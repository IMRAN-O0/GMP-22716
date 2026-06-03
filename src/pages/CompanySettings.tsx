import React, { useState, useEffect, useRef } from "react";
import { Save } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getJsonHeaders } from "../lib/utils";

export default function CompanySettings() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name_ar: "",
    name_en: "",
    logo_url: "",
    address: "",
    phone: "",
    email: "",
    license_number: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/company")
      .then((r) => r.json())
      .then((d) => { if (d && d.id) setForm({ name_ar: d.name_ar || "", name_en: d.name_en || "", logo_url: d.logo_url || "", address: d.address || "", phone: d.phone || "", email: d.email || "", license_number: d.license_number || "" }); })
      .catch(console.error);
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, logo_url: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/company", {
        method: "PUT",
        headers: getJsonHeaders(),
        body: JSON.stringify(form),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else { const e = await res.json(); alert("خطأ: " + e.error); }
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  if (user?.level > 2) {
    return <div className="p-8 text-center text-slate-500">ليس لديك صلاحية الوصول لهذه الصفحة.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 p-6 bg-slate-50">
          <h1 className="text-xl font-bold text-slate-900">إعدادات الشركة والنظام</h1>
        </div>

        <div className="p-8 space-y-6">
          {/* Logo */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-2">شعار الشركة (Logo)</label>
            <div className="flex items-center gap-4">
              {form.logo_url ? (
                <img src={form.logo_url} alt="شعار" className="h-20 w-20 object-contain border border-slate-200 rounded-xl p-1 cursor-pointer" onClick={() => fileRef.current?.click()} />
              ) : (
                <div onClick={() => fileRef.current?.click()} className="h-20 w-20 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-xs cursor-pointer hover:border-sky-400 hover:text-sky-500 transition-colors text-center font-bold">
                  اضغط لرفع شعار
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              <div>
                <button type="button" onClick={() => fileRef.current?.click()} className="text-sm font-semibold text-sky-600 hover:text-sky-700">
                  {form.logo_url ? "تغيير الشعار" : "اختيار ملفّ"}
                </button>
                {form.logo_url && (
                  <button type="button" onClick={() => setForm((f) => ({ ...f, logo_url: "" }))} className="block text-xs text-red-400 hover:text-red-600 mt-1">
                    حذف الشعار
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">اسم الشركة (العربية)</label>
              <input type="text" value={form.name_ar} onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))}
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2" />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">اسم الشركة (الإنجليزية)</label>
              <input type="text" dir="ltr" value={form.name_en} onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2 text-left" />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">العنوان</label>
            <input type="text" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2" />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">رقم الهاتف</label>
              <input type="text" dir="ltr" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2 text-left" />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">البريد الإلكتروني</label>
              <input type="email" dir="ltr" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2 text-left" />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">رقم الترخيص (SFDA)</label>
              <input type="text" dir="ltr" value={form.license_number} onChange={(e) => setForm((f) => ({ ...f, license_number: e.target.value }))}
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2 text-left" />
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold text-sm disabled:opacity-50 transition-colors">
              <Save className="w-4 h-4" />
              {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </button>
            {saved && <span className="text-emerald-600 font-semibold text-sm">تم الحفظ بنجاح ✓</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
