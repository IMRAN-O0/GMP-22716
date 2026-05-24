import * as yup from 'yup';
import { sendNotificationEmail } from './email.js';
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getDb } from "./db.js";

const router = Router();

const matchesReference = (formData: any, targetId: string): boolean => {
  if (!formData || !targetId) return false;
  return (
    formData.referenceDocument === targetId ||
    formData.poNumber === targetId ||
    formData.reference === targetId ||
    formData.sourceDocumentNo === targetId ||
    formData.productionOrderNo === targetId ||
    formData.productionOrderId === targetId
  );
};

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET environment variable is missing and is required in production.");
} else if (!process.env.JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET is not set. Using a fixed development fallback. Set JWT_SECRET in production.");
}
// In production the line above throws, so reaching here without JWT_SECRET is dev-only.
// We use a fixed dev secret so sessions survive server restarts during development.
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-jwt-secret-do-not-use-in-production";

const getAuthUser = (req: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const requireAuth = (req: any, res: any, next: any) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  req.user = user;
  next();
};

const handleFormApprovalEffect = (fId: string, data: any) => {
  // Sync F-INV-RM-001 or MAT to materials table
  if (
    (fId === "F-INV-RM-001" || fId === "F-INV-MAT") &&
    data
  ) {
    getDb().run(
      `INSERT INTO materials (code, name, name_en, category, description, unit, warehouse_id, balance, package_size, package_size_unit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(code) DO UPDATE SET
         name = excluded.name,
         name_en = excluded.name_en,
         category = excluded.category,
         description = excluded.description,
         unit = excluded.unit,
         warehouse_id = excluded.warehouse_id,
         package_size = excluded.package_size,
         package_size_unit = excluded.package_size_unit`,
      [
        data.code,
        data.name,
        data.name_en || null,
        data.category || "مادة خام",
        data.description || "",
        data.unit,
        data.warehouse_id || null,
        data.balance || 0,
        data.packageSize ? parseFloat(data.packageSize) : null,
        data.packageSizeUnit || null,
      ],
    );
  }

  // Sync F-INV-WH to warehouses table
  if (fId === "F-INV-WH" && data) {
    getDb().run(
      `INSERT INTO warehouses (code, name, type, parent_id, description) VALUES (?, ?, ?, ?, ?)`,
      [
        data.code,
        data.name,
        data.type,
        data.parent_id || null,
        data.description || "",
      ],
    );
  }

  // Helper: log to inventory_transactions (including warehouse and expiry when available)
  const logTxn = (type: string, materialCode: string, qty: number, unit: string, batchNo: string, refId: string, warehouseId?: number | null, expiryDate?: string | null) => {
    const txnId = `${type}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    getDb().run(
      `INSERT OR IGNORE INTO inventory_transactions (transaction_id, type, material_code, quantity, unit, batch_number, expiry_date, warehouse_id, reference_record_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
      [txnId, type, materialCode, qty, unit, batchNo || null, expiryDate || null, warehouseId || null, refId]
    );
  };

  // Helper: FIFO deduction from material_batches (oldest expiry first)
  const deductBatches = (db: any, materialCode: string, qty: number) => {
    db.all(
      `SELECT id, quantity_remaining FROM material_batches
       WHERE material_code = ? AND quantity_remaining > 0
       ORDER BY COALESCE(expiry_date, '9999-12-31') ASC, received_date ASC`,
      [materialCode],
      (err: any, batches: any[]) => {
        if (err || !batches || batches.length === 0) return;
        let remaining = qty;
        db.serialize(() => {
          for (const batch of batches) {
            if (remaining <= 0) break;
            const deduct = Math.min(remaining, batch.quantity_remaining);
            db.run(
              `UPDATE material_batches SET quantity_remaining = quantity_remaining - ? WHERE id = ?`,
              [deduct, batch.id]
            );
            remaining -= deduct;
          }
        });
      }
    );
  };

  // 1. PIN (Purchase Invoice) - Add to balance + create batch records
  if (fId === "F-INV-PIN-001" && Array.isArray(data.items)) {
    const db = getDb();
    const warehouseId = data.warehouseId ? parseInt(data.warehouseId) : null;
    const receivedDate = data.invoiceDate || new Date().toISOString().split('T')[0];
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      data.items.forEach((item: any) => {
        const qty = parseFloat(item.quantity) || 0;
        if (item.materialCode && qty > 0) {
          db.run(`UPDATE materials SET balance = COALESCE(balance, 0) + ? WHERE code = ?`, [qty, item.materialCode]);
          db.run(
            `INSERT INTO material_batches (material_code, batch_number, quantity_received, quantity_remaining, expiry_date, received_date, warehouse_id, reference_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [item.materialCode, item.batchNumber || null, qty, qty, item.expiryDate || null, receivedDate, warehouseId, fId]
          );
        }
      });
      db.run("COMMIT", (err) => { if (err) db.run("ROLLBACK"); });
    });
    data.items.forEach((item: any) => {
      const qty = parseFloat(item.quantity) || 0;
      if (item.materialCode && qty > 0)
        logTxn('RECEIVE', item.materialCode, qty, item.unit || '', item.batchNumber || '', fId, warehouseId, item.expiryDate || null);
    });
  }

  // 2. RMT (Material Receive/Issue) - Add or Subtract
  if (fId === "F-INV-RMT-001" && Array.isArray(data.items)) {
    // Skip balance update for Receive linked to a PIN (PIN already updated the balance)
    if (data.transactionType === "Receive" &&
        data.referenceDocument &&
        /^PIN-/i.test(String(data.referenceDocument))) {
      // Still log the receipt for audit trail
      data.items.forEach((item: any) => {
        const qty = parseFloat(item.quantity) || 0;
        if (item.materialCode && qty > 0) logTxn('RECEIVE_PIN', item.materialCode, qty, item.unit || '', '', data.referenceDocument);
      });
      return;
    }
    const isIssue = data.transactionType !== "Receive";
    const qtyMultiplier = isIssue ? -1 : 1;
    const txnType = isIssue ? "ISSUE" : "RECEIVE";
    const db = getDb();

    // For ISSUE: deduct from all items (allow negative balances)
    if (isIssue) {
      const issuedItems = data.items.filter((i: any) => i.materialCode && (parseFloat(i.quantity) || 0) > 0);
      if (issuedItems.length > 0) {
        db.serialize(() => {
          db.run("BEGIN TRANSACTION");
          issuedItems.forEach((item: any) => {
            const qty = parseFloat(item.quantity) || 0;
            db.run(`UPDATE materials SET balance = balance - ? WHERE code = ?`, [qty, item.materialCode]);
            deductBatches(db, item.materialCode, qty);
          });
          db.run("COMMIT", (err) => { if (err) db.run("ROLLBACK"); });
        });
        issuedItems.forEach((item: any) => {
          const qty = parseFloat(item.quantity) || 0;
          logTxn(txnType, item.materialCode, qty, item.unit || '', '', data.referenceDocument || fId);
        });
        return;
      }
    }
    // RECEIVE path (no balance check needed)
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      data.items.forEach((item: any) => {
        const qty = parseFloat(item.quantity) || 0;
        if (item.materialCode && qty > 0) {
          db.run(`UPDATE materials SET balance = COALESCE(balance, 0) + ? WHERE code = ?`, [qty, item.materialCode]);
        }
      });
      db.run("COMMIT", (err) => { if (err) db.run("ROLLBACK"); });
    });
    data.items.forEach((item: any) => {
      const qty = parseFloat(item.quantity) || 0;
      if (item.materialCode && qty > 0) logTxn(txnType, item.materialCode, qty, item.unit || '', '', data.referenceDocument || fId);
    });
  }

  // Helper: update FP balance using productCode directly (with fallback to PRD-001 lookup)
  const updateFPBalance = (productCode: string | undefined, batchNumber: string | undefined, qty: number, direction: 1 | -1, refId: string, txnType: string) => {
    const applyUpdate = (code: string) => {
      const db = getDb();
      const sql = direction > 0
        ? `UPDATE materials SET balance = COALESCE(balance, 0) + ? WHERE code = ?`
        : `UPDATE materials SET balance = COALESCE(balance, 0) - ? WHERE code = ?`;
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(sql, [qty, code]);
        db.run("COMMIT", (err) => { if (err) db.run("ROLLBACK"); });
      });
      logTxn(txnType, code, qty, '', batchNumber || '', refId);
    };

    // If productCode is stored directly, use it
    if (productCode) {
      applyUpdate(productCode);
      return;
    }
    // Fallback: targeted lookup via PRD-001 batchNumber (LIKE index scan, not full scan)
    if (!batchNumber) return;
    getDb().get(
      "SELECT data_json FROM forms_records WHERE form_id = 'F-PRD-001' AND status = 'approved' AND data_json LIKE ?",
      [`%"batchNumber":"${batchNumber}"%`],
      (err, row: any) => {
        if (err || !row) return;
        try {
          const prd = JSON.parse(row.data_json || "{}");
          if (prd.batchNumber === batchNumber && prd.itemNumber) {
            applyUpdate(prd.itemNumber);
          }
        } catch { /* skip */ }
      }
    );
  };

  // 3a. F-FP-001 (Batch Release) - Add released quantity to finished product balance
  if (fId === "F-FP-001" && data.qcStatus !== "Rejected") {
    const code = data.productCode;
    const qty = parseFloat(data.releasedQuantity || data.actualQuantity || data.plannedQuantity) || 0;
    if (code && qty > 0) updateFPBalance(code, data.batchNumber, qty, 1, data.releaseId || fId, 'FP_RELEASE');
  }

  // 3. F-FP-002 (Finished Product Storage) - Add to balance
  if (fId === "F-FP-002" && data.quantityStored) {
    const qty = parseFloat(data.quantityStored) || 0;
    if (qty > 0) updateFPBalance(data.productCode, data.batchNumber, qty, 1, data.storageId || fId, 'FP_RECEIVE');
  }

  // 4. F-PRD-002 (Batch Manufacturing Record) - Deduct raw materials from inventory
  if (fId === "F-PRD-002" && data.productionOrderNo) {
    getDb().get(
      "SELECT data_json FROM forms_records WHERE record_id = ? AND form_id = 'F-PRD-001'",
      [data.productionOrderNo],
      (err, row: any) => {
        if (err || !row) return;
        try {
          const prdData = JSON.parse(row.data_json || "{}");
          const rawMaterials = prdData.rawMaterials || [];
          const db = getDb();
          db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            rawMaterials.forEach((mat: any) => {
              const qty = parseFloat(mat.quantity) || 0;
              if (mat.materialCode && qty > 0) {
                db.run(`UPDATE materials SET balance = balance - ? WHERE code = ?`, [qty, mat.materialCode]);
                deductBatches(db, mat.materialCode, qty);
              }
            });
            db.run("COMMIT");
          });
          rawMaterials.forEach((mat: any) => {
            const qty = parseFloat(mat.quantity) || 0;
            if (mat.materialCode && qty > 0) logTxn('ISSUE', mat.materialCode, qty, mat.unit || '', data.batchNumber || '', data.productionOrderNo);
          });
        } catch (e) {
          console.error("PRD002 material deduction error:", e);
        }
      }
    );
  }

  // 5. F-FP-003 (Shipment) - Deduct shipped quantity from finished product balance
  if (fId === "F-FP-003" && data.shippedQuantity) {
    const qty = parseFloat(data.shippedQuantity) || 0;
    if (qty > 0) updateFPBalance(data.productCode, data.batchNumber, qty, -1, data.shipmentId || fId, 'FP_ISSUE');
  }

  // 6. F-FP-004 (Return) - Add returned quantity to finished product balance
  if (fId === "F-FP-004" && data.returnedQuantity) {
    const qty = parseFloat(data.returnedQuantity) || 0;
    if (qty > 0) updateFPBalance(data.productCode, data.batchNumber, qty, 1, data.returnId || fId, 'FP_RETURN');
  }

  // 7. F-FP-005 (Disposal) - Deduct disposed quantity from balance
  if (fId === "F-FP-005" && data.batchOrCode && data.quantity) {
    const qty = parseFloat(data.quantity) || 0;
    if (qty > 0) {
      getDb().get(`SELECT code FROM materials WHERE code = ?`, [data.batchOrCode], (err, row: any) => {
        if (row) {
          getDb().run(`UPDATE materials SET balance = COALESCE(balance, 0) - ? WHERE code = ?`, [qty, data.batchOrCode]);
          logTxn('DISPOSAL', data.batchOrCode, qty, '', data.batchOrCode, data.disposalId || fId);
        }
      });
    }
  }

  // Auto-create CAPA for DEV-001 when capaRequired is true
  if (fId === "F-DEV-001" && data.capaRequired === true) {
    const capaId = `CAPA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const capaData = {
      capaId,
      sourceFormId: "F-DEV-001",
      sourceDocumentNo: data.productionOrderNo || "",
      referenceDocument: capaId,
      issueDate: new Date().toISOString().split("T")[0],
      description: `تصعيد تلقائي من تقرير انحراف: ${data.description || ""}`,
      rootCause: "",
      correctiveAction: "",
      preventiveAction: "",
      targetDate: "",
      responsiblePerson: "",
      status: "Open",
      autoCreated: true,
    };
    getDb().run(
      `INSERT INTO forms_records (record_id, form_id, department, creator_id, created_at, status, data_json) VALUES (?, 'F-QM-006', 'QM', 1, ?, 'pending_review', ?)`,
      [capaId, new Date().toISOString(), JSON.stringify(capaData)],
      (err) => { if (err) console.error("Auto CAPA creation failed:", err); }
    );
  }

  // Auto-create CAPA for CMP-001 when capaRequired is true
  if (fId === "F-CMP-001" && data.capaRequired === true) {
    const capaId = `CAPA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const capaData = {
      capaId,
      sourceFormId: "F-CMP-001",
      sourceDocumentNo: data.complaintId || "",
      referenceDocument: capaId,
      issueDate: new Date().toISOString().split("T")[0],
      description: `تصعيد تلقائي من شكوى عميل: ${data.complaintDetails || ""}`,
      rootCause: data.rootCause || "",
      correctiveAction: data.correctiveAction || "",
      preventiveAction: "",
      targetDate: "",
      responsiblePerson: "",
      status: "Open",
      autoCreated: true,
    };
    getDb().run(
      `INSERT INTO forms_records (record_id, form_id, department, creator_id, created_at, status, data_json) VALUES (?, 'F-QM-006', 'QM', 1, ?, 'pending_review', ?)`,
      [capaId, new Date().toISOString(), JSON.stringify(capaData)],
      (err) => { if (err) console.error("Auto CAPA creation failed:", err); }
    );
  }

  // Sync F-HR-002 to employees table
  if (fId === "F-HR-002") {
    getDb().run(
      `INSERT OR REPLACE INTO employees (employee_number, full_name_ar, full_name_en, department, job_title, join_date, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.employeeNumber,
        data.fullNameAr,
        data.fullNameEn,
        data.department,
        data.jobTitle,
        data.joinDate,
        "active",
      ],
    );
  }
};

// Login
router.post("/login", (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ error: "User ID and password are required" });
  }

  getDb().get(
    "SELECT * FROM users WHERE user_id = ?",
    [userId],
    async (err, user: any) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          level: user.level, 
          department: user.department,
          permissions: user.permissions ? JSON.parse(user.permissions) : {}
        },
        JWT_SECRET,
        { expiresIn: "24h" },
      );
      res.json({
        token,
        user: {
          id: user.id,
          userId: user.user_id,
          name: user.name,
          level: user.level,
          department: user.department,
          permissions: user.permissions ? JSON.parse(user.permissions) : {}
        },
      });
    },
  );
});

