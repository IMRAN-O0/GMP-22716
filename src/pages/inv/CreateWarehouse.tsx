import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, CheckCircle, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function CreateWarehouse() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "MAIN",
    parent_id: "",
    description: "",
  });

  useEffect(() => {
    fetch("/api/warehouses")
      .then((r) => r.json())
      .then((data) => setWarehouses(data))
      .catch(console.error);
  }, []);

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
      const payloadData = {
        ...formData,
        parent_id:
          formData.type === "SUB" ? parseInt(formData.parent_id) : null,
      };

      if (user?.level <= 2) {
        const res = await fetch("/api/warehouses", {
          method: "POST",
          headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
          body: JSON.stringify(payloadData),
        });
        if (res.ok) {
          alert("تم إنشاء المستودع بنجاح");
          navigate("/inv");
        } else {
          const err = await res.json();
          alert("حدث خطأ: " + err.error);
        }
      } else {
        const formPayload = {
          recordId: `INV-WH-${Date.now()}`,
          formId: "F-INV-WH",
          department: "INV",
          creatorId: user?.id || 1,
          status: "pending_review",
          data: payloadData,
        };
        const res = await fetch("/api/forms", {
          method: "POST",
          headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
          body: JSON.stringify(formPayload),
        });
        if (res.ok) {
          alert("تم إرسال طلب إنشاء المستودع للمراجعة");
          navigate("/inv");
        } else {
          const err = await res.json();
          alert("حدث خطأ: " + err.error);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف المستودع "${name}"؟`)) return;
    try {
      const res = await fetch(`/api/warehouses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        setWarehouses((prev) => prev.filter((w) => w.id !== id));
        alert("تم حذف المستودع بنجاح");
      } else {
        const err = await res.json().catch(() => ({ error: "خطأ غير معروف" }));
        alert("فشل الحذف: " + err.error);
      }
    } catch (e) {
      console.error(e);
      alert("حدث خطأ في الاتصال");
    }
  };

  // --- INJECTED BY PATCH ---
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    if (editId) {
      fetch(`/api/forms/record/${editId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.data) {
            setFormData((prev) => ({ ...prev, ...data.data }));
          }
        })
        .catch(console.error);
    }
  }, []);
  // -------------------------

  return (
    <div className="max-w-4xl mx-auto bg-white border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden">
      <div className="border-b border-slate-200 p-6 flex justify-between items-center bg-slate-50">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            الشركة الحديثة للتجميل
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            تكويد المستودعات والمخازن
          </p>
        </div>
      </div>

      <form className="p-8" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              كود المستودع <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: WH-MAIN-01"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2 font-mono"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              اسم المستودع <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: مستودع المواد السائلة"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              نوع المستودع <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value,
                  parent_id: "",
                })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            >
              <option value="MAIN">رئيسي (Main Warehouse)</option>
              <option value="SUB">فرعي (Sub-warehouse)</option>
            </select>
          </div>

          {formData.type === "SUB" && (
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                يتبع للمستودع الرئيسي <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.parent_id}
                onChange={(e) =>
                  setFormData({ ...formData, parent_id: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
              >
                <option value="">-- اختر المستودع الرئيسي --</option>
                {warehouses
                  .filter((w) => !w.parent_id || w.type === "MAIN")
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              وصف المستودع ومحتوياته
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
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

      {/* Existing Warehouses List */}
      {warehouses.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-6 px-8 pb-8">
          <h3 className="text-[15px] font-bold text-slate-700 mb-3">المستودعات المسجلة</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[13px]">
                  <th className="p-3 border-b font-semibold">الكود</th>
                  <th className="p-3 border-b font-semibold">الاسم</th>
                  <th className="p-3 border-b font-semibold">النوع</th>
                  {user?.level === 1 && <th className="p-3 border-b font-semibold text-center w-20">حذف</th>}
                </tr>
              </thead>
              <tbody>
                {warehouses.map((w) => (
                  <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-mono text-sky-700 font-bold">{w.code}</td>
                    <td className="p-3 text-slate-800">{w.name}</td>
                    <td className="p-3 text-slate-500">{w.type === "MAIN" ? "رئيسي" : "فرعي"}</td>
                    {user?.level === 1 && (
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(w.id, w.name)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                          title="حذف المستودع"
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
