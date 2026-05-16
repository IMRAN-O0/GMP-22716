import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ClipboardList } from "lucide-react";

export default function ReportProductionOrders() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/reports/prd/all", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((records) => {
        // Group F-PRD-001 (plan) and F-PRD-002 (actual)
        const planned = records.filter((r: any) => r.form_id === "F-PRD-001");
        const actuals = records.filter((r: any) => r.form_id === "F-PRD-002");

        const combined = planned.map((p: any) => {
          const actual = actuals.find(
            (a: any) => a.data.productionOrderNo === p.data.productionOrderNo,
          );
          const plannedQty = Number(p.data.requiredBatchSize) || 0;
          const actualQty = actual
            ? Number(actual.data.actualProducedQty) || 0
            : 0;
          const completionRate = plannedQty
            ? Math.round((actualQty / plannedQty) * 100)
            : 0;

          return {
            orderNo: p.data.productionOrderNo,
            product: p.data.productName,
            batch: p.data.batchNumber,
            plannedQty,
            actualQty,
            completionRate,
            waste: actual ? Number(actual.data.wasteAmount) || 0 : 0,
            supervisor: actual ? actual.data.supervisorName : "-",
            status: actual ? "مكتمل" : "قيد التنفيذ",
          };
        });

        setData(combined);
      })
      .catch((err) => console.error(err));
  }, []);

  const chartData = data.map((d) => ({
    name: d.orderNo,
    المخطط: d.plannedQty,
    الفعلي: d.actualQty,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-500" />
            مقارنة الكميات (المخطط مقابل الفعلي)
          </h3>
          <div className="h-[300px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: "#F1F5F9" }} />
                <Legend />
                <Bar dataKey="المخطط" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="الفعلي" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-500" />
            ملخص الأوامر
          </h3>
          <div className="flex flex-col justify-center h-[300px] gap-6">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center">
              <span className="block text-slate-500 mb-2">
                إجمالي الأوامر المكتملة
              </span>
              <span className="text-4xl font-bold text-slate-800">
                {data.filter((d) => d.status === "مكتمل").length}
              </span>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center">
              <span className="block text-slate-500 mb-2">
                متوسط نسبة الإنجاز
              </span>
              <span className="text-4xl font-bold text-indigo-600">
                {data.length
                  ? Math.round(
                      data.reduce((acc, curr) => acc + curr.completionRate, 0) /
                        data.length,
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800">سجل أوامر الإنتاج</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold text-slate-600">رقم الأمر</th>
                <th className="p-4 font-semibold text-slate-600">المنتج</th>
                <th className="p-4 font-semibold text-slate-600">
                  رقم التشغيلة
                </th>
                <th className="p-4 font-semibold text-slate-600">
                  الكمية المخططة
                </th>
                <th className="p-4 font-semibold text-slate-600">
                  الكمية الفعلية
                </th>
                <th className="p-4 font-semibold text-slate-600">
                  نسبة الإنجاز
                </th>
                <th className="p-4 font-semibold text-slate-600">الفاقد</th>
                <th className="p-4 font-semibold text-slate-600">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono font-medium text-slate-700">
                    {item.orderNo}
                  </td>
                  <td className="p-4 text-slate-700">{item.product}</td>
                  <td className="p-4 font-mono text-slate-500 text-sm">
                    {item.batch}
                  </td>
                  <td className="p-4 text-slate-700">{item.plannedQty}</td>
                  <td className="p-4 text-slate-700">{item.actualQty}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${item.completionRate >= 100 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      {item.completionRate}%
                    </span>
                  </td>
                  <td className="p-4 text-red-600 font-medium">{item.waste}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === "مكتمل" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-700"}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    لا توجد بيانات متاحة
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
