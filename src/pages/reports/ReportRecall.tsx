import React, { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { getAuthHeaders } from "../../lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";

export default function ReportRecall() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/reports/qm/all", {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((records) => {
        const recalls = records.filter(
          (r: any) => r.form_id === "F-RCL-001" || r.form_id === "F-RCL-001",
        );
        const mapped = recalls.map((r: any) => {
          const affected = Number(r.data.affectedQuantity) || 0;
          const recovered = Number(r.data.recoveredQuantity) || 0;
          const rate =
            affected > 0 ? ((recovered / affected) * 100).toFixed(1) : 0;
          return {
            recallNo: r.data.recallNo || r.record_id,
            date: new Date(r.created_at).toLocaleDateString("ar-EG"),
            product: r.data.productName || "غير محدد",
            batch: r.data.batchNumber || "---",
            affected,
            recovered,
            rate,
            reason: r.data.reason || "---",
            status: r.status === "approved" ? "مغلق" : "قيد الاسترداد",
          };
        });
        setData(mapped);
      })
      .catch(console.error);
  }, []);

  const totalAffected = data.reduce((sum, d) => sum + d.affected, 0);
  const totalRecovered = data.reduce((sum, d) => sum + d.recovered, 0);
  const globalRecallRate =
    totalAffected > 0
      ? ((totalRecovered / totalAffected) * 100).toFixed(1)
      : "0";

  const pieData = [
    { name: "كمية مستردة", value: totalRecovered },
    {
      name: "كمية مفقودة / بالسوق",
      value: Math.max(0, totalAffected - totalRecovered),
    },
  ];
  const COLORS = ["#22c55e", "#ef4444"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex flex-col justify-center items-center text-center">
          <span className="text-red-700 font-bold mb-2 text-sm">
            معدل الاسترداد الكلي
          </span>
          <span className="text-4xl font-black text-red-700">
            {globalRecallRate}%
          </span>
          <div className="w-full bg-slate-200 rounded-full h-2 mt-4">
            <div
              className="bg-red-600 h-2 rounded-full"
              style={{ width: globalRecallRate + "%" }}
            ></div>
          </div>
        </div>
        <div
          className="bg-white p-4 rounded-2xl border border-slate-200 col-span-1 md:col-span-2 flex items-center justify-center"
          style={{ height: 200 }}
        >
          {totalAffected > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={"cell-" + index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400">لا تتوفر استدعاءات حالياً</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
          <ShieldAlert className="w-5 h-5 text-red-600" /> سجل استدعاء المنتجات
          (Product Recalls)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">رقم الاستدعاء</th>
                <th className="p-3">تاريخ</th>
                <th className="p-3">المنتج</th>
                <th className="p-3">رقم الدفعة</th>
                <th className="p-3">الكمية المتأثرة</th>
                <th className="p-3">مستردة</th>
                <th className="p-3">معدل (%)</th>
                <th className="p-3">السبب</th>
                <th className="p-3">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((d, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-semibold">{d.recallNo}</td>
                  <td className="p-3">{d.date}</td>
                  <td className="p-3 max-w-[150px] truncate">{d.product}</td>
                  <td className="p-3 font-mono">{d.batch}</td>
                  <td className="p-3 text-red-600 font-bold">{d.affected}</td>
                  <td className="p-3 text-green-600 font-bold">
                    {d.recovered}
                  </td>
                  <td className="p-3 font-bold">{d.rate}%</td>
                  <td className="p-3 truncate max-w-[150px]">{d.reason}</td>
                  <td className="p-3">
                    <span
                      className={
                        "px-2 py-1 rounded text-xs font-bold " +
                        (d.status === "مغلق"
                          ? "bg-slate-100 text-slate-700"
                          : "bg-red-100 text-red-700")
                      }
                    >
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-slate-400">
                    لا توجد بيانات استدعاء
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
