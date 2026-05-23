import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'QForm_Data.db');

export let db: sqlite3.Database;

export const getDb = () => db;

export const initDb = async () => {
  return new Promise<void>((resolve, reject) => {
    const dbExists = fs.existsSync(dbPath);
    db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        console.error('Error opening database', err.message);
        reject(err);
      } else {
        console.log('Connected to the SQLite database.');
        await createTables();
        if (!dbExists) {
            await seedInitialData();
        }
        resolve();
      }
    });
  });
};

const runMigrations = (dbParam: sqlite3.Database) => {
  return new Promise<void>((resolve, reject) => {
    dbParam.all(`SELECT version FROM schema_migrations`, (err, rows: any[]) => {
      if (err && !err.message.includes("no such table")) return reject(err);
      const executedVersions = (rows || []).map((r) => r.version);

      const migrations = [
        {
          version: 1,
          name: "add_category_to_materials",
          up: `ALTER TABLE materials ADD COLUMN category TEXT DEFAULT 'Raw Material';`
        },
        {
          version: 2,
          name: "add_permissions_to_users",
          up: `ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT '{}';`
        },
        {
          version: 3,
          name: "add_name_en_to_materials",
          up: `ALTER TABLE materials ADD COLUMN name_en TEXT;`
        },
        {
          version: 4,
          name: "add_min_balance_to_materials",
          up: `ALTER TABLE materials ADD COLUMN min_balance REAL DEFAULT 0;`
        },
        {
          version: 5,
          name: "add_supplier_name_to_materials",
          up: `ALTER TABLE materials ADD COLUMN supplier_name TEXT DEFAULT '';`
        },
        {
          version: 6,
          name: "add_tax_number_to_suppliers",
          up: `ALTER TABLE suppliers ADD COLUMN tax_number TEXT;`
        }
      ];

      const pendingMigrations = migrations.filter(m => !executedVersions.includes(m.version));

      if (pendingMigrations.length === 0) return resolve();

      dbParam.serialize(() => {
        dbParam.run(`BEGIN TRANSACTION`);
        let hasError = false;
        pendingMigrations.forEach(m => {
          dbParam.run(m.up, (migrateErr) => {
            if (migrateErr && !migrateErr.message.includes("duplicate column name")) {
              hasError = true;
              dbParam.run(`ROLLBACK`);
              return reject(migrateErr);
            }
            if (!hasError) {
              dbParam.run(`INSERT INTO schema_migrations (version, name) VALUES (?, ?)`, [m.version, m.name]);
            }
          });
        });
        if (!hasError) {
          dbParam.run(`COMMIT`);
          resolve();
        }
      });
    });
  });
};

const ensureColumnOrAdd = (dbParam: sqlite3.Database, table: string, col: string, def: string) => {
  return new Promise<void>((resolve, reject) => {
    // Deprecated for the new real migration runner, kept for compatibility if needed.
    resolve();
  });
};

const createTables = async () => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS company_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_ar TEXT,
      name_en TEXT,
      logo_url TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      license_number TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE,
      name TEXT,
      department TEXT,
      level INTEGER,
      password_hash TEXT,
      status TEXT,
      device_id TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_number TEXT UNIQUE,
      full_name_ar TEXT,
      full_name_en TEXT,
      department TEXT,
      job_title TEXT,
      join_date TEXT,
      status TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS forms_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id TEXT UNIQUE,
      form_id TEXT,
      department TEXT,
      creator_id INTEGER,
      created_at TEXT,
      status TEXT,
      data_json TEXT,
      FOREIGN KEY(creator_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT,
      form_id TEXT,
      record_id TEXT,
      timestamp TEXT,
      details TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS warehouses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT,
      type TEXT,
      parent_id INTEGER,
      description TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT,
      category TEXT DEFAULT 'Raw Material',
      description TEXT,
      unit TEXT,
      warehouse_id INTEGER,
      balance REAL DEFAULT 0,
      FOREIGN KEY(warehouse_id) REFERENCES warehouses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT NOT NULL,
      name_en TEXT,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      tax_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT NOT NULL,
      name_en TEXT,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS inventory_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id TEXT UNIQUE,
      type TEXT, 
      material_code TEXT,
      quantity REAL,
      unit TEXT,
      batch_number TEXT,
      expiry_date TEXT,
      warehouse_id INTEGER,
      status TEXT,
      reference_record_id TEXT, 
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER UNIQUE,
      name TEXT,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      let completed = 0;
      queries.forEach(query => {
        db.run(query, (err) => {
          if (err) return reject(err);
          completed++;
          if (completed === queries.length) {
            // After all tables are created, perform migrations
            const performMigrations = async () => {
              try {
                await runMigrations(db);
                resolve();
              } catch (migrationErr) {
                reject(migrationErr);
              }
            };
            performMigrations();
          }
        });
      });
    });
  });
};

const seedInitialData = async () => {
   const defaultPassword = await bcrypt.hash('admin123', 10);
   db.run(
       `INSERT INTO users (user_id, name, department, level, password_hash, status) 
        VALUES (?, ?, ?, ?, ?, ?)`,
       ['admin', 'مدير النظام', 'IT', 1, defaultPassword, 'active']
   );
   db.run(
       `INSERT INTO company_info (name_ar, name_en) VALUES (?, ?)`,
       ['الشركة الحديثة للتجميل', 'Modern Cosmetics Co.']
   );

   // Inventory & Warehouses Seed
   db.serialize(() => {
     // Main Warehouses
     db.run(`INSERT INTO warehouses (code, name, type) VALUES ('WH-RAW', 'مستودع المواد الخام', 'MAIN')`);
     db.run(`INSERT INTO warehouses (code, name, type) VALUES ('WH-FIN', 'مستودع المنتج النهائي', 'MAIN')`);
     
     // Sub-warehouses for Raw Materials (assuming parent_id = 1 for WH-RAW)
     db.run(`INSERT INTO warehouses (code, name, type, parent_id) VALUES ('WH-RAW-HAZ', 'مواد خام خطرة', 'SUB', 1)`);
     db.run(`INSERT INTO warehouses (code, name, type, parent_id) VALUES ('WH-RAW-POW', 'مواد خام بودر', 'SUB', 1)`);
     db.run(`INSERT INTO warehouses (code, name, type, parent_id) VALUES ('WH-RAW-LIQ', 'مواد خام سائلة', 'SUB', 1)`);
     db.run(`INSERT INTO warehouses (code, name, type, parent_id) VALUES ('WH-RAW-PKG', 'مواد تغليف وتعبئة', 'SUB', 1)`);


   });

   console.log('Seed data inserted.');
}
