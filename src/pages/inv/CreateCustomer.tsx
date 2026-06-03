import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Plus, Pencil, Trash2, X, CheckCircle } from "lucide-react";
import { getJsonHeaders } from "../../lib/utils";

const EMPTY = { code: "", name: "", name_en: "", contact_person: "", phone: "", email: "", address: "" };

export default function CreateCustomer() {
  const { user } = useAuth();
  const canEdit = (user?.level ?? 9) <= 2;
  const [customers, setCustomers] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const h = getJsonHeaders();

  const load = () =>
    fetch("/api/customers", { headers: h })
      .then((r) => r.json())
      .then((d) => setCustomers(Array.isArray(d) ? d : []))
      .catch(console.error);

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const isNew = !editing?.id;
    const url = isNew ? "/api/customers" : `/api/customers/${editing.id}`;
    const method = isNew ? "POST" : "PUT";
    try {
      const res = await fetch(url, { method, headers: h, body: JSON.stringify(editing) });
      if (res.ok) { await load(); setEditing(null); }
      else { const err = await res.json().catch(() => ({})); alert("خطأ: " + (err.error || "فشل الحفظ")); }
    } catch { alert("خطأ في الاتصال"); }
    setSaving(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف العميل "${name}"؟`)) return;
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE", headers: h });
    if (res.ok) setCustomers((p) => p.filter((c) => c.id !== id));
    else { const e = await res.json().catch(() => ({})); alert("فشل: " + (e.error || "")); }
  };

  const filtered = customers.filter(
    (c) => !search || c.name?.includes(search) || c.code?.includes(search)
  );

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">إدارة العملاء</h1>
          <p className="text-sm text-slate-500">{customers.length} عميل مسجّل</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setEditing({ ...EMPTY })}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> إضافة عميل جديد
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
              <th className="px-4 py-3 font-semibold text-slate-600 text-[12px]">كود العميل</th>
              <th className="px-4 py-3 font-semibold text-slate-600 text-[12px]">اسم العميل</th>
              <th className="px-4 py-3 font-semibold text-slate-600 text-[12px]">الاسم الإنجليزي</th>
              <th className="px-4 py-3 font-semibold text-slate-600 text-[12px]">المسؤول</th>
              <th className="px-4 py-3 font-semibold text-slate-600 text-[12px]">الهاتف</th>
              <th className="px-4 py-3 font-semibold text-slate-600 text-[12px]">البريد</th>
              {canEdit && <th className="px-4 py-3 w-24" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={canEdit ? 7 : 6} className="px-4 py-10 text-center text-slate-400">لا يوجد عملاء مسجّلون</td></tr>
            ) : filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-emerald-700">{c.code}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                <td className="px-4 py-3 text-slate-500">{c.name_en || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{c.contact_person || "—"}</td>
                <td className="px-4 py-3 text-slate-600 ltr">{c.phone || "—"}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{c.email || "—"}</td>
                {canEdit && (
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setEditing({ ...c })}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="تعديل">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(c.id, c.name)}
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
              <h2 className="font-bold text-slate-800">{editing.id ? "تعديل عميل" : "إضافة عميل جديد"}</h2>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "code", label: "كود العميل", required: true, placeholder: "مثال: CUS-001", mono: true },
                  { key: "name", label: "اسم العميل", required: true, placeholder: "شركة العميل" },
                  { key: "name_en", label: "الاسم بالإنجليزية", placeholder: "Customer Co." },
                  { key: "contact_person", label: "الشخص المسؤول", placeholder: "محمد أحمد" },
                  { key: "phone", label: "رقم الهاتف", placeholder: "+966..." },
                  { key: "email", label: "البريد الإلكتروني", placeholder: "contact@domain.com" },
                ].map(({ key, label, required, placeholder, mono }) => (
                  <div key={key}>
                    <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                      {label} {required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={required}
                      placeholder={placeholder}
                      value={(editing as any)[key] || ""}
                      onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                      className={`w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400 ${mono ? "font-mono" : ""}`}
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">العنوان</label>
                  <input type="text" placeholder="المدينة، المنطقة"
                    value={editing.address || ""}
                    onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400" />
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50">
                  <CheckCircle className="w-4 h-4" />
                  {saving ? "جاري الحفظ…" : editing.id ? "حفظ التعديلات" : "إضافة العميل"}
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
