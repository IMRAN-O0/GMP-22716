import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function CreateSupplier() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/suppliers", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then((r) => r.json())
      .then((data) => setSuppliers(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف المورد "${name}"؟`)) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        setSuppliers((prev) => prev.filter((s) => s.id !== id));
        alert("تم حذف المورد بنجاح");
      } else {
        const err = await res.json().catch(() => ({ error: "خطأ غير معروف" }));
        alert("فشل الحذف: " + err.error);
      }
    } catch (e) {
      console.error(e);
      alert("حدث خطأ في الاتصال");
    }
  };

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    name_en: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
  });

  const handleSubmit = async (e: React.FormEvent, status: any = "approved") => {
    e.preventDefault();
    if (status === "draft") {
      try {
        const formPayload = {
          recordId: `INV-DRAFT-${Date.now()}`,
          formId: "F-INV-GENERIC",
          department: "INV",
          creatorId: user?.id || 1,
          status: "draft",
          data: formData,
        };
        const editIdPatch = new URLSearchParams(window.location.search).get("edit");
        const fetchUrl = editIdPatch ? `/api/forms/record/${editIdPatch}` : "/api/forms";
        const fetchMethod = editIdPatch ? "PUT" : "POST";
        const res = await fetch(fetchUrl, {
          method: fetchMethod,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify(formPayload),
        });
        if (res.ok) {
          alert("تم حفظ المسودة بنجاح");
          window.location.reload();
        } else {
          const err = await res.json().catch(()=>({error: "Unknown"}));
          alert("حدث خطأ: " + err.error);
        }
      } catch(err) { console.error(err); }
      return;
    }
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        alert("تم تسجيل المورد بنجاح");
        navigate("/inv");
      } else {
        const err = await res.json();
        alert("حدث خطأ: " + err.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden">
      <div className="border-b border-slate-200 p-6 flex justify-between items-center bg-slate-50">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            الشركة الحديثة للتجميل
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            إضافة مورد جديد
          </p>
        </div>
      </div>

      <form className="p-8" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              كود المورد <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: SUP-001"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2 font-mono"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              اسم المورد <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: شركة المورد الذهبي"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
          <div>
             <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              الاسم باللغة الإنجليزية
            </label>
            <input
              type="text"
              placeholder="Example: Golden Supplier Co."
              value={formData.name_en}
              onChange={(e) =>
                setFormData({ ...formData, name_en: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2 text-left"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              الشخص المسؤول
            </label>
            <input
              type="text"
              placeholder="مثال: أحمد محمد"
              value={formData.contact_person}
              onChange={(e) =>
                setFormData({ ...formData, contact_person: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
          <div>
             <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              رقم الهاتف
            </label>
            <input
              type="text"
              placeholder="مثال: +966..."
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2 text-left"
              dir="ltr"
            />
          </div>
          <div>
             <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              placeholder="مثال: contact@domain.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2 text-left"
              dir="ltr"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              العنوان
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            ></textarea>
          </div>
        </div>

                <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-200">
          <button
            type="button"
            
            onClick={(e) => handleSubmit(e, "draft")}
            className="flex items-center px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[14px]"
          >
            حفظ كمسودة
          </button>
          
          {user?.level <= 2 ? (
            <button
              type="button"
              
              onClick={(e) => handleSubmit(e, "approved")}
              className="flex items-center px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold text-[14px]"
            >
              حفظ واعتماد
            </button>
          ) : (
            <button
              type="button"
              
              onClick={(e) =>
                handleSubmit(
                  e,
                  user?.level === 3 ? "pending_approval" : "pending_review"
                )
              }
              className="flex items-center px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold text-[14px]"
            >
              إرسال للمراجعة
            </button>
          )}

          <div className="flex-1"></div>
          <button
            type="button"

            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/");
              }
            }}
            className="text-slate-500 hover:text-slate-700 font-semibold text-[14px]"
          >
            إغلاق والعودة
          </button>
        </div>
      </form>

      {/* Existing Suppliers List */}
      {suppliers.length > 0 && (
        <div className="border-t border-slate-200 px-8 py-6">
          <h3 className="text-[15px] font-bold text-slate-700 mb-3">الموردون المسجلون</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[13px]">
                  <th className="p-3 border-b font-semibold">الكود</th>
                  <th className="p-3 border-b font-semibold">الاسم</th>
                  <th className="p-3 border-b font-semibold">الهاتف</th>
                  {user?.level <= 2 && <th className="p-3 border-b font-semibold text-center w-20">حذف</th>}
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-mono text-sky-700 font-bold">{s.code}</td>
                    <td className="p-3 text-slate-800">{s.name}</td>
                    <td className="p-3 text-slate-500">{s.phone || "—"}</td>
                    {user?.level <= 2 && (
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(s.id, s.name)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                          title="حذف المورد"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
