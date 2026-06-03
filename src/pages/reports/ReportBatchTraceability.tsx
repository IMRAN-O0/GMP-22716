import React, { useEffect, useRef, useState } from "react";
import {
  Route,
  Search,
  Package,
  FlaskConical,
  Truck,
  Factory,
  ShieldAlert,
  CheckCircle,
  Printer,
  AlertCircle,
} from "lucide-react";

interface TraceRecord {
  record_id: string;
  form_id: string;
  department: string;
  status: string;
  created_at: string;
  data: Record<string, any>;
}

interface BatchTrace {
  batch: string;
  materials: TraceRecord[];
  production: TraceRecord | null;
  operations: TraceRecord[];
  lab: TraceRecord[];
  qm: TraceRecord[];
  release: TraceRecord[];
  shipment: TraceRecord[];
}

const fmtDate = (v: string) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return v;
  }
};

const FORM_LABELS: Record<string, string> = {
  "F-INV-RMT-001": "صرف مواد خام",
  "F-PRD-001": "أمر إنتاج",
  "F-PRD-002": "سجل تصنيع الدُفعة (BMR)",
  "F-PRD-003": "مراقبة عملية الإنتاج",
  "F-PRD-004": "سجل التعبئة",
  "F-LAB-001": "طلب تحليل",
  "F-LAB-002": "تحليل المواد الخام",
  "F-LAB-003": "سجل نتائج اختبار المنتج",
  "F-LAB-004": "مراقبة الاستقرار",
  "F-LAB-005": "تحليل بيئي",
  "F-DEV-001": "بلاغ انحراف",
  "F-QM-005": "تقرير عدم مطابقة (NCR)",
  "F-QM-006": "CAPA",
  "F-FP-001": "فحص المنتج النهائي",
  "F-FP-002": "قرار الإفراج",
  "F-FP-006": "تحليل المنتج النهائي",
  "F-FP-003": "سند شحن",
};

