import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft } from "lucide-react";
import { getAuthHeaders } from "../../lib/utils";

export default function ReportTransactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("ALL");

  useEffect(() => {
    Promise.all([
      fetch("/api/reports/inv/transactions", {
        headers: getAuthHeaders(),
      }).then((res) => res.json()),
      fetch("/api/materials").then((res) => res.json()).catch(() => []),
      fetch("/api/warehouses").then((res) => res.json()).catch(() => []),
    ])
      .then(([data, materialsData, warehousesData]) => {
        const getMaterialName = (code: string) => {
          const m = materialsData.find((x: any) => x.code === code);
          return m ? `${code} - ${m.name}` : code;
        };

        const getWarehouseName = (id: string | number) => {
          const w = warehousesData.find((x: any) => x.id?.toString() === id?.toString());
          return w ? w.name : id;
        };

        // Flatten forms records into transaction line items
        let rows: any[] = [];
        data.forEach((record: any) => {
          const fd = record.data;
          if (record.form_id === "F-INV-RM-001") {
            rows.push({
              id: record.record_id,
              date: record.created_at ? record.created_at.split("T")[0] : "N/A",
              type: "RECEIVE",
              material_code: getMaterialName(fd.code || "N/A"),
              quantity: fd.balance || 0,
              warehouse: getWarehouseName(fd.warehouse_id || "N/A"),
              reference: "تعريف مادة خام",
              createdBy: record.creator_id,
            });
          } else if (record.form_id === "F-INV-MAT") {
            rows.push({
              id: record.record_id,
              date: record.created_at ? record.created_at.split("T")[0] : "N/A",
              type: "RECEIVE",
              material_code: getMaterialName(fd.code || "N/A"),
              quantity: fd.balance || 0,
              warehouse: getWarehouseName(fd.warehouse_id || "N/A"),
              reference: "تعريف منتج نهائي / مادة عبوات",
              createdBy: record.creator_id,
            });
          } else if (record.form_id === "F-INV-PIN-001") {
            if (fd.items && Array.isArray(fd.items)) {
              fd.items.forEach((m: any, i: number) => {
                rows.push({
                  id: `${record.record_id}-${i + 1}`,
                  date:
                    fd.invoiceDate ||
                    (record.created_at
                      ? record.created_at.split("T")[0]
                      : "N/A"),
                  type: "RECEIVE",
                  material_code: getMaterialName(m.materialCode || "N/A"),
                  quantity: m.quantity || 0,
                  warehouse: getWarehouseName(fd.warehouseId || "N/A"),
                  reference: "استلام مواد (فاتورة شراء)",
                  createdBy: record.creator_id,
                });
              });
            }
          } else if (record.form_id === "F-INV-RMT-001") {
            if (fd.items && Array.isArray(fd.items)) {
              fd.items.forEach((m: any, i: number) => {
                rows.push({
                  id: `${record.record_id}-${i + 1}`,
                  date: record.created_at
                    ? record.created_at.split("T")[0]
                    : "N/A",
                  type: fd.transactionType
                    ? fd.transactionType.toUpperCase()
                    : "TRANSFER",
                  material_code: getMaterialName(m.materialCode || "N/A"),
                  quantity: m.quantity || 0,
                  warehouse: "—",
                  reference: fd.transactionType === "Receive" ? `استلام${fd.referenceDocument ? " — " + fd.referenceDocument : ""}` : `صرف${fd.referenceDocument ? " — " + fd.referenceDocument : ""}`,
                  createdBy: record.creator_id,
                });
              });
            }
          } else if (record.form_id === "F-FP-001" && fd.qcStatus !== "Rejected") {
            const code = getMaterialName(fd.productCode || fd.batchNumber || "—");
            const qty = parseFloat(fd.releasedQuantity || fd.actualQuantity || fd.plannedQuantity) || 0;
            if (qty > 0) {
              rows.push({
                id: record.record_id,
                date: fd.releaseDate || (record.created_at ? record.created_at.split("T")[0] : "—"),
                type: "RECEIVE",
                material_code: code,
                quantity: qty,
                warehouse: fd.warehouseId || "—",
                reference: `إطلاق دفعة — ${fd.batchNumber || ""}`,
                createdBy: record.creator_id,
              });
            }
          } else if (record.form_id === "F-FP-002") {
            rows.push({
              id: record.record_id,
              date: record.created_at ? record.created_at.split("T")[0] : "—",
              type: "RECEIVE",
              material_code: getMaterialName(fd.productCode || fd.batchNumber || "—"),
              quantity: fd.quantityStored || 0,
              warehouse: fd.warehouseLocation || "—",
              reference: "تخزين منتج نهائي",
              createdBy: record.creator_id,
            });
          } else if (record.form_id === "F-FP-003") {
            rows.push({
              id: record.record_id,
              date: fd.shipmentDate || (record.created_at ? record.created_at.split("T")[0] : "—"),
              type: "ISSUE",
              material_code: getMaterialName(fd.productCode || fd.batchNumber || "—"),
              quantity: fd.shippedQuantity || 0,
              warehouse: "—",
              reference: `شحن للعميل — ${fd.customerName || ""}`,
              createdBy: record.creator_id,
            });
          } else if (record.form_id === "F-FP-004") {
            rows.push({
              id: record.record_id,
              date: fd.returnDate || (record.created_at ? record.created_at.split("T")[0] : "—"),
              type: "RECEIVE",
              material_code: getMaterialName(fd.productCode || fd.batchNumber || "—"),
              quantity: fd.returnedQuantity || 0,
              warehouse: "—",
              reference: `مرتجع من عميل — ${fd.customerName || ""}`,
              createdBy: record.creator_id,
            });
          } else if (record.form_id === "F-FP-005") {
            rows.push({
              id: record.record_id,
              date: fd.disposalDate || (record.created_at ? record.created_at.split("T")[0] : "—"),
              type: "ISSUE",
              material_code: getMaterialName(fd.batchOrCode || "—"),
              quantity: fd.quantity || 0,
              warehouse: "—",
              reference: "إتلاف منتج",
              createdBy: record.creator_id,
            });
          } else if (record.form_id === "F-PRD-002") {
            // PRD-002 deducts raw materials — show each material
            const rawMats = fd.rawMaterials || [];
            rawMats.forEach((mat: any, i: number) => {
              rows.push({
                id: `${record.record_id}-${i + 1}`,
                date: record.created_at ? record.created_at.split("T")[0] : "—",
                type: "ISSUE",
                material_code: getMaterialName(mat.materialCode || "—"),
                quantity: mat.quantity || 0,
                warehouse: "—",
                reference: `صرف إنتاج — ${fd.productionOrderNo || record.record_id}`,
                createdBy: record.creator_id,
              });
            });
          }
        });

        // Sort by date desc safely
        rows.sort((a, b) => {
          const timeA = a.date === "N/A" ? 0 : new Date(a.date).getTime() || 0;
          const timeB = b.date === "N/A" ? 0 : new Date(b.date).getTime() || 0;
          return timeB - timeA;
        });
        setTransactions(rows);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = transactions.filter(
    (t) => filterType === "ALL" || t.type === filterType,
  );

  // Calc totals
  const totalReceive = filtered
    .filter((t) => t.type === "RECEIVE")
    .reduce((acc, curr) => acc + Number(curr.quantity), 0);
  const totalIssue = filtered
    .filter((t) => t.type === "ISSUE")
    .reduce((acc, curr) => acc + Number(curr.quantity), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">إجمالي الحركات</p>
          <p className="text-2xl font-bold text-slate-800">{filtered.length}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl shadow-sm border border-emerald-100">
          <p className="text-sm text-emerald-600 mb-1">إجمالي الوارد</p>
          <p className="text-2xl font-bold text-emerald-700">{totalReceive}</p>
        </div>
        <div className="bg-rose-50 p-4 rounded-xl shadow-sm border border-rose-100">
          <p className="text-sm text-rose-600 mb-1">إجمالي المنصرف</p>
          <p className="text-2xl font-bold text-rose-700">{totalIssue}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-slate-300 rounded-lg p-2 outline-none focus:border-blue-500 w-full md:w-auto"
          >
            <option value="ALL">جميع الحركات</option>
            <option value="RECEIVE">وارد (استلام)</option>
            <option value="ISSUE">منصرف (صرف)</option>
            <option value="TRANSFER">تحويل داخلي</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold">رقم الحركة</th>
                <th className="p-4 font-semibold">التاريخ</th>
                <th className="p-4 font-semibold">النوع</th>
                <th className="p-4 font-semibold">كود المادة</th>
                <th className="p-4 font-semibold">الكمية</th>
                <th className="p-4 font-semibold">المستودع</th>
                <th className="p-4 font-semibold">المرجع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-500">
                    جاري التحميل...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-500">
                    لا توجد حركات
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 font-mono text-sm text-slate-700">
                      {t.id}
                    </td>
                    <td className="p-4 text-slate-600">{t.date}</td>
                    <td className="p-4">
                      {t.type === "RECEIVE" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-bold">
                          <ArrowDownLeft className="w-3 h-3" /> وارد
                        </span>
                      )}
                      {t.type === "ISSUE" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-100 text-rose-700 text-xs font-bold">
                          <ArrowUpRight className="w-3 h-3" /> منصرف
                        </span>
                      )}
                      {t.type === "TRANSFER" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold">
                          <ArrowRightLeft className="w-3 h-3" /> تحويل
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {t.material_code}
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {t.quantity}
                    </td>
                    <td className="p-4 text-slate-600 whitespace-nowrap">
                      {t.warehouse}
                    </td>
                    <td className="p-4 text-slate-500 text-sm">
                      {t.reference}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
