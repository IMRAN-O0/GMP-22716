import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateSerialNumber } from "../../lib/utils";

export default function FormPRD002() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [sysDate] = useState(new Date().toLocaleDateString("ar-EG"));

  const [productionOrders, setProductionOrders] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    productionOrderNo: "",
    productName: "",
    batchNumber: "",
    actualStartDateTime: "",
    actualEndDateTime: "",
    supervisorName: "",
    workers: [] as string[],
    manufacturingSteps: "",
    actualProducedQty: "",
    wasteAmount: "",
    wasteReason: "",
    notes: "",
  });

  useEffect(() => {
    // Fetch PRD forms to find F-PRD-001 (Production Orders)
    fetch("/api/forms/dept/PRD")
      .then((r) => r.json())
      .then((data) => {
        const orders = data.filter(
          (f: any) => f.form_id === "F-PRD-001" && f.status === "approved",
        );
        setProductionOrders(orders);
      })
      .catch(console.error);

    // Fetch active employees
    fetch("/api/employees")
      .then((r) => r.json())
      .then((data) => {
        setEmployees(Array.isArray(data) ? data : []);
      })
      .catch(console.error);
  }, []);

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentVal = e.target.value;
    const codeMatch = currentVal.match(/^([A-Za-z0-9-]+) - /);
    const selectedOrderNo = codeMatch ? codeMatch[1] : currentVal;
    const order = productionOrders.find(
      (o) =>
        o.data?.productionOrderNo === selectedOrderNo ||
        o.record_id === selectedOrderNo,
    );

    if (order && order.data) {
      setFormData((prev) => ({
        ...prev,
        productionOrderNo: order.data.productionOrderNo || order.record_id,
        productName: order.data.productName || "",
        batchNumber: order.data.batchNumber || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        productionOrderNo: selectedOrderNo,
        productName: "",
        batchNumber: "",
      }));
    }
  };

  const handleWorkerSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option: HTMLOptionElement) => option.value,
    );
    setFormData((prev) => ({ ...prev, workers: selectedOptions }));
  };

  const handleSubmit = async (e: React.FormEvent, status: any) => {
    e.preventDefault();
    const recordId = generateSerialNumber(
      "BMR",
      Math.floor(Math.random() * 10000),
    );

    const payload = {
      recordId,
      formId: "F-PRD-002",
      department: "PRD",
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
        alert(`تم الحفظ بنجاح. رقم المستند: ${recordId}`);
        navigate("/prd");
      } else {
        alert("حدث خطأ أثناء الحفظ");
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
            ISO 22716 - GMP
          </p>
        </div>
        <div className="text-left">
          <h2 className="text-xl font-bold text-slate-800 mb-1">
            سجل التصنيع (BMR)
          </h2>
          <p className="text-sm font-mono text-slate-500">نموذج: F-PRD-002</p>
          <p className="text-sm font-mono text-slate-500">
            تاريخ الإصدار: 01-01-2025
          </p>
        </div>
      </div>

      <form className="p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
          الربط مع أمر الإنتاج
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              رقم أمر الإنتاج <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              list="production-orders-list-prd002"
              required
              placeholder="ابحث برقم أمر الإنتاج أو اسم المنتج..."
              value={formData.productionOrderNo}
              onChange={handleOrderChange}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
            <datalist id="production-orders-list-prd002">
              {productionOrders.map((order, i) => {
                const orderNo =
                  order.data?.productionOrderNo || order.record_id;
                return (
                  <option
                    key={i}
                    value={`${orderNo} - ${order.data?.productName || ""}`}
                  />
                );
              })}
            </datalist>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              اسم المنتج (تلقائي)
            </label>
            <input
              type="text"
              readOnly
              disabled
              value={formData.productName}
              className="w-full border-slate-200 bg-slate-50 rounded-lg shadow-sm text-sm py-2 text-slate-500"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              رقم الدفعة (تلقائي)
            </label>
            <input
              type="text"
              readOnly
              disabled
              value={formData.batchNumber}
              className="w-full border-slate-200 bg-slate-50 rounded-lg shadow-sm text-sm py-2 text-slate-500 font-mono"
            />
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
          سجل التنفيذ والتصنيع
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              تاريخ وساعة البدء الفعلي <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={formData.actualStartDateTime}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  actualStartDateTime: e.target.value,
                })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              تاريخ وساعة الانتهاء الفعلي
            </label>
            <input
              type="datetime-local"
              value={formData.actualEndDateTime}
              onChange={(e) =>
                setFormData({ ...formData, actualEndDateTime: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              اسم مشرف الإنتاج <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.supervisorName}
              onChange={(e) =>
                setFormData({ ...formData, supervisorName: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              أسماء العمال (تحديد متعدد)
            </label>
            <select
              multiple
              value={formData.workers}
              onChange={handleWorkerSelection}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2 h-24"
            >
              {employees.map((emp: any, i) => (
                <option key={i} value={emp.name_ar || emp.emp_number}>
                  {emp.name_ar || emp.name_en || emp.emp_number}
                </option>
              ))}
              {employees.length === 0 && (
                <option disabled>لا يوجد موظفين مسجلين</option>
              )}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              اضغط مع الاستمرار على Ctrl لتحديد أكثر من عامل.
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              الخطوات التصنيعية المنفذة (بالترتيب){" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="وصف للعمليات والخلط والإضافة..."
              value={formData.manufacturingSteps}
              onChange={(e) =>
                setFormData({ ...formData, manufacturingSteps: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            ></textarea>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              الكمية المنتجة الفعلية <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              value={formData.actualProducedQty}
              onChange={(e) =>
                setFormData({ ...formData, actualProducedQty: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                الفاقد / الهالك
              </label>
              <input
                type="number"
                min="0"
                value={formData.wasteAmount}
                onChange={(e) =>
                  setFormData({ ...formData, wasteAmount: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
              />
            </div>
            <div className="flex-[2]">
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                سبب الفاقد
              </label>
              <input
                type="text"
                disabled={!formData.wasteAmount || formData.wasteAmount === "0"}
                value={formData.wasteReason}
                onChange={(e) =>
                  setFormData({ ...formData, wasteReason: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              ملاحظات عامة
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            ></textarea>
          </div>
        </div>

        {/* Form Footer (Auto filled / Read Only) */}
        <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl my-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold block text-slate-600 mb-1">
              موثق السجل والتوقيع (تلقائي):
            </span>
            <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-slate-700">
              {user?.name || "---"}
            </div>
          </div>
          <div>
            <span className="font-semibold block text-slate-600 mb-1">
              تاريخ التوثيق:
            </span>
            <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-slate-700">
              {sysDate}
            </div>
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
