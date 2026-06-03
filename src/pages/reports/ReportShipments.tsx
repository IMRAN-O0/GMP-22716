import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { PackageOpen, TrendingUp, Users } from "lucide-react";
import { getAuthHeaders } from "../../lib/utils";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

export default function ReportShipments() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/inv/shipments", {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        const rows = data.map((record: any) => {
          const fd = record.data;
          return {
            id: record.record_id,
            date: fd.date,
            customerName: fd.customerName || "غير محدد",
            batchNumber: fd.batchNumber || "N/A",
            quantity: Number(fd.quantity || 0),
            carrier: fd.carrierCompany || "N/A",
            plateNumber: fd.plateNumber || "N/A",
            status: fd.status || "shipped",
          };
        });
        setShipments(rows);
      })
      .finally(() => setLoading(false));
  }, []);

  // Totals
  const totalShipments = shipments.length;
  const totalQuantity = shipments.reduce((acc, curr) => acc + curr.quantity, 0);

  // Distribution by customer
  const customersDist: Record<string, number> = {};
  shipments.forEach((s) => {
    customersDist[s.customerName] =
      (customersDist[s.customerName] || 0) + s.quantity;
  });
  const pieData = Object.keys(customersDist).map((key) => ({
    name: key,
    value: customersDist[key],
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <PackageOpen className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">عدد الشحنات</p>
            <p className="text-3xl font-bold text-slate-900">
              {totalShipments}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">
              الكميات المشحونة
            </p>
            <p className="text-3xl font-bold text-slate-900">{totalQuantity}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">عملاء نشطين</p>
            <p className="text-3xl font-bold text-slate-900">
              {Object.keys(customersDist).length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-1">
          <h3 className="font-bold text-slate-800 mb-6">
            توزيع الكميات حسب العميل
          </h3>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                لا توجد بيانات
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden lg:col-span-2 flex flex-col">
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-800">سجل الشحنات</h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold">رقم الشحنة</th>
                  <th className="p-4 font-semibold">التاريخ</th>
                  <th className="p-4 font-semibold">العميل</th>
                  <th className="p-4 font-semibold">رقم الدفعة</th>
                  <th className="p-4 font-semibold">الكمية</th>
                  <th className="p-4 font-semibold">الناقل</th>
                  <th className="p-4 font-semibold">اللوحة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-500">
                      جاري التحميل...
                    </td>
                  </tr>
                ) : shipments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-500">
                      لا توجد شحنات
                    </td>
                  </tr>
                ) : (
                  shipments.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4 font-mono text-sm text-blue-600 font-bold">
                        {s.id}
                      </td>
                      <td className="p-4 text-slate-600 text-sm">{s.date}</td>
                      <td className="p-4 font-semibold text-slate-900">
                        {s.customerName}
                      </td>
                      <td className="p-4 font-mono text-sm text-slate-500">
                        {s.batchNumber}
                      </td>
                      <td className="p-4 font-bold text-emerald-600">
                        {s.quantity}
                      </td>
                      <td className="p-4 text-slate-600 text-sm">
                        {s.carrier}
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 rounded px-2 py-1">
                          {s.plateNumber}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
