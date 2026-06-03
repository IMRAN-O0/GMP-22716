import React, { useEffect, useState } from "react";
import { getAuthHeaders } from "../../lib/utils";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ReportSuppliers() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/inv/supplier-evaluations", {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        const logs = data.map((record: any) => {
          const fd = record.data;
          const total =
            (Number(fd.qualityScore) +
              Number(fd.deliveryScore) +
              Number(fd.documentationScore)) /
            3;
          return {
            id: record.record_id,
            supplierName: fd.supplierName || "غير محدد",
            date: fd.evaluationDate || record.created_at.split("T")[0],
            qualityScore: Number(fd.qualityScore || 0),
            deliveryScore: Number(fd.deliveryScore || 0),
            documentationScore: Number(fd.documentationScore || 0),
            totalScore: total.toFixed(1),
            decision: fd.decision || "pending",
          };
        });
        setEvaluations(logs);
      })
      .finally(() => setLoading(false));
  }, []);

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case "approved":
        return (
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">
            معتمد
          </span>
        );
      case "conditional":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">
            معتمد بشروط
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded text-xs font-bold">
            مرفوض
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-bold">
            معلق
          </span>
        );
    }
  };

  // Chart Data Preparation
  const barData = evaluations.map((e) => ({
    name: e.supplierName,
    الجودة: e.qualityScore,
    التسليم: e.deliveryScore,
    التوثيق: e.documentationScore,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6">
            مقارنة أداء الموردين
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} domain={[0, 5]} />
                <RechartsTooltip cursor={{ fill: "#F1F5F9" }} />
                <Legend />
                <Bar dataKey="الجودة" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="التسليم" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="التوثيق" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6">
            رادار التقييم (متوسط جميع الموردين)
          </h3>
          <div className="h-80 w-full">
            {evaluations.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  data={[
                    {
                      subject: "الجودة",
                      A:
                        evaluations.reduce(
                          (acc, curr) => acc + curr.qualityScore,
                          0,
                        ) / evaluations.length,
                      fullMark: 5,
                    },
                    {
                      subject: "التسليم",
                      A:
                        evaluations.reduce(
                          (acc, curr) => acc + curr.deliveryScore,
                          0,
                        ) / evaluations.length,
                      fullMark: 5,
                    },
                    {
                      subject: "التوثيق",
                      A:
                        evaluations.reduce(
                          (acc, curr) => acc + curr.documentationScore,
                          0,
                        ) / evaluations.length,
                      fullMark: 5,
                    },
                  ]}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis domain={[0, 5]} />
                  <Radar
                    name="المتوسط"
                    dataKey="A"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.6}
                  />
                  <RechartsTooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                لا توجد بيانات
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold">المورد</th>
                <th className="p-4 font-semibold">التاريخ</th>
                <th className="p-4 font-semibold text-center">الجودة / 5</th>
                <th className="p-4 font-semibold text-center">التسليم / 5</th>
                <th className="p-4 font-semibold text-center">التوثيق / 5</th>
                <th className="p-4 font-semibold text-center">المعدل</th>
                <th className="p-4 font-semibold text-center">القرار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-500">
                    جاري التحميل...
                  </td>
                </tr>
              ) : evaluations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-500">
                    لا توجد تقييمات
                  </td>
                </tr>
              ) : (
                evaluations.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 font-bold text-slate-800">
                      {e.supplierName}
                    </td>
                    <td className="p-4 text-slate-600 text-sm">{e.date}</td>
                    <td className="p-4 text-center font-semibold text-blue-600">
                      {e.qualityScore}
                    </td>
                    <td className="p-4 text-center font-semibold text-emerald-600">
                      {e.deliveryScore}
                    </td>
                    <td className="p-4 text-center font-semibold text-purple-600">
                      {e.documentationScore}
                    </td>
                    <td className="p-4 text-center font-bold text-slate-900">
                      {e.totalScore}
                    </td>
                    <td className="p-4 text-center">
                      {getDecisionBadge(e.decision)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
