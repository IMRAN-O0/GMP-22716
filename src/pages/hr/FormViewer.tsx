import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Printer,
  CheckCircle,
  XCircle,
  Send,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const FIELD_LABELS: Record<string, string> = {
  // Common
  date: "التاريخ",
  notes: "الملاحظات",
  status: "الحالة",
  attachmentUrl: "المرفق",
  items: "البنود",
  description: "الوصف",
  responsiblePerson: "المسؤول",
  targetDate: "التاريخ المستهدف",
  department: "القسم",
  category: "الفئة",
  // PRQ
  requestId: "رقم الطلب",
  requestDate: "تاريخ الطلب",
  supplierName: "اسم المورد",
  warehouseId: "المستودع",
  expectedDeliveryDate: "تاريخ التسليم المتوقع",
  priority: "الأولوية",
  // PIN
  invoiceId: "رقم الفاتورة",
  invoiceDate: "تاريخ الفاتورة",
  linkedPrqId: "رقم طلب الشراء المرتبط",
  supplierCode: "كود المورد",
  taxRate: "نسبة الضريبة (%)",
  taxAmount: "مبلغ الضريبة",
  subTotal: "المجموع قبل الضريبة",
  netTotal: "الإجمالي شامل الضريبة",
  // Items columns
  materialCode: "كود المادة",
  materialName: "اسم المادة",
  unit: "الوحدة",
  quantity: "الكمية",
  unitPrice: "سعر الوحدة",
  expectedPrice: "السعر المتوقع",
  totalPrice: "الإجمالي",
  // RM-001 (Material Receipt / Registration)
  recordId: "رقم السجل",
  code: "كود المادة",
  name: "اسم المادة",
  warehouse_id: "المستودع",
  balance: "الرصيد الافتتاحي",
  barcode: "الباركود",
  scientificName: "الاسم العلمي",
  purchasePrice: "سعر الشراء",
  countryOfOrigin: "بلد المنشأ",
  coaFileUrl: "شهادة المطابقة (CoA)",
  msdsFileUrl: "بيانات السلامة (MSDS)",
  tdsFileUrl: "المواصفات الفنية (TDS)",
  allergyFileUrl: "تقرير الحساسية",
  // RM / Materials common
  batchNumber: "رقم الدفعة",
  expiryDate: "تاريخ الانتهاء",
  manufacturingDate: "تاريخ التصنيع",
  receivedDate: "تاريخ الاستلام",
  receivedQuantity: "الكمية المستلمة",
  receivedBy: "استلم بواسطة",
  inspectedBy: "فحص بواسطة",
  approvedBy: "اعتمد بواسطة",
  storageCondition: "شروط التخزين",
  inspectionResult: "نتيجة الفحص",
  certificate: "شهادة المطابقة",
  poNumber: "رقم أمر الشراء",
  // FP-001 (Batch Release)
  releaseId: "رقم سجل الإطلاق",
  productionOrderNo: "رقم أمر الإنتاج",
  productionOrderId: "رقم أمر الإنتاج",
  productName: "اسم المنتج",
  productCode: "كود المنتج",
  releasedQuantity: "الكمية المُفرج عنها",
  qcStatus: "حالة فحص الجودة",
  releaseDate: "تاريخ الإطلاق",
  productionQty: "كمية الإنتاج",
  productionUnit: "وحدة الإنتاج",
  itemNumber: "كود الصنف",
  requiredBatchSize: "حجم الدفعة",
  // PRD
  plannedQuantity: "الكمية المخططة",
  actualQuantity: "الكمية الفعلية",
  startDate: "تاريخ البدء",
  endDate: "تاريخ الانتهاء",
  productionStage: "مرحلة الإنتاج",
  rawMaterials: "المواد الخام",
  packagingMaterials: "مواد التعبئة",
  // QM / DEV / CMP / NCR / CAPA
  issueDate: "تاريخ الإصدار",
  rootCause: "السبب الجذري",
  correctiveAction: "الإجراء التصحيحي",
  preventiveAction: "الإجراء الوقائي",
  verificationDate: "تاريخ التحقق",
  effectivenessCheck: "فحص الفعالية",
  capaRequired: "هل CAPA مطلوب",
  sourceFormId: "النموذج المصدر",
  sourceDocumentNo: "رقم المستند المصدر",
  ncrId: "رقم NCR",
  nonConformityType: "نوع عدم المطابقة",
  severity: "الخطورة",
  immediateAction: "الإجراء الفوري",
  disposition: "القرار",
  reportedBy: "أبلغ بواسطة",
  deviationType: "نوع الانحراف",
  deviationDescription: "وصف الانحراف",
  impactAssessment: "تقييم التأثير",
  // Equipment / Maintenance
  equipmentId: "معرف المعدة",
  equipmentName: "اسم المعدة",
  maintenanceType: "نوع الصيانة",
  maintenanceDate: "تاريخ الصيانة",
  nextMaintenanceDate: "تاريخ الصيانة التالية",
  technicianName: "اسم الفني",
  // Training
  trainingTitle: "عنوان التدريب",
  trainingDate: "تاريخ التدريب",
  trainerName: "اسم المدرب",
  employeeName: "اسم الموظف",
  employeeId: "رقم الموظف",
  score: "الدرجة",
  result: "النتيجة",
  // PRD-003 Production Checklist
  auditorName: "اسم المراجع",
  checksBefore: "فحوصات قبل الإنتاج",
  checksDuring: "فحوصات أثناء الإنتاج",
  checksAfter: "فحوصات بعد الإنتاج",
  cleanMachine: "نظافة الآلة",
  materialsReady: "المواد جاهزة",
  areaClear: "المنطقة خالية",
  tempNormal: "درجة الحرارة طبيعية",
  noLeaks: "لا توجد تسربات",
  speedNormal: "السرعة طبيعية",
  machineOff: "إيقاف الآلة",
  areaCleaned: "تنظيف المنطقة",
  productHandedOver: "تسليم المنتج",
  // PRD-004 Process Monitoring
  readings: "القراءات",
  parameter: "المعامل / المعيار",
  requiredValue: "القيمة المطلوبة",
  actualValue: "القيمة الفعلية",
  withinLimits: "ضمن الحدود",
  // Lab
  sampleId: "رقم العينة",
  testDate: "تاريخ الفحص",
  testType: "نوع الفحص",
  testResult: "نتيجة الفحص",
  analyst: "المحلل",
  // HR
  requestType: "نوع الطلب",
  employeeNumber: "رقم الموظف",
  fullName: "الاسم الكامل",
  joiningDate: "تاريخ الالتحاق",
  contractType: "نوع العقد",
  // FP-002 (Finished Product Storage)
  storageId: "رقم سجل التخزين",
  warehouseLocation: "موقع التخزين / المستودع",
  quantityStored: "الكمية المخزنة",
  storageDate: "تاريخ التخزين",
  // FP-003 (Shipment)
  shipmentId: "رقم الشحنة",
  customerName: "اسم العميل / الوجهة",
  destinationAddress: "العنوان التفصيلي",
  shippedQuantity: "الكمية المشحونة",
  shipmentDate: "تاريخ الشحن",
  transporterName: "اسم الناقل / السائق",
  vehiclePlate: "رقم المركبة",
  // FP-004 (Return)
  returnId: "رقم الإرجاع",
  returnedQuantity: "الكمية المرتجعة",
  returnDate: "تاريخ الإرجاع",
  returnReason: "سبب الإرجاع",
  condition: "حالة المنتج المرتجع",
  actionTaken: "الإجراء المتخذ",
  // FP-005 (Disposal)
  disposalId: "رقم إذن الإتلاف",
  itemType: "نوع الصنف",
  batchOrCode: "رقم الدفعة / كود المنتج",
  disposalDate: "تاريخ الإتلاف",
  disposalReason: "سبب الإتلاف",
  disposalMethod: "طريقة الإتلاف",
  // RMT (Material Transfer / Issue / Receive)
  transactionId: "رقم الحركة",
  transactionType: "نوع الحركة",
  fromWarehouseId: "من المستودع",
  toWarehouseId: "إلى المستودع",
  // Misc
  reference: "المرجع",
  referenceDocument: "وثيقة المرجع",
  lowStockAlert: "تنبيه مخزون منخفض",
  lowStockAlertTriggered: "تم تفعيل تنبيه المخزون المنخفض",
};

