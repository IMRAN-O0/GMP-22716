import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { formatMaterialCode, getAuthHeaders, getJsonHeaders } from "../../lib/utils";

export default function CreateMaterial() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [materialsList, setMaterialsList] = useState<any[]>([]);
  const [fpForms, setFpForms] = useState<any[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [editFormRecordId, setEditFormRecordId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    name_en: "",
    category: "منتج نهائي",
    description: "",
    unit: "قطعة",
    warehouse_id: "",
    balance: 0,
    packageSize: "" as string | number,
    packageSizeUnit: "جم",
  });

  useEffect(() => {
    fetch("/api/warehouses")
      .then((r) => r.json())
      .then((data) => {
        // filter warehouses to only those that might be "final" or related
        setWarehouses(data.filter((w: any) => 
          w.type === 'finished' || 
          w.name.includes("نهائي") || 
          w.name.includes("تعبئة") || 
          w.code.toLowerCase().includes("fp")
        ));
      })
      .catch(console.error);

    fetch("/api/materials")
      .then((r) => r.json())
      .then((data) => {
        setMaterialsList(data.filter((m: any) => 
          m.category === "منتج نهائي" || 
          m.category === "مواد تعبئة وتغليف" || 
          m.category === "Finished Product" ||
          m.code.startsWith("FP") ||
          m.code.startsWith("PM")
        ));
      })
      .catch(console.error);

    fetch("/api/forms")
      .then((r) => r.json())
      .then((data) => {
        setFpForms(data.filter((f: any) => f.form_id === "F-INV-MAT"));
      })
      .catch(console.error);
  }, []);

  const handleSelectMaterial = (m: any) => {
    const existingForm = fpForms.find((f: any) => f.data?.code === m.code);
    if (existingForm) {
      setFormData(existingForm.data);
      setEditFormRecordId(existingForm.record_id);
    } else {
      setFormData({
        code: m.code || "",
        name: m.name || "",
        name_en: m.name_en || "",
        category: m.category || "منتج نهائي",
        description: m.description || "",
        unit: m.unit || "كجم",
        warehouse_id: m.warehouse_id || "",
        balance: m.balance || 0,
      });
      setEditFormRecordId(null);
    }
    setSelectedMaterialId(m.id);
    setIsEditing(true);
    setShowSearchModal(false);
  };

  const handleSaveDraft = async () => {
    try {
      const payloadData = {
        ...formData,
        warehouse_id: formData.warehouse_id ? parseInt(formData.warehouse_id) : null,
        balance: formData.balance ? parseFloat(formData.balance.toString()) : 0,
      };

      const formPayload = {
        recordId: editFormRecordId || `INV-MAT-${Date.now()}`,
        formId: "F-INV-MAT",
        department: "INV",
        creatorId: user?.id || 1,
        status: "draft",
        data: payloadData,
      };

      const url = editFormRecordId ? `/api/forms/record/${editFormRecordId}` : "/api/forms";
      const method = editFormRecordId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getJsonHeaders(),
        body: JSON.stringify(formPayload),
      });

      if (res.ok) {
        alert("تم حفظ المسودة بنجاح");
        window.location.reload();
      } else {
        const err = await res.json();
        alert("حدث خطأ: " + err.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent, status: any = "approved") => {
    e.preventDefault();
    if (status === "draft") {
      return handleSaveDraft();
    }
    try {
      const payloadData = {
        ...formData,
        warehouse_id: formData.warehouse_id ? parseInt(formData.warehouse_id) : null,
        balance: formData.balance ? (parseFloat(formData.balance.toString()) || 0) : 0,
      };

      if (user?.level <= 2) {
        const url = isEditing && selectedMaterialId ? `/api/materials/${selectedMaterialId}` : "/api/materials";
        const method = isEditing && selectedMaterialId ? "PUT" : "POST";
        const res = await fetch(url, {
          method,
          headers: getJsonHeaders(),
          body: JSON.stringify(payloadData),
        });
        if (res.ok) {
          alert(`تم ${isEditing ? "تعديل" : "تسجيل"} المادة بنجاح`);
          navigate("/inv");
        } else {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          alert("حدث خطأ: " + err.error);
        }
      } else {
        const formPayload = {
          recordId: editFormRecordId || `INV-MAT-${Date.now()}`,
          formId: "F-INV-MAT",
          department: "INV",
          creatorId: user?.id || 1,
          status: "pending_review",
          data: payloadData,
        };
        const url = editFormRecordId ? `/api/forms/record/${editFormRecordId}` : "/api/forms";
        const method = editFormRecordId ? "PUT" : "POST";
        const res = await fetch(url, {
          method,
          headers: getJsonHeaders(),
          body: JSON.stringify(formPayload),
        });
        if (res.ok) {
          alert("تم إرسال طلب إضافة المادة للمراجعة");
          navigate("/inv");
        } else {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          alert("حدث خطأ: " + err.error);
        }
      }
    } catch (err: any) {
      console.error(err);
      alert("حدث خطأ غير متوقع: " + err.message);
    }
  };

  // --- INJECTED BY PATCH ---
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    if (editId) {
      setEditFormRecordId(editId);
      fetch(`/api/forms/record/${editId}`, {
        headers: getAuthHeaders()
      })
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
            إضافة أو تعديل منتج نهائي
          </p>
        </div>
      </div>

      <form className="p-8" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              نوع الكود (تصنيف الصنف) <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2 bg-sky-50"
            >
              <option value="منتج نهائي">منتج نهائي</option>
              <option value="مواد تعبئة وتغليف">مواد تعبئة وتغليف</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              كود الصنف <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: 001-0001 (اضغط F3 للبحث والتعديل)"
              value={formData.code}
              onKeyDown={(e) => {
                if (e.key === "F3") {
                  e.preventDefault();
                  setShowSearchModal(true);
                }
              }}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  code: formatMaterialCode(e.target.value, true),
                })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2 font-mono"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              اسم الصنف / الوصف القصير <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: زيت اللوز الحلو"
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
              placeholder="Example: Sweet Almond Oil"
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
              وحدة القياس <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            >
              <option>قطعة</option>
              <option>علبة</option>
              <option>كجم</option>
              <option>جرام</option>
              <option>لتر</option>
              <option>مل</option>
            </select>
          </div>

          {/* Package Size — for finished products sold as pieces/boxes */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              حجم العبوة
              <span className="text-slate-400 font-normal mr-1">(للمنتجات المعبأة — يستخدم لحساب عدد القطع)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number" min="0.001" step="0.001"
                placeholder="مثال: 300"
                value={formData.packageSize}
                onChange={e => setFormData({ ...formData, packageSize: e.target.value })}
                className="flex-1 border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
              />
              <select
                value={formData.packageSizeUnit}
                onChange={e => setFormData({ ...formData, packageSizeUnit: e.target.value })}
                className="w-28 border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
              >
                <option value="جم">جم</option>
                <option value="كجم">كجم</option>
                <option value="مل">مل</option>
                <option value="لتر">لتر</option>
                <option value="قطعة">قطعة</option>
              </select>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              مثال: 300 جم → يعني كل علبة تزن 300 جم، فإنتاج 200 كجم = 666 علبة
            </p>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              موقع التخزين (المستودع) <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.warehouse_id}
              onChange={(e) =>
                setFormData({ ...formData, warehouse_id: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            >
              <option value="">-- اختر موقع التخزين --</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              الرصيد الافتتاحي (الوحدات)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.balance}
              onChange={(e) =>
                setFormData({ ...formData, balance: e.target.value as any })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              ملاحظات وصفية أخرى
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

      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh] overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">بحث عن مادة للتعديل</h2>
              <button 
                type="button" 
                onClick={() => setShowSearchModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="p-5 border-b border-slate-100">
              <input
                type="text"
                placeholder="ابحث بالاسم أو الكود..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border-slate-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 shadow-sm"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto p-0">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="p-3 border-b text-slate-600 font-semibold">رقم الوثيقة</th>
                    <th className="p-3 border-b text-slate-600 font-semibold">الكود</th>
                    <th className="p-3 border-b text-slate-600 font-semibold">الاسم</th>
                    <th className="p-3 border-b text-slate-600 font-semibold w-24">تحديد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.from(new Map([...materialsList.filter((m: any) => 
          m.category === "منتج نهائي" || 
          m.category === "مواد تعبئة وتغليف" || 
          m.category === "Finished Product" ||
          m.code?.startsWith("FP") ||
          m.code?.startsWith("PM")
        ).map((m: any) => [m.code, { ...m, isDraft: false }]), ...fpForms.filter(f => f.data?.code).map(f => [f.data.code, { ...f.data, isDraft: true, record_id: f.record_id }])].filter(x => x[0])).values())
                    .filter(
                      (m: any) => 
                        (m.name || "").includes(searchTerm) || 
                        (m.code || "").includes(searchTerm)
                    )
                    .map((m: any) => (
                    <tr key={m.code} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-slate-500 text-xs">
                        {m.record_id || fpForms.find(f => f.data?.code === m.code)?.record_id || "لا يوجد مسودة"}
                      </td>
                      <td className="p-3">{m.code}</td>
                      <td className="p-3 font-medium text-slate-800">{m.name}</td>
                      <td className="p-3">
                        <button 
                          type="button" 
                          onClick={() => handleSelectMaterial(m)} 
                          className="text-stone-600 font-bold px-3 py-1.5 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors w-full"
                        >
                          تحديد
                        </button>
                      </td>
                    </tr>
                  ))}
                  {Array.from(new Map([...materialsList.filter((m: any) => 
          m.category === "منتج نهائي" || 
          m.category === "مواد تعبئة وتغليف" || 
          m.category === "Finished Product" ||
          m.code?.startsWith("FP") ||
          m.code?.startsWith("PM")
        ).map((m: any) => [m.code, m]), ...fpForms.filter(f => f.data?.code).map(f => [f.data.code, f.data])].filter(x => x[0])).values()).filter(
                      (m: any) => 
                        (m.name || "").includes(searchTerm) || 
                        (m.code || "").includes(searchTerm)
                    ).length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500">
                          لم يتم العثور على أي منتج يطابق بحثك
                        </td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
