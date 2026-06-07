// ── Packaging & Filling department (PKG) — form definitions ──────────────────
// All 18 filling/packaging forms are described here as data and rendered by a
// single generic component (PackagingFormRenderer). This keeps the department
// maintainable: adding/adjusting a form is a config change, not a new component.

export type PkgFieldType =
  | "text"
  | "number"
  | "date"
  | "time"
  | "textarea"
  | "select"
  | "checkbox";

export interface PkgField {
  name: string;
  label: string;
  type: PkgFieldType;
  options?: string[];
  required?: boolean;
  unit?: string;
}

export interface PkgChecklistItem {
  name: string;
  label: string;
}

export interface PkgTableColumn {
  name: string;
  label: string;
  type?: "text" | "number";
}

export interface PkgSection {
  title: string;
  fields?: PkgField[];
  // A yes/no/NA checklist (used by line-clearance style forms).
  checklist?: PkgChecklistItem[];
  // A repeatable table of rows (used by weight monitoring, reconciliation, etc.).
  table?: { name: string; columns: PkgTableColumn[] };
}

export interface PkgFormDef {
  key: string; // URL slug, e.g. "fill-line-clearance"
  formId: string; // stored form_id, e.g. "F-FIL-001"
  group: "filling" | "packaging";
  stage: "pre" | "during" | "post";
  title: string;
  description: string;
  sections: PkgSection[];
}

// The form that, once approved, marks a batch's packaging as complete.
// A finished-product release (F-FP-001) is blocked until this exists & is approved.
export const PACKAGING_COMPLETE_FORM_ID = "F-PKG-009";

const YES_NO_NA = ["نعم", "لا", "لا ينطبق"];

