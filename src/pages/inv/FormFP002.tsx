import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateSerialNumber } from "../../lib/utils";

export default function FormFP002() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<string[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    storageId: generateSerialNumber("STG", Math.floor(Math.random() * 10000)),
    batchNumber: "",
    warehouseLocation: "",
    quantityStored: "",
    storageDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent, status: any) => {
    e.preventDefault();

    if (status !== "draft" && formData.batchNumber && !batches.includes(formData.batchNumber)) {
      const confirmMsg = `رقم الدفعة (${formData.batchNumber}) غير مطابق لأي تفويض أو أمر إنتاج. هل أنت متأكد من رغبتك في المتابعة؟`;
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }

    const payload = {
      recordId: formData.storageId,
      formId: "F-FP-002",
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert("تم الحفظ بنجاح.");
        navigate("/inv");
      } else {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        alert("حدث خطأ: " + err.error);
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
    const authHeaders = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
    if (editId) {
      fetch(`/api/forms/record/${editId}`, { headers: authHeaders })
        .then((r) => r.json())
        .then((data) => {
          if (data && data.data) {
            setFormData((prev) => ({ ...prev, ...data.data }));
          }
        })
        .catch(console.error);
    }

    // Fetch warehouses
    fetch("/api/warehouses", { headers: authHeaders })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setWarehouses(Array.isArray(d) ? d : []))
      .catch(console.error);

    // Fetch batches from PRD and INV departments
    const b = new Set<string>();
    const extractBatches = (data: any) => {
      if (Array.isArray(data)) {
        data.forEach((r: any) => {
          if (r.data && r.data.batchNumber) b.add(r.data.batchNumber);
          if (r.data && r.data.targetBatch) b.add(r.data.targetBatch);
        });
        setBatches(Array.from(b));
      }
    };

    fetch("/api/forms/dept/PRD", { headers: authHeaders })
      .then((r) => (r.ok ? r.json() : []))
      .then(extractBatches)
      .catch(console.error);

    fetch("/api/forms/dept/INV", { headers: authHeaders })
      .then((r) => (r.ok ? r.json() : []))
      .then(extractBatches)
      .catch(console.error);
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
            تخزين وحفظ المنتجات النهائية
          </p>
        </div>
        <div className="text-left">
          <h2 className="text-xl font-bold text-slate-800 mb-1">
            تخزين المنتجات
          </h2>
          <p className="text-sm font-mono text-slate-500">نموذج: F-FP-002</p>
        </div>
      </div>
      <form className="p-8">
        <datalist id="batch-numbers-list">
          {batches.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
        <datalist id="warehouses-list">
          {warehouses.map((w) => (
            <option key={w.code} value={w.name}>
              {w.code}
            </option>
          ))}
        </datalist>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              رقم الدفعة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              list="batch-numbers-list"
              value={formData.batchNumber}
              onChange={(e) =>
                setFormData({ ...formData, batchNumber: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              موقع التخزين / المستودع <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              list="warehouses-list"
              value={formData.warehouseLocation}
              onChange={(e) =>
                setFormData({ ...formData, warehouseLocation: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              الكمية المخزنة <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              value={formData.quantityStored}
              onChange={(e) =>
                setFormData({ ...formData, quantityStored: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              تاريخ التخزين <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.storageDate}
              onChange={(e) =>
                setFormData({ ...formData, storageDate: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              ملاحظات وقيود حفظ
            </label>
            <textarea
              rows={3}
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
