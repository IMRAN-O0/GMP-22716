import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateSerialNumber, formatMaterialCode } from "../../lib/utils";
import { Save, CheckCircle, Package } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function FormRM001() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    recordId: generateSerialNumber("RM", Math.floor(Math.random() * 10000)),
    code: "",
    name: "",
    category: "مادة خام",
    description: "",
    unit: "كجم",
    warehouse_id: "",
    balance: 0,
    barcode: "",
    scientificName: "",
    purchasePrice: "",
    expiryDate: "",
    supplierName: "",
    batchNumber: "",
    countryOfOrigin: "",
    coaFileUrl: "",
    msdsFileUrl: "",
    tdsFileUrl: "",
    allergyFileUrl: "",
  });

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [rmsForms, setRmsForms] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [editFormRecordId, setEditFormRecordId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/warehouses")
      .then((r) => r.json())
      .then((data) => {
        setWarehouses(Array.isArray(data) ? data : []);
      })
      .catch(console.error);

    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((data) => {
        setSuppliers(Array.isArray(data) ? data : []);
      })
      .catch(console.error);

    fetch("/api/forms")
      .then(r => r.json())
      .then(data => {
        setRmsForms(data.filter((f: any) => f.form_id === "F-INV-RM-001"));
      })
      .catch(console.error);

    fetch("/api/materials")
      .then(r => r.json())
      .then(data => {
        setMaterials(data.filter((m: any) => m.category === 'مادة خام' || m.category === 'Raw Material' || (m.code && m.code.startsWith('RM'))));
      })
      .catch(console.error);

    const editId = new URLSearchParams(window.location.search).get("edit");
    if (editId) {
      fetch(`/api/forms/record/${editId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.data) {
            setFormData(data.data);
          }
        })
        .catch(console.error);
    }
  }, []);

  const handleSelectMaterial = (material: any) => {
    const existingForm = rmsForms.find((f: any) => f.data?.code === material.code);
    if (existingForm) {
      setFormData(existingForm.data);
      setEditFormRecordId(existingForm.record_id);
      setIsEditingForm(true);
    } else {
      setFormData({
        ...formData,
        recordId: generateSerialNumber("RM", Math.floor(Math.random() * 10000)),
        code: material.code || "",
        name: material.name || "",
        category: material.category || "مادة خام",
        description: material.description || "",
        unit: material.unit || "كجم",
        warehouse_id: material.warehouse_id || "",
        balance: material.balance || 0,
      });
      setIsEditingForm(false);
      setEditFormRecordId(null);
    }
    setShowSearchModal(false);
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [fieldName]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent, status: any) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      recordId: formData.recordId,
      formId: "F-INV-RM-001",
      department: "INV",
      creatorId: user?.id,
      status,
      data: formData,
    };

    try {
      const editId = editFormRecordId || new URLSearchParams(window.location.search).get("edit");
      const url = editId ? `/api/forms/record/${editId}` : "/api/forms";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        navigate("/inv");
      } else {
        alert("حدث خطأ أثناء الحفظ");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ في الاتصال");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-stone-50 border-b border-stone-100 p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              الشركة الحديثة للتجميل
            </h1>
            <h2 className="text-xl font-bold text-slate-800 mb-1">
              إضافة أو تعديل مواد خام (RM)
            </h2>
            <p className="text-sm text-stone-600 font-medium">
              نموذج مخصص لإضافة أو تعديل المواد الخام وتوثيقها
            </p>
          </div>
          <div className="text-left">
            <p className="text-sm text-slate-500 mb-1">
              رقم الوثيقة: F-INV-RM-001
            </p>
            <p className="text-xs text-slate-400">الإصدار: 1.0</p>
          </div>
        </div>

        <form className="p-8">
          {/* Section 1: Basic Material Info */}
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center">
            <Package className="w-5 h-5 ml-2 text-stone-500" /> المعلومات
            الأساسية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                كود المادة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: 001-0001 (F3 للبحث)"
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
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 font-mono text-sm py-2"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                اسم الصنف / الاسم التجاري{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 text-sm py-2"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                الاسم العلمي للمادة
              </label>
              <input
                type="text"
                value={formData.scientificName}
                onChange={(e) =>
                  setFormData({ ...formData, scientificName: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 text-sm py-2"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                رقم الباركود
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) =>
                  setFormData({ ...formData, barcode: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 font-mono text-sm py-2"
              />
            </div>
          </div>

          {/* Section 2: Supply & Storing */}
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center">
            التوريد والتخزين
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                اسم المورد <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="suppliers-list-rm"
                required
                placeholder="ابحث بكود أو اسم المورد..."
                value={formData.supplierName}
                onChange={(e) =>
                  setFormData({ ...formData, supplierName: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 text-sm py-2"
              />
              <datalist id="suppliers-list-rm">
                {suppliers.map((s, i) => (
                  <option key={i} value={s.name}>
                    {s.code}
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                بلد المنشأ
              </label>
              <input
                type="text"
                value={formData.countryOfOrigin}
                onChange={(e) =>
                  setFormData({ ...formData, countryOfOrigin: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 text-sm py-2"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                رقم التشغيلة (Batch Number){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.batchNumber}
                onChange={(e) =>
                  setFormData({ ...formData, batchNumber: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 text-sm py-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                تاريخ الانتهاء <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData({ ...formData, expiryDate: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 text-sm py-2"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                الوحدة القياسية <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 text-sm py-2"
              >
                <option>كجم</option>
                <option>جرام</option>
                <option>لتر</option>
                <option>مل</option>
                <option>قطعة</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                موقع التخزين المفضل <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.warehouse_id}
                onChange={(e) =>
                  setFormData({ ...formData, warehouse_id: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 text-sm py-2"
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
                سعر الشراء المتوقع
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) =>
                  setFormData({ ...formData, purchasePrice: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 text-sm py-2"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                الرصيد الافتتاحي (في حال الجرد)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.balance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    balance: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 text-sm py-2"
              />
            </div>
          </div>

          {/* Section 3: Technical Documents */}
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center">
            الشهادات والوثائق الفنية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                شهادة التحليل (COA)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, "coaFileUrl")}
                  className="w-full border border-slate-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 text-sm"
                />
                {formData.coaFileUrl && (
                  <span className="absolute left-2 top-3 text-emerald-500 text-xs font-bold">
                    تم الرفق ✓
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                صحيفة بيانات السلامة (MSDS)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, "msdsFileUrl")}
                  className="w-full border border-slate-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 text-sm"
                />
                {formData.msdsFileUrl && (
                  <span className="absolute left-2 top-3 text-emerald-500 text-xs font-bold">
                    تم الرفق ✓
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                المواصفات الفنية (TDS)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, "tdsFileUrl")}
                  className="w-full border border-slate-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 text-sm"
                />
                {formData.tdsFileUrl && (
                  <span className="absolute left-2 top-3 text-emerald-500 text-xs font-bold">
                    تم الرفق ✓
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                شهادة الحساسية (Allergen Info)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, "allergyFileUrl")}
                  className="w-full border border-slate-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 text-sm"
                />
                {formData.allergyFileUrl && (
                  <span className="absolute left-2 top-3 text-emerald-500 text-xs font-bold">
                    تم الرفق ✓
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              ملاحظات إضافية
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 text-sm p-3"
            ></textarea>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-4">
            {isEditingForm && (
              <button
                type="button"
                onClick={() => {
                  setIsEditingForm(false);
                  setEditFormRecordId(null);
                  setFormData({
                    recordId: generateSerialNumber("RM", Math.floor(Math.random() * 10000)),
                    code: "",
                    name: "",
                    category: "مادة خام",
                    description: "",
                    unit: "كجم",
                    warehouse_id: "",
                    balance: 0,
                    barcode: "",
                    scientificName: "",
                    purchasePrice: "",
                    expiryDate: "",
                    supplierName: "",
                    batchNumber: "",
                    countryOfOrigin: "",
                    coaFileUrl: "",
                    msdsFileUrl: "",
                    tdsFileUrl: "",
                    allergyFileUrl: "",
                  });
                }}
                className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 px-6 rounded-xl border border-slate-200 hover:bg-slate-200 transition-colors flex items-center justify-center min-w-[200px]"
              >
                إلغاء التعديل
              </button>
            )}
            <button
              type="button"
              onClick={(e) => handleSubmit(e, "draft")}
              disabled={loading}
              className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 px-6 rounded-xl border border-slate-300 hover:bg-slate-200 transition-colors flex items-center justify-center min-w-[200px]"
            >
              <Save className="w-5 h-5 ml-2 text-slate-500" />
              حفظ كمسودة
            </button>
            {user?.level <= 2 ? (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, "approved")}
                disabled={loading}
                className="flex-1 bg-stone-800 text-white font-bold py-3 px-6 rounded-xl hover:bg-stone-900 transition-colors flex items-center justify-center"
              >
                {user?.level <= 2 ? (
                  <>
                    <CheckCircle className="w-5 h-5 ml-2" />
                    اعتماد وتسجيل المادة الخام
                  </>
                ) : (
                  "إرسال للمراجعة / الاعتماد"
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) =>
                  handleSubmit(
                    e,
                    user?.level === 3 ? "pending_approval" : "pending_review",
                  )
                }
                disabled={loading}
                className="flex-1 bg-sky-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-sky-700 transition-colors flex items-center justify-center"
              >
                {user?.level <= 2
                  ? "إرسال للمراجعة / الاعتماد"
                  : "إرسال للمراجعة / الاعتماد"}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) navigate(-1);
                else navigate("/inv");
              }}
              className="flex-1 bg-white text-slate-700 font-bold py-3 px-6 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center"
            >
              إغلاق والعودة
            </button>
          </div>
        </form>
      </div>

      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[80vh] overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">بحث عن مواد خام مضافة سابقاً (F3)</h2>
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
                className="w-full border-slate-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-stone-400 focus:border-stone-400 shadow-sm"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto p-0">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="p-3 border-b text-slate-600 font-semibold">رقم الوثيقة</th>
                    <th className="p-3 border-b text-slate-600 font-semibold">كود المادة</th>
                    <th className="p-3 border-b text-slate-600 font-semibold">الاسم</th>
                    <th className="p-3 border-b text-slate-600 font-semibold w-24">تحديد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.from(new Map([...materials.filter((m: any) => 
          m.category === "مادة خام" || m.category === "Raw Material" || m.code?.startsWith("RM")
        ).map((m: any) => [m.code, { ...m, isDraft: false }]), ...rmsForms.filter(f => f.data?.code).map(f => [f.data.code, { ...f.data, isDraft: true, record_id: f.record_id }])].filter(x => x[0])).values())
                    .filter(
                      (m: any) => 
                        (m.name || "").includes(searchTerm) || 
                        (m.code || "").includes(searchTerm)
                    )
                    .map((m: any) => (
                    <tr key={m.code} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-slate-500 text-xs">
                        {m.record_id || rmsForms.find(f => f.data?.code === m.code)?.record_id || "لا يوجد مسودة"}
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
                  {Array.from(new Map([...materials.filter((m: any) => 
          m.category === "مادة خام" || m.category === "Raw Material" || m.code?.startsWith("RM")
        ).map((m: any) => [m.code, m]), ...rmsForms.filter(f => f.data?.code).map(f => [f.data.code, f.data])].filter(x => x[0])).values()).filter(
                      (m: any) => 
                        (m.name || "").includes(searchTerm) || 
                        (m.code || "").includes(searchTerm)
                    ).length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500">
                          لم يتم العثور على أي مواد مطابقة
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
