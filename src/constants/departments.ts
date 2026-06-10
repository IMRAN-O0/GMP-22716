// ── Shared department + permission definitions ──────────────────────────────
// Used by both UsersManagement (to render the permission picker for every
// department) and Layout (to decide which departments a user may access).
// Moving this here lets a single user hold permissions across multiple
// departments — e.g. an employee who works in both Quality and Inventory.

import { PACKAGING_FORMS } from "../pages/pkg/packagingForms.config";

export interface PermItem {
  id: string;
  label: string;
}
export interface PermCategory {
  category: string;
  items: PermItem[];
}

// Department codes that map to a sidebar section / index page.
// HR + Training were merged into a single department: "HRT".
export const DEPARTMENT_CODES = ["HRT", "PRD", "LAB", "INV", "QM", "PKG"] as const;

export const DEPT_PERMISSIONS: Record<string, PermCategory[]> = {
  INV: [
    {
      category: "نماذج المواد الخام",
      items: [
        { id: "F-INV-RMT-001", label: "استلام مادة خام" },
        { id: "F-INV-MV-001", label: "حركات المخزون" },
        { id: "F-INV-RM-001", label: "إنشاء مادة جديدة" },
        { id: "F-INV-BOM", label: "قائمة المكونات BOM" },
      ],
    },
    {
      category: "نماذج المنتج النهائي",
      items: [
        { id: "F-FP-001", label: "إفراج عن منتج" },
        { id: "F-FP-002", label: "تسجيل تخزين" },
        { id: "F-FP-003", label: "شحن للعميل" },
        { id: "F-FP-004", label: "تسجيل مرتجع" },
        { id: "F-FP-005", label: "إتلاف منتج" },
        { id: "F-FP-006", label: "إعادة تدوير" },
      ],
    },
    {
      category: "المشتريات",
      items: [
        { id: "F-PRQ-001", label: "طلب شراء PRQ" },
        { id: "F-PIN-001", label: "فاتورة استلام" },
      ],
    },
    {
      category: "التقارير",
      items: [
        { id: "REP-INV-BAL", label: "تقرير الأرصدة" },
        { id: "REP-INV-SHP", label: "تقرير الشحنات" },
        { id: "REP-INV-SUP", label: "تقرير الموردين" },
        { id: "REP-INV-TRN", label: "تقرير حركات المخزون" },
        { id: "REP-INV-RET", label: "تقرير المرتجعات والإتلاف" },
      ],
    },
  ],
  PRD: [
    {
      category: "الإنتاج المجسد",
      items: [
        { id: "F-PRD-001", label: "أمر إنتاج" },
        { id: "F-PRD-002", label: "سجل التصنيع والتشغيل" },
        { id: "F-PRD-003", label: "قائمة مراجعة الإنتاج" },
        { id: "F-PRD-004", label: "مراقبة العملية" },
      ],
    },
    {
      category: "التقارير",
      items: [
        { id: "prd_orders", label: "تقرير أوامر الإنتاج" },
        { id: "prd_waste", label: "تقرير الفاقد الإنتاجي" },
        { id: "prd_monitoring", label: "تقرير رصد المعاملات" },
        { id: "prd_labor", label: "تقرير كفاءة العمالة" },
        { id: "prd_bom", label: "تقرير مقارنة BOM بالاستهلاك" },
      ],
    },
  ],
  QM: [
    {
      category: "إدارة الجودة",
      items: [
        { id: "F-CMP-001", label: "سجل شكاوى العملاء" },
        { id: "F-RCL-001", label: "سجل استدعاء المنتجات" },
        { id: "F-DEV-001", label: "سجل الانحرافات" },
        { id: "F-QM-005", label: "تقرير عدم المطابقة" },
        { id: "F-QM-006", label: "إجراء تصحيحي ووقائي" },
      ],
    },
    {
      category: "النظافة والمرافق والصيانة",
      items: [
        { id: "F-CLN-001", label: "سجل التنظيف الأسبوعي" },
        { id: "F-PRM-001", label: "تفتيش المباني والمرافق" },
        { id: "F-PRM-002", label: "مراقبة الحرارة والرطوبة" },
        { id: "F-PRM-003", label: "فحص أنظمة الإضاءة" },
        { id: "F-PRM-004", label: "مراقبة جودة الهواء" },
        { id: "F-PRM-005", label: "فحص أنظمة الصرف" },
        { id: "F-EQP-001", label: "سجلات وفحوصات المعدات" },
        { id: "F-MNT-001", label: "خطط وسجلات الصيانة" },
      ],
    },
    {
      category: "التقارير",
      items: [
        { id: "qm_ncr", label: "تقرير عدم المطابقة NCR" },
        { id: "qm_capa", label: "تقرير CAPA" },
        { id: "qm_risk", label: "تقرير تقييم المخاطر" },
        { id: "qm_mnt", label: "تقرير الصيانة والأعطال" },
        { id: "qm_env", label: "مراقبة الحرارة والرطوبة" },
        { id: "qm_cal", label: "تقرير جدول المعايرة" },
        { id: "qm_recall", label: "تقرير الاستدعاءات" },
        { id: "batch_trace", label: "تتبع الدفعة الكامل" },
      ],
    },
  ],
  LAB: [
    {
      category: "المختبر",
      items: [
        { id: "F-LAB-001", label: "استلام عينة" },
        { id: "F-LAB-002", label: "نتائج الاختبار" },
        { id: "F-LAB-003", label: "سجل عينات الاحتفاظ" },
        { id: "F-LAB-004", label: "معايرة الأجهزة" },
        { id: "F-LAB-005", label: "تحضير المواد الكيميائية" },
        { id: "F-LAB-006", label: "مراقبة صلاحية الكواشف" },
      ],
    },
    {
      category: "التقارير",
      items: [{ id: "expiry_watch", label: "تقرير انتهاء الصلاحية" }],
    },
  ],
  // Merged Human Resources + Training department.
  HRT: [
    {
      category: "التوظيف والتهيئة",
      items: [
        { id: "F-HR-001", label: "طلب احتياج وظيفي" },
        { id: "F-HRT-006", label: "تقييم مقابلة شخصية" },
        { id: "F-HRT-007", label: "عرض وظيفي" },
        { id: "F-HR-003", label: "فحص طبي" },
        { id: "F-HRT-005", label: "خطة تهيئة موظف جديد" },
      ],
    },
    {
      category: "شؤون الموظفين والعمليات",
      items: [
        { id: "F-HR-002", label: "ملف موظف" },
        { id: "F-HRT-001", label: "إقرار الالتزام بالسلامة و GMP" },
        { id: "F-HRT-002", label: "طلب إجازة" },
        { id: "F-HRT-003", label: "تسليم واستلام عُهدة" },
        { id: "F-HRT-008", label: "لفت نظر / إنذار كتابي" },
      ],
    },
    {
      category: "التدريب والتطوير",
      items: [
        { id: "F-HRT-004", label: "حصر الاحتياجات التدريبية (TNA)" },
        { id: "F-TRN-001", label: "خطة التدريب السنوية" },
        { id: "F-TRN-002", label: "سجل التدريب الفردي" },
        { id: "F-TRN-003", label: "تقييم فعالية التدريب" },
        { id: "F-TRN-004", label: "اعتماد كفاءة" },
      ],
    },
    {
      category: "تقييم الأداء",
      items: [
        { id: "F-HRT-009", label: "تقييم فترة التجربة (90 يوماً)" },
        { id: "F-HRT-010", label: "تقييم الأداء السنوي / النصف سنوي" },
      ],
    },
    {
      category: "نهاية الخدمة",
      items: [
        { id: "F-HRT-011", label: "قبول استقالة / إنهاء خدمات" },
        { id: "F-HRT-012", label: "مقابلة خروج" },
        { id: "F-HRT-013", label: "إخلاء طرف" },
      ],
    },
  ],
  // Packaging & Filling — generated from the form config so it stays in sync.
  PKG: [
    {
      category: "نماذج التعبئة (Filling)",
      items: PACKAGING_FORMS.filter((f) => f.group === "filling").map((f) => ({
        id: f.formId,
        label: f.title,
      })),
    },
    {
      category: "نماذج التغليف (Packaging)",
      items: PACKAGING_FORMS.filter((f) => f.group === "packaging").map((f) => ({
        id: f.formId,
        label: f.title,
      })),
    },
    {
      category: "التقارير",
      items: [
        { id: "pkg_release_ready", label: "تقرير جاهزية الإفراج" },
        { id: "pkg_reconciliation", label: "تقرير تسوية المواد" },
        { id: "pkg_batch_log", label: "سجل التعبئة والتغليف للدفعة" },
        { id: "pkg_downtime", label: "تقرير التوقفات والأعطال" },
      ],
    },
  ],
  ALL: [
    {
      category: "لوحات القيادة المستقلة",
      items: [{ id: "exec_dash", label: "لوحة KPI التنفيذية" }],
    },
  ],
};

// Department codes shown in the user form's "primary department" dropdown.
export const USER_DEPARTMENT_OPTIONS = [
  "INV",
  "PRD",
  "QM",
  "LAB",
  "HRT",
  "PKG",
  "SLA",
  "ALL",
];

interface UserLike {
  level?: number;
  department?: string;
  permissions?: Record<string, boolean>;
}

// Returns the set of department codes a user may access. Level-1 admins and the
// "ALL" department see everything; otherwise a department is accessible if it is
// the user's primary department OR the user holds any permission within it.
export function getAccessibleDepartments(user: UserLike | null | undefined): Set<string> {
  if (!user) return new Set();
  if (user.level === 1 || user.department === "ALL") {
    return new Set(DEPARTMENT_CODES);
  }
  const depts = new Set<string>();
  if (user.department) depts.add(user.department);
  const perms = user.permissions || {};
  for (const dept of DEPARTMENT_CODES) {
    const ids = (DEPT_PERMISSIONS[dept] || []).flatMap((c) => c.items.map((i) => i.id));
    if (ids.some((id) => perms[id])) depts.add(dept);
  }
  return depts;
}
