import React, { useEffect, useState } from "react";
import { Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { getAuthHeaders } from "../../lib/utils";

export default function ReportExpiryWatch() {
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/reports/all", {
      headers: getAuthHeaders(),
    })
      .then((r) => r.json())
      .then((records) => {
        const items: any[] = [];

        // F-INV-RM-001 استلام مواد خام وتعبئة
        records
          .filter(
            (r: any) => r.form_id === "F-INV-RM-001" && r.status === "approved",
          )
          .forEach((r: any) => {
            if (r.data.items && Array.isArray(r.data.items)) {
              r.data.items.forEach((item: any) => {
                if (item.expiryDate) {
                  const expDate = new Date(item.expiryDate);
                  const diffTime = expDate.getTime() - new Date().getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  items.push({
                    code: item.materialCode || "---",
                    name: item.materialName || "---",
                    batch: item.batchNumber || r.data.batchNumber || "---",
                    expiry: item.expiryDate,
                    daysLeft: diffDays,
                    qty: item.receivedQuantity || 0,
                    location: r.data.warehouseName || "مستودع المواد",
                    type: "مادة",
                  });
                }
              });
            }
          });

        // F-FP-006 منتجات نهائية
        records
          .filter(
            (r: any) => r.form_id === "F-FP-006" && r.status === "approved",
          )
          .forEach((r: any) => {
            if (r.data.expiryDate || r.data.expirationDate) {
              const expDate = new Date(
                r.data.expiryDate || r.data.expirationDate,
              );
              const diffTime = expDate.getTime() - new Date().getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              items.push({
                code: r.data.productCode || "---",
                name: r.data.productName || "---",
                batch: r.data.batchNumber || "---",
                expiry: r.data.expiryDate || r.data.expirationDate,
                daysLeft: diffDays,
                qty: r.data.quantity || 0,
                location: r.data.warehouseName || "مستودع المنتجات",
                type: "منتج",
              });
            }
          });

        // عينات المختبر F-LAB-006 العينات المحتجزة
        records
          .filter(
            (r: any) => r.form_id === "F-LAB-006" && r.status === "approved",
          )
          .forEach((r: any) => {
            if (r.data.retentionExpiryDate || r.data.expiryDate) {
              const expDate = new Date(
                r.data.retentionExpiryDate || r.data.expiryDate,
              );
              const diffTime = expDate.getTime() - new Date().getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              items.push({
                code: r.data.productCode || r.data.materialCode || "---",
                name:
                  r.data.productName || r.data.materialName || "عينة محتجزة",
                batch: r.data.batchNumber || "---",
                expiry: r.data.retentionExpiryDate || r.data.expiryDate,
                daysLeft: diffDays,
                qty: r.data.quantity || "عينة",
                location: "المختبر - محتجزات",
                type: "عينة",
              });
            }
          });

        items.sort((a, b) => a.daysLeft - b.daysLeft);
        setData(items);
      })
      .catch(console.error);
  }, []);

  const filtered = data.filter(
    (d) =>
      d.name.includes(searchTerm) ||
      d.code.includes(searchTerm) ||
      d.batch.includes(searchTerm),
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col justify-center items-center text-center">
          <span className="text-red-700 font-bold mb-1 text-sm flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" /> منتهية الصلاحية
          </span>
          <span className="text-3xl font-black text-red-700">
            {data.filter((d) => d.daysLeft < 0).length}
          </span>
        </div>
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col justify-center items-center text-center">
          <span className="text-orange-700 font-bold mb-1 text-sm flex items-center gap-1">
            أقل من 30 يوم
          </span>
          <span className="text-3xl font-black text-orange-700">
            {data.filter((d) => d.daysLeft >= 0 && d.daysLeft <= 30).length}
          </span>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex flex-col justify-center items-center text-center">
          <span className="text-yellow-700 font-bold mb-1 text-sm flex items-center gap-1">
            أقل من 90 يوم
          </span>
          <span className="text-3xl font-black text-yellow-700">
            {data.filter((d) => d.daysLeft > 30 && d.daysLeft <= 90).length}
          </span>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col justify-center items-center text-center">
          <span className="text-green-700 font-bold mb-1 text-sm flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> آمن (&gt; 90 يوم)
          </span>
          <span className="text-3xl font-black text-green-700">
            {data.filter((d) => d.daysLeft > 90).length}
          </span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" /> تقرير انتهاء الصلاحية
            (Expiry Watch)
          </h3>
          <input
            type="text"
            placeholder="بحث..."
            className="border border-slate-200 rounded-lg px-3 py-1 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">الكود</th>
                <th className="p-3 w-1/4">الاسم</th>
                <th className="p-3">النوع</th>
                <th className="p-3">الدفعة</th>
                <th className="p-3 text-center">الكمية</th>
                <th className="p-3">الموقع</th>
                <th className="p-3 font-bold">تاريخ الانتهاء</th>
                <th className="p-3 text-center">الأيام المتبقية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((d, i) => {
                let badge = "bg-green-100 text-green-700";
                if (d.daysLeft < 0) badge = "bg-red-100 text-red-700 font-bold";
                else if (d.daysLeft <= 30)
                  badge = "bg-orange-100 text-orange-700";
                else if (d.daysLeft <= 90)
                  badge = "bg-yellow-100 text-yellow-700";

                return (
                  <tr
                    key={i}
                    className={
                      "hover:bg-slate-50 " + (d.daysLeft < 0 ? "bg-red-50" : "")
                    }
                  >
                    <td className="p-3 font-mono font-semibold">{d.code}</td>
                    <td className="p-3 font-bold text-slate-700">{d.name}</td>
                    <td className="p-3 text-slate-500">{d.type}</td>
                    <td className="p-3 font-mono">{d.batch}</td>
                    <td className="p-3 text-center font-bold">{d.qty}</td>
                    <td className="p-3 max-w-[150px] truncate">{d.location}</td>
                    <td className="p-3 font-mono font-bold">{d.expiry}</td>
                    <td className="p-3 text-center">
                      <span className={"px-2 py-1 rounded text-xs " + badge}>
                        {d.daysLeft < 0 ? "منتهي" : d.daysLeft + " يوم"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-slate-400">
                    لا توجد مواد للعرض
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
