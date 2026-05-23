import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateSerialNumber } from "../../lib/utils";

export default function FormFP001() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [productionOrders, setProductionOrders] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [company, setCompany] = useState<any>({});
  const [materialInfo, setMaterialInfo] = useState<any>(null); // package size info

  const [formData, setFormData] = useState({
    releaseId: generateSerialNumber("REL", Math.floor(Math.random() * 10000)),
    productionOrderNo: "",
    batchNumber: "",
    productName: "",
    productCode: "",
    releasedQuantity: "",
    warehouseId: "",
    qcStatus: "Approved",
    releaseDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
    fetch("/api/company", { headers }).then(r => r.json()).then(d => setCompany(d || {})).catch(() => {});
    fetch("/api/warehouses", { headers })
      .then(r => r.json())
      .then(d => setWarehouses(Array.isArray(d) ? d.filter((w: any) => w.name && w.name !== "0") : []))
      .catch(console.error);
    fetch("/api/forms/dept/PRD", { headers })
      .then(r => r.json())
      .then(data => {
        const orders = Array.isArray(data) ? data.filter((f: any) => f.form_id === "F-PRD-001" && f.status === "approved") : [];
        setProductionOrders(orders);
      })
      .catch(console.error);

    const editId = new URLSearchParams(window.location.search).get("edit");
    if (editId) {
      fetch(`/api/forms/record/${editId}`, { headers })
        .then(r => r.json())
        .then(data => { if (data?.data) setFormData(prev => ({ ...prev, ...data.data })); })
        .catch(console.error);
    }
  }, []);

  // Convert quantity to base unit (g or ml)
  const toBase = (qty: number, unit: string): number => {
    switch (unit?.toLowerCase()) {
      case "كجم": case "kg": return qty * 1000;
      case "جم": case "جرام": case "g": return qty;
      case "مجم": case "mg": return qty / 1000;
      case "لتر": case "l": case "liter": return qty * 1000;
      case "مل": case "ml": return qty;
      default: return qty; // same unit — no conversion
    }
  };

  const calcUnits = (productionQty: number, productionUnit: string, pkgSize: number, pkgUnit: string): number => {
    // If units are the same, divide directly
    if (!pkgSize || pkgSize <= 0) return productionQty;
    const prodBase = toBase(productionQty, productionUnit);
    const pkgBase = toBase(pkgSize, pkgUnit);
    // If both converted to same base (g or ml), divide
    const wt = ["كجم","kg","جم","جرام","g","مجم","mg"];
    const vol = ["لتر","l","liter","مل","ml"];
    const prodIsWeight = wt.some(u => u === productionUnit?.toLowerCase() || productionUnit === u);
    const pkgIsWeight = wt.some(u => u === pkgUnit?.toLowerCase() || pkgUnit === u);
    const prodIsVol = vol.some(u => u === productionUnit?.toLowerCase() || productionUnit === u);
    const pkgIsVol = vol.some(u => u === pkgUnit?.toLowerCase() || pkgUnit === u);
    if ((prodIsWeight && pkgIsWeight) || (prodIsVol && pkgIsVol)) {
      return prodBase / pkgBase;
    }
    // fallback: direct division without unit conversion
    return productionQty / pkgSize;
  };

  const handleOrderChange = async (val: string) => {
    const codeMatch = val.match(/^([A-Za-z0-9-]+) - /);
    const selectedOrderNo = codeMatch ? codeMatch[1] : val;
    const order = productionOrders.find(
      (o) => o.data?.productionOrderNo === selectedOrderNo || o.record_id === selectedOrderNo
    );
    if (!order?.data) {
      setMaterialInfo(null);
      setFormData(prev => ({ ...prev, productionOrderNo: selectedOrderNo, productName: "", batchNumber: "", productCode: "", releasedQuantity: "" }));
      return;
    }

    const d = order.data;
    const productCode = d.itemNumber || d.productCode || "";
    const productionQty = parseFloat(d.actualQuantity || d.plannedQuantity) || 0;
    const productionUnit = d.quantityUnit || d.unit || "كجم";

    // Fetch material package size
    let matInfo: any = null;
    let relQty = String(productionQty || "");
    if (productCode) {
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
        const res = await fetch(`/api/materials/by-code/${encodeURIComponent(productCode)}`, { headers });
        if (res.ok) {
          matInfo = await res.json();
          if (matInfo.packageSize && matInfo.packageSize > 0 && productionQty > 0) {
            const units = calcUnits(productionQty, productionUnit, matInfo.packageSize, matInfo.packageSizeUnit || matInfo.package_size_unit || "جم");
            relQty = String(Math.floor(units * 100) / 100); // round to 2 decimal
          }
        }
      } catch { /* ignore */ }
    }

    setMaterialInfo(matInfo);
    setFormData(prev => ({
      ...prev,
      productionOrderNo: selectedOrderNo,
      productName: d.productName || "",
      batchNumber: d.batchNumber || "",
      productCode,
      releasedQuantity: relQty,
      productionQty: String(productionQty),
      productionUnit,
    }));
  };

  const handleSubmit = async (e: React.FormEvent, status: any) => {
    e.preventDefault();
    if (status !== "draft" && !formData.productCode) {
      alert("يجب تحديد أمر إنتاج صحيح مرتبط بكود منتج.");
      return;
    }
    if (status !== "draft" && !formData.warehouseId) {
      alert("يجب تحديد المستودع.");
      return;
    }
    const editId = new URLSearchParams(window.location.search).get("edit");
    try {
      setLoading(true);
      const res = await fetch(editId ? `/api/forms/record/${editId}` : "/api/forms", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ recordId: formData.releaseId, formId: "F-FP-001", department: "INV", creatorId: user?.id, status, data: formData }),
      });
      if (res.ok) { alert("تم الحفظ بنجاح."); navigate("/inv"); }
      else { const e = await res.json().catch(() => ({ error: "خطأ" })); alert("حدث خطأ: " + e.error); }
    } catch (err: any) { alert("خطأ: " + err.message); }
    finally { setLoading(false); }
  };

  const selectedWarehouse = warehouses.find(w => String(w.id) === String(formData.warehouseId));

  return (
    <div className="max-w-4xl mx-auto bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
      <div className="border-b border-slate-200 p-6 flex justify-between items-center bg-slate-50">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{company.name_ar || "نظام الجودة"}</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">إطلاق وتخزين المنتجات النهائية</p>
        </div>
        <div className="text-left">
          <h2 className="text-xl font-bold text-slate-800 mb-1">إطلاق الدفعة</h2>
          <p className="text-sm font-mono text-slate-500">نموذج: F-FP-001</p>
        </div>
      </div>
      <form className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="md:col-span-2">
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">أمر الإنتاج <span className="text-red-500">*</span></label>
            <input
              type="text" list="production-orders-list-fp001" required
              placeholder="ابحث برقم أمر الإنتاج أو اسم المنتج..."
              value={formData.productionOrderNo}
              onChange={e => handleOrderChange(e.target.value)}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
            />
            <datalist id="production-orders-list-fp001">
              {productionOrders.map((order, i) => (
                <option key={i} value={`${order.data?.productionOrderNo || order.record_id} - ${order.data?.productName || ""}`} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">رقم الدفعة</label>
            <input type="text" readOnly disabled value={formData.batchNumber}
              className="w-full border-slate-200 bg-slate-50 rounded-lg shadow-sm text-sm py-2 text-slate-500 font-mono" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">كود المنتج</label>
            <input type="text" readOnly disabled value={formData.productCode}
              className="w-full border-slate-200 bg-slate-50 rounded-lg shadow-sm text-sm py-2 text-slate-500 font-mono" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">اسم المنتج</label>
            <input type="text" readOnly disabled value={formData.productName}
              className="w-full border-slate-200 bg-slate-50 rounded-lg shadow-sm text-sm py-2 text-slate-500" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              الكمية المُفرج عنها ({materialInfo ? (materialInfo.unit || "قطعة") : "وحدة"}) <span className="text-red-500">*</span>
            </label>
            <input type="number" readOnly disabled value={formData.releasedQuantity}
              className="w-full border-slate-200 bg-amber-50 rounded-lg shadow-sm text-sm py-2 font-bold text-amber-800 border-amber-200" />
            {materialInfo?.packageSize ? (
              <p className="text-[11px] text-sky-600 mt-1 font-semibold">
                حساب تلقائي: {(formData as any).productionQty} {(formData as any).productionUnit} ÷ {materialInfo.packageSize} {materialInfo.packageSizeUnit || materialInfo.package_size_unit} = {formData.releasedQuantity} {materialInfo.unit || "قطعة"}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                {materialInfo ? "لم يُحدد حجم العبوة في تعريف المنتج — الكمية من أمر الإنتاج مباشرة" : "من أمر الإنتاج"}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">مستودع التخزين <span className="text-red-500">*</span></label>
            <select required value={formData.warehouseId} onChange={e => setFormData({ ...formData, warehouseId: e.target.value })}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2">
              <option value="">-- اختر المستودع --</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">حالة فحص الجودة <span className="text-red-500">*</span></label>
            <select required value={formData.qcStatus} onChange={e => setFormData({ ...formData, qcStatus: e.target.value })}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2">
              <option value="Approved">معتمد — مطابق للمواصفات</option>
              <option value="Rejected">مرفوض — غير مطابق</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">تاريخ الإطلاق <span className="text-red-500">*</span></label>
            <input type="date" required value={formData.releaseDate} onChange={e => setFormData({ ...formData, releaseDate: e.target.value })}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">ملاحظات</label>
            <textarea rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2" />
          </div>
        </div>

        {formData.productCode && formData.releasedQuantity && formData.qcStatus === "Approved" && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
            <span className="font-bold text-emerald-700">عند الاعتماد: سيتم إضافة </span>
            <span className="font-bold text-emerald-900">{formData.releasedQuantity} وحدة </span>
            <span className="font-bold text-emerald-700">من المنتج </span>
            <span className="font-mono font-bold text-emerald-900">{formData.productCode}</span>
            {formData.productName && <span className="text-emerald-700"> ({formData.productName})</span>}
            {selectedWarehouse && <span className="text-emerald-700"> إلى مستودع "{selectedWarehouse.name}"</span>}
          </div>
        )}
        {formData.qcStatus === "Rejected" && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm">
            <span className="font-bold text-rose-700">الدفعة مرفوضة — لن يُضاف أي رصيد للمستودع.</span>
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
            className="text-slate-500 hover:text-slate-700 font-semibold text-[14px]">إغلاق والعودة</button>
        </div>
      </form>
    </div>
  );
}