// App Info — requireAuth so only logged-in users can read company data
router.get("/company", requireAuth, (req, res) => {
  getDb().get(
    "SELECT * FROM company_info ORDER BY id DESC LIMIT 1",
    [],
    (err, row) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      res.json(row || {});
    },
  );
});

router.put("/company", requireAuth, (req, res) => {
  const { name_ar, name_en, logo_url, address, phone, email, license_number } = req.body;
  getDb().get("SELECT id FROM company_info ORDER BY id DESC LIMIT 1", [], (err, row: any) => {
    if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
    if (row) {
      getDb().run(
        "UPDATE company_info SET name_ar=?, name_en=?, logo_url=?, address=?, phone=?, email=?, license_number=? WHERE id=?",
        [name_ar, name_en, logo_url, address, phone, email, license_number, row.id],
        function(e) {
          if (e) return res.status(500).json({ error: e.message });
          res.json({ success: true });
        }
      );
    } else {
      getDb().run(
        "INSERT INTO company_info (name_ar, name_en, logo_url, address, phone, email, license_number) VALUES (?,?,?,?,?,?,?)",
        [name_ar, name_en, logo_url, address, phone, email, license_number],
        function(e) {
          if (e) return res.status(500).json({ error: e.message });
          res.json({ success: true, id: this.lastID });
        }
      );
    }
  });
});

// System Admin: Manage Users
router.get("/audit", requireAuth, (req, res) => {
  getDb().all(
    "SELECT * FROM audit_log ORDER BY id DESC LIMIT 500",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      res.json(rows || []);
    },
  );
});

router.get("/users", requireAuth, (req: any, res) => {
  const caller = req.user;
  if (!caller || caller.level > 2) return res.status(403).json({ error: "غير مصرح" });
  getDb().all(
    "SELECT id, user_id, name, department, level, status, permissions FROM users WHERE is_active = 1 ORDER BY level ASC",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      res.json(rows || []);
    },
  );
});

router.post("/users", requireAuth, async (req: any, res) => {
  if (!req.user || req.user.level > 1) return res.status(403).json({ error: "غير مصرح" });
  const { userId, name, department, level, password, permissions } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const perms = permissions ? JSON.stringify(permissions) : '{}';
    getDb().run(
      "INSERT INTO users (user_id, name, department, level, password_hash, status, permissions) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, name, department, level, hash, "active", perms],
      function (err) {
        if (err)
          return res.status(500).json({ error: "Failed to create user" });
        res.status(201).json({ id: this.lastID });
      },
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to hash password" });
  }
});

router.put("/users/:id", requireAuth, async (req, res) => {
  const { name, department, level, password, permissions } = req.body;
  const perms = permissions ? JSON.stringify(permissions) : null;
  if (password) {
    const hash = await bcrypt.hash(password, 10);
    getDb().run(
      "UPDATE users SET name=?, department=?, level=?, password_hash=?, permissions=COALESCE(?, permissions) WHERE id=?",
      [name, department, level, hash, perms, req.params.id],
      (err) => {
        if (err) return res.status(500).json({ error: "Update failed" });
        res.json({ success: true });
      },
    );
  } else {
    getDb().run(
      "UPDATE users SET name=?, department=?, level=?, permissions=COALESCE(?, permissions) WHERE id=?",
      [name, department, level, perms, req.params.id],
      (err) => {
        if (err) return res.status(500).json({ error: "Update failed" });
        res.json({ success: true });
      },
    );
  }
});

router.delete("/users/:id", requireAuth, (req, res) => {
  getDb().run("UPDATE users SET is_active = 0 WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
    res.json({ success: true });
  });
});

