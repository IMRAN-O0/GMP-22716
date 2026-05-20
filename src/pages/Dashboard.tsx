import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FileStack,
  CheckCircle2,
  Clock,
  Users,
  AlertTriangle,
  Package,
  FlaskConical,
  Factory,
  ShieldCheck,
  BookOpen,
  Briefcase,
  ArrowLeft,
  PlusCircle,
  Eye,
  Loader2,
} from "lucide-react";
import DepartmentNotifications from "../components/DepartmentNotifications";
import { useAuth } from "../context/AuthContext";
import { StatusBadge } from "../components/StatusBadge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DeptStat {
  department: string;
  total: number;
  approved: number;
  pending_review: number;
  pending_approval: number;
  drafts: number;
  rejected: number;
  // aliases for backward compat
  count?: number;
  approved_count?: number;
}

interface FormRecord {
  id: number;
  record_id: string;
  form_id: string;
  department: string;
  status: string;
  created_at: string;
  created_by?: number;
}

interface Material {
  id: number;
  name: string;
  balance: number;
  minBalance: number;
  unit?: string;
}

interface ApiUser {
  id: number;
  name: string;
  status?: string;
  active?: boolean;
}

// ---------------------------------------------------------------------------
// Department metadata
// ---------------------------------------------------------------------------

type DeptKey = "INV" | "PRD" | "QM" | "LAB" | "HR" | "TRN";

interface DeptMeta {
  label: string;
  route: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  hoverBorder: string;
  badgeBg: string;
  badgeText: string;
  accentBg: string;
  accentText: string;
}

const DEPT_META: Record<DeptKey, DeptMeta> = {
  INV: {
    label: "المخزون",
    route: "/inv",
    icon: <Package className="w-5 h-5" />,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    hoverBorder: "hover:border-indigo-300",
    badgeBg: "bg-indigo-50",
    badgeText: "text-indigo-600",
    accentBg: "bg-indigo-600",
    accentText: "text-white",
  },
  PRD: {
    label: "الإنتاج",
    route: "/prd",
    icon: <Factory className="w-5 h-5" />,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    hoverBorder: "hover:border-emerald-300",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-600",
    accentBg: "bg-emerald-600",
    accentText: "text-white",
  },
  QM: {
    label: "إدارة الجودة",
    route: "/qm",
    icon: <ShieldCheck className="w-5 h-5" />,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    hoverBorder: "hover:border-violet-300",
    badgeBg: "bg-violet-50",
    badgeText: "text-violet-600",
    accentBg: "bg-violet-600",
    accentText: "text-white",
  },
  LAB: {
    label: "المختبر",
    route: "/lab",
    icon: <FlaskConical className="w-5 h-5" />,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
    hoverBorder: "hover:border-sky-300",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-600",
    accentBg: "bg-sky-600",
    accentText: "text-white",
  },
  HR: {
    label: "الموارد البشرية",
    route: "/hr",
    icon: <Briefcase className="w-5 h-5" />,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    hoverBorder: "hover:border-amber-300",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-600",
    accentBg: "bg-amber-600",
    accentText: "text-white",
  },
  TRN: {
    label: "التدريب",
    route: "/trn",
    icon: <BookOpen className="w-5 h-5" />,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
    hoverBorder: "hover:border-teal-300",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-600",
    accentBg: "bg-teal-600",
    accentText: "text-white",
  },
};

const ALL_DEPTS: DeptKey[] = ["INV", "PRD", "QM", "LAB", "HR", "TRN"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function authHeaders(): HeadersInit {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  loading,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex items-center justify-between">
      <div>
        <span className="block text-[13px] font-semibold text-slate-500 mb-2">
          {label}
        </span>
        <div className="text-[26px] font-bold text-slate-900">
          {loading ? (
            <span className="inline-block w-10 h-7 bg-slate-100 rounded animate-pulse" />
          ) : (
            value
          )}
        </div>
      </div>
      <div className={`p-3 ${iconBg} rounded-xl ${iconColor}`}>{icon}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[16px] font-bold text-slate-900 mb-4">{children}</h3>
  );
}