export const PACKAGING_FORMS: PkgFormDef[] = [
  // ─────────────────────────── FILLING — PRE ───────────────────────────
  {
    key: "fill-line-clearance",
    formId: "F-FIL-001",
    group: "filling",
    stage: "pre",
    title: "تصفية خط التعبئة (Line Clearance)",
    description: "قائمة فحص تُعبأ قبل كل تشغيلة للتأكد أن خط التعبئة خالٍ من بقايا المنتج السابق.",
    sections: [
      {
        title: "قائمة فحص التصفية",
        checklist: [
          { name: "noPreviousProduct", label: "خلو الخط من بقايا المنتج السابق" },
          { name: "noPreviousPackaging", label: "إزالة جميع العبوات والملصقات السابقة" },
          { name: "noPreviousMaterials", label: "إزالة مواد التعبئة الخام السابقة" },
          { name: "equipmentClean", label: "نظافة المعدات والنوزلات" },
          { name: "surfacesClean", label: "نظافة الأسطح والطاولات" },
          { name: "floorClean", label: "نظافة الأرضيات والمنطقة المحيطة" },
          { name: "docsRemoved", label: "إزالة جميع وثائق التشغيلة السابقة" },
        ],
      },
      {
        title: "الاعتماد",
        fields: [
          { name: "performedBy", label: "نفّذ التصفية", type: "text" },
          { name: "verifiedBy", label: "تحقق المشرف", type: "text" },
          { name: "clearanceResult", label: "نتيجة التصفية", type: "select", options: ["الخط جاهز", "يحتاج إعادة تنظيف"], required: true },
        ],
      },
    ],
  },
  {
    key: "fill-material-receipt",
    formId: "F-FIL-002",
    group: "filling",
    stage: "pre",
    title: "فحص واستلام مواد التعبئة",
    description: "استلام العبوات الداخلية والأغطية والمضخات من المستودع مع الفحص البصري.",
    sections: [
      {
        title: "بيانات الاستلام",
        fields: [
          { name: "shipmentNo", label: "رقم الشحنة", type: "text" },
          { name: "supplierName", label: "المورد", type: "text" },
          { name: "expiryDate", label: "تاريخ الصلاحية", type: "date" },
        ],
      },
      {
        title: "أصناف مواد التعبئة المستلمة",
        table: {
          name: "items",
          columns: [
            { name: "material", label: "الصنف (عبوة/غطاء/مضخة)" },
            { name: "qtyReceived", label: "الكمية المستلمة", type: "number" },
            { name: "batchNo", label: "رقم اللوط" },
            { name: "visualCheck", label: "الفحص البصري (لون/حجم/شكل)" },
            { name: "result", label: "النتيجة (مطابق/مرفوض)" },
          ],
        },
      },
      {
        title: "الاعتماد",
        fields: [{ name: "receivedBy", label: "استلم بواسطة", type: "text" }],
      },
    ],
  },
  {
    key: "fill-line-setup",
    formId: "F-FIL-003",
    group: "filling",
    stage: "pre",
    title: "تجهيز وتحضير خط التعبئة",
    description: "توثيق جاهزية مكوّنات خط التعبئة وضبط الماكينة.",
    sections: [
      {
        title: "إعدادات الماكينة",
        fields: [
          { name: "machineId", label: "رقم الماكينة", type: "text" },
          { name: "fillingSpeed", label: "سرعة التعبئة", type: "text" },
          { name: "nozzleCalibration", label: "معايرة النوزلات", type: "select", options: YES_NO_NA },
          { name: "moldSize", label: "القوالب المناسبة لحجم العبوة", type: "text" },
        ],
      },
      {
        title: "الاعتماد",
        fields: [
          { name: "technician", label: "توقيع الفني", type: "text" },
          { name: "supervisor", label: "توقيع المشرف", type: "text" },
        ],
      },
    ],
  },
  // ─────────────────────────── FILLING — DURING ───────────────────────────
  {
    key: "fill-in-process",
    formId: "F-FIL-004",
    group: "filling",
    stage: "during",
    title: "الفحص أثناء التعبئة (In-Process)",
    description: "فحص دوري كل نصف ساعة/ساعة أثناء التعبئة.",
    sections: [
      {
        title: "سجل الفحوصات الدورية",
        table: {
          name: "checks",
          columns: [
            { name: "time", label: "الوقت" },
            { name: "fillLevel", label: "مستوى التعبئة" },
            { name: "netWeight", label: "الوزن الصافي", type: "number" },
            { name: "sealCheck", label: "إحكام الإغلاق" },
            { name: "appearance", label: "مظهر العبوة" },
            { name: "leakCheck", label: "عدم التسريب" },
            { name: "batchPrint", label: "وضوح رقم التشغيلة والتواريخ" },
          ],
        },
      },
    ],
  },
  {
    key: "fill-weight-monitoring",
    formId: "F-FIL-005",
    group: "filling",
    stage: "during",
    title: "مراقبة الوزن والحجم",
    description: "تسجيل أوزان عينات عشوائية ومقارنتها بالحدود المسموحة.",
    sections: [
      {
        title: "الحدود المسموحة",
        fields: [
          { name: "minWeight", label: "الحد الأدنى للوزن", type: "number" },
          { name: "maxWeight", label: "الحد الأقصى للوزن", type: "number" },
          { name: "targetWeight", label: "الوزن المستهدف", type: "number" },
        ],
      },
      {
        title: "قراءات العينات",
        table: {
          name: "samples",
          columns: [
            { name: "time", label: "الوقت" },
            { name: "sampleNo", label: "رقم العينة" },
            { name: "weight", label: "الوزن المقاس", type: "number" },
            { name: "withinLimits", label: "ضمن الحدود؟" },
          ],
        },
      },
      {
        title: "التحليل",
        fields: [
          { name: "average", label: "المتوسط", type: "number" },
          { name: "stdDev", label: "الانحراف المعياري", type: "number" },
        ],
      },
    ],
  },
  {
    key: "fill-downtime",
    formId: "F-FIL-006",
    group: "filling",
    stage: "during",
    title: "تسجيل التوقفات والأعطال",
    description: "توثيق كل توقف في خط التعبئة (مخطط أو غير مخطط).",
    sections: [
      {
        title: "سجل التوقفات",
        table: {
          name: "stops",
          columns: [
            { name: "startTime", label: "وقت البدء" },
            { name: "endTime", label: "وقت الانتهاء" },
            { name: "type", label: "النوع (مخطط/غير مخطط)" },
            { name: "reason", label: "السبب" },
            { name: "action", label: "الإجراء المتخذ" },
            { name: "partsReplaced", label: "القطع المستبدلة" },
          ],
        },
      },
    ],
  },
  // ─────────────────────────── FILLING — POST ───────────────────────────
  {
    key: "fill-reconciliation",
    formId: "F-FIL-007",
    group: "filling",
    stage: "post",
    title: "تسوية مواد التعبئة (Reconciliation)",
    description: "مقارنة العبوات والأغطية المستلمة بالمستخدمة والتالفة والمرتجعة. الفرق يجب أن يكون صفراً أو ضمن نسبة مقبولة.",
    sections: [
      {
        title: "جدول التسوية",
        table: {
          name: "reconciliation",
          columns: [
            { name: "material", label: "الصنف" },
            { name: "received", label: "المستلم", type: "number" },
            { name: "used", label: "المستخدم", type: "number" },
            { name: "damaged", label: "التالف", type: "number" },
            { name: "returned", label: "المرتجع للمستودع", type: "number" },
            { name: "difference", label: "الفرق", type: "number" },
          ],
        },
      },
      {
        title: "النتيجة",
        fields: [
          { name: "withinTolerance", label: "ضمن النسبة المقبولة؟", type: "select", options: YES_NO_NA, required: true },
          { name: "investigationRef", label: "رقم التحقيق (إن وجد فرق)", type: "text" },
        ],
      },
    ],
  },
  {
    key: "fill-product-check",
    formId: "F-FIL-008",
    group: "filling",
    stage: "post",
    title: "فحص المنتج بعد التعبئة",
    description: "فحص عينات المنتج المعبأ قبل تحويله لمرحلة التغليف.",
    sections: [
      {
        title: "نتائج الفحص",
        fields: [
          { name: "weight", label: "الوزن", type: "number" },
          { name: "appearance", label: "المظهر", type: "select", options: ["مطابق", "غير مطابق"] },
          { name: "leak", label: "اختبار التسريب", type: "select", options: ["سليم", "يوجد تسريب"] },
          { name: "capSeal", label: "إحكام الغطاء", type: "select", options: YES_NO_NA },
          { name: "barcode", label: "قراءة الباركود", type: "select", options: ["سليم", "غير مقروء"] },
          { name: "result", label: "النتيجة النهائية", type: "select", options: ["مقبول للتغليف", "مرفوض"], required: true },
        ],
      },
    ],
  },
  // ─────────────────────────── PACKAGING — PRE ───────────────────────────
  {
    key: "pack-line-clearance",
    formId: "F-PKG-001",
    group: "packaging",
    stage: "pre",
    title: "تصفية خط التغليف",
    description: "التأكد من خلو منطقة التغليف من علب وكراتين ومطبوعات التشغيلة السابقة.",
    sections: [
      {
        title: "قائمة فحص التصفية",
        checklist: [
          { name: "noPreviousCartons", label: "خلو المنطقة من علب وكراتين سابقة" },
          { name: "noPreviousPrints", label: "إزالة مطبوعات التشغيلة السابقة" },
          { name: "noPreviousLeaflets", label: "إزالة النشرات الداخلية السابقة" },
          { name: "areaClean", label: "نظافة منطقة التغليف" },
          { name: "docsRemoved", label: "إزالة وثائق التشغيلة السابقة" },
        ],
      },
      {
        title: "الاعتماد",
        fields: [
          { name: "performedBy", label: "نفّذ التصفية", type: "text" },
          { name: "verifiedBy", label: "تحقق المشرف", type: "text" },
          { name: "clearanceResult", label: "النتيجة", type: "select", options: ["الخط جاهز", "يحتاج إعادة تنظيف"], required: true },
        ],
      },
    ],
  },
  {
    key: "pack-material-receipt",
    formId: "F-PKG-002",
    group: "packaging",
    stage: "pre",
    title: "استلام مواد التغليف",
    description: "استلام العلب والكراتين والنشرات والشرنك والفويل مع فحص الطباعة والمطابقة.",
    sections: [
      {
        title: "أصناف مواد التغليف المستلمة",
        table: {
          name: "items",
          columns: [
            { name: "material", label: "الصنف (علبة/كرتون/نشرة/شرنك/فويل)" },
            { name: "qtyReceived", label: "الكمية المستلمة", type: "number" },
            { name: "printQuality", label: "جودة الطباعة" },
            { name: "dimensions", label: "الأبعاد" },
            { name: "matchSample", label: "المطابقة للعينة المعتمدة" },
            { name: "result", label: "النتيجة" },
          ],
        },
      },
      {
        title: "الاعتماد",
        fields: [{ name: "receivedBy", label: "استلم بواسطة", type: "text" }],
      },
    ],
  },
  {
    key: "pack-line-setup",
    formId: "F-PKG-003",
    group: "packaging",
    stage: "pre",
    title: "تجهيز خط التغليف",
    description: "ضبط ماكينة الكرتنة والشرنك واللصق والطابعة لرقم التشغيلة والتواريخ.",
    sections: [
      {
        title: "إعدادات الماكينات",
        fields: [
          { name: "cartoningMachine", label: "ضبط ماكينة الكرتنة", type: "select", options: YES_NO_NA },
          { name: "shrinkMachine", label: "ضبط ماكينة الشرنك", type: "select", options: YES_NO_NA },
          { name: "gluingMachine", label: "ضبط ماكينة اللصق", type: "select", options: YES_NO_NA },
          { name: "printerSetup", label: "ضبط الطابعة (رقم التشغيلة/التواريخ)", type: "select", options: YES_NO_NA },
        ],
      },
      {
        title: "الاعتماد",
        fields: [
          { name: "technician", label: "توقيع الفني", type: "text" },
          { name: "supervisor", label: "توقيع المشرف", type: "text" },
        ],
      },
    ],
  },
  // ─────────────────────────── PACKAGING — DURING ───────────────────────────
  {
    key: "pack-in-process",
    formId: "F-PKG-004",
    group: "packaging",
    stage: "during",
    title: "الفحص أثناء التغليف",
    description: "فحص دوري لصحة إدخال العبوة والنشرة وإغلاق العلبة ووضوح الطباعة والباركود.",
    sections: [
      {
        title: "سجل الفحوصات",
        table: {
          name: "checks",
          columns: [
            { name: "time", label: "الوقت" },
            { name: "unitInBox", label: "إدخال العبوة بالعلبة" },
            { name: "leaflet", label: "النشرة الداخلية" },
            { name: "boxSeal", label: "إغلاق العلبة" },
            { name: "printClarity", label: "وضوح الطباعة" },
            { name: "barcodeScan", label: "قراءة الباركود الإلكترونية" },
          ],
        },
      },
    ],
  },
  {
    key: "pack-print-monitoring",
    formId: "F-PKG-005",
    group: "packaging",
    stage: "during",
    title: "مراقبة الطباعة على العبوات",
    description: "متابعة جودة طباعة رقم التشغيلة وتاريخ الإنتاج والصلاحية على العلب والكراتين.",
    sections: [
      {
        title: "بيانات الطباعة",
        fields: [
          { name: "batchPrint", label: "وضوح رقم التشغيلة", type: "select", options: YES_NO_NA },
          { name: "mfgDate", label: "تاريخ الإنتاج المطبوع", type: "date" },
          { name: "expDate", label: "تاريخ الصلاحية المطبوع", type: "date" },
          { name: "sampleAttached", label: "إلصاق عينة مطبوعة كمرجع", type: "select", options: YES_NO_NA },
          { name: "notes", label: "ملاحظات", type: "textarea" },
        ],
      },
    ],
  },
  {
    key: "pack-carton-count",
    formId: "F-PKG-006",
    group: "packaging",
    stage: "during",
    title: "عدّ وتجميع الكراتين",
    description: "تسجيل عدد العبوات داخل كل كرتون وعدد الكراتين ووزنها وبيانات البالتة.",
    sections: [
      {
        title: "بيانات التجميع",
        fields: [
          { name: "unitsPerCarton", label: "عدد العبوات داخل الكرتون", type: "number" },
          { name: "totalCartons", label: "إجمالي عدد الكراتين", type: "number" },
          { name: "cartonWeight", label: "وزن الكرتون", type: "number" },
          { name: "palletNo", label: "رقم البالتة", type: "text" },
        ],
      },
    ],
  },
  // ─────────────────────────── PACKAGING — POST ───────────────────────────
  {
    key: "pack-reconciliation",
    formId: "F-PKG-007",
    group: "packaging",
    stage: "post",
    title: "تسوية مواد التغليف (Reconciliation)",
    description: "مقارنة العلب والنشرات والكراتين المستلمة بالمستخدمة والتالفة والمرتجعة.",
    sections: [
      {
        title: "جدول التسوية",
        table: {
          name: "reconciliation",
          columns: [
            { name: "material", label: "الصنف" },
            { name: "received", label: "المستلم", type: "number" },
            { name: "used", label: "المستخدم", type: "number" },
            { name: "damaged", label: "التالف", type: "number" },
            { name: "returned", label: "المرتجع", type: "number" },
            { name: "difference", label: "الفرق", type: "number" },
          ],
        },
      },
      {
        title: "النتيجة",
        fields: [
          { name: "withinTolerance", label: "ضمن النسبة المقبولة؟", type: "select", options: YES_NO_NA, required: true },
          { name: "investigationRef", label: "رقم التحقيق (إن وجد)", type: "text" },
        ],
      },
    ],
  },
  {
    key: "pack-final-inspection",
    formId: "F-PKG-008",
    group: "packaging",
    stage: "post",
    title: "فحص المنتج النهائي (Finished Product Inspection)",
    description: "الفحص الأخير قبل إدخال المنتج للمستودع.",
    sections: [
      {
        title: "نتائج الفحص",
        fields: [
          { name: "boxIntegrity", label: "سلامة العلبة", type: "select", options: ["سليمة", "تالفة"] },
          { name: "dataClarity", label: "وضوح البيانات", type: "select", options: YES_NO_NA },
          { name: "barcode", label: "صحة الباركود", type: "select", options: ["سليم", "غير مقروء"] },
          { name: "shrinkAppearance", label: "مظهر الشرنك", type: "select", options: ["جيد", "غير مقبول"] },
          { name: "cartonWeight", label: "وزن الكرتون", type: "number" },
          { name: "result", label: "النتيجة النهائية", type: "select", options: ["مقبول", "مرفوض"], required: true },
        ],
      },
    ],
  },
  {
    key: "pack-warehouse-delivery",
    formId: "F-PKG-009",
    group: "packaging",
    stage: "post",
    title: "تسليم المنتج النهائي للمستودع (إتمام التغليف)",
    description:
      "يوثّق تسليم المنتج النهائي للمستودع وإتمام التعبئة والتغليف. اعتماد هذا النموذج شرط للإفراج عن التشغيلة (F-FP-001).",
    sections: [
      {
        title: "بيانات التسليم",
        fields: [
          { name: "quantityDelivered", label: "الكمية المسلّمة", type: "number", required: true },
          { name: "unit", label: "الوحدة", type: "text" },
          { name: "storageLocation", label: "موقع التخزين", type: "text" },
          { name: "quarantineStatus", label: "حالة الحجر الصحي", type: "select", options: ["تحت الحجر (Quarantine)", "بانتظار شهادة الإفراج"], required: true },
          { name: "deliveredBy", label: "سلّم بواسطة", type: "text" },
          { name: "receivedByStore", label: "استلم أمين المستودع", type: "text" },
        ],
      },
    ],
  },
];