// HR: Get Employees
router.get("/employees", requireAuth, (req, res) => {
  getDb().all("SELECT * FROM employees ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    res.json(rows || []);
  });
});

// INV: Get Warehouses
router.get("/warehouses", requireAuth, (req, res) => {
  getDb().all("SELECT * FROM warehouses WHERE is_active = 1 ORDER BY code ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    res.json(rows || []);
  });
});

// INV: Create Warehouse
router.post("/warehouses", requireAuth, (req, res) => {
  const { code, name, type, parent_id, description } = req.body;
  getDb().run(
    `INSERT INTO warehouses (code, name, type, parent_id, description) VALUES (?, ?, ?, ?, ?)`,
    [code, name, type, parent_id, description],
    function (err) {
      if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
      res.json({ success: true, id: this.lastID });
    },
  );
});

// INV: Update Warehouse
router.put("/warehouses/:id", requireAuth, (req, res) => {
  const { code, name, type, parent_id, description } = req.body;
  getDb().run(
    `UPDATE warehouses SET code=?, name=?, type=?, parent_id=?, description=? WHERE id=?`,
    [code, name, type, parent_id, description, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
      res.json({ success: true });
    },
  );
});

// INV: Delete Warehouse (soft)
router.delete("/warehouses/:id", requireAuth, (req, res) => {
  getDb().run(
    `UPDATE warehouses SET is_active = 0 WHERE id=?`,
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
      res.json({ success: true });
    },
  );
});


