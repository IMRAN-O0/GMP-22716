import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Pie,
  Legend,
  PieChart as RechartsPieChart,
} from "recharts";
import { RefreshCcw, Trash2, PieChart } from "lucide-react";
import { getAuthHeaders } from "../../lib/utils";

export default function ReportReturns() {
  const [returns, setReturns] = useState<any[]>([]);
  const [disposals, setDisposals] = useState<any[]>([]);
  const [totalShipmentsQuantity, setTotalShipmentsQuantity] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/reports/inv/returns-disposals", {
        headers: getAuthHeaders(),
      }).then((res) => res.json()),
      fetch("/api/reports/inv/shipments", {
        headers: getAuthHeaders(),
      }).then((res) => res.json()),
    ])
      .then(([retDispData, shipmentsData]) => {
        const rets: any[] = [];
        const disps: any[] = [];

        retDispData.forEach((record: any) => {
          const fd = record.data;
          if (record.form_id === "F-FP-004") {
            rets.push({
              id: record.record_id,
              date: fd.date,
              customerName: fd.customerName || "N/A",
              batchNumber: fd.batchNumber || "N/A",
              quantity: Number(fd.quantity || 0),
              reason: fd.reason || "-",
              condition: fd.condition || "-",
              actionTaken: fd.actionTaken || "-",
            });
          } else if (record.form_id === "F-FP-005") {
            disps.push({
              id: record.record_id,
              date: fd.date,
              type: fd.type || "منتج",
              quantity: Number(fd.quantity || 0),
              reason: fd.reason || "-",
              method: fd.method || "-",
            });
          }
        });

        const totalShipQ = shipmentsData.reduce(
          (acc: number, curr: any) => acc + Number(curr.data.quantity || 0),
          0,
        );

        setReturns(rets);
        setDisposals(disps);
        setTotalShipmentsQuantity(totalShipQ);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalReturnQ = returns.reduce((acc, curr) => acc + curr.quantity, 0);
  const returnRatio =
    totalShipmentsQuantity > 0
      ? ((totalReturnQ / totalShipmentsQuantity) * 100).toFixed(2)
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-xl">
            <RefreshCcw className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">
              الكميات المرتجعة
            </p>
            <p className="text-3xl font-bold text-slate-900">{totalReturnQ}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-xl">
            <Trash2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">
              الكميات المتلفة
            </p>
            <p className="text-3xl font-bold text-slate-900">
              {disposals.reduce((acc, curr) => acc + curr.quantity, 0)}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <PieChart className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">
              نسبة المرتجعات للشحنات
            </p>
            <p className="text-3xl font-bold text-slate-900">{returnRatio}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <RefreshCcw className="w-5 h-5 text-orange-500" />
            سجل المرتجعات (F-FP-004)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold">رقم الإرجاع</th>
                <th className="p-4 font-semibold">التاريخ</th>
                <th className="p-4 font-semibold">العميل</th>
                <th className="p-4 font-semibold">الدفعة</th>
                <th className="p-4 font-semibold">الكمية</th>
                <th className="p-4 font-semibold">السبب</th>
                <th className="p-4 font-semibold">الحالة</th>
                <th className="p-4 font-semibold">الإجراء المتخذ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-slate-500">
                    جاري التحميل...
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-slate-500">
                    لا توجد مرتجعات
                  </td>
                </tr>
              ) : (
                returns.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 font-mono text-sm font-bold text-orange-600">
                      {r.id}
                    </td>
                    <td className="p-4 text-slate-600 text-sm">{r.date}</td>
                    <td className="p-4 font-semibold text-slate-900">
                      {r.customerName}
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500">
                      {r.batchNumber}
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {r.quantity}
                    </td>
                    <td className="p-4 text-slate-600">{r.reason}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${r.condition === "تالف" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}
                      >
                        {r.condition}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 text-sm">
                      {r.actionTaken}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-500" />
            سجل الإتلاف (F-FP-005)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold">رقم الإتلاف</th>
                <th className="p-4 font-semibold">التاريخ</th>
                <th className="p-4 font-semibold">النوع</th>
                <th className="p-4 font-semibold">الكمية</th>
                <th className="p-4 font-semibold">السبب</th>
                <th className="p-4 font-semibold">طريقة الإتلاف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">
                    جاري التحميل...
                  </td>
                </tr>
              ) : disposals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">
                    لا توجد عمليات إتلاف
                  </td>
                </tr>
              ) : (
                disposals.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 font-mono text-sm font-bold text-rose-600">
                      {d.id}
                    </td>
                    <td className="p-4 text-slate-600 text-sm">{d.date}</td>
                    <td className="p-4 font-semibold text-slate-900">
                      {d.type}
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {d.quantity}
                    </td>
                    <td className="p-4 text-slate-600">{d.reason}</td>
                    <td className="p-4 text-slate-600 text-sm">{d.method}</td>
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
