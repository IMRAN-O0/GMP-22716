import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Users, Clock } from "lucide-react";

export default function ReportLaborEfficiency() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/reports/prd/all", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((records) => {
        const actuals = records.filter((r: any) => r.form_id === "F-PRD-002");
        const mapped = actuals.map((a: any) => {
          const start = new Date(a.data.actualStartDateTime);
          const end = new Date(a.data.actualEndDateTime);

          let durationHours = 0;
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            durationHours =
              (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          }
          if (durationHours < 0) durationHours = 0;

          const workersCount = Array.isArray(a.data.workers)
            ? a.data.workers.length
            : 0;
          const produced = Number(a.data.actualProducedQty) || 0;

          const qtyPerHour = durationHours > 0 ? produced / durationHours : 0;
          const qtyPerWorker = workersCount > 0 ? produced / workersCount : 0;

          return {
            batch: a.data.batchNumber,
            product: a.data.productName,
            workersCount,
            duration: Number(durationHours.toFixed(2)),
            produced,
            qtyPerHour: Number(qtyPerHour.toFixed(2)),
            qtyPerWorker: Number(qtyPerWorker.toFixed(2)),
          };
        });

        setData(mapped);
      })
      .catch((err) => console.error(err));
  }, []);

  const totalHours = data
    .reduce((sum, item) => sum + item.duration, 0)
    .toFixed(1);
  const avgQtyPerHour =
    data.length > 0
      ? (
          data.reduce((sum, item) => sum + item.qtyPerHour, 0) / data.length
        ).toFixed(1)
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            الإنتاجية مقابل المدة الزمنية
          </h3>
          <div className="h-[300px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis dataKey="batch" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: "#F1F5F9" }} />
                <Legend />
                <Bar
                  name="مدة الإنتاج (ساعات)"
                  dataKey="duration"
                  fill="#F59E0B"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  name="الإنتاجية في الساعة"
                  dataKey="qtyPerHour"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            مؤشرات الكفاءة
          </h3>
          <div className="flex flex-col justify-center h-[280px] gap-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <span className="block text-slate-500 mb-1">
                إجمالي ساعات العمل
              </span>
              <span className="text-3xl font-bold text-slate-800">
                {totalHours}
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <span className="block text-slate-500 mb-1">
                متوسط إنتاجية الساعة
              </span>
              <span className="text-3xl font-bold text-emerald-600">
                {avgQtyPerHour}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800">
            تفاصيل كفاءة العمالة بكل تشغيلة
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold text-slate-600">
                  رقم التشغيلة
                </th>
                <th className="p-4 font-semibold text-slate-600">المنتج</th>
                <th className="p-4 font-semibold text-slate-600 text-center">
                  المدة (ساعات)
                </th>
                <th className="p-4 font-semibold text-slate-600 text-center">
                  عدد العمال
                </th>
                <th className="p-4 font-semibold text-slate-600 text-center">
                  الكمية المنتجة
                </th>
                <th className="p-4 font-semibold text-slate-600 text-center">
                  الإنتاج / ساعة
                </th>
                <th className="p-4 font-semibold text-slate-600 text-center">
                  الإنتاج / عامل
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono font-medium text-slate-700">
                    {item.batch}
                  </td>
                  <td className="p-4 text-slate-700">{item.product}</td>
                  <td className="p-4 text-center font-bold text-amber-600">
                    {item.duration}
                  </td>
                  <td className="p-4 text-center text-slate-800">
                    {item.workersCount}
                  </td>
                  <td className="p-4 text-center text-slate-700">
                    {item.produced}
                  </td>
                  <td className="p-4 text-center font-bold text-emerald-600">
                    {item.qtyPerHour}
                  </td>
                  <td className="p-4 text-center text-sky-600 font-medium">
                    {item.qtyPerWorker}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
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
