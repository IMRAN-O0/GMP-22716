import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { getAuthHeaders } from "../../lib/utils";

export default function ReportBalances() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterWarehouse, setFilterWarehouse] = useState("ALL");
  const [filterLowStock, setFilterLowStock] = useState(false);

  const fetchMaterials = useCallback((category: string, warehouse_id: string, low_stock: boolean) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "ALL") params.set("category", category);
    if (warehouse_id !== "ALL") params.set("warehouse_id", warehouse_id);
    if (low_stock) params.set("low_stock", "true");
    const qs = params.toString() ? `?${params.toString()}` : "";
    fetch(`/api/materials${qs}`, {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((mats) => setMaterials(Array.isArray(mats) ? mats : []))
      .catch(() => setMaterials([]))
      .finally(() => setLoading(false));
  }, []);

  // Initial load: fetch warehouses once, then let filter effect handle materials
  useEffect(() => {
    fetch("/api/warehouses", {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((whs) => setWarehouses(Array.isArray(whs) ? whs : []))
      .catch(() => setWarehouses([]));
  }, []);

  // Fetch materials on mount and whenever filters change
  useEffect(() => {
    fetchMaterials(filterCategory, filterWarehouse, filterLowStock);
  }, [filterCategory, filterWarehouse, filterLowStock, fetchMaterials]);

  const getWarehouseName = (id: number) => {
    const wh = warehouses.find((w) => w.id === id);
    return wh ? wh.name : "غير محدد";
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-4 w-full md:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-slate-300 rounded-lg p-2 outline-none focus:border-emerald-500"
          >
            <option value="ALL">جميع التصنيفات</option>
            <option value="مادة خام">مادة خام</option>
            <option value="مادة تعبئة">مادة تعبئة</option>
            <option value="منتج نهائي">منتج نهائي</option>
          </select>
          <select
            value={filterWarehouse}
            onChange={(e) => setFilterWarehouse(e.target.value)}
            className="border border-slate-300 rounded-lg p-2 outline-none focus:border-emerald-500"
          >
            <option value="ALL">جميع المستودعات</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filterLowStock}
            onChange={(e) => setFilterLowStock(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded"
          />
          <span className="text-sm font-semibold text-slate-700">
            تنبيه النقص فقط
          </span>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold">كود المادة</th>
              <th className="p-4 font-semibold">اسم المادة</th>
              <th className="p-4 font-semibold">التصنيف</th>
              <th className="p-4 font-semibold">المستودع</th>
              <th className="p-4 font-semibold">الرصيد الحالي</th>
              <th className="p-4 font-semibold">الوحدة</th>
              <th className="p-4 font-semibold text-center">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-slate-500">
                  جاري التحميل...
                </td>
              </tr>
            ) : materials.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-slate-500">
                  لا توجد سجلات مطابقة
                </td>
              </tr>
            ) : (
              materials.map((m) => {
                const isZero = m.balance <= 0;
                const isLow = m.balance > 0 && m.balance <= 10;
                const isGood = m.balance > 10;
                return (
                  <tr
                    key={m.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 font-mono text-sm text-slate-700">
                      {m.code}
                    </td>
                    <td className="p-4 font-semibold text-slate-900">
                      {m.name}
                    </td>
                    <td className="p-4 text-slate-600">{m.category}</td>
                    <td className="p-4 text-slate-600">
                      {getWarehouseName(m.warehouse_id)}
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {m.balance}
                    </td>
                    <td className="p-4 text-slate-500">{m.unit}</td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        {isGood && (
                          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        )}
                        {isLow && (
                          <span className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]"></span>
                        )}
                        {isZero && (
                          <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