// Fields that are internal/redundant and should NOT appear in print
const HIDDEN_FIELDS = new Set([
  "coaFileUrl", "msdsFileUrl", "tdsFileUrl", "allergyFileUrl",
  "productionQty", "productionUnit", "itemNumber",
]);

// Translate known English values to Arabic
const VALUE_MAP: Record<string, Record<string, string>> = {
  qcStatus: { Approved: "معتمد — مطابق للمواصفات", Rejected: "مرفوض — غير مطابق" },
  transactionType: { Receive: "استلام", Issue: "صرف / إصدار", Transfer: "نقل داخلي" },
  priority: { Normal: "عادي", High: "عالي", Urgent: "عاجل", Low: "منخفض" },
  category: {
    "Raw Material": "مادة خام", "Finished Product": "منتج نهائي",
    "Packaging": "مواد تعبئة", "مادة خام": "مادة خام", "منتج نهائي": "منتج نهائي",
  },
  itemType: { Product: "منتج نهائي", Material: "مادة خام" },
  inspectionResult: { Pass: "مقبول", Fail: "مرفوض", "Approved": "معتمد", "Rejected": "مرفوض" },
  condition: { سليم: "سليم", تالف: "تالف" },
};

const translateValue = (key: string, val: any): string => {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "نعم" : "لا";
  const str = String(val);
  if (VALUE_MAP[key]?.[str]) return VALUE_MAP[key][str];
  // Generic English-to-Arabic for common values
  const generic: Record<string, string> = {
    Approved: "معتمد", Rejected: "مرفوض", Pending: "قيد الانتظار",
    Active: "نشط", Inactive: "غير نشط", Pass: "مقبول", Fail: "مرفوض",
    Yes: "نعم", No: "لا", Normal: "عادي", High: "عالي", Low: "منخفض",
    Receive: "استلام", Issue: "صرف", Transfer: "نقل",
    Product: "منتج نهائي", Material: "مادة خام",
  };
  return generic[str] ?? str;
};

