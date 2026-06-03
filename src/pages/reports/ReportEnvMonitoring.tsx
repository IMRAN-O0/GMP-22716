import React, { useEffect, useState } from "react";
import { Thermometer } from "lucide-react";
import { getAuthHeaders } from "../../lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export default function ReportEnvMonitoring() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/reports/qm/all", {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((records) => {
        const envs = records.filter((r: any) => r.form_id === "F-PRM-002");
        let mapped: any[] = [];
        envs.forEach((r: any) => {
          if (r.data.readings && Array.isArray(r.data.readings)) {
            r.data.readings.forEach((reading: any) => {
              mapped.push({
                date:
                  r.data.date ||
                  new Date(r.created_at).toLocaleDateString("ar-CA"),
                time: reading.time || "00:00",
                area: r.data.area || r.data.zone || "الإنتاج",
                temp: Number(reading.temperature || reading.temp) || 0,
                humidity: Number(reading.humidity) || 0,
                status:
                  reading.withinLimits === "لا" ? "خارج الحدود" : "ضمن الحدود",
                recorder: r.data.observerName || "---",
              });
            });
          }
        });
        // sort by date and time
        mapped.sort((a, b) =>
          (a.date + " " + a.time).localeCompare(b.date + " " + b.time),
        );
        setData(mapped);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6"
        style={{ height: 350 }}
      >
        <h3 className="font-bold text-slate-800 mb-4">
          تذبذب الحرارة والرطوبة
        </h3>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                vertical={false}
              />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
              <YAxis yAxisId="left" stroke="#ef4444" fontSize={12} />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#3b82f6"
                fontSize={12}
              />
              <RechartsTooltip />
              <Legend />
              <ReferenceLine
                yAxisId="left"
                y={25}
                stroke="red"
                strokeDasharray="3 3"
                label="الحد الأقصى للحرارة"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="temp"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="humidity"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            لا تتوفر بيانات لعرض الرسم البياني
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Thermometer className="w-5 h-5 text-sky-500" /> قراءات البيئة (حرارة
          / رطوبة)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">التاريخ والغرفة</th>
                <th className="p-3">الوقت</th>
                <th className="p-3 text-center">الحرارة (°C)</th>
                <th className="p-3 text-center">الرطوبة (%)</th>
                <th className="p-3 text-center">الحالة</th>
                <th className="p-3">المسؤول</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((d, i) => (
                <tr
                  key={i}
                  className={
                    "hover:bg-slate-50 " +
                    (d.status === "خارج الحدود" ? "bg-red-50" : "")
                  }
                >
                  <td className="p-3 font-semibold text-slate-700">
                    {d.date} | {d.area}
                  </td>
                  <td className="p-3 font-mono">{d.time}</td>
                  <td
                    className={
                      "p-3 text-center font-bold text-lg " +
                      (d.temp > 25 ? "text-red-600" : "text-slate-700")
                    }
                  >
                    {d.temp}
                  </td>
                  <td
                    className={
                      "p-3 text-center font-bold text-lg " +
                      (d.humidity > 60 ? "text-blue-600" : "text-slate-700")
                    }
                  >
                    {d.humidity}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={
                        "px-2 py-1 rounded text-xs font-bold " +
                        (d.status === "ضمن الحدود"
                          ? "text-green-700 bg-green-100"
                          : "text-red-700 bg-red-100")
                      }
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{d.recorder}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-400">
                    لا توجد بيانات
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
