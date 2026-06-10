import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, ChildProcess } from "child_process";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";

// ── End-to-end API integration tests ────────────────────────────────────────
// Boots the real API router (server/test-server.ts via tsx) against a throwaway
// SQLite DB, then drives it over HTTP exactly like the frontend does. Covers:
// auth, validation, approval + side-effects, RBAC, security and bulk import,
// across every department (HRT, INV, PRD, QM, LAB, PKG).

let child: ProcessHandle;
let BASE = "";
let adminToken = "";
let tmpDir = "";

interface ProcessHandle extends ChildProcess {}

const PORT = 3300 + Math.floor(Math.random() * 400);

const api = async (
  pathname: string,
  opts: { method?: string; token?: string; body?: any } = {},
) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const res = await fetch(`${BASE}${pathname}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let json: any = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, body: json };
};

const login = async (userId: string, password: string) => {
  const r = await api("/api/login", { method: "POST", body: { userId, password } });
  return r;
};

const createForm = (token: string, formId: string, department: string, status: string, data: any) =>
  api("/api/forms", {
    method: "POST",
    token,
    body: { recordId: `T-${formId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, formId, department, status, data },
  });

beforeAll(async () => {
  tmpDir = mkdtempSync(path.join(tmpdir(), "naxe-test-"));
  const dbPath = path.join(tmpDir, "test.db");
  BASE = `http://127.0.0.1:${PORT}`;

  child = spawn("npx", ["tsx", "server/test-server.ts"], {
    cwd: process.cwd(),
    env: { ...process.env, DB_PATH: dbPath, JWT_SECRET: "integration-test-secret", PORT: String(PORT), NODE_ENV: "test" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Test server did not start in time")), 55000);
    child.stdout?.on("data", (d) => {
      if (String(d).includes("TEST_SERVER_READY")) { clearTimeout(timer); resolve(); }
    });
    child.stderr?.on("data", (d) => {
      const s = String(d);
      if (s.includes("TEST_SERVER_ERROR")) { clearTimeout(timer); reject(new Error(s)); }
    });
    child.on("exit", (code) => { clearTimeout(timer); reject(new Error(`server exited early (${code})`)); });
  });

  // admin/admin123 is seeded on a fresh DB.
  const r = await login("admin", "admin123");
  expect(r.status).toBe(200);
  adminToken = r.body.token;
  expect(adminToken).toBeTruthy();
}, 60000);

afterAll(() => {
  child?.kill("SIGTERM");
  if (tmpDir) try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
});

// ── Authentication & security ───────────────────────────────────────────────
describe("Authentication & security", () => {
  it("logs in with valid admin credentials", async () => {
    const r = await login("admin", "admin123");
    expect(r.status).toBe(200);
    expect(r.body.token).toBeTruthy();
    expect(r.body.user.level).toBe(1);
  });

  it("rejects a wrong password (401)", async () => {
    const r = await login("admin", "wrong-pass");
    expect(r.status).toBe(401);
  });

  it("rejects a protected route with no token (401)", async () => {
    const r = await api("/api/employees");
    expect(r.status).toBe(401);
  });

  it("rejects a forged/garbage token (401)", async () => {
    const r = await api("/api/employees", { token: "not.a.real.token" });
    expect(r.status).toBe(401);
  });
});

// ── Form creation smoke across every department ─────────────────────────────
describe("Form creation per department (draft skips validation)", () => {
  const reps: [string, string, string][] = [
    ["HRT", "F-HR-002", "HRT"],
    ["INV", "F-INV-PRQ-001", "INV"],
    ["PRD", "F-PRD-001", "PRD"],
    ["QM", "F-QM-005", "QM"],
    ["LAB", "F-LAB-001", "LAB"],
    ["PKG", "F-FIL-001", "PKG"],
  ];
  it.each(reps)("creates a draft %s form (%s)", async (_dept, formId, department) => {
    const r = await createForm(adminToken, formId, department, "draft", { note: "smoke" });
    expect(r.status).toBe(201);
    expect(r.body.recordId).toBeTruthy();
  });
});

// ── All HRT forms can be created as drafts ──────────────────────────────────
describe("All HRT forms create successfully", () => {
  const hrtForms = [
    "F-HR-001", "F-HR-003", "F-HRT-005", "F-HRT-001", "F-HRT-002", "F-HRT-003",
    "F-HRT-004", "F-TRN-001", "F-HRT-006", "F-HRT-007", "F-HRT-008",
    "F-HRT-009", "F-HRT-010", "F-HRT-011", "F-HRT-012", "F-HRT-013",
  ];
  it.each(hrtForms)("creates %s", async (formId) => {
    const r = await createForm(adminToken, formId, "HRT", "draft", {});
    expect(r.status).toBe(201);
  });
});

// ── Required-field validation (non-draft submissions) ───────────────────────
describe("Required-field validation rejects incomplete submissions", () => {
  const cases: [string, string][] = [
    ["F-HR-002", "HRT"],
    ["F-HRT-002", "HRT"],
    ["F-HRT-008", "HRT"],
    ["F-INV-PRQ-001", "INV"],
  ];
  it.each(cases)("rejects empty %s with 400 + missing fields", async (formId, department) => {
    const r = await createForm(adminToken, formId, department, "approved", {});
    expect(r.status).toBe(400);
    expect(Array.isArray(r.body.missingFields)).toBe(true);
    expect(r.body.missingFields.length).toBeGreaterThan(0);
  });

  it("accepts a fully-filled F-HRT-002 (leave request)", async () => {
    const r = await createForm(adminToken, "F-HRT-002", "HRT", "approved", {
      employeeName: "تجريبي", leaveType: "سنوية", startDate: "2026-01-01", endDate: "2026-01-05",
    });
    expect(r.status).toBe(201);
  });
});

// ── Approval side-effect: F-HR-002 syncs the employees table ────────────────
describe("Approved employee file syncs the employees table", () => {
  it("creates an employee row on approval", async () => {
    const empNo = `EMP-T${Date.now() % 100000}`;
    const r = await createForm(adminToken, "F-HR-002", "HRT", "approved", {
      employeeNumber: empNo, fullNameAr: "موظف اختبار", fullNameEn: "Test Emp",
      idNumber: "1010101010", joinDate: "2026-01-01", department: "الإنتاج",
      jobTitle: "فني", supervisor: "مشرف", phone: "0500000000", nationality: "سعودي",
      dob: "1990-01-01", address: "الرياض",
    });
    expect(r.status).toBe(201);
    const emps = await api("/api/employees", { token: adminToken });
    expect(emps.status).toBe(200);
    expect(emps.body.some((e: any) => e.employee_number === empNo)).toBe(true);
  });
});

// ── RBAC: department scope + level-based status enforcement ──────────────────
describe("Role-based access control", () => {
  let qmToken = "";
  let staffToken = "";

  beforeAll(async () => {
    // Level-2 manager scoped to QM
    await api("/api/users", { method: "POST", token: adminToken, body: {
      userId: "qm_mgr", name: "مدير الجودة", department: "QM", level: 2, password: "secret123", permissions: {},
    }});
    qmToken = (await login("qm_mgr", "secret123")).body.token;

    // Level-4 staff scoped to HRT
    await api("/api/users", { method: "POST", token: adminToken, body: {
      userId: "hrt_staff", name: "موظف", department: "HRT", level: 4, password: "secret123", permissions: {},
    }});
    staffToken = (await login("hrt_staff", "secret123")).body.token;
  });

  it("blocks a QM manager from posting to another department (403)", async () => {
    const r = await createForm(qmToken, "F-INV-PRQ-001", "INV", "draft", {});
    expect(r.status).toBe(403);
  });

  it("allows a QM manager to post within QM", async () => {
    const r = await createForm(qmToken, "F-QM-005", "QM", "draft", {});
    expect(r.status).toBe(201);
  });

  it("non-admin cannot list users (403)", async () => {
    const r = await api("/api/users", { token: staffToken });
    expect(r.status).toBe(403);
  });

  it("downgrades a level-4 'approved' submission to pending_review", async () => {
    const recordId = `T-LV4-${Date.now()}`;
    const r = await api("/api/forms", { method: "POST", token: staffToken, body: {
      recordId, formId: "F-HRT-002", department: "HRT", status: "approved",
      data: { employeeName: "x", leaveType: "سنوية", startDate: "2026-02-01", endDate: "2026-02-03" },
    }});
    expect(r.status).toBe(201);
    const list = await api("/api/forms/dept/HRT", { token: adminToken });
    const found = list.body.find((f: any) => f.record_id === recordId);
    expect(found?.status).toBe("pending_review");
  });
});

// ── Bulk employee import ────────────────────────────────────────────────────
describe("Bulk employee import (/employees/bulk)", () => {
  it("imports multiple rows and auto-generates numbers", async () => {
    const r = await api("/api/employees/bulk", { method: "POST", token: adminToken, body: { rows: [
      { fullNameAr: "أحمد بلك", fullNameEn: "Ahmed Bulk", idNumber: "2020202020", department: "الإنتاج", jobTitle: "فني", joinDate: "2026-01-01", iqamaExpiry: "2027-01-01", contractExpiry: "2028-01-01" },
      { fullNameAr: "سعد بلك", fullNameEn: "Saad Bulk", idNumber: "3030303030", department: "الجودة", jobTitle: "مفتش", joinDate: "2026-02-01" },
    ]}});
    expect(r.status).toBe(200);
    expect(r.body.inserted).toBe(2);
  });

  it("rejects rows missing required name/id", async () => {
    const r = await api("/api/employees/bulk", { method: "POST", token: adminToken, body: { rows: [
      { fullNameAr: "", idNumber: "" },
    ]}});
    expect(r.status).toBe(200);
    expect(r.body.inserted).toBe(0);
    expect(r.body.errors.length).toBeGreaterThan(0);
  });

  it("forbids non-managers (level 4) from bulk import (403)", async () => {
    const staff = await login("hrt_staff", "secret123");
    const r = await api("/api/employees/bulk", { method: "POST", token: staff.body.token, body: { rows: [
      { fullNameAr: "x", idNumber: "1" },
    ]}});
    expect(r.status).toBe(403);
  });
});
