import React, { useEffect, useState } from "react";
import { Activity, Search } from "lucide-react";
import { getAuthHeaders } from "../../lib/utils";

export default function ReportRiskRegister() {
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("ALL");

  useEffect(() => {
    fetch("/api/reports/qm/all", {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((records) => {
        const risks = records.filter((r: any) => r.form_id === "F-QM-002");
        const mapped: any[] = [];
        risks.forEach((r: any) => {
          if (r.data.risks && Array.isArray(r.data.risks)) {
            r.data.risks.forEach((risk: any) => {
              mapped.push({
                date: new Date(r.created_at).toLocaleDateString("ar-EG"),
                dept: r.data.department || "---",
                desc: risk.description || "---",
                probability: Number(risk.probability) || 0,
                severity: Number(risk.severity) || 0,
                score:
                  (Number(risk.probability) || 0) *
                  (Number(risk.severity) || 0),
                riskLevel: risk.riskLevel || "Low",
                control: risk.currentControl || "---",
                mitigation: risk.mitigationPlan || "---",
              });
            });
          }
        });
        setData(mapped);
      })
      .catch(console.error);
  }, []);

  const filteredData = data.filter(
    (d) =>
      (filterLevel === "ALL" || (filterLevel === "HIGH" && d.score >= 15)) &&
      (d.desc.includes(searchTerm) || d.dept.includes(searchTerm)),
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-500" /> سجل تقييم المخاطر
            (Risk Register)
          </h3>
          <div className="flex gap-2 text-sm">
            <select
              className="border border-slate-200 rounded-lg px-3 py-1"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
            >
              <option value="ALL">الكل</option>
              <option value="HIGH">المخاطر العالية فقط</option>
            </select>
            <input
              type="text"
              placeholder="بحث..."
              className="border border-slate-200 rounded-lg px-3 py-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">تاريخ</th>
                <th className="p-3">القسم</th>
                <th className="p-3 w-1/4">الخطر</th>
                <th className="p-3 text-center">P × S</th>
                <th className="p-3 text-center">الدرجة</th>
                <th className="p-3">الضابط التخفيفي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((d, i) => {
                let levelBadge = "bg-yellow-100 text-yellow-700";
                if (d.score >= 15) levelBadge = "bg-red-100 text-red-700";
                if (d.score <= 5)
                  levelBadge = "bg-emerald-100 text-emerald-700";

                return (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-500">{d.date}</td>
                    <td className="p-3">{d.dept}</td>
                    <td className="p-3 text-slate-700 font-semibold">
                      {d.desc}
                    </td>
                    <td className="p-3 text-center font-mono">
                      {d.probability} × {d.severity}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={
                          "px-2 py-1 rounded text-xs font-bold " + levelBadge
                        }
                      >
                        {d.score} ({d.riskLevel})
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{d.mitigation}</td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
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
