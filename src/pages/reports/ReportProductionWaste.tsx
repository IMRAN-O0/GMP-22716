import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Trash2 } from "lucide-react";

export default function ReportProductionWaste() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/reports/prd/all", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((records) => {
        const actuals = records.filter((r: any) => r.form_id === "F-PRD-002");
        const mapped = actuals
          .map((a: any) => ({
            batch: a.data.batchNumber,
            product: a.data.productName,
            produced: Number(a.data.actualProducedQty) || 0,
            waste: Number(a.data.wasteAmount) || 0,
            reason: a.data.wasteReason || "غير محدد",
          }))
          .filter((d: any) => d.waste > 0);

        setData(mapped);
      })
      .catch((err) => console.error(err));
  }, []);

  // Aggregate by reason for Pareto chart
  const reasonMap = data.reduce(
    (acc, curr) => {
      acc[curr.reason] = (acc[curr.reason] || 0) + curr.waste;
      return acc;
    },
    {} as Record<string, number>,
  );

  const chartData = Object.keys(reasonMap)
    .map((key) => ({ name: key, الكمية: reasonMap[key] }))
    .sort((a, b) => b["الكمية"] - a["الكمية"]); // descending

  const totalWaste = data.reduce((acc, curr) => acc + curr.waste, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            أسباب الفاقد (تحليل باريتو)
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
                <Bar dataKey="الكمية" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? "#ef4444" : "#f87171"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6 text-center">
            إجمالي الفاقد الكلي
          </h3>
          <div className="flex flex-col items-center justify-center h-[250px]">
            <div className="w-32 h-32 rounded-full border-8 border-red-100 flex items-center justify-center mb-4">
              <span className="text-3xl font-black text-red-600">
                {totalWaste}
              </span>
            </div>
            <span className="text-slate-500">كجم / وحدة</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800">تفاصيل الفاقد لكل تشغيلة</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold text-slate-600">
                  رقم التشغيلة
                </th>
                <th className="p-4 font-semibold text-slate-600">المنتج</th>
                <th className="p-4 font-semibold text-slate-600">
                  الكمية المنتجة
                </th>
                <th className="p-4 font-semibold text-slate-600">
                  الفاقد (كمية)
                </th>
                <th className="p-4 font-semibold text-slate-600">
                  نسبة الفاقد %
                </th>
                <th className="p-4 font-semibold text-slate-600">السبب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item, index) => {
                const percentage = item.produced
                  ? ((item.waste / item.produced) * 100).toFixed(2)
                  : 0;
                return (
                  <tr
                    key={index}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 font-mono font-medium text-slate-700">
                      {item.batch}
                    </td>
                    <td className="p-4 text-slate-700">{item.product}</td>
                    <td className="p-4 text-slate-700">{item.produced}</td>
                    <td className="p-4 font-bold text-red-600">{item.waste}</td>
                    <td className="p-4 text-slate-600">{percentage}%</td>
                    <td className="p-4 text-slate-700">{item.reason}</td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    لا توجد بيانات فاقد
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
