import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Activity, AlertOctagon } from "lucide-react";
import { getAuthHeaders } from "../../lib/utils";

export default function ReportProcessMonitoring() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/reports/prd/all", {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((records) => {
        const monitoringForms = records.filter(
          (r: any) => r.form_id === "F-PRD-004",
        );
        const allReadings: any[] = [];

        monitoringForms.forEach((form: any) => {
          if (form.data.readings && Array.isArray(form.data.readings)) {
            form.data.readings.forEach((reading: any) => {
              allReadings.push({
                batch: form.data.batchNumber,
                stage: form.data.productionStage,
                time: reading.time,
                parameter: reading.parameter,
                target:
                  Number(reading.requiredValue) ||
                  Number(reading.targetValue) ||
                  0,
                actual: Number(reading.actualValue) || 0,
                withinLimits: reading.withinLimits,
                action: reading.correctiveAction,
              });
            });
          }
        });

        setData(allReadings);
      })
      .catch((err) => console.error(err));
  }, []);

  const outOfLimitCount = data.filter(
    (d) => !d.withinLimits && String(d.withinLimits) !== "true",
  ).length;
  const tempReadings = data.filter(
    (d) => d.parameter === "درجة الحرارة" || d.parameter === "Temperature",
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-500" />
            تتبع درجات الحرارة
          </h3>
          <div className="h-[300px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tempReadings}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis dataKey="time" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip
                  cursor={{
                    stroke: "#cbd5e1",
                    strokeWidth: 1,
                    strokeDasharray: "3 3",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  name="الفعلي"
                  dataKey="actual"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  name="المطلوب"
                  dataKey="target"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6 text-center text-red-600 flex justify-center items-center gap-2">
            <AlertOctagon className="w-5 h-5" />
            تجاوزات الحدود
          </h3>
          <div className="flex flex-col items-center justify-center h-[200px]">
            <span className="text-6xl font-black text-red-500 mb-2">
              {outOfLimitCount}
            </span>
            <span className="text-slate-500 font-medium text-center">
              حالة تجاوز مسجلة
              <br />
              في جميع التشغيلات
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">
            تفاصيل القراءات الخارجة عن الحدود
          </h3>
          <span className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full font-bold">
            تنبيهات فقط
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold text-slate-600">رقم الدفعة</th>
                <th className="p-4 font-semibold text-slate-600">المرحلة</th>
                <th className="p-4 font-semibold text-slate-600">الوقت</th>
                <th className="p-4 font-semibold text-slate-600">المعامل</th>
                <th className="p-4 font-semibold text-slate-600">المطلوب</th>
                <th className="p-4 font-semibold text-slate-600">الفعلي</th>
                <th className="p-4 font-semibold text-slate-600">
                  الإجراء التصحيحي
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data
                .filter(
                  (d) => !d.withinLimits && String(d.withinLimits) !== "true",
                )
                .map((item, index) => (
                  <tr key={index} className="hover:bg-red-50 transition-colors">
                    <td className="p-4 font-mono font-medium text-slate-700">
                      {item.batch}
                    </td>
                    <td className="p-4 text-slate-700">{item.stage}</td>
                    <td className="p-4 font-mono text-slate-500 text-sm">
                      {item.time}
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {item.parameter}
                    </td>
                    <td className="p-4 text-slate-600">{item.target}</td>
                    <td className="p-4 font-bold text-red-600">
                      {item.actual}
                    </td>
                    <td className="p-4 text-red-700 text-sm whitespace-pre-wrap">
                      {item.action || "لم يتم اتخاذ إجراء"}
                    </td>
                  </tr>
                ))}
              {outOfLimitCount === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-green-600 font-bold bg-green-50"
                  >
                    لا توجد أي قراءات خارجة عن الحدود
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