export const getPackagingForm = (key: string): PkgFormDef | undefined =>
  PACKAGING_FORMS.find((f) => f.key === key);

export const getPackagingFormById = (formId: string): PkgFormDef | undefined =>
  PACKAGING_FORMS.find((f) => f.formId === formId);

export const isPackagingFormId = (formId: string): boolean =>
  /^F-(FIL|PKG)-/.test(formId || "");

// formId → Arabic title (used by FormViewer for the header).
export const PKG_FORM_TITLES: Record<string, string> = Object.fromEntries(
  PACKAGING_FORMS.map((f) => [f.formId, f.title]),
);

// field/checklist/column name → Arabic label (used by FormViewer's translateKey
// so viewed records show friendly labels instead of raw camelCase keys).
export const PKG_FIELD_LABELS: Record<string, string> = (() => {
  const labels: Record<string, string> = {
    batchNumber: "رقم التشغيلة",
    productCode: "كود المنتج",
    productName: "اسم المنتج",
    productionOrderNo: "أمر الإنتاج",
    formDate: "التاريخ",
  };
  for (const form of PACKAGING_FORMS) {
    for (const section of form.sections) {
      section.fields?.forEach((f) => (labels[f.name] = f.label));
      section.checklist?.forEach((c) => (labels[c.name] = c.label));
      section.table?.columns.forEach((col) => (labels[col.name] = col.label));
    }
  }
  return labels;
})();