const txnSchema = yup.object({
  transaction_id: yup.string().required(),
  type: yup.string().oneOf(['RECEIVE', 'ISSUE', 'RETURN']).required(),
  material_code: yup.string().required(),
  quantity: yup.number().positive().required()
});
// INV: Record Inventory Transaction
router.post("/inventory/transactions", requireAuth, async (req, res) => {
  try {
    await txnSchema.validate(req.body);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }

  const { transaction_id, type, material_code, quantity, unit, batch_number, expiry_date, warehouse_id, status, reference_record_id } = req.body;
  const db = getDb();
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    db.run(
      `INSERT INTO inventory_transactions (transaction_id, type, material_code, quantity, unit, batch_number, expiry_date, warehouse_id, status, reference_record_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [transaction_id, type, material_code, quantity, unit, batch_number, expiry_date, warehouse_id, status, reference_record_id],
    );
    // Update material balance
    if (type === 'RECEIVE') {
      db.run(`UPDATE materials SET balance = balance + ? WHERE code = ?`, [quantity, material_code]);
    } else if (type === 'ISSUE') {
      db.run(`UPDATE materials SET balance = balance - ? WHERE code = ?`, [quantity, material_code]);
    }
    db.run("COMMIT", function (err) {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ error: "خطأ في قاعدة البيانات — يرجى المحاولة مرة أخرى" });
      }
      res.json({ success: true });
    });
  });
});

// INV: Get Inventory Transactions
router.get("/inventory/transactions", requireAuth, (req, res) => {
  getDb().all("SELECT * FROM inventory_transactions ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    res.json(rows || []);
  });
});

// INV: Get Materials
router.get("/materials", requireAuth, (req, res) => {
  const { category, warehouse_id, low_stock } = req.query;
  const conditions: string[] = ["is_active = 1"];
  const params: any[] = [];
  if (category && category !== "ALL") { conditions.push("category = ?"); params.push(category); }
  if (warehouse_id && warehouse_id !== "ALL") { conditions.push("warehouse_id = ?"); params.push(warehouse_id); }
  if (low_stock === "true") { conditions.push("balance <= min_balance"); }
  const where = conditions.join(" AND ");
  getDb().all(`SELECT *, min_balance as minBalance FROM materials WHERE ${where} ORDER BY code ASC`, params, (err, rows) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    res.json(rows || []);
  });
});


const materialSchema = yup.object({
  code: yup.string().required(),
  name: yup.string().required(),
  category: yup.string().required(),
  balance: yup.number().min(0)
});
// INV: Create Material
router.post("/materials", requireAuth, async (req, res) => {
  
  try {
    await materialSchema.validate(req.body);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
  const { code, name, name_en, category, description, unit, warehouse_id, balance, package_size, package_size_unit } =
    req.body;
  getDb().run(
    `INSERT INTO materials (code, name, name_en, category, description, unit, warehouse_id, balance, package_size, package_size_unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [code, name, name_en, category, description, unit, warehouse_id, balance,
     package_size ? parseFloat(package_size) : null, package_size_unit || null],
    function (err) {
      if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
      res.json({ success: true, id: this.lastID });
    },
  );
});

// INV: Bulk import materials from Excel (parsed client-side, sent as JSON array)
router.post("/materials/bulk", requireAuth, async (req: any, res) => {
  const user = req.user;
  if (!user || user.level > 2) return res.status(403).json({ error: "غير مصرح" });

  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0)
    return res.status(400).json({ error: "لا توجد بيانات للاستيراد" });

  const db = getDb();
  const errors: string[] = [];
  let inserted = 0;
  let skipped = 0;

  // Pre-load warehouse map: code → id
  db.all("SELECT id, code FROM warehouses WHERE is_active = 1", [], (whErr, whRows: any[]) => {
    if (whErr) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });

    const warehouseMap: Record<string, number> = {};
    (whRows || []).forEach((w) => { warehouseMap[w.code] = w.id; });

    const insertNext = (i: number) => {
      if (i >= rows.length) {
        return res.json({ success: true, inserted, skipped, errors });
      }
      const r = rows[i];
      if (!r.code || !r.name) {
        errors.push(`الصف ${i + 2}: كود المادة والاسم مطلوبان`);
        return insertNext(i + 1);
      }

      // Resolve warehouse: try exact code match, then partial match
      const whCode = (r.warehouse_code || "").trim().toUpperCase();
      let warehouseId: number | null =
        warehouseMap[whCode] ??
        warehouseMap[Object.keys(warehouseMap).find((k) => k.toUpperCase().includes(whCode) || whCode.includes(k.toUpperCase())) ?? ""] ??
        null;

      if (!warehouseId && whCode) {
        errors.push(`الصف ${i + 2} (${r.code}): كود المستودع "${r.warehouse_code}" غير موجود — سيُضاف بدون مستودع`);
      }

      db.get("SELECT id FROM materials WHERE code = ?", [r.code], (_err, existing) => {
        if (existing) {
          skipped++;
          return insertNext(i + 1);
        }
        db.run(
          `INSERT INTO materials (code, name, name_en, category, description, unit, warehouse_id, balance, min_balance, supplier_name)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            r.code, r.name, r.name_en || "", r.category || "مادة خام",
            r.description || "", r.unit || "كجم",
            warehouseId || null,
            parseFloat(r.balance) || 0,
            parseFloat(r.min_balance) || 0,
            r.supplier_name || "",
          ],
          function (e) {
            if (e) { errors.push(`الصف ${i + 2} (${r.code}): ${e.message}`); return insertNext(i + 1); }
            inserted++;
            // Auto-create supplier in suppliers table if not exists
            if (r.supplier_name) {
              const supCode = (r.code || "").split("-")[1] || "";
              db.run(
                `INSERT OR IGNORE INTO suppliers (code, name) VALUES (?, ?)`,
                [supCode || `SUP-${Date.now()}`, r.supplier_name]
              );
            }
            insertNext(i + 1);
          }
        );
      });
    };

    insertNext(0);
  });
});

// INV: Deactivate ALL Materials (admin only — soft delete)
router.delete("/materials", requireAuth, (req: any, res) => {
  if (!req.user || req.user.level > 1) return res.status(403).json({ error: "للمدير فقط" });
  getDb().run(`UPDATE materials SET is_active = 0`, [], function (err) {
    if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
    res.json({ success: true, deactivated: this.changes });
  });
});

// INV: Delete Material (soft)
router.delete("/materials/:id", requireAuth, (req, res) => {
  getDb().run(
    `UPDATE materials SET is_active = 0 WHERE id=?`,
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
      res.json({ success: true });
    },
  );
});

// INV: Update Material
router.put("/materials/:id", requireAuth, (req, res) => {
  const { code, name, name_en, category, description, unit, warehouse_id, balance, package_size, package_size_unit } = req.body;
  getDb().run(
    `UPDATE materials SET code=?, name=?, name_en=?, category=?, description=?, unit=?, warehouse_id=?, balance=?, package_size=?, package_size_unit=? WHERE id=?`,
    [code, name, name_en, category, description, unit, warehouse_id, balance,
     package_size ? parseFloat(package_size) : null, package_size_unit || null, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
      res.json({ success: true });
    },
  );
});

// INV: Get material by code (used by FP-001 for package size calculation)
router.get("/materials/by-code/:code", requireAuth, (req, res) => {
  getDb().get(
    "SELECT *, package_size as packageSize, package_size_unit as packageSizeUnit FROM materials WHERE code = ? AND is_active = 1",
    [req.params.code],
    (err, row) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      if (!row) return res.status(404).json({ error: "not found" });
      res.json(row);
    }
  );
});

// INV: Patch balance only (admin level 1)
router.patch("/materials/:id/balance", requireAuth, (req: any, res) => {
  const user = req.user;
  if (!user || user.level > 1) return res.status(403).json({ error: "المدير فقط" });
  const newBalance = parseFloat(req.body.balance);
  if (isNaN(newBalance) || newBalance < 0) return res.status(400).json({ error: "قيمة رصيد غير صحيحة" });
  getDb().run("UPDATE materials SET balance = ? WHERE id = ?", [newBalance, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
    res.json({ success: true, balance: newBalance });
  });
});

// INV: Sync all material balances from approved transaction records (admin only)
router.post("/materials/sync-from-transactions", requireAuth, (req: any, res) => {
  const user = req.user;
  if (!user || user.level > 1) return res.status(403).json({ error: "المدير فقط" });

  const db = getDb();
  db.all("SELECT * FROM forms_records WHERE status = 'approved' ORDER BY created_at ASC", [], (err, rows: any[]) => {
    if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });

    const balances: Record<string, number> = {};

    // Build PRD-001 lookup maps
    const prd001ById: Record<string, any> = {};
    const prd001ByBatch: Record<string, string> = {}; // batchNumber -> productCode (itemNumber)
    rows.filter((r: any) => r.form_id === "F-PRD-001").forEach((r: any) => {
      try {
        const d = JSON.parse(r.data_json || "{}");
        prd001ById[r.record_id] = d;
        if (d.batchNumber && d.itemNumber) prd001ByBatch[d.batchNumber] = d.itemNumber;
      } catch { /* skip */ }
    });

    // Helper: resolve finished-product code from productCode or batchNumber
    const fpCode = (d: any): string | undefined =>
      d.productCode || (d.batchNumber ? prd001ByBatch[d.batchNumber] : undefined);

    for (const row of rows as any[]) {
      const fId: string = row.form_id;
      let d: any;
      try { d = JSON.parse(row.data_json || "{}"); } catch { continue; }

      // RM-001 / MAT: opening balance (set ONLY on first occurrence per code)
      if ((fId === "F-INV-RM-001" || fId === "F-INV-MAT") && d.code) {
        if (!(d.code in balances)) {
          balances[d.code] = parseFloat(d.balance) || 0;
        }
      }

      // PIN: add purchased quantities
      else if (fId === "F-INV-PIN-001" && Array.isArray(d.items)) {
        d.items.forEach((item: any) => {
          const qty = parseFloat(item.quantity) || 0;
          if (item.materialCode && qty > 0) {
            balances[item.materialCode] = (balances[item.materialCode] || 0) + qty;
          }
        });
      }

      // RMT: receive or issue (skip receive if linked to PIN — already counted)
      else if (fId === "F-INV-RMT-001" && Array.isArray(d.items)) {
        if (d.transactionType === "Receive" && d.referenceDocument && /^PIN-/i.test(String(d.referenceDocument))) {
          continue; // PIN already updated balance
        }
        const mult = d.transactionType === "Receive" ? 1 : -1;
        d.items.forEach((item: any) => {
          const qty = parseFloat(item.quantity) || 0;
          if (item.materialCode && qty > 0) {
            balances[item.materialCode] = (balances[item.materialCode] || 0) + qty * mult;
          }
        });
      }

      // PRD-002: deduct raw materials used in production (read from linked PRD-001 ONLY)
      else if (fId === "F-PRD-002" && d.productionOrderNo) {
        const prd1 = prd001ById[d.productionOrderNo];
        if (prd1 && Array.isArray(prd1.rawMaterials)) {
          prd1.rawMaterials.forEach((mat: any) => {
            const qty = parseFloat(mat.quantity) || 0;
            if (mat.materialCode && qty > 0) {
              balances[mat.materialCode] = (balances[mat.materialCode] || 0) - qty;
            }
          });
        }
      }

      // FP-001 (NEW): batch release adds finished product to balance
      else if (fId === "F-FP-001" && d.qcStatus !== "Rejected") {
        const code = fpCode(d);
        const qty = parseFloat(d.releasedQuantity || d.actualQuantity || d.plannedQuantity) || 0;
        if (code && qty > 0) {
          balances[code] = (balances[code] || 0) + qty;
        }
      }

      // FP-002 (legacy): storage adds finished product (keep for old data)
      else if (fId === "F-FP-002") {
        const code = fpCode(d);
        const qty = parseFloat(d.quantityStored) || 0;
        if (code && qty > 0) {
          balances[code] = (balances[code] || 0) + qty;
        }
      }

      // FP-003: shipment deducts from balance
      else if (fId === "F-FP-003") {
        const code = fpCode(d);
        const qty = parseFloat(d.shippedQuantity) || 0;
        if (code && qty > 0) {
          balances[code] = (balances[code] || 0) - qty;
        }
      }

      // FP-004: return adds back to balance
      else if (fId === "F-FP-004") {
        const code = fpCode(d);
        const qty = parseFloat(d.returnedQuantity) || 0;
        if (code && qty > 0) {
          balances[code] = (balances[code] || 0) + qty;
        }
      }

      // FP-005: disposal deducts from balance
      else if (fId === "F-FP-005" && d.batchOrCode) {
        const qty = parseFloat(d.quantity) || 0;
        if (qty > 0) {
          balances[d.batchOrCode] = (balances[d.batchOrCode] || 0) - qty;
        }
      }
    }

    // Apply computed balances
    const entries = Object.entries(balances);
    if (entries.length === 0) return res.json({ success: true, updated: 0, balances: {} });

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      entries.forEach(([code, bal]) => {
        db.run("UPDATE materials SET balance = ? WHERE code = ?", [bal, code]);
      });
      db.run("COMMIT", (commitErr) => {
        if (commitErr) { db.run("ROLLBACK"); return res.status(500).json({ error: "فشل تطبيق التحديثات" }); }
        res.json({ success: true, updated: entries.length, balances });
      });
    });
  });
});

// INV: Search Material by Code
router.get("/materials/search/:code", requireAuth, (req, res) => {
  const codeSearch = `%${req.params.code}%`;
  getDb().all(
    "SELECT * FROM materials WHERE is_active = 1 AND (code LIKE ? OR name LIKE ?)",
    [codeSearch, codeSearch],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      res.json(rows || []);
    },
  );
});

// INV: Get Products (From materials table)
router.get("/products", requireAuth, (req, res) => {
  getDb().all(
    "SELECT * FROM materials WHERE is_active = 1 AND (category = 'منتج نهائي' OR category = 'Finished Product') ORDER BY code ASC",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      res.json(rows || []);
    },
  );
});

// INV: Get Suppliers
router.get("/suppliers", requireAuth, (req, res) => {
  getDb().all("SELECT * FROM suppliers WHERE is_active = 1 ORDER BY code ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    res.json(rows || []);
  });
});

// INV: Create Supplier
router.post("/suppliers", requireAuth, (req, res) => {
  const { code, name, name_en, contact_person, phone, email, address, tax_number } = req.body;
  getDb().run(
    `INSERT INTO suppliers (code, name, name_en, contact_person, phone, email, address, tax_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [code, name, name_en, contact_person, phone, email, address, tax_number || null],
    function (err) {
      if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
      res.json({ success: true, id: this.lastID });
    },
  );
});

// INV: Delete Supplier — soft delete (level ≤ 2 only)
router.delete("/suppliers/:id", requireAuth, (req: any, res) => {
  if (!req.user || req.user.level > 2) return res.status(403).json({ error: "غير مصرح" });
  getDb().run(`UPDATE suppliers SET is_active = 0 WHERE id=?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
    res.json({ success: true });
  });
});

// INV: Update Supplier
router.put("/suppliers/:id", requireAuth, (req: any, res) => {
  if (!req.user || req.user.level > 2) return res.status(403).json({ error: "غير مصرح" });
  const { code, name, name_en, contact_person, phone, email, address, tax_number } = req.body;
  getDb().run(
    `UPDATE suppliers SET code=?, name=?, name_en=?, contact_person=?, phone=?, email=?, address=?, tax_number=? WHERE id=?`,
    [code, name, name_en, contact_person, phone, email, address, tax_number || null, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
      res.json({ success: true });
    }
  );
});

// INV: Search Supplier
router.get("/suppliers/search/:code", requireAuth, (req, res) => {
  const query = `%${req.params.code}%`;
  getDb().all(
    "SELECT * FROM suppliers WHERE is_active = 1 AND (code LIKE ? OR name LIKE ?)",
    [query, query],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      res.json(rows || []);
    },
  );
});

// INV: Get Customers
router.get("/customers", requireAuth, (req, res) => {
  getDb().all("SELECT * FROM customers WHERE is_active = 1 ORDER BY code ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    res.json(rows || []);
  });
});

// INV: Create Customer
router.post("/customers", requireAuth, (req, res) => {
  const { code, name, name_en, contact_person, phone, email, address } = req.body;
  getDb().run(
    `INSERT INTO customers (code, name, name_en, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [code, name, name_en, contact_person, phone, email, address],
    function (err) {
      if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
      res.json({ success: true, id: this.lastID });
    },
  );
});

// INV: Delete Customer — soft delete (level ≤ 2 only)
router.delete("/customers/:id", requireAuth, (req: any, res) => {
  if (!req.user || req.user.level > 2) return res.status(403).json({ error: "غير مصرح" });
  getDb().run(`UPDATE customers SET is_active = 0 WHERE id=?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
    res.json({ success: true });
  });
});

// INV: Update Customer
router.put("/customers/:id", requireAuth, (req: any, res) => {
  if (!req.user || req.user.level > 2) return res.status(403).json({ error: "غير مصرح" });
  const { code, name, name_en, contact_person, phone, email, address } = req.body;
  getDb().run(
    `UPDATE customers SET code=?, name=?, name_en=?, contact_person=?, phone=?, email=?, address=? WHERE id=?`,
    [code, name, name_en, contact_person, phone, email, address, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
      res.json({ success: true });
    }
  );
});

// INV: Search Customer
router.get("/customers/search/:code", requireAuth, (req, res) => {
  const query = `%${req.params.code}%`;
  getDb().all(
    "SELECT * FROM customers WHERE is_active = 1 AND (code LIKE ? OR name LIKE ?)",
    [query, query],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      res.json(rows || []);
    },
  );
});


// Required fields per form — validated when status is not 'draft'
const FORM_REQUIRED_FIELDS: Record<string, { field: string; label: string }[]> = {
  "F-INV-PRQ-001": [
    { field: "requestDate",   label: "تاريخ الطلب" },
    { field: "supplierName",  label: "اسم المورد" },
    { field: "warehouseId",   label: "المستودع المستلم" },
    { field: "items",         label: "قائمة المواد المطلوبة" },
  ],
  "F-INV-PIN-001": [
    { field: "invoiceDate",   label: "تاريخ الفاتورة" },
    { field: "supplierName",  label: "اسم المورد" },
    { field: "items",         label: "المواد المستلمة" },
  ],
  "F-INV-RM-001": [
    { field: "code",          label: "كود المادة" },
    { field: "name",          label: "اسم المادة" },
    { field: "batchNumber",   label: "رقم الدفعة" },
    { field: "expiryDate",    label: "تاريخ الانتهاء" },
    { field: "unit",          label: "وحدة القياس" },
  ],
  "F-INV-RMT-001": [
    { field: "transactionType", label: "نوع الحركة" },
    { field: "items",           label: "المواد" },
  ],
  "F-INV-BOM": [
    { field: "productCode",   label: "كود المنتج" },
    { field: "version",       label: "الإصدار" },
    { field: "materials",     label: "المواد الخام" },
  ],
  "F-FP-001": [
    { field: "productionOrderNo", label: "رقم أمر الإنتاج" },
    { field: "qcStatus",          label: "حالة الجودة" },
    { field: "releaseDate",       label: "تاريخ الإفراج" },
  ],
  "F-FP-002": [
    { field: "batchNumber",       label: "رقم الدفعة" },
    { field: "quantityStored",    label: "الكمية المخزنة" },
    { field: "storageDate",       label: "تاريخ التخزين" },
  ],
  "F-FP-003": [
    { field: "customerName",      label: "اسم العميل" },
    { field: "batchNumber",       label: "رقم الدفعة" },
    { field: "shippedQuantity",   label: "الكمية المشحونة" },
    { field: "shipmentDate",      label: "تاريخ الشحن" },
  ],
  "F-FP-004": [
    { field: "customerName",      label: "اسم العميل" },
    { field: "batchNumber",       label: "رقم الدفعة" },
    { field: "returnedQuantity",  label: "الكمية المرتجعة" },
    { field: "returnReason",      label: "سبب الإرجاع" },
  ],
  "F-FP-005": [
    { field: "itemType",          label: "نوع المادة" },
    { field: "quantity",          label: "الكمية" },
    { field: "disposalDate",      label: "تاريخ الإتلاف" },
    { field: "disposalMethod",    label: "طريقة الإتلاف" },
  ],
  "F-FP-006": [
    { field: "batchNumber",       label: "رقم الدفعة" },
    { field: "productCode",       label: "كود المنتج" },
    { field: "sampleQuantity",    label: "كمية العينة" },
    { field: "expiryDate",        label: "تاريخ الانتهاء" },
  ],
  "F-PRD-001": [
    { field: "productName",           label: "اسم المنتج" },
    { field: "requiredBatchSize",     label: "حجم الدفعة" },
    { field: "plannedStartDate",      label: "تاريخ البدء المخطط" },
    { field: "rawMaterials",          label: "المواد الخام" },
  ],
  "F-PRD-002": [
    { field: "productionOrderNo",     label: "رقم أمر الإنتاج" },
    { field: "batchNumber",           label: "رقم الدفعة" },
    { field: "actualStartDateTime",   label: "وقت بدء الإنتاج الفعلي" },
    { field: "supervisorName",        label: "اسم المشرف" },
  ],
  "F-PRD-003": [
    { field: "batchNumber",           label: "رقم الدفعة" },
    { field: "auditorName",           label: "اسم المدقق" },
  ],
  "F-PRD-004": [
    { field: "batchNumber",           label: "رقم الدفعة" },
    { field: "productionStage",       label: "مرحلة الإنتاج" },
    { field: "readings",              label: "القراءات" },
  ],
  "F-LAB-001": [
    { field: "requestDate",           label: "تاريخ الطلب" },
    { field: "sampleType",            label: "نوع العينة" },
    { field: "itemCode",              label: "كود المادة" },
    { field: "batchNumber",           label: "رقم الدفعة" },
    { field: "requiredTests",         label: "الاختبارات المطلوبة" },
  ],
  "F-LAB-002": [
    { field: "itemName",              label: "اسم العينة" },
    { field: "batchNumber",           label: "رقم الدفعة" },
    { field: "sampleQuantity",        label: "كمية العينة" },
    { field: "conditionOnReceipt",    label: "حالة العينة عند الاستلام" },
  ],
  "F-LAB-003": [
    { field: "sampleId",              label: "رقم العينة" },
    { field: "testType",              label: "نوع الاختبار" },
    { field: "results",               label: "النتائج" },
    { field: "overallStatus",         label: "الحكم النهائي" },
  ],
  "F-LAB-004": [
    { field: "testResultId",          label: "رقم نتيجة الاختبار" },
    { field: "finalStatus",           label: "القرار النهائي" },
    { field: "approvedBy",            label: "اعتمد بواسطة" },
  ],
  "F-LAB-005": [
    { field: "itemCode",              label: "كود المادة" },
    { field: "batchNumber",           label: "رقم الدفعة" },
    { field: "startDate",             label: "تاريخ البدء" },
  ],
  "F-LAB-006": [
    { field: "equipmentName",         label: "اسم الجهاز" },
    { field: "equipmentId",           label: "رقم الجهاز" },
    { field: "nextCalibrationDate",   label: "تاريخ المعايرة القادمة" },
  ],
  "F-LAB-007": [
    { field: "items",                 label: "المواد المطلوبة" },
  ],
  "F-QM-001": [
    { field: "meetingDate",           label: "تاريخ الاجتماع" },
    { field: "attendees",             label: "الحضور" },
    { field: "decisionsAndActions",   label: "القرارات والإجراءات" },
  ],
  "F-QM-005": [
    { field: "description",           label: "وصف عدم المطابقة" },
    { field: "batchNumber",           label: "رقم الدفعة" },
    { field: "immediateAction",       label: "الإجراء الفوري" },
  ],
  "F-QM-006": [
    { field: "description",           label: "وصف المشكلة" },
    { field: "rootCause",             label: "السبب الجذري" },
    { field: "correctiveAction",      label: "الإجراء التصحيحي" },
    { field: "responsiblePerson",     label: "الشخص المسؤول" },
    { field: "targetDate",            label: "التاريخ المستهدف" },
  ],
  "F-DEV-001": [
    { field: "batchNumber",           label: "رقم الدفعة" },
    { field: "productionStage",       label: "مرحلة الإنتاج" },
    { field: "description",           label: "وصف الانحراف" },
    { field: "immediateAction",       label: "الإجراء الفوري" },
  ],
  "F-CMP-001": [
    { field: "customerName",          label: "اسم العميل" },
    { field: "productName",           label: "اسم المنتج" },
    { field: "complaintDetails",      label: "تفاصيل الشكوى" },
  ],
  "F-RCL-001": [
    { field: "productName",           label: "اسم المنتج" },
    { field: "batchNumber",           label: "رقم الدفعة" },
    { field: "reasonForRecall",       label: "سبب الاستدعاء" },
    { field: "actionPlan",            label: "خطة العمل" },
  ],
  "F-HR-001": [
    { field: "jobTitle",              label: "المسمى الوظيفي" },
    { field: "requestingDept",        label: "القسم الطالب" },
    { field: "dateNeeded",            label: "التاريخ المطلوب" },
  ],
  "F-HR-002": [
    { field: "employeeNumber",        label: "رقم الموظف" },
    { field: "fullNameAr",            label: "الاسم بالعربية" },
    { field: "joinDate",              label: "تاريخ الالتحاق" },
  ],
  "F-HR-003": [
    { field: "employeeId",            label: "رقم الموظف" },
    { field: "examDate",              label: "تاريخ الفحص" },
  ],
  "F-TRN-001": [
    { field: "department",            label: "القسم" },
    { field: "trainingCourses",       label: "الدورات التدريبية" },
  ],
  "F-TRN-002": [
    { field: "trainingTitle",         label: "عنوان التدريب" },
    { field: "trainingDate",          label: "تاريخ التدريب" },
    { field: "trainerName",           label: "اسم المدرب" },
    { field: "attendees",             label: "المشاركون" },
  ],
  "F-TRN-003": [
    { field: "employeeName",          label: "اسم الموظف" },
    { field: "trainingTitle",         label: "عنوان التدريب" },
    { field: "assessmentDate",        label: "تاريخ التقييم" },
  ],
  "F-TRN-004": [
    { field: "employeeName",          label: "اسم الموظف" },
    { field: "certificateTitle",      label: "عنوان الشهادة" },
    { field: "issueDate",             label: "تاريخ الإصدار" },
    { field: "expiryDate",            label: "تاريخ الانتهاء" },
  ],
};

const validateFormData = (formId: string, data: any): string[] => {
  const errors: string[] = [];
  const rules = FORM_REQUIRED_FIELDS[formId];
  if (!rules || !data) return errors;

  for (const rule of rules) {
    const val = data[rule.field];
    const isEmpty =
      val === undefined ||
      val === null ||
      val === "" ||
      (Array.isArray(val) && val.length === 0);
    if (isEmpty) {
      errors.push(rule.label);
    }
  }
  return errors;
};

router.get("/forms", requireAuth, (req: any, res) => {
  const user: any = req.user;

  let query = "SELECT * FROM forms_records WHERE status != 'deleted' ORDER BY id DESC LIMIT 500";
  let params: any[] = [];

  if (user && user.level) {
    if (user.level === 4) {
      query =
        "SELECT * FROM forms_records WHERE status != 'deleted' AND (creator_id = ? OR creator_id IS NULL) ORDER BY id DESC LIMIT 500";
      params = [user.id];
    } else if (user.level === 3 || user.level === 2) {
      if (user.department !== "ALL") {
        query =
          "SELECT * FROM forms_records WHERE status != 'deleted' AND department = ? ORDER BY id DESC LIMIT 500";
        params = [user.department];
      }
    }
  }

  getDb().all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    const mappedRows = rows.map((r: any) => ({
      ...r,
      data: JSON.parse(r.data_json || "{}"),
    }));
    res.json(mappedRows);
  });
});

// Create Form Record
router.post("/forms", requireAuth, (req: any, res) => {
  let { recordId, formId, department, creatorId, status, data } = req.body;
  const timestamp = new Date().toISOString();
  creatorId = req.user.id; // always use authenticated user's id

  const user: any = getAuthUser(req);
  if (user && user.level && user.level >= 2 && user.department !== "ALL") {
    if (department !== user.department) {
      return res.status(403).json({ error: "Unauthorized department" });
    }
  }

  // Enforce status based on user level
  if (user && user.level) {
    if (user.level === 3 && status === "approved") {
      status = "pending_approval";
    } else if (
      user.level >= 4 &&
      (status === "approved" || status === "pending_approval")
    ) {
      status = "pending_review";
    }
  }

  // Validate required fields for non-draft submissions
  if (status !== "draft") {
    const missing = validateFormData(formId, data);
    if (missing.length > 0) {
      return res.status(400).json({
        error: `الحقول التالية مطلوبة قبل الإرسال: ${missing.join("، ")}`,
        missingFields: missing,
      });
    }
  }

  getDb().run(
    `INSERT INTO forms_records (record_id, form_id, department, creator_id, created_at, status, data_json) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      recordId,
      formId,
      department,
      creatorId,
      timestamp,
      status,
      JSON.stringify(data),
    ],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to create record" });
      }
      const newRecordId = this.lastID;

      // Add audit log
      getDb().run(
        `INSERT INTO audit_log (user_id, action, form_id, record_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          creatorId,
          "CREATE",
          formId,
          recordId,
          timestamp,
          "Created new form record",
        ],
      );

      if (status === "approved") {
        handleFormApprovalEffect(formId, data);
      }

      res.status(201).json({ id: newRecordId, recordId });
    },
  );
});

// Update Form Record
router.put("/forms/record/:recordId", requireAuth, (req: any, res) => {
  const { recordId } = req.params;
  let { status, data, userId, notes } = req.body;
  const timestamp = new Date().toISOString();
  userId = req.user.id;

  const user: any = req.user;
  // Enforce status based on user level
  if (user && user.level) {
    if (user.level === 3 && status === "approved") {
      status = "pending_approval";
    } else if (
      user.level >= 4 &&
      (status === "approved" || status === "pending_approval")
    ) {
      status = "pending_review";
    }
  }

  // First let's get existing to avoid wiping
  getDb().get(
    "SELECT * FROM forms_records WHERE record_id = ?",
    [recordId],
    (err, row: any) => {
      if (err || !row)
        return res.status(404).json({ error: "Record not found" });

      if (user && user.level) {
        if (user.level === 4) {
          if (row.creator_id !== user.id) {
             return res.status(403).json({ error: "Only the creator can edit this form" });
          }
          if (row.status === "approved" || row.status === "rejected") {
             return res.status(403).json({ error: "Cannot edit an approved or rejected form" });
          }
        } else if (user.level === 2 || user.level === 3) {
          if (row.department !== user.department && user.department !== "ALL") {
             return res.status(403).json({ error: "Unauthorized department" });
          }
          if (row.status === "approved" || row.status === "rejected") {
             return res.status(403).json({ error: "Cannot edit an approved or rejected form" });
          }
        }
      }

      let finalDataJson = row.data_json;
      if (data !== undefined) {
        finalDataJson = JSON.stringify(data);
      }

      // Validate required fields when moving out of draft
      if (status !== "draft" && status !== "rejected" && status !== "returned") {
        const formData = JSON.parse(finalDataJson || "{}");
        const fIdToValidate = row.form_id || "";
        const missing = validateFormData(fIdToValidate, formData);
        if (missing.length > 0) {
          return res.status(400).json({
            error: `الحقول التالية مطلوبة قبل الإرسال: ${missing.join("، ")}`,
            missingFields: missing,
          });
        }
      }

      // Pre-approval balance check for PRD-002 raw material deductions
      const doUpdate = () => {
        getDb().run(
          `UPDATE forms_records SET status = ?, data_json = ? WHERE record_id = ?`,
          [status, finalDataJson, recordId],
          function (errUpdate) {
          if (errUpdate) {
            console.error(errUpdate);
            return res.status(500).json({ error: "Failed to update record" });
          }

          // Add audit log
          const fId = row.form_id || req.body.formId || (data ? data.formId : "") || "";
          let details = `Updated form record status to ${status}`;
          if (notes) details += ` | Notes: ${notes}`;

          getDb().run(
            `INSERT INTO audit_log (user_id, action, form_id, record_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)`,
            [userId || 1, "UPDATE", fId, recordId, timestamp, details],
          );

          if (status === "approved" || status === "rejected") { sendNotificationEmail("admin@qform.local", "Form Status Update", `Form ${recordId} is now ${status}`); }
          if (status === "approved" && row.status !== "approved") {
            handleFormApprovalEffect(fId, JSON.parse(finalDataJson || "{}"));
          }

          res.json({ success: true, recordId });
        },
      );
      }; // end doUpdate

      // For PRD-002 approval: check raw material balances before committing
      if (status === "approved" && row.status !== "approved" && row.form_id === "F-PRD-002") {
        const prdFormData = JSON.parse(finalDataJson || "{}");
        const rawMaterials: any[] = (prdFormData.rawMaterials || []).filter((m: any) => m.materialCode && (parseFloat(m.quantity) || 0) > 0);
        if (rawMaterials.length > 0) {
          const codes = rawMaterials.map((m: any) => m.materialCode);
          const placeholders = codes.map(() => '?').join(',');
          getDb().all(
            `SELECT code, balance FROM materials WHERE code IN (${placeholders}) AND is_active = 1`,
            codes,
            (balErr: any, balRows: any[]) => {
              if (balErr) return res.status(500).json({ error: "خطأ في التحقق من أرصدة المواد الخام" });
              const balMap: Record<string, number> = {};
              (balRows || []).forEach((r: any) => { balMap[r.code] = r.balance || 0; });
              const deficits = rawMaterials
                .filter((m: any) => (parseFloat(m.quantity) || 0) > (balMap[m.materialCode] || 0))
                .map((m: any) =>
                  `• ${m.materialName || m.materialCode}: الرصيد المتوفر ${(balMap[m.materialCode] || 0).toFixed(2)}، المطلوب ${parseFloat(m.quantity).toFixed(2)}`
                );
              if (deficits.length > 0) {
                return res.status(400).json({
                  error: `لا يمكن اعتماد أمر التصنيع — رصيد غير كافٍ للمواد التالية:\n${deficits.join('\n')}`
                });
              }
              doUpdate();
            }
          );
          return;
        }
      }
      doUpdate();
    },
  );
});

// Delete Form Record — admin (level 1) or dept manager (level 2) only
router.delete("/forms/record/:recordId", requireAuth, (req: any, res) => {
  const user = req.user;
  if (!user || user.level > 2) return res.status(403).json({ error: "غير مصرح — المدير فقط" });

  getDb().get("SELECT * FROM forms_records WHERE record_id = ?", [req.params.recordId], (err, row: any) => {
    if (err || !row) return res.status(404).json({ error: "السجل غير موجود" });
    if (row.status === "approved" && user.level > 1) {
      return res.status(403).json({ error: "لا يمكن حذف نموذج معتمد إلا من قبل مدير النظام" });
    }
    if (user.level === 2 && row.department !== user.department && user.department !== "ALL") {
      return res.status(403).json({ error: "غير مصرح — خارج نطاق قسمك" });
    }
    getDb().run("UPDATE forms_records SET status = 'deleted' WHERE record_id = ?", [req.params.recordId], function (e) {
      if (e) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
      getDb().run(
        `INSERT INTO audit_log (user_id, action, form_id, record_id, timestamp, details) VALUES (?, 'DELETE', ?, ?, ?, ?)`,
        [user.id, row.form_id, req.params.recordId, new Date().toISOString(), `Soft-deleted by level ${user.level}`]
      );
      res.json({ success: true });
    });
  });
});

// Get Single Form Record
router.get("/forms/record/:recordId", requireAuth, (req, res) => {
  const { recordId } = req.params;
  getDb().get(
    "SELECT * FROM forms_records WHERE record_id = ?",
    [recordId],
    (err, row: any) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json({ ...row, data: JSON.parse(row.data_json || "{}") });
    },
  );
});

// Get Dashboard Notifications
router.get("/notifications/dashboard", requireAuth, (req, res) => {
  const user: any = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  getDb().all("SELECT * FROM forms_records WHERE status != 'deleted' ORDER BY id DESC LIMIT 200", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    const records = rows.map((r: any) => ({
      ...r,
      data: JSON.parse(r.data_json || "{}"),
    }));

    const notifications: { id: string;
      message: string;
      type: "info" | "warning" | "success" | "error";
      link?: string;
      date: string;
    }[] = [];

    const formsByFormId = (formId: string, status?: string) => records.filter(r => r.form_id === formId && (!status || r.status === status));

    // Inventory (INV)
    if (user.department === "INV" || user.department === "ALL" || user.level === 1) {
      // 1. Purchase Requisitions needing Material Receipt (PIN)
      const approvedPRQs = formsByFormId("F-INV-PRQ-001", "approved");
      const pinForms = formsByFormId("F-INV-PIN-001");
      
      approvedPRQs.forEach(prq => {
        const isReceived = pinForms.some(pin => matchesReference(pin.data, prq.record_id));
        if (!isReceived) {
          notifications.push({
            id: `prq-missing-pin-${prq.record_id}`,
            message: `طلب شراء مواد رقم ${prq.record_id} معتمد وبانتظار استلام المواد (فاتورة استلام).`,
            type: "warning",
            link: "/inv",
            date: prq.created_at
          });
        }
      });

      // 2. Finished Product Releases needing Storage in Warehouse (FP-002)
      const approvedReleases = formsByFormId("F-FP-001", "approved");
      const fpStored = formsByFormId("F-FP-002");
      approvedReleases.forEach(rel => {
        const isStored = fpStored.some(stg => stg.data?.batchNumber === rel.data?.batchNumber || stg.data?.reference === rel.record_id);
        if (!isStored) {
          notifications.push({
            id: `fp-not-stored-${rel.record_id}`,
            message: `تم الإفراج عن تشغيلة ${rel.data?.batchNumber || ''} بالنموذج ${rel.record_id} بانتظار أمر تخزينه في المستودع.`,
            type: "info",
            link: "/inv",
            date: rel.created_at
          });
        }
      });

      // 3. Production Orders needing Material Issue (RMT)
      const approvedOrders = formsByFormId("F-PRD-001", "approved");
      const rmtIssues = formsByFormId("F-INV-RMT-001").filter(r => r.data?.transactionType === "Issue");
      approvedOrders.forEach(order => {
        const isIssued = rmtIssues.some(rmt => matchesReference(rmt.data, order.record_id));
        if (!isIssued) {
          notifications.push({
            id: `prd-missing-rmt-${order.record_id}`,
            message: `أمر إنتاج رقم ${order.record_id} معتمد بانتظار صرف المواد الخام والتعبئة الخاصة به من المستودع.`,
            type: "warning",
            link: "/inv",
            date: order.created_at
          });
        }
      });

      // 4. Lab Material Requests (R&D) needing Material Issue (RMT)
      const labRequests = formsByFormId("F-LAB-007").filter(r => r.status && r.status !== "draft");
      labRequests.forEach(req => {
        const isIssued = rmtIssues.some(rmt => matchesReference(rmt.data, req.record_id));
        if (!isIssued) {
           notifications.push({
            id: `lab-missing-rmt-${req.record_id}`,
            message: `المختبر يطلب مواد للبحث العينة/التركيبة رقم ${req.record_id}، يجب إصدار سند صرف للمختبر.`,
            type: "warning",
            link: "/inv",
            date: req.created_at
           });
        }
      });
      
      const pendingPINs = formsByFormId("F-INV-PIN-001", "pending");
      if (pendingPINs.length > 0 && user.level <= 2) {
        notifications.push({
          id: `pin-pending`,
          message: `لديك ${pendingPINs.length} فاتورة شراء (فحص الدخول المعياري) بانتظار المراجعة والاعتماد.`,
          type: "info",
          link: "/inv",
          date: new Date().toISOString()
        });
      }
    }

    // Production (PRD)
    if (user.department === "PRD" || user.department === "ALL" || user.level === 1) {
      const approvedOrders = formsByFormId("F-PRD-001", "approved");
      const completedBMRs = formsByFormId("F-PRD-002");
      approvedOrders.forEach(order => {
         const hasBmr = completedBMRs.some(bmr => matchesReference(bmr.data, order.record_id));
         if (!hasBmr) {
            notifications.push({
              id: `prd-order-pending-${order.record_id}`,
              message: `أمر إنتاج رقم ${order.record_id} معتمد ولم يتم فتح سجل التشغيلة الخاص به.`,
              type: "warning",
              link: "/prd",
              date: order.created_at
            });
         }
      });
      
      const pendingOrders = formsByFormId("F-PRD-001", "pending");
      if (pendingOrders.length > 0 && user.level <= 2) {
         notifications.push({
           id: `prd-orders-pending`,
           message: `تنبيه للإدارة: يوجد ${pendingOrders.length} أوامر إنتاج بانتظار الاعتماد.`,
           type: "info",
           link: "/prd",
           date: new Date().toISOString()
         });
      }
    }

    // Quality (QM)
    if (user.department === "QM" || user.department === "ALL" || user.level === 1) {
      const submittedBMRs = [...formsByFormId("F-PRD-002", "pending"), ...formsByFormId("F-PRD-002", "submitted")];
      if (submittedBMRs.length > 0) {
        notifications.push({
          id: `qm-bmrs`,
          message: `يوجد ${submittedBMRs.length} سجلات تصنيع وتشغيل (BMR) جاهزة بانتظار المراجعة من قسم الجودة.`,
          type: "warning",
          link: "/qm",
          date: new Date().toISOString()
        });
      }

      // Complaints, Deviations, NCRs needing CAPA
      const issues = [
        ...formsByFormId("F-CMP-001"),
        ...formsByFormId("F-DEV-001"),
        ...formsByFormId("F-QM-005"),
      ];
      const capaForms = formsByFormId("F-QM-006");
      
      issues.forEach(issue => {
        // Find if a CAPA references this issue
        const hasCapa = capaForms.some(capa => matchesReference(capa.data, issue.record_id) || capa.data?.sourceDocument === issue.record_id);
        if (!hasCapa && issue.status !== "draft") {
          notifications.push({
            id: `qm-missing-capa-${issue.record_id}`,
            message: `سجل (${issue.record_id}) يحتاج إلى فتح نموذج إجراء تصحيحي ووقائي (CAPA).`,
            type: "error",
            link: "/qm",
            date: issue.created_at
          });
        }
      });
    }

    // Laboratory (LAB)
    if (user.department === "LAB" || user.department === "ALL" || user.level === 1) {
       const incomingMaterials = formsByFormId("F-INV-PIN-001", "approved");
       const analysisForms = formsByFormId("F-LAB-001");

       incomingMaterials.forEach(pin => {
         const hasAnalysis = analysisForms.some(lab => matchesReference(lab.data, pin.record_id) || lab.data?.invoiceNo === pin.record_id);
         if (!hasAnalysis) {
            notifications.push({
              id: `lab-pin-${pin.record_id}`,
              message: `مواد مدخلة جديد على الفاتورة ${pin.record_id} بانتظار إنشاء نموذج سحب عينات وفحص مخبري.`,
              type: "info",
              link: "/lab",
              date: pin.created_at
            });
         }
       });
    }

    // Training (TRN)
    if (user.department === "TRN" || user.department === "ALL" || user.level === 1) {
       const newEmployees = formsByFormId("F-HR-002").filter(r => r.status === "approved");
       const trainingPlans = formsByFormId("F-TRN-002");
       
       newEmployees.forEach(emp => {
         // Check if a training plan exists for this employee 
         // Assuming the employee name or ID is linked. We'll use referenceDocument or employee ID
         const hasPlan = trainingPlans.some(plan =>
           plan.data?.employeeId === emp.record_id ||
           plan.data?.employeeName === emp.data?.employeeName ||
           matchesReference(plan.data, emp.record_id)
         );
         if (!hasPlan) {
            notifications.push({
              id: `trn-missing-plan-${emp.record_id}`,
              message: `الموظف الجديد (${emp.data?.fullNameAr || emp.record_id}) يحتاج إلى خطة تدريب وإدراج في السجلات.`,
              type: "info",
              link: "/trn",
              date: emp.created_at
            });
         }
       });
    }

    // Any department: their own drafts
    const myDrafts = records.filter(r => r.status === "draft" && r.creator_id === user.id);
    const getDeptLink = (dept: string) => {
      if (dept === "ALL") return "/";
      if (dept === "QA" || dept === "QC" || dept === "ENG") return "/qm";
      if (dept === "R&D") return "/lab";
      return `/${dept.toLowerCase()}`;
    };

    if (myDrafts.length > 0) {
      notifications.push({
          id: `my-drafts`,
          message: `لديك ${myDrafts.length} مسودات غير مكتملة خاصة بك. يرجى إكمالها للمحافظة على سير العمل.`,
          type: "info",
          link: getDeptLink(user.department),
          date: new Date().toISOString()
      });
    }

    notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(notifications);
  });
});

// Get Forms by Department
router.get("/forms/dept/:department", requireAuth, (req, res) => {
  const { department } = req.params;
  const user: any = getAuthUser(req);

  let query =
    "SELECT * FROM forms_records WHERE status != 'deleted' AND department = ? ORDER BY id DESC LIMIT 500";
  let params: any[] = [department];

  if (user && user.level) {
    if (user.level === 4) {
      query =
        "SELECT * FROM forms_records WHERE status != 'deleted' AND department = ? AND (creator_id = ? OR creator_id IS NULL) ORDER BY id DESC LIMIT 500";
      params = [department, user.id];
    } else if (user.level === 3 || user.level === 2) {
      if (user.department !== "ALL" && user.department !== department) {
        return res.json([]);
      }
    }
  }

  getDb().all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    const mappedRows = rows.map((r: any) => ({
      ...r,
      data: JSON.parse(r.data_json || "{}"),
    }));
    res.json(mappedRows);
  });
});

// Backward compatibility or catch all
router.get("/forms/:department", requireAuth, (req, res) => {
  const { department } = req.params;
  const user: any = getAuthUser(req);
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string) || 50);
  const offset = (page - 1) * limit;

  let query =
    "SELECT * FROM forms_records WHERE status != 'deleted' AND department = ? ORDER BY id DESC LIMIT ? OFFSET ?";
  let params: any[] = [department];

  if (user && user.level) {
    if (user.level === 4) {
      query =
        "SELECT * FROM forms_records WHERE status != 'deleted' AND department = ? AND (creator_id = ? OR creator_id IS NULL) ORDER BY id DESC LIMIT ? OFFSET ?";
      params = [department, user.id];
    } else if (user.level === 3 || user.level === 2) {
      if (user.department !== "ALL" && user.department !== department) {
        return res.json({ data: [], page, limit, total: null });
      }
    }
  }

  getDb().all(query, [...params, limit, offset], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB Error" });

    const mappedRows = rows.map((r: any) => ({
      ...r,
      data: JSON.parse(r.data_json || "{}"),
    }));
    res.json({ data: mappedRows, page, limit, total: null });
  });
});

// Dashboard Stats — rich per-department breakdown
router.get("/stats", requireAuth, (req: any, res) => {
  const user = req.user;
  const db = getDb();
  db.all(
    `SELECT department,
            COUNT(*) as total,
            SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status='pending_review' THEN 1 ELSE 0 END) as pending_review,
            SUM(CASE WHEN status='pending_approval' THEN 1 ELSE 0 END) as pending_approval,
            SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) as drafts,
            SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END) as rejected
     FROM forms_records GROUP BY department`,
    [],
    (err, deptRows) => {
      if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });

      // Pending items assigned to this user for action
      db.all(
        `SELECT record_id, form_id, department, status, created_at, data_json
         FROM forms_records
         WHERE status IN ('pending_review','pending_approval')
         ORDER BY created_at DESC LIMIT 50`,
        [],
        (err2, pendingRows: any[]) => {
          if (err2) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });

          // Filter pending based on user scope
          const pending = pendingRows
            .filter((r: any) => {
              if (user.level === 1 || user.department === "ALL") return true;
              return r.department === user.department;
            })
            .map((r: any) => ({ ...r, data: JSON.parse(r.data_json || "{}") }));

          res.json({ departments: deptRows || [], pending });
        }
      );
    }
  );
});

// -- REPORTS ENDPOINTS --
const hasReportAccess = (user: any, dept: string, reportId: string) => {
  if (!user) return false;
  if (Number(user.level) === 1 || user.department === "ALL") return true;
  if (user.permissions && user.permissions[reportId]) return true;
  if (user.department === dept && (!user.permissions || Object.keys(user.permissions).length === 0)) return true;
  return false;
};

router.get("/reports/inv/transactions", requireAuth, (req, res) => {
  const user: any = getAuthUser(req);
  if (!hasReportAccess(user, "INV", "REP-INV-TRN")) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const query = `SELECT * FROM forms_records WHERE status = 'approved' AND form_id IN ('F-INV-RM-001', 'F-INV-MAT', 'F-INV-PIN-001', 'F-INV-RMT-001', 'F-FP-002', 'F-FP-003', 'F-FP-004', 'F-FP-005', 'F-PRD-002') ORDER BY created_at DESC`;
  getDb().all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    res.json(
      rows.map((r: any) => ({ ...r, data: JSON.parse(r.data_json || "{}") })),
    );
  });
});

router.get("/reports/inv/supplier-evaluations", requireAuth, (req, res) => {
  const user: any = getAuthUser(req);
  if (!hasReportAccess(user, "INV", "REP-INV-SUP")) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const query = `SELECT * FROM forms_records WHERE form_id = 'F-QM-003' AND status = 'approved' ORDER BY created_at DESC`;
  getDb().all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    res.json(
      rows.map((r: any) => ({ ...r, data: JSON.parse(r.data_json || "{}") })),
    );
  });
});

router.get("/reports/inv/shipments", requireAuth, (req, res) => {
  const user: any = getAuthUser(req);
  if (!hasReportAccess(user, "INV", "REP-INV-SHP")) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const query = `SELECT * FROM forms_records WHERE form_id = 'F-FP-003' AND status = 'approved' ORDER BY created_at DESC`;
  getDb().all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    res.json(
      rows.map((r: any) => ({ ...r, data: JSON.parse(r.data_json || "{}") })),
    );
  });
});

router.get("/reports/inv/returns-disposals", requireAuth, (req, res) => {
  const user: any = getAuthUser(req);
  if (!hasReportAccess(user, "INV", "REP-INV-RET")) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const query = `SELECT * FROM forms_records WHERE form_id IN ('F-FP-004', 'F-FP-005') AND status = 'approved' ORDER BY created_at DESC`;
  getDb().all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    res.json(
      rows.map((r: any) => ({ ...r, data: JSON.parse(r.data_json || "{}") })),
    );
  });
});

router.get("/reports/prd/all", requireAuth, (req, res) => {
  const user: any = getAuthUser(req);
  if (!user) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const query = `SELECT * FROM forms_records WHERE department = 'PRD' AND status = 'approved' ORDER BY created_at DESC`;
  getDb().all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    res.json(
      rows.map((r: any) => ({ ...r, data: JSON.parse(r.data_json || "{}") })),
    );
  });
});

router.get("/reports/qm/all", requireAuth, (req, res) => {
  const user: any = getAuthUser(req);
  if (!user) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const query = `SELECT * FROM forms_records WHERE department = 'QM' AND status = 'approved' ORDER BY created_at DESC`;
  getDb().all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    res.json(
      rows.map((r: any) => ({ ...r, data: JSON.parse(r.data_json || "{}") })),
    );
  });
});

router.get("/reports/all", requireAuth, (req, res) => {
  const user: any = getAuthUser(req);
  if (!user) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const query = `SELECT * FROM forms_records WHERE status = 'approved' ORDER BY created_at DESC`;
  getDb().all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    res.json(
      rows.map((r: any) => ({ ...r, data: JSON.parse(r.data_json || "{}") })),
    );
  });
});

// ─── Archive Endpoint ─────────────────────────────────────────────────────────
// GET /api/archive?search=&department=&status=&formId=&dateFrom=&dateTo=&page=1&limit=50
router.get("/archive", requireAuth, (req: any, res) => {
  const user = req.user as any;
  const db = getDb();

  const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));
  const offset = (page - 1) * limit;

  const search     = (req.query.search     as string || "").trim();
  const department = (req.query.department as string || "").trim();
  const status     = (req.query.status     as string || "").trim();
  const formId     = (req.query.formId     as string || "").trim();
  const dateFrom   = (req.query.dateFrom   as string || "").trim();
  const dateTo     = (req.query.dateTo     as string || "").trim();

  const conditions: string[] = ["fr.status != 'deleted'"];
  const params: any[] = [];

  // ── Access control ──────────────────────────────────────────────────────────
  if (user.level === 4) {
    conditions.push("(fr.creator_id = ? OR fr.creator_id IS NULL)");
    params.push(user.id);
  } else if ((user.level === 3 || user.level === 2) && user.department !== "ALL") {
    conditions.push("fr.department = ?");
    params.push(user.department);
  }

  // ── Filters ─────────────────────────────────────────────────────────────────
  if (department) { conditions.push("fr.department = ?");  params.push(department); }
  if (status)     { conditions.push("fr.status = ?");      params.push(status); }
  if (formId)     { conditions.push("fr.form_id = ?");     params.push(formId); }
  if (dateFrom)   { conditions.push("DATE(fr.created_at) >= ?"); params.push(dateFrom); }
  if (dateTo)     { conditions.push("DATE(fr.created_at) <= ?"); params.push(dateTo); }
  if (search)     {
    conditions.push("(fr.record_id LIKE ? OR fr.form_id LIKE ? OR u.name LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const baseQuery = `
    FROM forms_records fr
    LEFT JOIN users u ON fr.creator_id = u.id
    ${where}
  `;

  // Count first
  db.get(`SELECT COUNT(*) as total ${baseQuery}`, params, (err, countRow: any) => {
    if (err) return res.status(500).json({ error: "DB Error: count" });
    const total = countRow?.total ?? 0;
    const pages = Math.ceil(total / limit);

    db.all(
      `SELECT fr.id, fr.record_id, fr.form_id, fr.department,
              fr.creator_id, fr.created_at, fr.status,
              u.name as creator_name, u.user_id as creator_user_id
       ${baseQuery}
       ORDER BY fr.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
      (err2, rows: any[]) => {
        if (err2) return res.status(500).json({ error: "DB Error: rows" });
        res.json({ data: rows, total, page, pages, limit });
      }
    );
  });
});

// Archive stats — counts by department and status for the current user's scope
router.get("/archive/stats", requireAuth, (req: any, res) => {
  const user = req.user as any;
  const db = getDb();

  const conditions: string[] = ["status != 'deleted'"];
  const params: any[] = [];

  if (user.level === 4) {
    conditions.push("(creator_id = ? OR creator_id IS NULL)");
    params.push(user.id);
  } else if ((user.level === 3 || user.level === 2) && user.department !== "ALL") {
    conditions.push("department = ?");
    params.push(user.department);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  db.all(
    `SELECT
       department,
       COUNT(*) as total,
       SUM(CASE WHEN status='approved'        THEN 1 ELSE 0 END) as approved,
       SUM(CASE WHEN status='pending_review'  THEN 1 ELSE 0 END) as pending_review,
       SUM(CASE WHEN status='pending_approval'THEN 1 ELSE 0 END) as pending_approval,
       SUM(CASE WHEN status='draft'           THEN 1 ELSE 0 END) as draft,
       SUM(CASE WHEN status='rejected'        THEN 1 ELSE 0 END) as rejected
     FROM forms_records
     ${where}
     GROUP BY department
     ORDER BY department`,
    params,
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      res.json(rows);
    }
  );
});

export default router;
