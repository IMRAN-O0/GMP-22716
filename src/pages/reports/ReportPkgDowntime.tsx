import { useEffect, useState } from "react";
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
import { Clock } from "lucide-react";
import { getAuthHeaders } from "../../lib/utils";

// Downtime is recorded in F-FIL-006 (filling line stops) in the `stops` table.
interface StopRow {
  batch: string;
  startTime: string;
  endTime: string;
  type: string;
  reason: string;
  action: string;
  partsReplaced: string;
}

export default function ReportPkgDowntime() {
  const [rows, setRows] = useState<StopRow[]>([]);

  useEffect(() => {
    fetch("/api/reports/all", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((records: any[]) => {
        if (!Array.isArray(records)) return;
        const out: StopRow[] = [];
        records
          .filter((r) => r.form_id === "F-FIL-006")
          .forEach((rec) => {
            const stops = Array.isArray(rec.data?.stops) ? rec.data.stops : [];
            stops.forEach((s: any) => {
              out.push({
                batch: rec.data?.batchNumber || "—",
                startTime: s.startTime || "",
                endTime: s.endTime || "",
                type: s.type || "غير محدد",
                reason: s.reason || "غير محدد",
                action: s.action || "—",
                partsReplaced: s.partsReplaced || "—",
              });
            });
          });
        setRows(out);
      })
      .catch(console.error);
  }, []);

  // Aggregate stop count by reason (Pareto-style).
  const reasonMap = rows.reduce(
    (acc, r) => {
      acc[r.reason] = (acc[r.reason] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const chartData = Object.keys(reasonMap)
    .map((k) => ({ name: k, "عدد التوقفات": reasonMap[k] }))
    .sort((a, b) => b["عدد التوقفات"] - a["عدد التوقفات"]);

  const planned = rows.filter((r) => r.type.includes("مخطط") && !r.type.includes("غير")).length;
  const unplanned = rows.length - planned;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-500" /> أسباب التوقفات (الأكثر تكراراً)
          </h3>
          <div className="h-[300px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <RechartsTooltip cursor={{ fill: "#F1F5F9" }} />
                <Bar dataKey="عدد التوقفات" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#0ea5e9" : "#7dd3fc"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center gap-6">
          <div className="text-center">
            <div className="text-sm text-slate-500 mb-1">توقفات مخطّطة</div>
            <div className="text-3xl font-black text-emerald-600">{planned}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-500 mb-1">توقفات غير مخطّطة</div>
            <div className="text-3xl font-black text-rose-600">{unplanned}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800">تفاصيل التوقفات والأعطال</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-3 font-semibold">التشغيلة</th>
                <th className="p-3 font-semibold">من</th>
                <th className="p-3 font-semibold">إلى</th>
                <th className="p-3 font-semibold">النوع</th>
                <th className="p-3 font-semibold">السبب</th>
                <th className="p-3 font-semibold">الإجراء</th>
                <th className="p-3 font-semibold">القطع المستبدلة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-slate-700">{r.batch}</td>
                  <td className="p-3 text-slate-600">{r.startTime || "—"}</td>
                  <td className="p-3 text-slate-600">{r.endTime || "—"}</td>
                  <td className="p-3 text-slate-700">{r.type}</td>
                  <td className="p-3 text-slate-700">{r.reason}</td>
                  <td className="p-3 text-slate-600">{r.action}</td>
                  <td className="p-3 text-slate-600">{r.partsReplaced}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">لا توجد توقفات مسجّلة.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
