import React, { useEffect, useState } from "react";
import {
  Route,
  Search,
  Package,
  FlaskConical,
  Truck,
  Factory,
  ShieldAlert,
  CheckCircle,
} from "lucide-react";

export default function ReportBatchTraceability() {
  const [data, setData] = useState<any[]>([]);
  const [searchBatch, setSearchBatch] = useState("");
  const [tracedBatch, setTracedBatch] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/reports/all", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((records) => setData(records))
      .catch(console.error);
  }, []);

  const handleTrace = () => {
    if (!searchBatch) return;

    let prdOrder: any = null;

    // Find the production order first
    data.forEach((r) => {
      if (
        r.form_id === "F-PRD-001" &&
        r.status === "approved" &&
        r.data.batchNumber === searchBatch
      ) {
        prdOrder = r;
      }
    });

    const prodOrderNoField =
      prdOrder?.data?.productionOrderNo || prdOrder?.record_id || null;

    const trace: any = {
      batch: searchBatch,
      materials: [],
      production: prdOrder,
      operations: [],
      lab: [],
      qm: [],
      release: [],
      shipment: [],
    };

    const relatedQmRecords = new Set<string>();

    data.forEach((r) => {
      const d = r.data || {};
      const isMatchBatch =
        d.batchNumber === searchBatch || d.targetBatch === searchBatch;
      const isMatchProdOrder =
        prodOrderNoField &&
        (d.referenceDocument === prodOrderNoField ||
          d.productionOrderNo === prodOrderNoField);

      // 1. Raw Materials Dispensed
      if (
        (r.form_id === "F-INV-RMT-001" || r.form_id === "F-INV-RMT-001") &&
        r.status === "approved"
      ) {
        if (isMatchBatch || isMatchProdOrder) trace.materials.push(r);
      }

      // 3. Operations
      if (
        ["F-PRD-002", "F-PRD-003", "F-PRD-004"].includes(r.form_id) &&
        r.status === "approved"
      ) {
        if (isMatchBatch || isMatchProdOrder) trace.operations.push(r);
      }

      // 4. Lab Results
      if (
        [
          "F-LAB-001",
          "F-LAB-002",
          "F-LAB-003",
          "F-LAB-004",
          "F-LAB-005",
        ].includes(r.form_id) &&
        r.status === "approved"
      ) {
        if (isMatchBatch || isMatchProdOrder) trace.lab.push(r);
      }

      // Quality Events (NCR / Dev)
      if (["F-DEV-001", "F-QM-005"].includes(r.form_id)) {
        if (isMatchBatch || isMatchProdOrder) {
          trace.qm.push(r);
          relatedQmRecords.add(r.record_id);
        }
      }

      // 5. Release
      if (
        ["F-FP-001", "F-FP-002", "F-FP-006"].includes(r.form_id) &&
        r.status === "approved"
      ) {
        if (isMatchBatch || isMatchProdOrder) trace.release.push(r);
      }

      // 6. Shipment
      if (r.form_id === "F-FP-003" && r.status === "approved") {
        if (d.items && Array.isArray(d.items)) {
          const hasBatch = d.items.some(
            (item: any) => item.batchNumber === searchBatch,
          );
          if (hasBatch) trace.shipment.push(r);
        } else if (isMatchBatch) {
          trace.shipment.push(r);
        }
      }
    });

    // find CAPA separately to ensure sourceDocumentNo is matched
    data.forEach((r) => {
      if (r.form_id === "F-QM-006") {
        const d = r.data || {};
        const isMatchBatch =
          d.batchNumber === searchBatch || d.targetBatch === searchBatch;
        const isMatchProdOrder =
          prodOrderNoField &&
          (d.referenceDocument === prodOrderNoField ||
            d.productionOrderNo === prodOrderNoField);

        if (
          isMatchBatch ||
          isMatchProdOrder ||
          (d.sourceDocumentNo && relatedQmRecords.has(d.sourceDocumentNo))
        ) {
          if (!trace.qm.find((q: any) => q.record_id === r.record_id)) {
            trace.qm.push(r);
          }
        }
      }
    });

    setTracedBatch(trace);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
          <Route className="w-5 h-5 text-indigo-500" /> تتبع الدفعة الكامل
          (Batch Traceability)
        </h3>

        <div className="flex gap-2 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-9 text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="أدخل رقم الدفعة..."
              value={searchBatch}
              onChange={(e) => setSearchBatch(e.target.value)}
            />
          </div>
          <button
            onClick={handleTrace}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
          >
            تتبع
          </button>
        </div>

        {tracedBatch ? (
          <div className="space-y-4 relative">
            <div className="absolute right-7 top-0 bottom-0 w-1 bg-slate-100 z-0 hidden md:block"></div>

            {/* Materials */}
            <div className="relative z-10 flex gap-6 flex-col md:flex-row">
              <div className="w-14 h-14 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center shrink-0 shadow-sm">
                <Package className="w-6 h-6 text-slate-500" />
              </div>
              <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-2">
                  صرف المواد الخام
                </h4>
                {tracedBatch.materials.length > 0 ? (
                  tracedBatch.materials.map((m: any, i: number) => (
                    <div
                      key={i}
                      className="text-sm text-slate-600 border-b border-slate-200 pb-2 mb-2 last:border-0"
                    >
                      <div>الطلب: {m.record_id}</div>
                      <div>الكمية المصروفة: {m.data.quantity}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">لا توجد سجلات صرف</p>
                )}
              </div>
            </div>

            {/* Production */}
            <div className="relative z-10 flex gap-6 flex-col md:flex-row">
              <div className="w-14 h-14 rounded-full bg-blue-100 border-4 border-white flex items-center justify-center shrink-0 shadow-sm">
                <Factory className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-800 mb-2">
                  أمر وعمليات الإنتاج
                </h4>
                {tracedBatch.production ? (
                  <div className="text-sm text-blue-700 mb-3">
                    <span className="font-bold">المنتج:</span>{" "}
                    {tracedBatch.production.data.productName} <br />
                    <span className="font-bold">الكمية المخططة:</span>{" "}
                    {tracedBatch.production.data.plannedQuantity}
                  </div>
                ) : (
                  <p className="text-sm text-blue-400 mb-2">
                    لا يوجد أمر إنتاج
                  </p>
                )}

                {tracedBatch.operations.length > 0 && (
                  <div className="text-sm text-blue-600 bg-white p-3 rounded-lg border border-blue-50">
                    <div className="font-bold mb-1">العمليات:</div>
                    {tracedBatch.operations.map((op: any, i: number) => (
                      <div key={i}>
                        المرحلة: {op.data.productionStage} - الفاقد:{" "}
                        {op.data.wasteQuantity}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Lab */}
            <div className="relative z-10 flex gap-6 flex-col md:flex-row">
              <div className="w-14 h-14 rounded-full bg-purple-100 border-4 border-white flex items-center justify-center shrink-0 shadow-sm">
                <FlaskConical className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1 bg-purple-50 p-4 rounded-xl border border-purple-100">
                <h4 className="font-bold text-purple-800 mb-2">
                  نتائج المختبر
                </h4>
                {tracedBatch.lab.length > 0 ? (
                  tracedBatch.lab.map((l: any, i: number) => (
                    <div
                      key={i}
                      className="text-sm text-purple-700 bg-white p-2 rounded mb-2 border border-purple-100"
                    >
                      النموذج: {l.form_id} - النتيجة:{" "}
                      {l.data.decision || l.data.status || "مكتمل"}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-purple-400">لا توجد تحاليل</p>
                )}
              </div>
            </div>

            {/* Quality Events (QM) */}
            {tracedBatch.qm.length > 0 && (
              <div className="relative z-10 flex gap-6 flex-col md:flex-row">
                <div className="w-14 h-14 rounded-full bg-rose-100 border-4 border-white flex items-center justify-center shrink-0 shadow-sm">
                  <ShieldAlert className="w-6 h-6 text-rose-500" />
                </div>
                <div className="flex-1 bg-rose-50 p-4 rounded-xl border border-rose-100">
                  <h4 className="font-bold text-rose-800 mb-2">
                    أحداث الجودة (NCR / CAPA)
                  </h4>
                  {tracedBatch.qm.map((q: any, i: number) => (
                    <div
                      key={i}
                      className="text-sm text-rose-700 bg-white p-2 rounded mb-2 border border-rose-100"
                    >
                      <div className="font-bold">النموذج: {q.form_id}</div>
                      <div>الحالة: {q.data.status || "مفتوح"}</div>
                      {q.data.description && (
                        <div className="truncate">
                          الوصف: {q.data.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Release */}
            <div className="relative z-10 flex gap-6 flex-col md:flex-row">
              <div className="w-14 h-14 rounded-full bg-teal-100 border-4 border-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle className="w-6 h-6 text-teal-500" />
              </div>
              <div className="flex-1 bg-teal-50 p-4 rounded-xl border border-teal-100">
                <h4 className="font-bold text-teal-800 mb-2">
                  الإفراج عن الدفعة والتخزين
                </h4>
                {tracedBatch.release.length > 0 ? (
                  tracedBatch.release.map((r: any, i: number) => (
                    <div
                      key={i}
                      className="text-sm text-teal-700 bg-white p-2 rounded mb-2 border border-teal-100"
                    >
                      النموذج: {r.form_id} - قرار الجودة:{" "}
                      {r.data.qcStatus || r.data.decision || "مختبر ومعتمد"}{" "}
                      <br />
                      {r.data.warehouseLocation && (
                        <span>الموقع: {r.data.warehouseLocation}</span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-teal-400">بانتظار الإفراج</p>
                )}
              </div>
            </div>

            {/* Shipment */}
            <div className="relative z-10 flex gap-6 flex-col md:flex-row">
              <div className="w-14 h-14 rounded-full bg-emerald-100 border-4 border-white flex items-center justify-center shrink-0 shadow-sm">
                <Truck className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="flex-1 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <h4 className="font-bold text-emerald-800 mb-2">
                  الشحن والتوزيع
                </h4>
                {tracedBatch.shipment.length > 0 ? (
                  tracedBatch.shipment.map((s: any, i: number) => (
                    <div
                      key={i}
                      className="text-sm text-emerald-700 border-b border-emerald-200 pb-2 mb-2 last:border-0"
                    >
                      <div>
                        العميل:{" "}
                        <span className="font-bold">{s.data.customerName}</span>
                      </div>
                      <div>
                        التاريخ:{" "}
                        {s.data.shipmentDate ||
                          new Date(s.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-emerald-400">لم يتم الشحن بعد</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            أدخل رقم دفعة للبحث وإظهار شجرة التتبع كاملة
          </div>
        )}
      </div>
    </div>
  );
}