export default function ReportBatchTraceability() {
  const [allRecords, setAllRecords] = useState<TraceRecord[]>([]);
  const [searchBatch, setSearchBatch] = useState("");
  const [tracedBatch, setTracedBatch] = useState<BatchTrace | null>(null);
  const [company, setCompany] = useState<any>({});
  const [loadingData, setLoadingData] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
    Promise.all([
      fetch("/api/reports/all", { headers }).then((r) => r.json()),
      fetch("/api/company", { headers }).then((r) => r.json()),
    ])
      .then(([records, comp]) => {
        setAllRecords(Array.isArray(records) ? records : []);
        setCompany(comp || {});
      })
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, []);

  const handleTrace = () => {
    const batch = searchBatch.trim();
    if (!batch) return;

    let production: TraceRecord | null = null;
    allRecords.forEach((r) => {
      if (r.form_id === "F-PRD-001" && r.data.batchNumber === batch) {
        production = r;
      }
    });

    const prodRef = (production as any)?.data?.productionOrderNo || (production as any)?.record_id || null;

    const trace: BatchTrace = {
      batch,
      materials: [],
      production,
      operations: [],
      lab: [],
      qm: [],
      release: [],
      shipment: [],
    };

    const relatedQm = new Set<string>();

    allRecords.forEach((r) => {
      const d = r.data || {};
      const byBatch =
        d.batchNumber === batch || d.targetBatch === batch;
      const byProdRef =
        prodRef &&
        (d.referenceDocument === prodRef || d.productionOrderNo === prodRef);

      if (r.form_id === "F-INV-RMT-001") {
        if (byBatch || byProdRef) trace.materials.push(r);
      }
      if (["F-PRD-002", "F-PRD-003", "F-PRD-004"].includes(r.form_id)) {
        if (byBatch || byProdRef) trace.operations.push(r);
      }
      if (["F-LAB-001","F-LAB-002","F-LAB-003","F-LAB-004","F-LAB-005"].includes(r.form_id)) {
        if (byBatch || byProdRef) trace.lab.push(r);
      }
      if (["F-DEV-001","F-QM-005"].includes(r.form_id)) {
        if (byBatch || byProdRef) { trace.qm.push(r); relatedQm.add(r.record_id); }
      }
      if (["F-FP-001","F-FP-002","F-FP-006"].includes(r.form_id)) {
        if (byBatch || byProdRef) trace.release.push(r);
      }
      if (r.form_id === "F-FP-003") {
        const hasBatch = Array.isArray(d.items)
          ? d.items.some((it: any) => it.batchNumber === batch)
          : byBatch;
        if (hasBatch) trace.shipment.push(r);
      }
    });

    // CAPA linkage
    allRecords.forEach((r) => {
      if (r.form_id === "F-QM-006") {
        const d = r.data || {};
        const byBatch = d.batchNumber === batch || d.targetBatch === batch;
        const byProdRef =
          prodRef && (d.referenceDocument === prodRef || d.productionOrderNo === prodRef);
        const bySource = d.sourceDocumentNo && relatedQm.has(d.sourceDocumentNo);
        if (
          (byBatch || byProdRef || bySource) &&
          !trace.qm.find((q) => q.record_id === r.record_id)
        ) {
          trace.qm.push(r);
        }
      }
    });

    setTracedBatch(trace);
  };

  const handlePrint = () => {
    const api = (window as any).electronAPI;
    if (api?.printPreview) { api.printPreview(); } else { window.print(); }
  };

  const totalSteps = [
    tracedBatch?.materials.length,
    tracedBatch?.production ? 1 : 0,
    tracedBatch?.operations.length,
    tracedBatch?.lab.length,
    tracedBatch?.release.length,
    tracedBatch?.shipment.length,
  ].reduce((a, b) => (a ?? 0) + (b ?? 0), 0);

  const hasIssues = (tracedBatch?.qm.length ?? 0) > 0;

  return (
    <>
      {/* A4 Portrait Print Styles */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 15mm 12mm; }
          body * { visibility: hidden; }
          #batch-print-area, #batch-print-area * { visibility: visible; }
          #batch-print-area { position: absolute; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-page-break { page-break-before: always; }
        }
      `}</style>

      <div className="space-y-6">
        {/* Search bar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 no-print">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-5">
            <Route className="w-5 h-5 text-indigo-500" />
            تتبع الدفعة الكامل (Batch Traceability)
          </h3>

          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 pr-9 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="أدخل رقم الدفعة (مثال: B-2024-001)"
                value={searchBatch}
                onChange={(e) => setSearchBatch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTrace()}
              />
            </div>
            <button
              onClick={handleTrace}
              disabled={loadingData}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
            >
              {loadingData ? "جاري التحميل…" : "تتبع"}
            </button>
            {tracedBatch && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-200 transition-colors text-sm"
              >
                <Printer className="w-4 h-4" />
                طباعة التقرير
              </button>
            )}
          </div>

          {tracedBatch && (
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
                الدفعة: {tracedBatch.batch}
              </span>
              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
                {totalSteps} سجل مرتبط
              </span>
              {hasIssues && (
                <span className="bg-rose-50 text-rose-600 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> يوجد أحداث جودة
                </span>
              )}
              {!tracedBatch.production && (
                <span className="bg-amber-50 text-amber-600 text-xs font-bold px-3 py-1 rounded-full">
                  لم يُعثر على أمر إنتاج
                </span>
              )}
            </div>
          )}
        </div>

        {/* Trace result */}
        {tracedBatch ? (
          <div id="batch-print-area" ref={printRef}>
            {/* Print header */}
            <div className="hidden print:block mb-6 border-b-2 border-slate-300 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  {company.logo && (
                    <img src={company.logo} alt="logo" className="h-14 mb-1 object-contain" />
                  )}
                  <div className="font-bold text-lg text-slate-900">{company.name_ar || "الشركة"}</div>
                  <div className="text-sm text-slate-500">{company.name_en}</div>
                </div>
                <div className="text-left ltr text-sm text-slate-600 space-y-0.5">
                  <div className="font-bold text-base text-slate-900">تقرير تتبع الدفعة</div>
                  <div>رقم الدفعة: <strong>{tracedBatch.batch}</strong></div>
                  <div>تاريخ التقرير: {new Date().toLocaleDateString("ar-SA")}</div>
                  <div>رقم الترخيص: {company.license_number || "—"}</div>
                </div>
              </div>
            </div>

            {/* Screen title */}
            <div className="print:hidden bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Route className="w-5 h-5 text-white" />
                  <div>
                    <div className="font-bold text-white text-base">تقرير تتبع الدفعة</div>
                    <div className="text-indigo-200 text-xs">{tracedBatch.batch}</div>
                  </div>
                </div>
                {hasIssues && (
                  <span className="flex items-center gap-1 text-xs font-bold bg-rose-500 text-white px-3 py-1 rounded-full">
                    <AlertCircle className="w-3 h-3" /> يوجد مشاكل جودة
                  </span>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-0 mt-4 print:mt-0">
              <TraceSection
                icon={<Package className="w-5 h-5 text-slate-600" />}
                iconBg="bg-slate-100"
                title="صرف المواد الخام"
                step="1"
                empty="لا توجد سجلات صرف مواد خام مرتبطة"
              >
                {tracedBatch.materials.map((m, i) => (
                  <TraceRow key={i} label={m.record_id} formLabel={FORM_LABELS[m.form_id] || m.form_id}>
                    <Field k="المادة" v={m.data.materialName || m.data.itemName} />
                    <Field k="الكمية المصروفة" v={m.data.quantity} />
                    <Field k="رقم التشغيلة" v={m.data.batchNumber || m.data.lotNumber} />
                    <Field k="التاريخ" v={fmtDate(m.data.issueDate || m.created_at)} />
                  </TraceRow>
                ))}
              </TraceSection>

              <TraceSection
                icon={<Factory className="w-5 h-5 text-blue-600" />}
                iconBg="bg-blue-50"
                title="الإنتاج والتصنيع"
                step="2"
                empty="لا يوجد أمر إنتاج أو عمليات مرتبطة"
              >
                {tracedBatch.production && (
                  <TraceRow
                    label={(tracedBatch.production as any).record_id}
                    formLabel="أمر إنتاج (F-PRD-001)"
                    highlight
                  >
                    <Field k="المنتج" v={(tracedBatch.production as any).data.productName} />
                    <Field k="رقم الدفعة" v={(tracedBatch.production as any).data.batchNumber} />
                    <Field k="الكمية المخططة" v={(tracedBatch.production as any).data.plannedQuantity} />
                    <Field k="تاريخ الإنتاج" v={fmtDate((tracedBatch.production as any).data.productionDate || (tracedBatch.production as any).created_at)} />
                  </TraceRow>
                )}
                {tracedBatch.operations.map((op, i) => (
                  <TraceRow key={i} label={op.record_id} formLabel={FORM_LABELS[op.form_id] || op.form_id}>
                    <Field k="المرحلة" v={op.data.productionStage || op.data.stage} />
                    <Field k="الفاقد" v={op.data.wasteQuantity} />
                    <Field k="المشغّل" v={op.data.operatorName} />
                    <Field k="التاريخ" v={fmtDate(op.data.date || op.created_at)} />
                  </TraceRow>
                ))}
              </TraceSection>

              <TraceSection
                icon={<FlaskConical className="w-5 h-5 text-purple-600" />}
                iconBg="bg-purple-50"
                title="نتائج المختبر"
                step="3"
                empty="لا توجد تحاليل مختبرية مرتبطة"
              >
                {tracedBatch.lab.map((l, i) => (
                  <TraceRow key={i} label={l.record_id} formLabel={FORM_LABELS[l.form_id] || l.form_id}>
                    <Field k="نوع التحليل" v={l.data.testType || l.data.analysisType} />
                    <Field k="النتيجة" v={l.data.decision || l.data.result || l.data.status} />
                    <Field k="المختبر" v={l.data.analystName || l.data.performedBy} />
                    <Field k="التاريخ" v={fmtDate(l.data.testDate || l.created_at)} />
                  </TraceRow>
                ))}
              </TraceSection>

              {(tracedBatch.qm.length > 0) && (
                <TraceSection
                  icon={<ShieldAlert className="w-5 h-5 text-rose-600" />}
                  iconBg="bg-rose-50"
                  title="أحداث الجودة (NCR / CAPA / انحرافات)"
                  step="⚠"
                  isAlert
                  empty=""
                >
                  {tracedBatch.qm.map((q, i) => (
                    <TraceRow key={i} label={q.record_id} formLabel={FORM_LABELS[q.form_id] || q.form_id} isAlert>
                      <Field k="الحالة" v={q.data.status || "مفتوح"} />
                      {q.data.description && <Field k="الوصف" v={q.data.description} />}
                      {q.data.rootCause && <Field k="السبب الجذري" v={q.data.rootCause} />}
                      <Field k="التاريخ" v={fmtDate(q.data.date || q.created_at)} />
                    </TraceRow>
                  ))}
                </TraceSection>
              )}

              <TraceSection
                icon={<CheckCircle className="w-5 h-5 text-teal-600" />}
                iconBg="bg-teal-50"
                title="الإفراج عن الدفعة وتخزينها"
                step="4"
                empty="بانتظار قرار الإفراج"
              >
                {tracedBatch.release.map((r, i) => (
                  <TraceRow key={i} label={r.record_id} formLabel={FORM_LABELS[r.form_id] || r.form_id}>
                    <Field k="قرار الجودة" v={r.data.qcStatus || r.data.decision} />
                    <Field k="موقع التخزين" v={r.data.warehouseLocation} />
                    <Field k="تاريخ انتهاء الصلاحية" v={fmtDate(r.data.expiryDate)} />
                    <Field k="التاريخ" v={fmtDate(r.data.releaseDate || r.created_at)} />
                  </TraceRow>
                ))}
              </TraceSection>

              <TraceSection
                icon={<Truck className="w-5 h-5 text-emerald-600" />}
                iconBg="bg-emerald-50"
                title="الشحن والتوزيع"
                step="5"
                empty="لم يتم شحن هذه الدفعة بعد"
              >
                {tracedBatch.shipment.map((s, i) => (
                  <TraceRow key={i} label={s.record_id} formLabel={FORM_LABELS[s.form_id] || s.form_id}>
                    <Field k="العميل" v={s.data.customerName} />
                    <Field k="تاريخ الشحن" v={fmtDate(s.data.shipmentDate || s.created_at)} />
                    <Field k="رقم السيارة" v={s.data.vehicleNumber} />
                    <Field k="الكمية المشحونة" v={s.data.quantity || s.data.totalQuantity} />
                  </TraceRow>
                ))}
              </TraceSection>
            </div>

            {/* Print footer */}
            <div className="hidden print:flex justify-between items-center mt-8 pt-4 border-t border-slate-300 text-xs text-slate-500">
              <span>تقرير تتبع الدفعة · رقم الدفعة: {tracedBatch.batch}</span>
              <span>ISO 22716 GMP · {new Date().toLocaleDateString("ar-SA")}</span>
            </div>

            {/* Signature block for print */}
            <div className="hidden print:grid grid-cols-3 gap-8 mt-10 pt-4 border-t border-slate-200">
              {["أعده", "راجعه", "اعتمده"].map((role) => (
                <div key={role} className="text-center">
                  <div className="text-xs text-slate-600 mb-8">{role}</div>
                  <div className="border-t border-slate-400 pt-2 text-xs text-slate-500">الاسم والتوقيع</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="no-print text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm">
            <Route className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">أدخل رقم دفعة وانقر "تتبع" لعرض شجرة التتبع الكاملة</p>
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TraceSection({
  icon, iconBg, title, step, children, empty, isAlert,
}: React.PropsWithChildren<{
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  step: string | number;
  empty: string;
  isAlert?: boolean;
}>) {
  const hasChildren = React.Children.count(children) > 0;
  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden mb-4 print:mb-3 print:rounded-none print:shadow-none print:border-slate-300 ${isAlert ? "border-rose-200" : "border-slate-200"}`}>
      <div className={`flex items-center gap-3 px-5 py-3 border-b print:py-2 ${isAlert ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-100"}`}>
        <div className={`w-8 h-8 ${iconBg} rounded-full flex items-center justify-center flex-shrink-0 print:w-6 print:h-6`}>
          {icon}
        </div>
        <span className={`font-bold text-sm ${isAlert ? "text-rose-800" : "text-slate-800"}`}>{title}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full mr-auto ${isAlert ? "bg-rose-100 text-rose-600" : "bg-slate-200 text-slate-600"}`}>
          {isAlert ? "تنبيه" : `مرحلة ${step}`}
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {hasChildren ? children : (
          <p className="text-sm text-slate-400 px-5 py-4">{empty}</p>
        )}
      </div>
    </div>
  );
}

function TraceRow({
  label, formLabel, children, highlight, isAlert,
}: React.PropsWithChildren<{
  label: string;
  formLabel: string;
  highlight?: boolean;
  isAlert?: boolean;
}>) {
  return (
    <div className={`px-5 py-3 print:py-2 ${highlight ? "bg-blue-50/40" : ""} ${isAlert ? "bg-rose-50/40" : ""}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${isAlert ? "bg-rose-100 text-rose-700" : "bg-indigo-50 text-indigo-700"}`}>
          {label}
        </span>
        <span className="text-xs text-slate-500">{formLabel}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
        {children}
      </div>
    </div>
  );
}

function Field({ k, v }: { k: string; v?: string | number | null }) {
  if (!v && v !== 0) return null;
  return (
    <div className="text-xs">
      <span className="text-slate-500">{k}: </span>
      <span className="font-semibold text-slate-800">{String(v)}</span>
    </div>
  );
}
