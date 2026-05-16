import React, { useEffect, useState } from "react";
import { Wrench } from "lucide-react";

export default function ReportMaintenance() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/reports/qm/all", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((records) => {
        // Form MNT-001 (صيانة المعاملات)
        const mnts = records.filter((r: any) => r.form_id === "F-MNT-001");
        const mapped = mnts.map((r: any) => ({
          equipId: r.data.equipmentId || r.data.machineId || "---",
          equipName: r.data.equipmentName || r.data.machineName || "---",
          date: new Date(r.created_at).toLocaleDateString("ar-EG"),
          type: r.data.maintenanceType || "وقائية",
          desc: r.data.description || "---",
          technician: r.data.technicianName || "---",
          result: r.data.result || r.data.status || "مكتمل",
        }));
        setData(mapped);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
          <Wrench className="w-5 h-5 text-slate-500" /> تقرير الصيانة (وقائية
          وتصحيحية)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">كود المعدة</th>
                <th className="p-3">اسم المعدة</th>
                <th className="p-3">تاريخ الصيانة</th>
                <th className="p-3">النوع</th>
                <th className="p-3">الوصف</th>
                <th className="p-3">الفني</th>
                <th className="p-3">النتيجة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((d, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-semibold">{d.equipId}</td>
                  <td className="p-3">{d.equipName}</td>
                  <td className="p-3">{d.date}</td>
                  <td className="p-3">
                    <span
                      className={
                        "px-2 py-1 rounded text-xs font-bold " +
                        (d.type.includes("وقائي")
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-red-100 text-red-700")
                      }
                    >
                      {d.type}
                    </span>
                  </td>
                  <td className="p-3 truncate max-w-[200px]">{d.desc}</td>
                  <td className="p-3">{d.technician}</td>
                  <td className="p-3">{d.result}</td>
                </tr>
              ))}
              {data.length === 0 && (
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
