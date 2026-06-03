import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Thermometer,
  Box,
  FileWarning,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { getAuthHeaders } from "../../lib/utils";

export default function ReportExecutiveDashboard() {
  const [data, setData] = useState<any>({
    completedBatches: 0,
    totalBatches: 0,
    wasteRate: 0,
    openNCRs: 0,
    delayedCAPAs: 0,
    overdueCalibrations: 0,
    lowStockCount: 0,
    delayedPos: 0,
    returnRate: 0,
    recallRate: 0,
    monthlyProduction: [],
    ncrSources: [],
  });

  useEffect(() => {
    fetch("/api/reports/all", {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((records) => {
        const stats: any = {
          completedBatches: 0,
          totalBatches: 0,
          totalPlannedQty: 0,
          totalWasteQty: 0,
          openNCRs: 0,
          delayedCAPAs: 0,
          overdueCalibrations: 0,
          lowStockCount: 0,
          delayedPos: 0,
          totalShipped: 0,
          totalReturned: 0,
          recallAffected: 0,
          recallRecovered: 0,
          months: {},
          ncrs: {},
        };

        const now = new Date();

        records.forEach((r: any) => {
          // Production
          if (r.form_id === "F-PRD-001" && r.status === "approved") {
            stats.totalBatches++;
            if (r.data.status === "Completed" || r.data.status === "مكتمل")
              stats.completedBatches++;

            const pQty = Number(r.data.plannedQuantity) || 1; // avoid /0
            stats.totalPlannedQty += pQty;

            // Monthly aggregation
            const month = new Date(r.created_at).toLocaleString("ar-EG", {
              month: "short",
            });
            stats.months[month] = (stats.months[month] || 0) + 1;
          }
          if (r.form_id === "F-PRD-002" && r.status === "approved") {
            stats.totalWasteQty += Number(r.data.wasteQuantity) || 0;
          }

          // QM
          if (r.form_id === "F-QM-005") {
            if (r.status !== "approved" && r.data.status !== "Closed")
              stats.openNCRs++;
            const src = r.data.source || "غير محدد";
            stats.ncrs[src] = (stats.ncrs[src] || 0) + 1;
          }
          if (
            r.form_id === "F-QM-006" &&
            r.status !== "approved" &&
            r.data.status !== "Closed"
          ) {
            if (r.data.targetDate || r.data.targetCompletionDate) {
              const tDate = new Date(
                r.data.targetDate || r.data.targetCompletionDate,
              );
              if (tDate < now) stats.delayedCAPAs++;
            }
          }
          if (r.form_id === "F-PRM-001" || r.form_id === "F-EQP-001") {
            const lastCal = new Date(
              r.data.lastCalibrationDate || r.created_at,
            );
            const cycle = Number(r.data.calibrationCycleMonths) || 6;
            const nextCal = new Date(lastCal);
            nextCal.setMonth(nextCal.getMonth() + cycle);
            if (nextCal < now) stats.overdueCalibrations++;
          }
          if (r.form_id === "F-RCL-001" || r.form_id === "F-RCL-001") {
            stats.recallAffected += Number(r.data.affectedQuantity) || 0;
            stats.recallRecovered += Number(r.data.recoveredQuantity) || 0;
          }

          // INV
          if (r.form_id === "F-INV-RM-001") {
            // Simulated low stock check (just a mock logic since we don't track running balance in records easily without full reduction)
            if (Number(r.data.quantity) < 50) stats.lowStockCount++;
          }
          if (r.form_id === "F-FP-003" && r.status === "approved") {
            stats.totalShipped += 1;
          }
          if (r.form_id === "F-FP-004" && r.status === "approved") {
            stats.totalReturned += 1;
          }
        });

        const monthlyProduction = Object.keys(stats.months).map((k) => ({
          name: k,
          batches: stats.months[k],
        }));
        const ncrSources = Object.keys(stats.ncrs).map((k) => ({
          name: k,
          value: stats.ncrs[k],
        }));

        const completionRate =
          stats.totalBatches > 0
            ? (stats.completedBatches / stats.totalBatches) * 100
            : 0;
        const wasteRate =
          stats.totalPlannedQty > 0
            ? (stats.totalWasteQty / stats.totalPlannedQty) * 100
            : 0;
        const returnRate =
          stats.totalShipped > 0
            ? (stats.totalReturned / stats.totalShipped) * 100
            : 0;
        const recallRate =
          stats.recallAffected > 0
            ? (stats.recallRecovered / stats.recallAffected) * 100
            : 0;

        setData({
          completionRate: completionRate.toFixed(1),
          wasteRate: wasteRate.toFixed(1),
          openNCRs: stats.openNCRs,
          delayedCAPAs: stats.delayedCAPAs,
          overdueCalibrations: stats.overdueCalibrations,
          lowStockCount: stats.lowStockCount,
          returnRate: returnRate.toFixed(1),
          recallRate: recallRate.toFixed(1),
          monthlyProduction,
          ncrSources,
        });
      })
      .catch(console.error);
  }, []);

  const PIE_COLORS = ["#f43f5e", "#f97316", "#eab308", "#3b82f6"];

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6 text-xl">
        <LayoutDashboard className="w-6 h-6 text-slate-700" /> لوحة KPI
        التنفيذية (Executive Dashboard)
      </h3>

      {/* 8 KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Production */}
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
          <div className="text-sm text-blue-600 font-bold mb-1 flex justify-between">
            <span>إنجاز الدفعات</span> <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-blue-800">
            {data.completionRate}%
          </div>
        </div>
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
          <div className="text-sm text-red-600 font-bold mb-1 flex justify-between">
            <span>معدل الفاقد الإنتاجي</span>{" "}
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-red-800">
            {data.wasteRate}%
          </div>
        </div>

        {/* QM */}
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
          <div className="text-sm text-orange-600 font-bold mb-1 flex justify-between">
            <span>NCR مفتوحة</span> <FileWarning className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-orange-800">
            {data.openNCRs}
          </div>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl">
          <div className="text-sm text-rose-600 font-bold mb-1 flex justify-between">
            <span>CAPA متأخرة</span> <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-800">
            {data.delayedCAPAs}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <div className="text-sm text-slate-600 font-bold mb-1 flex justify-between">
            <span>أجهزة متأخرة المعايرة</span>{" "}
            <Thermometer className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {data.overdueCalibrations}
          </div>
        </div>

        {/* INV */}
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
          <div className="text-sm text-emerald-600 font-bold mb-1 flex justify-between">
            <span>مواد تحت الحد الأدنى</span> <Box className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-800">
            {data.lowStockCount}
          </div>
        </div>

        {/* Customers */}
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
          <div className="text-sm text-indigo-600 font-bold mb-1 flex justify-between">
            <span>معدل المرتجعات</span> <TrendingDown className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-indigo-800">
            {data.returnRate}%
          </div>
        </div>
        <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl">
          <div className="text-sm text-teal-600 font-bold mb-1 flex justify-between">
            <span>معدل الاسترداد</span> <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-teal-800">
            {data.recallRate}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
          style={{ height: 300 }}
        >
          <h4 className="font-bold text-slate-700 mb-4">
            الإنتاج الشهري (عدد الدفعات)
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthlyProduction}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <RechartsTooltip />
              <Bar dataKey="batches" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
          style={{ height: 300 }}
        >
          <h4 className="font-bold text-slate-700 mb-4">
            مصادر حالات عدم المطابقة (NCR)
          </h4>
          {data.ncrSources.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.ncrSources}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {data.ncrSources.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              لا تتوفر بيانات
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
