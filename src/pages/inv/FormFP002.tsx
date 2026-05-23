import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateSerialNumber } from "../../lib/utils";
import { SearchModal, SearchField } from "../../components/SearchModal";

export default function FormFP002() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<string[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [finishedProducts, setFinishedProducts] = useState<any[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [company, setCompany] = useState<any>({});

  const [formData, setFormData] = useState({
    storageId: generateSerialNumber("STG", Math.floor(Math.random() * 10000)),
    batchNumber: "",
    productCode: "",
    productName: "",
    warehouseLocation: "",
    quantityStored: "",
    storageDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

    fetch("/api/company", { headers }).then(r => r.json()).then(d => setCompany(d || {})).catch(() => {});

    fetch("/api/warehouses", { headers })
      .then(r => r.json())
      .then(d => setWarehouses(Array.isArray(d) ? d.filter(w => w.id && w.name && w.name !== "0") : []))
      .catch(console.error);

    fetch("/api/materials", { headers })
      .then(r => r.json())
      .then(d => setFinishedProducts(Array.isArray(d) ? d.filter((m: any) => m.category === "منتج نهائي" || m.code?.startsWith("FD-")) : []))
      .catch(console.error);

    // Gather existing batch numbers from PRD+INV
    const b = new Set<string>();
    const extract = (data: any) => { if (Array.isArray(data)) data.forEach((r: any) => { if (r.data?.batchNumber) b.add(r.data.batchNumber); }); setBatches(Array.from(b)); };
    Promise.all([
      fetch("/api/forms/dept/PRD", { headers }).then(r => r.json()),
      fetch("/api/forms/dept/INV", { headers }).then(r => r.json()),
    ]).then(([prd, inv]) => { extract(prd); extract(inv); }).catch(console.error);

    // Load edit
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
      const res = await fetch("/api/forms/dept/PRD", { headers });
      const forms = await res.json();
      const prd = forms.find((f: any) => f.form_id === "F-PRD-001" && f.data?.batchNumber === batchNum);
      if (prd?.data?.itemNumber) {
        const matRes = await fetch("/api/materials", { headers });
        const mats = await matRes.json();
        const mat = mats.find((m: any) => m.code === prd.data.itemNumber);
        setFormData(prev => ({
          ...prev,
          batchNumber: batchNum,
          productCode: prd.data.itemNumber,
          productName: mat?.name || prd.data.productName || "",
        }));
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
        body: JSON.stringify({ recordId: formData.storageId, formId: "F-FP-002", department: "INV", creatorId: user?.id, status, data: formData }),
      });
      if (res.ok) { alert("تم الحفظ بنجاح."); navigate("/inv"); }
      else { const e = await res.json().catch(() => ({ error: "خطأ" })); alert("حدث خطأ: " + e.error); }
    } catch (err: any) { alert("خطأ: " + err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
      <div className="border-b border-slate-200 p-6 flex justify-between items-center bg-slate-50">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{company.name_ar || "نظام الجودة"}</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">تخزين وحفظ المنتجات النهائية</p>
        </div>
        <div className="text-left">
          <h2 className="text-xl font-bold text-slate-800 mb-1">تخزين المنتجات</h2>
          <p className="text-sm font-mono text-slate-500">نموذج: F-FP-002</p>
        </div>
      </div>
      <form className="p-8">
        <datalist id="batch-numbers-list">
          {batches.map(b => <option key={b} value={b} />)}
        </datalist>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Batch Number */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              رقم الدفعة <span className="text-red-500">*</span>
            </label>
            <input
              type="text" required list="batch-numbers-list"
              value={formData.batchNumber}
              onChange={e => handleBatchChange(e.target.value)}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
            />
          </div>

          {/* Product Code — auto-filled or manual F3 */}
          <div>
            <SearchField
              label="كود المنتج النهائي"
              required
              value={formData.productCode}
              onChange={v => {
                const mat = finishedProducts.find(m => m.code === v);
                setFormData(prev => ({ ...prev, productCode: v, productName: mat?.name || prev.productName }));
              }}
              onF3={() => setShowProductModal(true)}
              placeholder="اكتب أو اضغط F3 للبحث…"
              hint={formData.productName ? `المنتج: ${formData.productName}` : "يتم التعبئة تلقائياً من رقم الدفعة أو F3"}
            />
          </div>

          {/* Warehouse */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              موقع التخزين / المستودع <span className="text-red-500">*</span>
            </label>
            <select
              required value={formData.warehouseLocation}
              onChange={e => setFormData({ ...formData, warehouseLocation: e.target.value })}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
            >
              <option value="">-- اختر المستودع --</option>
              {warehouses.map(w => <option key={w.id} value={w.name}>{w.name} ({w.code})</option>)}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              الكمية المخزنة <span className="text-red-500">*</span>
            </label>
            <input
              type="number" required min="0.01" step="0.01"
              value={formData.quantityStored}
              onChange={e => setFormData({ ...formData, quantityStored: e.target.value })}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
            />
          </div>

          {/* Storage Date */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              تاريخ التخزين <span className="text-red-500">*</span>
            </label>
            <input
              type="date" required value={formData.storageDate}
              onChange={e => setFormData({ ...formData, storageDate: e.target.value })}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">ملاحظات وقيود حفظ</label>
            <textarea rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2" />
          </div>
        </div>

        {/* Summary */}
        {formData.productCode && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
            <span className="font-bold text-emerald-700">سيتم إضافة </span>
            <span className="font-bold text-emerald-900">{formData.quantityStored || "—"} </span>
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
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-[14px] flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> حفظ واعتماد
            </button>
          ) : (
            <button type="button" disabled={loading} onClick={e => handleSubmit(e, user?.level === 3 ? "pending_approval" : "pending_review")}
              className="px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold text-[14px]">
              إرسال للمراجعة
            </button>
          )}
          <div className="flex-1" />
          <button type="button" disabled={loading} onClick={() => navigate(-1)}
            className="text-slate-500 hover:text-slate-700 font-semibold text-[14px]">
            إغلاق والعودة
          </button>
        </div>
      </form>

      {showProductModal && (
        <SearchModal
          title="بحث عن منتج نهائي (F3)"
          items={finishedProducts}
          columns={[
            { key: "code", label: "الكود", className: "font-mono w-28" },
            { key: "name", label: "اسم المنتج" },
            { key: "balance", label: "الرصيد الحالي", className: "w-28" },
          ]}
          searchKeys={["code", "name"]}
          placeholder="ابحث بالكود أو الاسم…"
          onSelect={m => { setFormData(prev => ({ ...prev, productCode: m.code, productName: m.name })); setShowProductModal(false); }}
          onClose={() => setShowProductModal(false)}
        />
      )}
    </div>
  );
}
