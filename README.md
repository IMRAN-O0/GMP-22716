# نظام GMP لإدارة الجودة

نظام متكامل لإدارة الجودة (GMP) للصناعات الدوائية والتجميلية.  
مبني بـ React + TypeScript + Express + SQLite.

---

## ⚡ التشغيل السريع (وضع التطوير)

```bash
cp .env.example .env        # انسخ ملف البيئة وغيّر JWT_SECRET
npm install                 # ثبّت الحزم
npm run dev                 # شغّل على http://localhost:3009
# المستخدم الافتراضي: admin  |  كلمة المرور: admin123
```

---

## 🖥️ تطبيق سطح مكتب (.exe)

```bash
npm install
npm run electron:build
# الناتج في: dist-electron/نظام GMP Setup 1.0.0.exe
```

تشغيل Electron بدون تثبيت (تطوير):
```bash
npm run electron:dev
```

---

## 🌐 ربط الأجهزة عبر شبكة LAN

**على جهاز السيرفر:**

1. عيّن IP ثابتاً (مثال: `192.168.1.10`) من إعدادات الشبكة
2. اسمح للمنفذ 3009 في جدار الحماية (Windows Firewall → Inbound Rule → Port 3009)
3. عدّل `.env`:
```env
PORT=3009
NODE_ENV=production
JWT_SECRET=سلسلة_عشوائية_طويلة_50_حرف_على_الأقل
ALLOWED_ORIGINS=http://192.168.1.10:3009,http://localhost:3009
```
4. شغّل:
```bash
npm run build:all
npm start
```

**على الأجهزة الأخرى:** افتح المتصفح على `http://192.168.1.10:3009`

---

## 🚀 تشغيل تلقائي مستمر مع pm2

```bash
npm install -g pm2
pm2 start server-bundle.cjs --name "gmp-server"
pm2 startup && pm2 save      # يبدأ تلقائياً مع Windows
pm2 logs gmp-server          # عرض السجلات
```

---

## 📁 هيكل المشروع

```
├── electron/              # ملفات Electron (main.cjs, preload.cjs, icon)
├── scripts/               # سكريبتات البناء
├── server/                # الباك اند (api.ts, db.ts, backup.ts)
├── src/                   # الفرونت اند (React / TypeScript)
├── server.ts              # نقطة دخول وضع التطوير
├── server-electron.ts     # نقطة دخول وضع Electron
└── .env.example           # نموذج متغيرات البيئة
```

---

## 🔑 متغيرات البيئة

| المتغير | الوصف | مثال |
|---|---|---|
| `JWT_SECRET` | مفتاح تشفير التوكن **(مطلوب)** | سلسلة عشوائية 48+ حرف |
| `PORT` | منفذ السيرفر | `3009` |
| `NODE_ENV` | بيئة التشغيل | `production` |
| `ALLOWED_ORIGINS` | العناوين المسموح بها (CORS) | `http://192.168.1.10:3009` |
| `DB_PATH` | مسار قاعدة البيانات | `/data/QForm_Data.db` |
| `SMTP_HOST` | سيرفر البريد (اختياري) | `smtp.gmail.com` |

---

## 💾 النسخ الاحتياطي

- تلقائي كل 6 ساعات إلى مجلد `backups/`
- يدوي: انسخ ملف `QForm_Data.db` إلى مكان آمن
- في Electron: `C:\Users\<user>\AppData\Roaming\نظام GMP\QForm_Data.db`

---

## 👤 بيانات الدخول الافتراضية

| المستخدم | كلمة المرور | الصلاحية |
|---|---|---|
| `admin` | `admin123` | مدير النظام (كل الصلاحيات) |

**⚠️ غيّر كلمة مرور admin فور أول تسجيل دخول.**

---

## 🛠️ أوامر npm

| الأمر | الوصف |
|---|---|
| `npm run dev` | تشغيل وضع التطوير |
| `npm start` | تشغيل وضع الإنتاج |
| `npm run build:all` | بناء frontend + server bundle |
| `npm run electron:dev` | تشغيل Electron (تطوير) |
| `npm run electron:build` | بناء ملف .exe للتثبيت |
| `npm run lint` | فحص الكود بـ ESLint |
| `npm run lint:fix` | إصلاح مشاكل ESLint تلقائياً |
| `npm run typecheck` | فحص أنواع TypeScript |
| `npm run format` | تنسيق الكود بـ Prettier |
| `npm run format:check` | التحقق من التنسيق دون تعديل |
| `npm run test` | تشغيل اختبارات الوحدة (Vitest) |
| `npm run test:watch` | تشغيل الاختبارات بوضع المراقبة |
| `npm run test:coverage` | تقرير تغطية الاختبارات |

---

## ✅ الجودة والاختبارات (Quality & CI)

- **ESLint + Prettier**: فحص وتنسيق موحّد للكود (إعدادات في `eslint.config.js` و `.prettierrc.json`).
- **Vitest**: اختبارات وحدة في مجلد `tests/` تغطي دوال المساعدة (`server/helpers.ts`) ودوال التنسيق (`src/lib/utils.ts`).
- **GitHub Actions**: يعمل تلقائياً عند كل `push`/`pull_request` (`.github/workflows/ci.yml`) ويُشغّل:
  `lint` → `typecheck` → `test` → `build`.

```bash
npm run lint && npm run typecheck && npm run test   # نفس فحوصات CI محلياً
```
