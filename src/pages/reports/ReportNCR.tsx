import React, { useEffect, useState } from "react";
import { AlertCircle, Search } from "lucide-react";
import { getAuthHeaders } from "../../lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";

export default function ReportNCR() {
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/reports/qm/all", {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((records) => {
        const ncrs = records.filter((r: any) => r.form_id === "F-QM-005");
        const mapped = ncrs.map((r: any) => ({
          ncrNo: r.data.ncrNo || r.record_id,
          date: new Date(r.created_at).toLocaleDateString("ar-EG"),
          source: r.data.source || "غير محدد",
          product: r.data.productName || r.data.materialName || "غير محدد",
          batch: r.data.batchNumber || "---",
          qty: r.data.affectedQuantity || 0,
          investigation: r.data.requiresInvestigation ? "نعم" : "لا",
          capaOpened: r.data.capaOpened ? "نعم" : "لا",
          status: r.status === "approved" ? "Closed" : "Open",
        }));
        setData(mapped);
      })
      .catch(console.error);
  }, []);

  const filteredData = data.filter(
    (d) => d.ncrNo.includes(searchTerm) || d.product.includes(searchTerm),
  );

  const closedCount = data.filter((d) => d.status === "Closed").length;
  const closureRate =
    data.length > 0 ? ((closedCount / data.length) * 100).toFixed(1) : "0";

  const sourceGroups = data.reduce((acc, curr) => {
    acc[curr.source] = (acc[curr.source] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.keys(sourceGroups).map((k) => ({
    name: k,
    value: sourceGroups[k],
  }));
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#a855f7"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex flex-col justify-center items-center text-center">
          <span className="text-red-600 font-bold mb-2">معدل إغلاق NCR</span>
          <span className="text-4xl font-black text-red-700">
            {closureRate}%
          </span>
        </div>
        <div
          className="bg-white p-4 rounded-2xl border border-slate-200 col-span-1 md:col-span-2 flex items-center justify-center"
          style={{ height: 200 }}
        >
          {data.length > 0 ? (
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
            <p className="text-slate-400">لا تتوفر بيانات لعرض الرسم البياني</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" /> حالات عدم المطابقة
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
                <th className="p-3">رقم NCR</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">المصدر</th>
                <th className="p-3">المنتج/المادة</th>
                <th className="p-3">الكمية</th>
                <th className="p-3">CAPA؟</th>
                <th className="p-3">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((d, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-slate-700">{d.ncrNo}</td>
                  <td className="p-3">{d.date}</td>
                  <td className="p-3">{d.source}</td>
                  <td className="p-3 truncate max-w-[150px]">{d.product}</td>
                  <td className="p-3">{d.qty}</td>
                  <td className="p-3">{d.capaOpened}</td>
                  <td className="p-3">
                    <span
                      className={
                        "px-2 py-1 rounded text-xs font-bold " +
                        (d.status === "Closed"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700")
                      }
                    >
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-400">
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
