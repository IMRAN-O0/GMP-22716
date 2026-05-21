import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Plus, Pencil, Trash2, X, CheckCircle } from "lucide-react";
import { formatProductCode } from "../../lib/utils";

const EMPTY = { code: "FD-", name: "", name_en: "", unit: "كجم", description: "", warehouse_id: "", balance: 0 };

export default function CreateFinalProduct() {
  const { user } = useAuth();
  const canEdit = (user?.level ?? 9) <= 2;
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const h = { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` };

  const load = () =>
    fetch("/api/materials", { headers: h })
      .then((r) => r.json())
      .then((d) => setProducts(
        Array.isArray(d) ? d.filter((m: any) =>
          m.category === "منتج نهائي" || m.category === "Finished Product" || (m.code || "").startsWith("FD-")
        ) : []
      ))
      .catch(console.error);

  useEffect(() => {
    load();
    fetch("/api/warehouses", { headers: h })
      .then((r) => r.json())
      .then((d) => setWarehouses(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const isNew = !editing?.id;
    const payload = {
      ...editing,
      category: "منتج نهائي",
      code: formatProductCode(editing.code),
    };
    const url = isNew ? "/api/materials" : `/api/materials/${editing.id}`;
    const method = isNew ? "POST" : "PUT";
    try {
      const res = await fetch(url, { method, headers: h, body: JSON.stringify(payload) });
      if (res.ok) { await load(); setEditing(null); }
      else { const err = await res.json().catch(() => ({})); alert("خطأ: " + (err.error || "فشل الحفظ")); }
    } catch { alert("خطأ في الاتصال"); }
    setSaving(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف المنتج "${name}"؟`)) return;
    const res = await fetch(`/api/materials/${id}`, { method: "DELETE", headers: h });
    if (res.ok) setProducts((p) => p.filter((m) => m.id !== id));
    else { const e = await res.json().catch(() => ({})); alert("فشل: " + (e.error || "")); }
  };

  const filtered = products.filter(
    (p) => !search || p.name?.includes(search) || p.code?.includes(search)
  );

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">إدارة المنتجات النهائية</h1>
          <p className="text-sm text-slate-500">{products.length} منتج مسجّل · الكود: FD-XXXX</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setEditing({ ...EMPTY })}
            className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-sky-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> إضافة منتج نهائي جديد
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="ابحث بالاسم أو الكود…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-600 text-[12px]">كود المنتج</th>
              <th className="px-4 py-3 font-semibold text-slate-600 text-[12px]">اسم المنتج</th>
              <th className="px-4 py-3 font-semibold text-slate-600 text-[12px]">الاسم الإنجليزي</th>
              <th className="px-4 py-3 font-semibold text-slate-600 text-[12px]">الوحدة</th>
              <th className="px-4 py-3 font-semibold text-slate-600 text-[12px]">الرصيد</th>
              {canEdit && <th className="px-4 py-3 w-24" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={canEdit ? 6 : 5} className="px-4 py-10 text-center text-slate-400">لا يوجد منتجات نهائية مسجّلة</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-sky-700">{p.code}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                <td className="px-4 py-3 text-slate-500">{p.name_en || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{p.unit || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{p.balance ?? 0}</td>
                {canEdit && (
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setEditing({ ...p })}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="تعديل">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="حذف">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-bold text-slate-800">{editing.id ? "تعديل منتج نهائي" : "إضافة منتج نهائي جديد"}</h2>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    كود المنتج <span className="text-red-500">*</span>
                    <span className="text-xs text-slate-400 font-normal mr-1">(FD-XXXX تلقائي)</span>
                  </label>
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-sky-400 focus-within:border-sky-400">
                    <span className="bg-slate-100 px-3 py-2 text-sm font-mono font-bold text-slate-600 border-l border-slate-200 select-none">FD-</span>
                    <input
                      type="text"
                      required
                      placeholder="0001"
                      maxLength={4}
                      value={(editing.code || "FD-").replace(/^FD-?/i, "")}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setEditing({ ...editing, code: `FD-${digits}` });
                      }}
                      className="flex-1 px-3 py-2 text-sm font-mono border-0 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">اسم المنتج <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="اسم المنتج بالعربي"
                    value={editing.name || ""}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">الاسم بالإنجليزية</label>
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={editing.name_en || ""}
                    onChange={(e) => setEditing({ ...editing, name_en: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">الوحدة</label>
                  <select
                    value={editing.unit || "كجم"}
                    onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  >
                    <option value="كجم">كجم</option>
                    <option value="لتر">لتر</option>
                    <option value="قطعة">قطعة</option>
                    <option value="علبة">علبة</option>
                    <option value="كرتون">كرتون</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">المستودع</label>
                  <select
                    value={editing.warehouse_id || ""}
                    onChange={(e) => setEditing({ ...editing, warehouse_id: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  >
                    <option value="">-- بدون مستودع --</option>
                    {warehouses.map((w: any) => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">الرصيد الافتتاحي</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editing.balance ?? 0}
                    onChange={(e) => setEditing({ ...editing, balance: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">الوصف</label>
                  <input
                    type="text"
                    placeholder="وصف المنتج..."
                    value={editing.description || ""}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-sky-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-sky-700 transition-colors disabled:opacity-50">
                  <CheckCircle className="w-4 h-4" />
                  {saving ? "جاري الحفظ…" : editing.id ? "حفظ التعديلات" : "إضافة المنتج"}
                </button>
                <button type="button" onClick={() => setEditing(null)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
