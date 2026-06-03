import React, { useEffect, useState } from "react";
import { FileWarning, Search } from "lucide-react";
import { getAuthHeaders } from "../../lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";

export default function ReportCAPA() {
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/reports/qm/all", {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((records) => {
        const capas = records.filter((r: any) => r.form_id === "F-QM-006");
        const mapped = capas.map((r: any) => {
          const targetRaw =
            r.data.targetCompletionDate || r.data.targetDate || "";
          const isClosed =
            r.status === "approved" || r.data.status === "Closed";
          let isDelayed = false;
          if (targetRaw && !isClosed) {
            const targetDate = new Date(targetRaw);
            if (targetDate < new Date()) isDelayed = true;
          }
          return {
            capaNo: r.data.capaNo || r.record_id,
            refDoc: r.data.referenceDoc || r.data.ncrNo || "---",
            rcaMethod: r.data.rcaMethod || "---",
            owner: r.data.actionOwner || r.data.responsible || "غير محدد",
            targetDate: targetRaw,
            status: isClosed
              ? "Closed"
              : r.status === "draft"
                ? "Open"
                : "In Progress",
            isDelayed,
          };
        });
        setData(mapped);
      })
      .catch(console.error);
  }, []);

  const filteredData = data.filter(
    (d) => d.capaNo.includes(searchTerm) || d.refDoc.includes(searchTerm),
  );

  const delayedCount = data.filter((d) => d.isDelayed).length;

  const statusGroups = data.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.keys(statusGroups).map((k) => ({
    name: k,
    value: statusGroups[k],
  }));
  const COLORS = ["#eab308", "#3b82f6", "#22c55e"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 flex flex-col justify-center items-center text-center">
          <span className="text-orange-600 font-bold mb-2">CAPA متأخرة</span>
          <span className="text-4xl font-black text-orange-700">
            {delayedCount}
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
            <p className="text-slate-400">لا تتوفر بيانات</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FileWarning className="w-5 h-5 text-orange-500" /> الإجراءات
            التصحيحية والوقائية
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
                <th className="p-3">رقم CAPA</th>
                <th className="p-3">المستند المرجعي</th>
                <th className="p-3">طريقة RCA</th>
                <th className="p-3">المسؤول</th>
                <th className="p-3">تاريخ مستهدف</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">ملاحظة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((d, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-slate-700">{d.capaNo}</td>
                  <td className="p-3 text-slate-700 font-mono">{d.refDoc}</td>
                  <td className="p-3">{d.rcaMethod}</td>
                  <td className="p-3">{d.owner}</td>
                  <td className="p-3">{d.targetDate}</td>
                  <td className="p-3">
                    <span
                      className={
                        "px-2 py-1 rounded text-xs font-bold " +
                        (d.status === "Closed"
                          ? "bg-green-100 text-green-700"
                          : d.status === "In Progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700")
                      }
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {d.isDelayed && (
                      <span className="text-red-600 font-bold text-xs">
                        تأخير!
                      </span>
                    )}
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