function FormsTable({
  forms,
  loading,
  emptyMsg = "لا توجد نماذج",
}: {
  forms: FormRecord[];
  loading: boolean;
  emptyMsg?: string;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin ml-2" />
        <span className="text-sm">جارٍ التحميل...</span>
      </div>
    );
  }
  if (forms.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 text-sm">{emptyMsg}</div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-right text-[12px] font-semibold text-slate-500 pb-3 pr-1">
              رقم السجل
            </th>
            <th className="text-right text-[12px] font-semibold text-slate-500 pb-3">
              النموذج
            </th>
            <th className="text-right text-[12px] font-semibold text-slate-500 pb-3">
              القسم
            </th>
            <th className="text-right text-[12px] font-semibold text-slate-500 pb-3">
              الحالة
            </th>
            <th className="text-right text-[12px] font-semibold text-slate-500 pb-3">
              التاريخ
            </th>
            <th className="pb-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {forms.map((form) => {
            const meta = DEPT_META[form.department as DeptKey];
            const route = meta
              ? `${meta.route}#${form.record_id}`
              : `#`;
            return (
              <tr key={form.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 pr-1 font-mono text-[12px] text-slate-700">
                  {form.record_id}
                </td>
                <td className="py-3 text-slate-700">{form.form_id}</td>
                <td className="py-3">
                  {meta ? (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${meta.badgeBg} ${meta.badgeText}`}
                    >
                      {meta.label}
                    </span>
                  ) : (
                    <span className="text-slate-500">{form.department}</span>
                  )}
                </td>
                <td className="py-3">
                  <StatusBadge status={form.status} />
                </td>
                <td className="py-3 text-slate-500 text-[12px]">
                  {fmtDate(form.created_at)}
                </td>
                <td className="py-3 text-left pl-1">
                  <Link
                    to={route}
                    className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-800 text-[12px] font-semibold"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    عرض
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Level 1 — Admin dashboard
// ---------------------------------------------------------------------------

function AdminDashboard() {
  const [stats, setStats] = useState<DeptStat[]>([]);
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = authHeaders();
    Promise.all([
      fetch("/api/stats", { headers }).then((r) => r.json()),
      fetch("/api/forms", { headers }).then((r) => r.json()),
      fetch("/api/users", { headers }).then((r) => r.json()),
    ])
      .then(([statsData, formsData, usersData]) => {
        const depts = statsData?.departments ?? (Array.isArray(statsData) ? statsData : []);
        setStats(depts);
        const allForms: FormRecord[] = Array.isArray(formsData) ? formsData : [];
        setForms(allForms);
        const users: ApiUser[] = Array.isArray(usersData) ? usersData : [];
        const active = users.filter(
          (u) => u.status === "active" || u.active === true
        ).length;
        setActiveUsers(active || users.length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalForms = stats.reduce((acc, s) => acc + (s.total ?? s.count ?? 0), 0);
  const pendingApproval = forms.filter(
    (f) => f.status === "pending_approval"
  ).length;
  const pendingReview = forms.filter(
    (f) => f.status === "pending_review"
  ).length;

  const actionForms = forms
    .filter(
      (f) =>
        f.status === "pending_approval" || f.status === "pending_review"
    )
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="إجمالي النماذج"
          value={totalForms}
          icon={<FileStack className="w-5 h-5" />}
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
          loading={loading}
        />
        <StatCard
          label="بانتظار الاعتماد"
          value={pendingApproval}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          loading={loading}
        />
        <StatCard
          label="بانتظار المراجعة"
          value={pendingReview}
          icon={<Clock className="w-5 h-5" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          loading={loading}
        />
        <StatCard
          label="المستخدمون النشطون"
          value={activeUsers}
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          loading={loading}
        />
      </div>

      {/* Department grid */}
      <div>
        <SectionTitle>الأقسام</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ALL_DEPTS.map((deptKey) => {
            const meta = DEPT_META[deptKey];
            const stat = stats.find((s) => s.department === deptKey);
            const count = stat?.total ?? stat?.count ?? 0;
            const approved = stat?.approved ?? stat?.approved_count ?? 0;
            const pending = count - approved;
            return (
              <Link key={deptKey} to={meta.route} className="block group">
                <div
                  className={`bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6 flex flex-col h-full transition-all hover:shadow-md ${meta.hoverBorder}`}
                >
                  <div className="flex items-center mb-5">
                    <div
                      className={`w-10 h-10 ${meta.iconBg} flex items-center justify-center rounded-xl ${meta.iconColor} ml-3 flex-shrink-0`}
                    >
                      {meta.icon}
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-slate-900 leading-tight">
                        {meta.label}
                      </h4>
                      <span
                        className={`text-[11px] font-bold ${meta.badgeText} ${meta.badgeBg} px-2 py-0.5 rounded-full`}
                      >
                        {deptKey}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1" />

                  {loading ? (
                    <div className="space-y-2 mb-4">
                      <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      <div className="text-center">
                        <div className="text-[20px] font-bold text-slate-900">
                          {count}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          إجمالي
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[20px] font-bold text-emerald-600">
                          {approved}
                        </div>
                        <div className="text-[11px] text-slate-500">معتمد</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[20px] font-bold text-amber-500">
                          {pending}
                        </div>
                        <div className="text-[11px] text-slate-500">معلق</div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[12px] text-slate-400">
                      عرض تفاصيل القسم
                    </span>
                    <ArrowLeft
                      className={`w-4 h-4 ${meta.iconColor} group-hover:translate-x-[-3px] transition-transform`}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Pending action table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
        <SectionTitle>النماذج التي تستدعي إجراءً (آخر 10)</SectionTitle>
        <FormsTable
          forms={actionForms}
          loading={loading}
          emptyMsg="لا توجد نماذج بانتظار إجراء"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Level 2 — Department Manager dashboard
// ---------------------------------------------------------------------------

function DeptManagerDashboard({ department }: { department: string }) {
  const dept = department as DeptKey;
  const meta = DEPT_META[dept] ?? DEPT_META["INV"];

  const [stats, setStats] = useState<DeptStat[]>([]);
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = authHeaders();
    const requests: Promise<unknown>[] = [
      fetch("/api/stats", { headers }).then((r) => r.json()),
      fetch("/api/forms", { headers }).then((r) => r.json()),
    ];
    if (dept === "INV") {
      requests.push(
        fetch("/api/materials", { headers }).then((r) => r.json())
      );
    }
    Promise.all(requests)
      .then(([statsData, formsData, materialsData]) => {
        const depts = (statsData as any)?.departments ?? (Array.isArray(statsData) ? statsData : []);
        setStats(depts);
        setForms(Array.isArray(formsData) ? formsData : []);
        if (dept === "INV" && Array.isArray(materialsData)) {
          setMaterials(materialsData);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [dept]);

  const deptStat = stats.find((s) => s.department === dept);
  const totalForms = deptStat?.total ?? deptStat?.count ?? 0;
  const approved = deptStat?.approved ?? deptStat?.approved_count ?? 0;
  const pending = totalForms - approved;

  const deptForms = forms.filter((f) => f.department === dept);
  const pendingApproval = deptForms.filter(
    (f) => f.status === "pending_approval"
  );
  const pendingReview = deptForms.filter(
    (f) => f.status === "pending_review"
  ).length;

  const lowStock = materials.filter(
    (m) => m.balance <= (m.minBalance ?? 0) || m.balance <= 10
  );

  const quickLinks: { label: string; route: string }[] = {
    INV: [
      { label: "استلام مادة خام", route: "/inv/form-rmt" },
      { label: "طلب شراء", route: "/inv/form-prq001" },
      { label: "إفراج عن منتج", route: "/inv/form-fp001" },
    ],
    PRD: [
      { label: "سجل تشغيل", route: "/prd/form-prd001" },
      { label: "تقرير إنتاج", route: "/prd/form-prd002" },
    ],
    QM: [
      { label: "انحراف", route: "/qm/form-dev001" },
      { label: "شكوى", route: "/qm/form-cmp001" },
      { label: "أذونات", route: "/qm/form-prm001" },
    ],
    LAB: [
      { label: "تحليل مختبر", route: "/lab/form-lab001" },
    ],
    HR: [
      { label: "طلب توظيف", route: "/hr/form-hr001" },
      { label: "بيانات موظف", route: "/hr/form-hr002" },
    ],
    TRN: [
      { label: "سجل تدريب", route: "/trn" },
    ],
  }[dept] ?? [];

  return (
    <div className="space-y-8">
      {/* Department hero card */}
      <div
        className={`rounded-2xl p-7 text-white shadow-md`}
        style={{
          background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
        }}
      >
        {/* Fallback with inline style since we can't compose Tailwind gradient from dynamic class */}
        <div
          className={`rounded-2xl p-7 -m-7 flex items-center justify-between`}
          style={{
            background:
              dept === "INV"
                ? "linear-gradient(135deg,#4f46e5,#818cf8)"
                : dept === "PRD"
                ? "linear-gradient(135deg,#059669,#34d399)"
                : dept === "QM"
                ? "linear-gradient(135deg,#7c3aed,#a78bfa)"
                : dept === "LAB"
                ? "linear-gradient(135deg,#0284c7,#38bdf8)"
                : dept === "HR"
                ? "linear-gradient(135deg,#d97706,#fbbf24)"
                : "linear-gradient(135deg,#0d9488,#2dd4bf)",
          }}
        >
          <div>
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center ml-3">
                {meta.icon}
              </div>
              <div>
                <p className="text-white/80 text-[13px] font-medium">قسم</p>
                <h2 className="text-[22px] font-bold text-white">
                  {meta.label}
                </h2>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-[28px] font-bold text-white">{loading ? "—" : totalForms}</div>
              <div className="text-white/75 text-[12px]">إجمالي النماذج</div>
            </div>
            <div>
              <div className="text-[28px] font-bold text-white">{loading ? "—" : approved}</div>
              <div className="text-white/75 text-[12px]">معتمد</div>
            </div>
            <div>
              <div className="text-[28px] font-bold text-white">{loading ? "—" : pending}</div>
              <div className="text-white/75 text-[12px]">معلق</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <StatCard
          label="بانتظار الاعتماد"
          value={pendingApproval.length}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          loading={loading}
        />
        <StatCard
          label="بانتظار المراجعة"
          value={pendingReview}
          icon={<Clock className="w-5 h-5" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          loading={loading}
        />
      </div>

      {/* Quick create actions */}
      {quickLinks.length > 0 && (
        <div>
          <SectionTitle>إجراءات سريعة</SectionTitle>
          <div className="flex flex-wrap gap-3">
            {quickLinks.map((ql) => (
              <Link
                key={ql.route}
                to={ql.route}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold border transition-all ${meta.badgeBg} ${meta.badgeText} border-transparent hover:border-current hover:opacity-90`}
              >
                <PlusCircle className="w-4 h-4" />
                {ql.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Forms pending approval */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
        <SectionTitle>النماذج المعلقة بانتظار اعتمادك</SectionTitle>
        <FormsTable
          forms={pendingApproval}
          loading={loading}
          emptyMsg="لا توجد نماذج بانتظار اعتمادك"
        />
      </div>

      {/* Low stock alert (INV only) */}
      {dept === "INV" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
          <SectionTitle>
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              تنبيهات المخزون المنخفض
            </span>
          </SectionTitle>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin ml-2" />
              <span className="text-sm">جارٍ التحميل...</span>
            </div>
          ) : lowStock.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              جميع مستويات المخزون ضمن الحدود الآمنة
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-right text-[12px] font-semibold text-slate-500 pb-3 pr-1">
                      المادة
                    </th>
                    <th className="text-right text-[12px] font-semibold text-slate-500 pb-3">
                      الرصيد الحالي
                    </th>
                    <th className="text-right text-[12px] font-semibold text-slate-500 pb-3">
                      الحد الأدنى
                    </th>
                    <th className="text-right text-[12px] font-semibold text-slate-500 pb-3">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {lowStock.map((m) => (
                    <tr key={m.id} className="hover:bg-amber-50 transition-colors">
                      <td className="py-3 pr-1 font-semibold text-slate-800">
                        {m.name}
                      </td>
                      <td className="py-3 text-red-600 font-bold">
                        {m.balance} {m.unit ?? ""}
                      </td>
                      <td className="py-3 text-slate-500">
                        {m.minBalance ?? 10} {m.unit ?? ""}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          منخفض
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Level 3 — Reviewer dashboard
// ---------------------------------------------------------------------------

function ReviewerDashboard({ department }: { department: string }) {
  const dept = department as DeptKey;
  const meta = DEPT_META[dept] ?? DEPT_META["QM"];

  const [forms, setForms] = useState<FormRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/forms", { headers: authHeaders() })
      .then((r) => r.json())
      .then((data: unknown) => {
        setForms(Array.isArray(data) ? (data as FormRecord[]) : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const deptForms = forms.filter((f) => f.department === dept);
  const pendingReviewForms = deptForms.filter(
    (f) => f.status === "pending_review"
  );

  return (
    <div className="space-y-8">
      {/* Stat card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <StatCard
          label="نماذج بانتظار مراجعتك"
          value={pendingReviewForms.length}
          icon={<Clock className="w-5 h-5" />}
          iconBg={meta.iconBg}
          iconColor={meta.iconColor}
          loading={loading}
        />
        <StatCard
          label={`إجمالي نماذج ${meta.label}`}
          value={deptForms.length}
          icon={<FileStack className="w-5 h-5" />}
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
          loading={loading}
        />
      </div>

      {/* Pending review table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
        <SectionTitle>النماذج المطلوب مراجعتها</SectionTitle>
        <FormsTable
          forms={pendingReviewForms}
          loading={loading}
          emptyMsg="لا توجد نماذج بانتظار المراجعة"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Level 4 — Employee dashboard
// ---------------------------------------------------------------------------

function EmployeeDashboard({
  department,
  userId,
}: {
  department: string;
  userId: number;
}) {
  const dept = department as DeptKey;
  const meta = DEPT_META[dept] ?? DEPT_META["HR"];

  const [forms, setForms] = useState<FormRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/forms", { headers: authHeaders() })
      .then((r) => r.json())
      .then((data: unknown) => {
        setForms(Array.isArray(data) ? (data as FormRecord[]) : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const myForms = forms.filter(
    (f) => f.created_by === userId || f.department === dept
  );
  const drafts = myForms.filter((f) => f.status === "draft").length;
  const submitted = myForms.filter((f) => f.status !== "draft").length;

  const createLinks: { label: string; route: string }[] = {
    INV: [
      { label: "استلام مادة خام", route: "/inv/form-rmt" },
      { label: "طلب شراء", route: "/inv/form-prq001" },
    ],
    PRD: [
      { label: "سجل تشغيل", route: "/prd/form-prd001" },
    ],
    QM: [
      { label: "بلاغ انحراف", route: "/qm/form-dev001" },
      { label: "شكوى", route: "/qm/form-cmp001" },
    ],
    LAB: [
      { label: "نموذج تحليل", route: "/lab/form-lab001" },
    ],
    HR: [
      { label: "طلب توظيف", route: "/hr/form-hr001" },
      { label: "بيانات موظف جديد", route: "/hr/form-hr002" },
    ],
    TRN: [
      { label: "سجل تدريب", route: "/trn" },
    ],
  }[dept] ?? [];

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          label="نماذجي الإجمالية"
          value={myForms.length}
          icon={<FileStack className="w-5 h-5" />}
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
          loading={loading}
        />
        <StatCard
          label="مسودات"
          value={drafts}
          icon={<Clock className="w-5 h-5" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          loading={loading}
        />
        <StatCard
          label="مقدَّمة"
          value={submitted}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          loading={loading}
        />
      </div>

      {/* Quick create */}
      {createLinks.length > 0 && (
        <div>
          <SectionTitle>إنشاء نموذج جديد</SectionTitle>
          <div className="flex flex-wrap gap-3">
            {createLinks.map((cl) => (
              <Link
                key={cl.route}
                to={cl.route}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold border transition-all ${meta.badgeBg} ${meta.badgeText} border-transparent hover:border-current hover:opacity-90`}
              >
                <PlusCircle className="w-4 h-4" />
                {cl.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* My forms table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
        <SectionTitle>نماذجي</SectionTitle>
        <FormsTable
          forms={myForms
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )
            .slice(0, 20)}
          loading={loading}
          emptyMsg="لم تقم بإنشاء أي نماذج بعد"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page header helper
// ---------------------------------------------------------------------------

function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-[28px] font-bold text-slate-900 m-0">{title}</h1>
        <p className="text-[14px] text-slate-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root Dashboard
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const { user } = useAuth();

  const level = user?.level ?? 4;
  const department = user?.department ?? "HR";

  const headerProps: Record<number, { title: string; subtitle: string }> = {
    1: {
      title: "نظرة عامة على النظام",
      subtitle: "ملخص النشاط والتنبيهات لجميع الأقسام",
    },
    2: {
      title: `لوحة قسم ${DEPT_META[department as DeptKey]?.label ?? department}`,
      subtitle: "مهامك ونماذج قسمك تحت إشرافك",
    },
    3: {
      title: "لوحة المراجع",
      subtitle: "النماذج المطلوب منك مراجعتها",
    },
    4: {
      title: "لوحتي",
      subtitle: "نماذجي وإجراءاتي",
    },
  };

  const header = headerProps[level] ?? headerProps[4];

  const renderDashboard = useCallback(() => {
    switch (level) {
      case 1:
        return <AdminDashboard />;
      case 2:
        return <DeptManagerDashboard department={department} />;
      case 3:
        return <ReviewerDashboard department={department} />;
      case 4:
      default:
        return (
          <EmployeeDashboard department={department} userId={user?.id ?? 0} />
        );
    }
  }, [level, department, user?.id]);

  return (
    <div className="space-y-6">
      <DepartmentNotifications />

      <PageHeader title={header.title} subtitle={header.subtitle} />

      {renderDashboard()}
    </div>
  );
}
