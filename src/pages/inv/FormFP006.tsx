import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateSerialNumber, formatMaterialCode, getJsonHeaders } from "../../lib/utils";

export default function FormFP006() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/materials")
      .then((r) => r.json())
      .then((data) => setProducts(data))
      .catch(console.error);
  }, []);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sampleId: generateSerialNumber("SMP", Math.floor(Math.random() * 10000)),
    batchNumber: "",
    productCode: "",
    productName: "",
    sampleQuantity: "",
    storageLocation: "",
    retentionPeriodMonths: "12",
    expiryDate: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent, status: any) => {
    e.preventDefault();
    const payload = {
      recordId: formData.sampleId,
      formId: "F-FP-006",
      department: "INV",
      creatorId: user?.id,
      status,
      data: formData,
    };

    try {
      const editIdPatch = new URLSearchParams(window.location.search).get(
        "edit",
      );
      const fetchUrl = editIdPatch
        ? `/api/forms/record/${editIdPatch}`
        : "/api/forms";
      const fetchMethod = editIdPatch ? "PUT" : "POST";
      const res = await fetch(fetchUrl, {
        method: fetchMethod,
        headers: getJsonHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert("تم الحفظ بنجاح.");
        navigate("/inv");
      }
    } catch (err) {
      console.error(err);
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
            تتبع حفظ العينات
          </p>
        </div>
        <div className="text-left">
          <h2 className="text-xl font-bold text-slate-800 mb-1">
            العينات الاحتياطية
          </h2>
          <p className="text-sm font-mono text-slate-500">نموذج: F-FP-006</p>
        </div>
      </div>
      <form className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              رقم الدفعة المرجعي <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.batchNumber}
              onChange={(e) =>
                setFormData({ ...formData, batchNumber: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              كود المنتج (Item Number) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              list="products-list-fp006"
              required
              placeholder="ابحث بكود أو اسم المنتج..."
              value={formData.productCode || ""}
              onChange={(e) => {
                const currentVal = e.target.value;
                const codeMatch = currentVal.match(/^([A-Za-z0-9-]+) - /);
                const code = codeMatch ? codeMatch[1] : currentVal;
                const foundProduct = products.find((p: any) => p.code === code);
                setFormData({
                  ...formData,
                  productCode: formatMaterialCode(code),
                  productName: foundProduct
                    ? foundProduct.name
                    : formData.productName,
                });
              }}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
            />
            <datalist id="products-list-fp006">
              {products.map((p: any) => (
                <option key={p.id} value={`${p.code} - ${p.name}`} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              اسم المنتج <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              readOnly
              disabled
              placeholder="يتم سحبه تلقائياً..."
              value={formData.productName}
              className="w-full border-slate-300 bg-slate-50 text-slate-600 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              كمية العينة المحتفظ بها <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.sampleQuantity}
              onChange={(e) =>
                setFormData({ ...formData, sampleQuantity: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              موقع تخزين العينة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.storageLocation}
              onChange={(e) =>
                setFormData({ ...formData, storageLocation: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              فترة الاحتفاظ (بالشهور)
            </label>
            <input
              type="number"
              required
              value={formData.retentionPeriodMonths}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  retentionPeriodMonths: e.target.value,
                })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              تاريخ الانتهاء المرجعي <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.expiryDate}
              onChange={(e) =>
                setFormData({ ...formData, expiryDate: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              ملاحظات والتوجيه
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
            ></textarea>
          </div>
        </div>
                        <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-200">
          <button
            type="button"
            disabled={loading}
            onClick={(e) => handleSubmit(e, "draft")}
            className="flex items-center px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[14px]"
          >
            حفظ كمسودة
          </button>
          
          {user?.level <= 2 ? (
            <button
              type="button"
              disabled={loading}
              onClick={(e) => handleSubmit(e, "approved")}
              className="flex items-center px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold text-[14px]"
            >
              حفظ واعتماد
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
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
            disabled={loading}
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
    </div>
  );
}