const translateKey = (key: string): string => {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  // Convert camelCase to spaced Arabic-friendly fallback
  return key.replace(/([A-Z])/g, " $1").trim();
};

export default function FormViewer() {
  const { recordId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [record, setRecord] = useState<any>(null);
  const [company, setCompany] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showNotesInput, setShowNotesInput] = useState<{ show: boolean; type: string }>({ show: false, type: "" });
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch("/api/company")
      .then((r) => r.json())
      .then((d) => setCompany(d || {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!recordId) return;
    fetch(`/api/forms/record/${recordId}`)
      .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then((data) => { setRecord(data); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); });
  }, [recordId]);

  if (loading) return <div className="p-8 text-center text-slate-500">جاري التحميل...</div>;

  if (!record) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-4">السجل غير موجود</h2>
        <button onClick={() => navigate(-1)} className="text-sky-500 hover:underline">العودة</button>
      </div>
    );
  }

  const { data } = record;

  const executeStatusChange = async (newStatus: string, reasonNotes: string = "") => {
    try {
      const res = await fetch(`/api/forms/record/${recordId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ status: newStatus, userId: user?.id, notes: reasonNotes }),
      });
      if (res.ok) { setRecord({ ...record, status: newStatus }); setShowNotesInput({ show: false, type: "" }); setNotes(""); }
    } catch (err) { console.error(err); }
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === "returned" || newStatus === "rejected") {
      setShowNotesInput({ show: true, type: newStatus });
    } else {
      executeStatusChange(newStatus);
    }
  };

  const renderStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      approved:         { label: "معتمد",              cls: "bg-emerald-100 text-emerald-800" },
      rejected:         { label: "مرفوض",              cls: "bg-red-100 text-red-700" },
      returned:         { label: "مُعاد بملاحظات",     cls: "bg-orange-100 text-orange-700" },
      pending_review:   { label: "في انتظار المراجعة", cls: "bg-blue-100 text-blue-700" },
      pending_approval: { label: "في انتظار الاعتماد", cls: "bg-purple-100 text-purple-700" },
      draft:            { label: "مسودة",              cls: "bg-slate-100 text-slate-700" },
    };
    const s = map[status] || map.draft;
    return <span className={`px-3 py-1.5 rounded-lg text-[12px] font-bold ${s.cls}`}>{s.label}</span>;
  };

  const formRouteMap: Record<string, string> = {
    "F-HR-001": "/hr/new-request", "F-HR-002": "/hr/employee-file", "F-HR-003": "/hr/medical-exam",
    "F-PRD-001": "/prd/production-order", "F-PRD-002": "/prd/batch-record",
    "F-PRD-003": "/prd/production-checklist", "F-PRD-004": "/prd/process-monitoring",
    "F-INV-RMT-001": "/inv/rmt", "F-FP-001": "/inv/fp-001", "F-FP-002": "/inv/fp-002",
    "F-FP-003": "/inv/fp-003", "F-FP-004": "/inv/fp-004", "F-FP-005": "/inv/fp-005",
    "F-FP-006": "/inv/fp-006", "F-INV-BOM": "/inv/composition", "F-INV-RM-001": "/inv/rm-001",
    "F-INV-MAT": "/inv/create-material", "F-INV-WH": "/inv/create-warehouse",
    "F-INV-PRQ-001": "/inv/prq-001", "F-INV-PIN-001": "/inv/pin-001",
    "F-QM-001": "/qm/qm-001", "F-QM-002": "/qm/qm-002", "F-QM-003": "/qm/qm-003",
    "F-QM-004": "/qm/qm-004", "F-QM-005": "/qm/qm-005", "F-QM-006": "/qm/qm-006",
    "F-DEV-001": "/qm/dev-001", "F-DEV-002": "/qm/dev-002", "F-DEV-003": "/qm/dev-003",
    "F-DEV-004": "/qm/dev-004", "F-CMP-001": "/qm/cmp-001", "F-RCL-001": "/qm/rcl-001",
    "F-PRM-001": "/qm/prm-001", "F-PRM-002": "/qm/prm-002", "F-PRM-003": "/qm/prm-003",
    "F-PRM-004": "/qm/prm-004", "F-PRM-005": "/qm/prm-005", "F-EQP-001": "/qm/eqp-001",
    "F-MNT-001": "/qm/mnt-001", "F-TRN-001": "/trn/trn-001", "F-TRN-002": "/trn/trn-002",
    "F-TRN-003": "/trn/trn-003", "F-TRN-004": "/trn/trn-004",
    "F-LAB-001": "/lab/lab-001", "F-LAB-002": "/lab/lab-002", "F-LAB-003": "/lab/lab-003",
    "F-LAB-004": "/lab/lab-004", "F-LAB-005": "/lab/lab-005", "F-LAB-006": "/lab/lab-006",
  };

  const todayHijri = new Date().toLocaleDateString("ar-SA-u-ca-islamic", { year: "numeric", month: "numeric", day: "numeric" });

  // Determine print orientation based on form type
  const landscapeForms = ["F-INV-PIN-001", "F-INV-PRQ-001", "F-PRD-002", "F-LAB-003", "F-PRD-004"];
  const isLandscape = landscapeForms.includes(record.form_id);

  const FORM_TITLES: Record<string, string> = {
    "F-INV-RM-001":    "سجل استلام وتسجيل المواد الخام",
    "F-INV-MAT":       "تسجيل مادة / صنف جديد",
    "F-INV-WH":        "تسجيل مستودع",
    "F-INV-PRQ-001":   "طلب الشراء",
    "F-INV-PIN-001":   "فاتورة الشراء",
    "F-INV-BOM":       "قائمة المكونات (BOM)",
    "F-INV-RMT-001":   "حركة مخزون — صرف / استلام / نقل",
    "F-FP-001":        "إطلاق الدفعة وتخزين المنتج النهائي",
    "F-FP-002":        "تخزين المنتج النهائي",
    "F-FP-003":        "شحن المنتج النهائي",
    "F-FP-004":        "إرجاع المنتج النهائي",
    "F-FP-005":        "إذن الإتلاف",
    "F-FP-006":        "تسوية المخزون",
    "F-PRD-001":       "أمر الإنتاج",
    "F-PRD-002":       "سجل الدفعة",
    "F-PRD-003":       "قائمة فحص الإنتاج",
    "F-PRD-004":       "مراقبة العملية",
    "F-QM-001":        "طلب عدم مطابقة (NCR)",
    "F-QM-002":        "CAPA — إجراء تصحيحي ووقائي",
    "F-QM-003":        "بلاغ انحراف",
    "F-QM-004":        "بروتوكول تحقق",
    "F-QM-005":        "مراجعة المستندات",
    "F-QM-006":        "تدقيق جودة",
    "F-HR-001":        "طلب موارد بشرية",
    "F-HR-002":        "ملف الموظف",
    "F-HR-003":        "الفحص الطبي",
    "F-TRN-001":       "سجل التدريب",
    "F-TRN-002":       "اختبار التدريب",
    "F-TRN-003":       "خطة التدريب",
    "F-TRN-004":       "تقييم التدريب",
    "F-LAB-001":       "طلب فحص مختبري",
    "F-LAB-002":       "سجل نتائج المختبر",
    "F-LAB-003":       "سجل قراءات المعدات",
    "F-EQP-001":       "سجل المعدة",
    "F-MNT-001":       "طلب صيانة",
  };
  const formTitle = FORM_TITLES[record.form_id] || record.form_id;

  return (
    <div className="max-w-4xl mx-auto space-y-4" dir="rtl">
      <style>{`
        @media print {
          @page {
            size: A4 ${isLandscape ? "landscape" : "portrait"};
            margin: 8mm 6mm;
          }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 9pt !important; }
          .print\\:hidden { display: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
          table { font-size: 8pt !important; }
          th, td { padding: 3px 5px !important; font-size: 8pt !important; }
          h1 { font-size: 13pt !important; }
          h2 { font-size: 11pt !important; }
          p, span, div { font-size: 9pt; }
          /* Keep signature block on same page */
          .px-8.pb-6 { page-break-inside: avoid; }
        }
      `}</style>
      {/* Action Bar - hidden on print */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-lg">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 m-0">تفاصيل النموذج: {record.record_id}</h1>
            <p className="text-[13px] font-semibold text-slate-500">{record.form_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {renderStatusBadge(record.status)}

          {(record.status === "draft" || record.status === "returned") && (
            <button onClick={() => handleStatusChange("pending_review")}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 font-semibold text-[13px]">
              <Send className="w-4 h-4" /> إرسال للمراجعة
            </button>
          )}

          {user?.level <= 3 && record.status === "pending_review" && (<>
            <button onClick={() => handleStatusChange("pending_approval")}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-semibold text-[13px]">
              <CheckCircle className="w-4 h-4" /> إرسال للمدير
            </button>
            <button onClick={() => handleStatusChange("returned")}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold text-[13px]">
              <AlertCircle className="w-4 h-4" /> إعادة للموظف
            </button>
          </>)}

          {user?.level <= 2 && record.status === "pending_approval" && (<>
            <button onClick={() => handleStatusChange("approved")}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-semibold text-[13px]">
              <CheckCircle className="w-4 h-4" /> اعتماد نهائي
            </button>
            <button onClick={() => handleStatusChange("rejected")}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold text-[13px]">
              <XCircle className="w-4 h-4" /> رفض
            </button>
          </>)}

          {(record.status === "draft" || record.status === "returned") && (
            <button onClick={() => { const route = formRouteMap[record.form_id]; if (route) navigate(`${route}?edit=${record.record_id}`); }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-semibold text-[13px]">
              تعديل المسودة
            </button>
          )}

          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-semibold text-[13px]">
            <Printer className="w-4 h-4" /> طباعة PDF
          </button>

          {user?.level <= 2 && (
            <button
              onClick={async () => {
                const confirmMsg = record.status === "approved"
                  ? `تحذير: هذا النموذج معتمد. هل أنت متأكد من حذفه نهائياً؟`
                  : `هل أنت متأكد من حذف النموذج "${record.record_id}"؟`;
                if (!window.confirm(confirmMsg)) return;
                const res = await fetch(`/api/forms/record/${recordId}`, {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                if (res.ok) { alert("تم حذف النموذج بنجاح"); navigate(-1); }
                else { const e = await res.json().catch(() => ({ error: "خطأ" })); alert("فشل الحذف: " + e.error); }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold text-[13px]">
              <Trash2 className="w-4 h-4" /> حذف النموذج
            </button>
          )}
        </div>
      </div>

      {showNotesInput.show && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
          <h3 className="text-sm font-bold text-slate-800 mb-2">
            {showNotesInput.type === "rejected" ? "سبب الرفض" : "ملاحظات الإعادة"}
          </h3>
          <textarea className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-sky-500 mb-3" rows={2}
            placeholder="اكتب الأسباب والملاحظات هنا..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowNotesInput({ show: false, type: "" })}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold">إلغاء</button>
            <button onClick={() => executeStatusChange(showNotesInput.type, notes)} disabled={!notes.trim()}
              className="px-4 py-2 text-white bg-sky-600 hover:bg-sky-700 rounded-lg text-sm font-semibold disabled:opacity-50">تأكيد</button>
          </div>
        </div>
      )}

      {/* Printable Document */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden print:border-none print:shadow-none print:rounded-none shadow-sm">
        {/* Company Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-start justify-between gap-4">
            {/* Logo + Company Info */}
            <div className="flex items-center gap-4">
              {company.logo_url ? (
                <img src={company.logo_url} alt="شعار الشركة" className="h-20 w-20 object-contain border border-slate-200 rounded-xl p-1" />
              ) : (
                <div className="h-20 w-20 border-2 border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-xs text-center font-bold">شعار</div>
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-900">{company.name_ar || "الشركة"}</h1>
                <p className="text-sm font-semibold text-slate-500">{company.name_en || ""}</p>
                {company.address && <p className="text-xs text-slate-400 mt-1">{company.address}</p>}
                {(company.phone || company.email) && (
                  <p className="text-xs text-slate-400">
                    {company.phone && `الهاتف: ${company.phone}`}
                    {company.phone && company.email && " | "}
                    {company.email && `البريد: ${company.email}`}
                  </p>
                )}
                {company.license_number && (
                  <p className="text-xs text-slate-400">رقم الترخيص: {company.license_number}</p>
                )}
              </div>
            </div>
            {/* Document Info Box */}
            <div className="border border-slate-300 rounded-lg overflow-hidden text-[12px] min-w-[200px]">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="px-3 py-1.5 text-slate-500 border-l border-slate-200">رقم النموذج</td>
                    <td className="px-3 py-1.5 font-mono font-bold text-slate-800">{record.form_id}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="px-3 py-1.5 text-slate-500 border-l border-slate-200">رقم السجل</td>
                    <td className="px-3 py-1.5 font-mono font-bold text-sky-700">{record.record_id}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="px-3 py-1.5 text-slate-500 border-l border-slate-200">الإصدار</td>
                    <td className="px-3 py-1.5 font-bold text-slate-800">Rev.01</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5 text-slate-500 border-l border-slate-200">التاريخ</td>
                    <td className="px-3 py-1.5 font-bold text-slate-800">{todayHijri}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section Label */}
        <div className="bg-slate-800 text-white text-center py-2 font-bold text-[15px] tracking-wide">
          {formTitle}
        </div>

        {/* Form Data */}
        <div className="p-8">
          <div className="grid grid-cols-2 gap-y-5 gap-x-8">
            {Object.entries(data).map(([key, val], idx) => {
              // Skip internal/file-only fields
              if (HIDDEN_FIELDS.has(key)) return null;

              // Attachment (image or PDF)
              if ((key === "attachmentUrl" || key.endsWith("FileUrl") || key.endsWith("Url")) && typeof val === "string" && val.startsWith("data:")) {
                return (
                  <div key={idx} className="col-span-2 border-b border-slate-100 pb-4">
                    <span className="block text-[12px] font-semibold text-slate-500 mb-2">{translateKey(key)}</span>
                    {val.startsWith("data:image/") ? (
                      <img src={val} alt="مرفق" className="max-h-48 object-contain border border-slate-200 rounded-lg" />
                    ) : (
                      <span className="text-sky-600 text-sm font-semibold">✓ مرفق موجود</span>
                    )}
                  </div>
                );
              }

              // Array of objects → table
              if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
                const visibleKeys = Object.keys(val[0]).filter(k => !HIDDEN_FIELDS.has(k));
                return (
                  <div key={idx} className="col-span-2 mt-2">
                    <div className="bg-slate-700 text-white px-4 py-2 font-bold text-[13px] rounded-t-lg">{translateKey(key)}</div>
                    <div className="overflow-x-auto border border-slate-200 rounded-b-lg">
                      <table className="w-full text-right border-collapse text-[13px]">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                          <tr>
                            {visibleKeys.map((k) => (
                              <th key={k} className="p-2.5 font-semibold border-l border-slate-200 last:border-l-0">{translateKey(k)}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {val.map((item: any, i: number) => (
                            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                              {visibleKeys.map((k, j) => (
                                <td key={j} className="p-2.5 border-l border-slate-100 last:border-l-0">{translateValue(k, item[k])}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              // Nested object → key-value table
              if (typeof val === "object" && val !== null && !Array.isArray(val)) {
                return (
                  <div key={idx} className="col-span-2 mt-2">
                    <div className="bg-slate-700 text-white px-4 py-2 font-bold text-[13px] rounded-t-lg">{translateKey(key)}</div>
                    <div className="border border-slate-200 rounded-b-lg overflow-hidden">
                      <table className="w-full text-right border-collapse text-[13px]">
                        <tbody>
                          {Object.entries(val as Record<string, any>)
                            .filter(([k]) => !HIDDEN_FIELDS.has(k))
                            .map(([k, v], j) => (
                              <tr key={j} className="border-b border-slate-100 last:border-0">
                                <td className="p-2.5 font-semibold text-slate-600 border-l border-slate-100 w-1/2">{translateKey(k)}</td>
                                <td className="p-2.5 font-bold text-slate-900">{translateValue(k, v)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              // Skip empty values
              const strVal = val === null || val === undefined ? "" : String(val);
              if (strVal === "" || strVal === "—") return null;

              return (
                <div key={idx} className="border-b border-slate-100 pb-3">
                  <span className="block text-[12px] font-semibold text-slate-500 mb-0.5">{translateKey(key)}</span>
                  <span className="block text-[14px] font-semibold text-slate-900 break-words whitespace-pre-wrap">{translateValue(key, val)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Signature Blocks */}
        <div className="px-8 pb-6">
          <div className="grid grid-cols-4 gap-3 border border-slate-200 rounded-xl overflow-hidden">
            {["صاحب الطلب", "المنفذ", "المراجع", "المعتمد"].map((title) => (
              <div key={title} className="border-l border-slate-200 last:border-l-0 p-4">
                <div className="bg-slate-800 text-white text-center text-[12px] font-bold py-1.5 rounded mb-8">{title}</div>
                <div className="border-t border-slate-300 pt-2 space-y-1.5">
                  <p className="text-[11px] text-slate-500">التوقيع: <span className="inline-block w-20 border-b border-slate-300"></span></p>
                  <p className="text-[11px] text-slate-500">التاريخ: <span className="inline-block w-16 border-b border-slate-300"></span></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-8 py-3 flex justify-between items-center text-[11px] text-slate-400">
          <span>{company.name_ar || ""} — {company.name_en || ""}</span>
          <span>وثيقة خاضعة لنظام الجودة — يُمنع التعديل بعد الاعتماد</span>
          <span>تاريخ الإنشاء: {new Date(record.created_at).toLocaleDateString("ar-EG")}</span>
        </div>
      </div>
    </div>
  );
}
