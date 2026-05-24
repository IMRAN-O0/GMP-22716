import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateSerialNumber } from "../../lib/utils";
import { SearchModal, SearchField } from "../../components/SearchModal";

export default function FormFP004() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [finishedProducts, setFinishedProducts] = useState<any[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [company, setCompany] = useState<any>({});

  const [formData, setFormData] = useState({
    returnId: generateSerialNumber("RET", Math.floor(Math.random() * 10000)),
    customerName: "",
    batchNumber: "",
    productCode: "",
    productName: "",
    returnedQuantity: "",
    returnReason: "",
    condition: "سليم",
    actionTaken: "",
  });

  useEffect(() => {
    const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
    fetch("/api/company", { headers }).then(r => r.json()).then(d => setCompany(d || {})).catch(() => {});
    fetch("/api/customers", { headers }).then(r => r.json()).then(d => setCustomers(Array.isArray(d) ? d : [])).catch(console.error);
    fetch("/api/materials", { headers })
      .then(r => r.json())
      .then(d => setFinishedProducts(Array.isArray(d) ? d.filter((m: any) => m.category === "منتج نهائي" || m.code?.startsWith("FD-")) : []))
      .catch(console.error);

    const editId = new URLSearchParams(window.location.search).get("edit");
    if (editId) {
      fetch(`/api/forms/record/${editId}`, { headers })
        .then(r => r.json())
        .then(data => { if (data?.data) setFormData(prev => ({ ...prev, ...data.data })); })
        .catch(console.error);
    }
  }, []);

  // Auto-fill product from PRD-001 when batchNumber changes
  const handleBatchChange = async (batchNum: string) => {
    setFormData(prev => ({ ...prev, batchNumber: batchNum, productCode: "", productName: "" }));
    if (!batchNum) return;
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const forms = await fetch("/api/forms/dept/PRD", { headers }).then(r => r.json());
      const prd = forms.find((f: any) => f.form_id === "F-PRD-001" && f.data?.batchNumber === batchNum);
      if (prd?.data?.itemNumber) {
        const mats = await fetch("/api/materials", { headers }).then(r => r.json());
        const mat = mats.find((m: any) => m.code === prd.data.itemNumber);
        setFormData(prev => ({ ...prev, batchNumber: batchNum, productCode: prd.data.itemNumber, productName: mat?.name || prd.data.productName || "" }));
      }
    } catch { /* ignore */ }
  };

  const handleSubmit = async (e: React.FormEvent, status: any) => {
    e.preventDefault();
    if (status !== "draft" && !formData.productCode) {
      alert("يجب تحديد كود المنتج النهائي. تأكد من رقم الدفعة أو اختر المنتج يدوياً.");
      return;
    }
    const editIdPatch = new URLSearchParams(window.location.search).get("edit");
    try {
      setLoading(true);
      const res = await fetch(editIdPatch ? `/api/forms/record/${editIdPatch}` : "/api/forms", {
        method: editIdPatch ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ recordId: formData.returnId, formId: "F-FP-004", department: "INV", creatorId: user?.id, status, data: formData }),
      });
      if (res.ok) { alert("تم الحفظ بنجاح."); navigate("/inv"); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
      <div className="border-b border-slate-200 p-6 flex justify-between items-center bg-slate-50">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{company.name_ar || "نظام الجودة"}</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">تتبع وإدارة المرتجعات</p>
        </div>
        <div className="text-left">
          <h2 className="text-xl font-bold text-slate-800 mb-1">إرجاع المنتجات</h2>
          <p className="text-sm font-mono text-slate-500">نموذج: F-FP-004</p>
        </div>
      </div>
      <form className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <SearchField label="العميل" required value={formData.customerName}
              onChange={v => setFormData({ ...formData, customerName: v })}
              onF3={() => setShowCustomerModal(true)} placeholder="اكتب أو F3 للبحث…" hint="F3 للبحث في قائمة العملاء" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">رقم الدفعة المرتجعة <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.batchNumber} onChange={e => handleBatchChange(e.target.value)}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2" />
          </div>
          <div>
            <SearchField label="كود المنتج النهائي" required value={formData.productCode}
              onChange={v => { const mat = finishedProducts.find(m => m.code === v); setFormData(prev => ({ ...prev, productCode: v, productName: mat?.name || prev.productName })); }}
              onF3={() => setShowProductModal(true)}
              placeholder="اكتب أو F3 للبحث…"
              hint={formData.productName ? `المنتج: ${formData.productName}` : "يتم التعبئة تلقائياً من رقم الدفعة"} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">الكمية المرتجعة <span className="text-red-500">*</span></label>
            <input type="number" required min="0.01" step="0.01" value={formData.returnedQuantity} onChange={e => setFormData({ ...formData, returnedQuantity: e.target.value })}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">حالة المنتج المرتجع <span className="text-red-500">*</span></label>
            <select required value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value })}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2">
              <option value="سليم">سليم (صالح للاستخدام)</option>
              <option value="تالف">تالف</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">سبب الإرجاع</label>
            <textarea rows={2} required value={formData.returnReason} onChange={e => setFormData({ ...formData, returnReason: e.target.value })}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">الإجراء المتخذ</label>
            <textarea rows={2} required value={formData.actionTaken} onChange={e => setFormData({ ...formData, actionTaken: e.target.value })}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2" />
          </div>
        </div>

        {formData.productCode && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
            <span className="font-bold text-emerald-700">سيتم إضافة </span>
            <span className="font-bold text-emerald-900">{formData.returnedQuantity || "—"} </span>
            <span className="font-bold text-emerald-700">وحدة للمنتج </span>
            <span className="font-mono font-bold text-emerald-900">{formData.productCode}</span>
            {formData.productName && <span className="text-emerald-700"> ({formData.productName})</span>}
            <span className="text-emerald-700"> عند الاعتماد</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-200">
          <button type="button" disabled={loading} onClick={e => handleSubmit(e, "draft")}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[14px]">
            حفظ كمسودة
          </button>
          {user?.level <= 2 ? (
            <button type="button" disabled={loading} onClick={e => handleSubmit(e, "approved")}
              className="px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold text-[14px] flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> حفظ واعتماد
            </button>
          ) : (
            <button type="button" disabled={loading} onClick={e => handleSubmit(e, user?.level === 3 ? "pending_approval" : "pending_review")}
              className="px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold text-[14px]">
              إرسال للمراجعة
            </button>
          )}
          <div className="flex-1" />
          <button type="button" disabled={loading} onClick={() => navigate(-1)}
            className="text-slate-500 hover:text-slate-700 font-semibold text-[14px]">إغلاق والعودة</button>
        </div>
      </form>

      {showCustomerModal && (
        <SearchModal title="بحث عن عميل (F3)" items={customers}
          columns={[{ key: "code", label: "كود", className: "font-mono w-28" }, { key: "name", label: "اسم العميل" }, { key: "phone", label: "الهاتف", className: "w-32" }]}
          searchKeys={["code", "name"]} placeholder="ابحث بكود أو اسم العميل…"
          onSelect={c => { setFormData({ ...formData, customerName: c.name }); setShowCustomerModal(false); }}
          onClose={() => setShowCustomerModal(false)} />
      )}
      {showProductModal && (
        <SearchModal title="بحث عن منتج نهائي (F3)" items={finishedProducts}
          columns={[{ key: "code", label: "الكود", className: "font-mono w-28" }, { key: "name", label: "اسم المنتج" }, { key: "balance", label: "الرصيد", className: "w-24" }]}
          searchKeys={["code", "name"]} placeholder="ابحث بالكود أو الاسم…"
          onSelect={m => { setFormData(prev => ({ ...prev, productCode: m.code, productName: m.name })); setShowProductModal(false); }}
          onClose={() => setShowProductModal(false)} />
      )}
    </div>
  );
}
