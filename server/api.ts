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
  console.warn("WARNING: JWT_SECRET environment variable is missing. Using dynamic fallback secret. Existing tokens will be invalidated on server restart.");
}
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

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
      `INSERT INTO materials (code, name, name_en, category, description, unit, warehouse_id, balance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(code) DO UPDATE SET
         name = excluded.name,
         name_en = excluded.name_en,
         category = excluded.category,
         description = excluded.description,
         unit = excluded.unit,
         warehouse_id = excluded.warehouse_id`,
      [
        data.code,
        data.name,
        data.name_en || null,
        data.category || "مادة خام",
        data.description || "",
        data.unit,
        data.warehouse_id || null,
        data.balance || 0,
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

  // 1. PIN (Purchase Invoice) - Add to balance (wrapped in transaction)
  if (fId === "F-INV-PIN-001" && Array.isArray(data.items)) {
    const db = getDb();
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      data.items.forEach((item: any) => {
        if (item.materialCode && item.quantity) {
          db.run(
            `UPDATE materials SET balance = COALESCE(balance, 0) + ? WHERE code = ?`,
            [parseFloat(item.quantity) || 0, item.materialCode]
          );
        }
      });
      db.run("COMMIT", (err) => { if (err) db.run("ROLLBACK"); });
    });
  }

  // 2. RMT (Material Receive/Issue) - Add or Subtract (wrapped in transaction)
  if (fId === "F-INV-RMT-001" && Array.isArray(data.items)) {
    const qtyMultiplier = data.transactionType === "Receive" ? 1 : -1;
    const db = getDb();
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      data.items.forEach((item: any) => {
        if (item.materialCode && item.quantity) {
          db.run(
            `UPDATE materials SET balance = COALESCE(balance, 0) + ? WHERE code = ?`,
            [(parseFloat(item.quantity) || 0) * qtyMultiplier, item.materialCode]
          );
        }
      });
      db.run("COMMIT", (err) => { if (err) db.run("ROLLBACK"); });
    });
  }

  // 3. F-FP-002 (Finished Product Storage) - Add to balance (wrapped in transaction inside callback)
  if (fId === "F-FP-002" && data.batchNumber && data.quantityStored) {
    const qty = parseFloat(data.quantityStored) || 0;
    if (qty > 0) {
      getDb().all(
        "SELECT data_json FROM forms_records WHERE form_id = 'F-PRD-001' AND status = 'approved'",
        [],
        (err, prdRows: any[]) => {
          if (!err && prdRows) {
            for (const prdRow of prdRows) {
              try {
                const prdData = JSON.parse(prdRow.data_json || "{}");
                if (prdData.batchNumber === data.batchNumber && prdData.itemNumber) {
                  const db = getDb();
                  db.serialize(() => {
                    db.run("BEGIN TRANSACTION");
                    db.run(
                      `UPDATE materials SET balance = COALESCE(balance, 0) + ? WHERE code = ?`,
                      [qty, prdData.itemNumber]
                    );
                    db.run("COMMIT", (commitErr) => { if (commitErr) db.run("ROLLBACK"); });
                  });
                  break;
                }
              } catch (e) {
                // ignore json parse error
              }
            }
          }
        }
      );
    }
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
              if (mat.materialCode && mat.quantity) {
                const qty = parseFloat(mat.quantity) || 0;
                if (qty > 0) {
                  db.run(
                    `UPDATE materials SET balance = MAX(0, COALESCE(balance, 0) - ?) WHERE code = ?`,
                    [qty, mat.materialCode]
                  );
                  const txnId = `PRD-${Date.now()}-${mat.materialCode}`;
                  db.run(
                    `INSERT OR IGNORE INTO inventory_transactions (transaction_id, type, material_code, quantity, unit, batch_number, reference_record_id, status) VALUES (?, 'ISSUE', ?, ?, ?, ?, ?, 'confirmed')`,
                    [txnId, mat.materialCode, qty, mat.unit || '', data.batchNumber || '', data.productionOrderNo]
                  );
                }
              }
            });
            db.run("COMMIT");
          });
        } catch (e) {
          console.error("PRD002 material deduction error:", e);
        }
      }
    );
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
    "SELECT id, user_id, name, department, level, status, permissions FROM users ORDER BY level ASC",
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
  getDb().run("DELETE FROM users WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: "Delete failed" });
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
  getDb().all("SELECT * FROM warehouses ORDER BY code ASC", [], (err, rows) => {
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

// INV: Delete Warehouse
router.delete("/warehouses/:id", requireAuth, (req, res) => {
  getDb().run(
    `DELETE FROM warehouses WHERE id=?`,
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
        return res.status(500).json({ error: err.message });
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
  getDb().all("SELECT * FROM materials ORDER BY code ASC", [], (err, rows) => {
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
  const { code, name, name_en, category, description, unit, warehouse_id, balance } =
    req.body;
  getDb().run(
    `INSERT INTO materials (code, name, name_en, category, description, unit, warehouse_id, balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [code, name, name_en, category, description, unit, warehouse_id, balance],
    function (err) {
      if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
      res.json({ success: true, id: this.lastID });
    },
  );
});

// INV: Delete Material
router.delete("/materials/:id", requireAuth, (req, res) => {
  getDb().run(
    `DELETE FROM materials WHERE id=?`,
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
      res.json({ success: true });
    },
  );
});

// INV: Update Material
router.put("/materials/:id", requireAuth, (req, res) => {
  const { code, name, name_en, category, description, unit, warehouse_id, balance } = req.body;
  getDb().run(
    `UPDATE materials SET code=?, name=?, name_en=?, category=?, description=?, unit=?, warehouse_id=?, balance=? WHERE id=?`,
    [code, name, name_en, category, description, unit, warehouse_id, balance, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
      res.json({ success: true });
    },
  );
});

// INV: Search Material by Code
router.get("/materials/search/:code", requireAuth, (req, res) => {
  const codeSearch = `%${req.params.code}%`;
  getDb().all(
    "SELECT * FROM materials WHERE code LIKE ? OR name LIKE ?",
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
    "SELECT * FROM materials WHERE category = 'منتج نهائي' OR category = 'Finished Product' ORDER BY code ASC",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      res.json(rows || []);
    },
  );
});

// INV: Get Suppliers
router.get("/suppliers", requireAuth, (req, res) => {
  getDb().all("SELECT * FROM suppliers ORDER BY code ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    res.json(rows || []);
  });
});

// INV: Create Supplier
router.post("/suppliers", requireAuth, (req, res) => {
  const { code, name, name_en, contact_person, phone, email, address } = req.body;
  getDb().run(
    `INSERT INTO suppliers (code, name, name_en, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [code, name, name_en, contact_person, phone, email, address],
    function (err) {
      if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
      res.json({ success: true, id: this.lastID });
    },
  );
});

// INV: Delete Supplier
router.delete("/suppliers/:id", requireAuth, (req, res) => {
  getDb().run(`DELETE FROM suppliers WHERE id=?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
    res.json({ success: true });
  });
});

// INV: Search Supplier
router.get("/suppliers/search/:code", requireAuth, (req, res) => {
  const query = `%${req.params.code}%`;
  getDb().all(
    "SELECT * FROM suppliers WHERE code LIKE ? OR name LIKE ?",
    [query, query],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      res.json(rows || []);
    },
  );
});

// INV: Get Customers
router.get("/customers", requireAuth, (req, res) => {
  getDb().all("SELECT * FROM customers ORDER BY code ASC", [], (err, rows) => {
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

// INV: Delete Customer
router.delete("/customers/:id", requireAuth, (req, res) => {
  getDb().run(`DELETE FROM customers WHERE id=?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
    res.json({ success: true });
  });
});

// INV: Search Customer
router.get("/customers/search/:code", requireAuth, (req, res) => {
  const query = `%${req.params.code}%`;
  getDb().all(
    "SELECT * FROM customers WHERE code LIKE ? OR name LIKE ?",
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
    { field: "joiningDate",           label: "تاريخ الالتحاق" },
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
  let query = "SELECT * FROM forms_records ORDER BY id DESC";
  let params: any[] = [];

  if (user && user.level) {
    if (user.level === 4) {
      query =
        "SELECT * FROM forms_records WHERE (creator_id = ? OR creator_id IS NULL) ORDER BY id DESC";
      params = [user.id];
    } else if (user.level === 3 || user.level === 2) {
      if (user.department !== "ALL") {
        query =
          "SELECT * FROM forms_records WHERE department = ? ORDER BY id DESC";
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
    },
  );
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

  getDb().all("SELECT * FROM forms_records ORDER BY id DESC", [], (err, rows) => {
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
    "SELECT * FROM forms_records WHERE department = ? ORDER BY id DESC";
  let params: any[] = [department];

  if (user && user.level) {
    if (user.level === 4) {
      query =
        "SELECT * FROM forms_records WHERE department = ? AND (creator_id = ? OR creator_id IS NULL) ORDER BY id DESC";
      params = [department, user.id];
    } else if (user.level === 3 || user.level === 2) {
      // Can see all in department, but only if they are in this department
      if (user.department !== "ALL" && user.department !== department) {
        return res.json([]); // Empty if unauthorized
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

  let query =
    "SELECT * FROM forms_records WHERE department = ? ORDER BY id DESC";
  let params: any[] = [department];

  if (user && user.level) {
    if (user.level === 4) {
      query =
        "SELECT * FROM forms_records WHERE department = ? AND (creator_id = ? OR creator_id IS NULL) ORDER BY id DESC";
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

// Dashboard Stats (General Manager / Quick View)
router.get("/stats", requireAuth, (req, res) => {
  getDb().all(
    `SELECT department, COUNT(*) as count, 
            SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) as approved_count 
            FROM forms_records GROUP BY department`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      res.json(rows || []);
    },
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
  const query = `SELECT * FROM forms_records WHERE department = 'INV' AND status = 'approved' AND form_id IN ('F-INV-RM-001', 'F-INV-PIN-001', 'F-INV-RMT-001', 'F-FP-002', 'F-FP-003', 'F-FP-004', 'F-FP-005') ORDER BY created_at DESC`;
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

export default router;
