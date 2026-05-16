import React, { useEffect, useState } from "react";
import { CalendarDays, AlertTriangle } from "lucide-react";

export default function ReportCalibration() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/reports/qm/all", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((records) => {
        const cals = records.filter(
          (r: any) => r.form_id === "F-PRM-001" || r.form_id === "F-EQP-001",
        );
        const mapped = cals.map((r: any) => {
          const lastCal = new Date(r.data.lastCalibrationDate || r.created_at);
          const cycleMonths = Number(r.data.calibrationCycleMonths) || 6;

          const nextCal = new Date(lastCal);
          nextCal.setMonth(nextCal.getMonth() + cycleMonths);

          const now = new Date();
          const daysLeft = Math.ceil(
            (nextCal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );

          let status = "Valid";
          if (daysLeft < 0) status = "Overdue";
          else if (daysLeft <= 30) status = "Upcoming";

          return {
            deviceId: r.data.equipmentId || r.data.deviceId || "---",
            name: r.data.equipmentName || r.data.deviceName || "---",
            location: r.data.location || "الإنتاج",
            lastCal: lastCal.toLocaleDateString("ar-EG"),
            cycle: cycleMonths + " شهر",
            nextCal: nextCal.toLocaleDateString("ar-EG"),
            daysLeft,
            status,
          };
        });
        setData(mapped);
      })
      .catch(console.error);
  }, []);

  const overdueCount = data.filter((d) => d.status === "Overdue").length;
  const upcomingCount = data.filter((d) => d.status === "Upcoming").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex flex-col justify-center items-center text-center">
          <span className="text-red-600 font-bold mb-2 flex items-center gap-1">
            <AlertTriangle className="w-5 h-5" /> أجهزة متأخرة المعايرة
          </span>
          <span className="text-4xl font-black text-red-700">
            {overdueCount}
          </span>
        </div>
        <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100 flex flex-col justify-center items-center text-center">
          <span className="text-yellow-600 font-bold mb-2">
            تستحق المعايرة خلال 30 يوم
          </span>
          <span className="text-4xl font-black text-yellow-700">
            {upcomingCount}
          </span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
          <CalendarDays className="w-5 h-5 text-indigo-500" /> جدول المعايرة
          الدوري
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">كود الجهاز</th>
                <th className="p-3">الاسم</th>
                <th className="p-3">الموقع</th>
                <th className="p-3">آخر معايرة</th>
                <th className="p-3">الدورية</th>
                <th className="p-3">المعايرة القادمة</th>
                <th className="p-3">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((d, i) => {
                let badge = "bg-green-100 text-green-700";
                if (d.status === "Overdue") badge = "bg-red-100 text-red-700";
                if (d.status === "Upcoming")
                  badge = "bg-yellow-100 text-yellow-700";

                return (
                  <tr
                    key={i}
                    className={
                      "hover:bg-slate-50 " +
                      (d.status === "Overdue" ? "bg-red-50" : "")
                    }
                  >
                    <td className="p-3 font-mono font-semibold">
                      {d.deviceId}
                    </td>
                    <td className="p-3">{d.name}</td>
                    <td className="p-3">{d.location}</td>
                    <td className="p-3">{d.lastCal}</td>
                    <td className="p-3">{d.cycle}</td>
                    <td className="p-3 font-bold text-slate-700">
                      {d.nextCal}
                    </td>
                    <td className="p-3">
                      <span
                        className={
                          "px-2 py-1 rounded text-xs font-bold " + badge
                        }
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-400">
                    لا توجد أجهزة مسجلة
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
