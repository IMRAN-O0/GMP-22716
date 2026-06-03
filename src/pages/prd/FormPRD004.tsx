import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Save, CheckCircle, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateSerialNumber, getJsonHeaders } from "../../lib/utils";

interface Reading {
  time: string;
  parameter: string;
  requiredValue: string;
  actualValue: string;
  withinLimits: string;
  correctiveAction: string;
}

export default function FormPRD004() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [sysDate] = useState(new Date().toLocaleDateString("ar-EG"));
  const [productionOrders, setProductionOrders] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    batchNumber: "",
    productionStage: "",
    readings: [] as Reading[],
  });

  useEffect(() => {
    fetch("/api/forms/dept/PRD")
      .then((r) => r.json())
      .then((data) => {
        const orders = data.filter(
          (f: any) => f.form_id === "F-PRD-001" && f.status === "approved",
        );
        setProductionOrders(orders);
      })
      .catch(console.error);
  }, []);

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

  const addReading = () => {
    setFormData((prev) => ({
      ...prev,
      readings: [
        ...(prev.readings || []),
        {
          time: "",
          parameter: "",
          requiredValue: "",
          actualValue: "",
          withinLimits: "نعم",
          correctiveAction: "",
        },
      ],
    }));
  };

  const removeReading = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      readings: (prev.readings || []).filter((_, i) => i !== index),
    }));
  };

  const updateReading = (
    index: number,
    field: keyof Reading,
    value: string,
  ) => {
    const newReadings = [...(formData.readings || [])];
    newReadings[index] = { ...newReadings[index], [field]: value };
    setFormData((prev) => ({ ...prev, readings: newReadings }));
  };

  const handleSubmit = async (e: React.FormEvent, status: any) => {
    e.preventDefault();
    const recordId = generateSerialNumber(
      "MON",
      Math.floor(Math.random() * 10000),
    );

    const payload = {
      recordId,
      formId: "F-PRD-004",
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
        headers: getJsonHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert(`تم الحفظ بنجاح. رقم المستند: ${recordId}`);
        navigate("/prd");
      } else {
        const errData = await res.json().catch(() => ({ error: "حدث خطأ أثناء الحفظ" }));
        alert(errData.error || "حدث خطأ أثناء الحفظ");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden">
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
            مراقبة العملية (Process Monitoring)
          </h2>
          <p className="text-sm font-mono text-slate-500">نموذج: F-PRD-004</p>
          <p className="text-sm font-mono text-slate-500">
            تاريخ الإصدار: 01-01-2025
          </p>
        </div>
      </div>

      <form className="p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
          بيانات العملية والدفعة
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              رقم الدفعة <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.batchNumber}
              onChange={(e) =>
                setFormData({ ...formData, batchNumber: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            >
              <option value="">-- اختر رقم الدفعة --</option>
              {productionOrders.map((order, i) => (
                <option key={i} value={order.data?.batchNumber}>
                  {order.data?.batchNumber} - {order.data?.productName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              المرحلة الإنتاجية <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: مرحلة الخلط، مرحلة التعبئة..."
              value={formData.productionStage}
              onChange={(e) =>
                setFormData({ ...formData, productionStage: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
        </div>

        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h3 className="text-lg font-bold text-slate-800">
            جدول القراءات الدورية
          </h3>
          <button
            type="button"
            onClick={addReading}
            className="flex items-center text-sm text-sky-600 font-bold hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100"
          >
            <Plus className="w-4 h-4 ml-1" /> إضافة قراءة جديدة
          </button>
        </div>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50 text-[13px] text-slate-600 border border-slate-200">
              <tr>
                <th className="p-3 border-r border-slate-200">الوقت</th>
                <th className="p-3 border-r border-slate-200 w-1/4">
                  المعيار
</th>
                <th className="p-3 border-r border-slate-200">
                  القيمة المطلوبة
                </th>
                <th className="p-3 border-r border-slate-200">
                  القيمة الفعلية
                </th>
                <th className="p-3 border-r border-slate-200">ضمن الحدود؟</th>
                <th className="p-3 border-r border-slate-200 w-1/4">
                  الإجراء التصحيحي
                </th>
                <th className="p-3 border-slate-200 w-12 text-center">حذف</th>
              </tr>
            </thead>
            <tbody>
              {!formData.readings || formData.readings.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-6 text-center text-slate-400 text-sm border-b border-x border-slate-200 bg-white"
                  >
                    لا توجد قراءات مسجلة حتى الآن
                  </td>
                </tr>
              ) : (
                formData.readings.map((reading, i) => {
                  const isOutOfLimits = reading.withinLimits === "لا";

                  return (
                    <tr
                      key={i}
                      className={`border-b border-x border-slate-200 ${isOutOfLimits ? "bg-red-50" : "bg-white"}`}
                    >
                      <td className="p-2 border-r border-slate-100">
                        <input
                          type="time"
                          required
                          value={reading.time}
                          onChange={(e) =>
                            updateReading(i, "time", e.target.value)
                          }
                          className="w-full bg-transparent border-0 focus:ring-1 focus:ring-sky-400 rounded text-sm py-1"
                        />
                      </td>
                      <td className="p-2 border-r border-slate-100">
                        <input
                          type="text"
                          required
                          placeholder="مثال: الحرارة"
                          value={reading.parameter}
                          onChange={(e) =>
                            updateReading(i, "parameter", e.target.value)
                          }
                          className={`w-full bg-transparent border-0 focus:ring-1 focus:ring-sky-400 rounded text-sm py-1 focus:bg-white ${isOutOfLimits ? "text-red-700 font-semibold" : ""}`}
                        />
                      </td>
                      <td className="p-2 border-r border-slate-100">
                        <input
                          type="text"
                          required
                          value={reading.requiredValue}
                          onChange={(e) =>
                            updateReading(i, "requiredValue", e.target.value)
                          }
                          className="w-full bg-transparent border-0 focus:ring-1 focus:ring-sky-400 rounded text-sm py-1 focus:bg-white"
                        />
                      </td>
                      <td className="p-2 border-r border-slate-100">
                        <input
                          type="text"
                          required
                          value={reading.actualValue}
                          onChange={(e) =>
                            updateReading(i, "actualValue", e.target.value)
                          }
                          className={`w-full bg-transparent border-0 focus:ring-1 focus:ring-sky-400 rounded text-sm py-1 focus:bg-white ${isOutOfLimits ? "text-red-700 font-bold" : ""}`}
                        />
                      </td>
                      <td className="p-2 border-r border-slate-100">
                        <select
                          value={reading.withinLimits}
                          onChange={(e) =>
                            updateReading(i, "withinLimits", e.target.value)
                          }
                          className={`w-full bg-transparent border-0 focus:ring-1 focus:ring-sky-400 rounded text-sm py-1 font-bold ${isOutOfLimits ? "text-red-600" : "text-green-600"}`}
                        >
                          <option value="نعم">نعم (ضمن الحدود)</option>
                          <option value="لا" className="text-red-600 font-bold">
                            لا (خارج الحدود)
                          </option>
                        </select>
                      </td>
                      <td className="p-2 border-r border-slate-100">
                        <input
                          type="text"
                          placeholder={
                            isOutOfLimits ? "ما هو الإجراء المتخذ؟" : ""
                          }
                          value={reading.correctiveAction}
                          onChange={(e) =>
                            updateReading(i, "correctiveAction", e.target.value)
                          }
                          className={`w-full bg-transparent border-0 focus:ring-1 focus:ring-sky-400 rounded text-sm py-1 focus:bg-white ${isOutOfLimits ? "placeholder-red-300 text-red-800" : ""}`}
                        />
                      </td>
                      <td className="p-2 text-center align-middle relative">
                        <button
                          type="button"
                          onClick={() => removeReading(i)}
                          className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                        {isOutOfLimits && (
                          <div className="absolute top-1/2 -left-36 -translate-y-1/2 w-32">
                            <div className="flex flex-col items-start gap-1">
                              <span className="text-[10px] text-red-600 font-bold flex items-center">
                                <AlertTriangle className="w-3 h-3 ml-1" /> يتطلب
                                انحراف!
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const params = new URLSearchParams({
                                    fromBatch: formData.batchNumber,
                                    fromStage: formData.productionStage,
                                    fromMonitoring: 'true'
                                  });
                                  navigate(`/qm/dev-001?${params.toString()}`);
                                }}
                                className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded shadow-sm hover:bg-red-700 transition"
                              >
                                فتح F-DEV-001
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Form Footer (Auto filled / Read Only) */}
        <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl my-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold block text-slate-600 mb-1">
              اسم المراقب الفني:
            </span>
            <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-slate-700">
              {user?.name || "---"}
            </div>
          </div>
          <div>
            <span className="font-semibold block text-slate-600 mb-1">
              تاريخ توقيع السجل:
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
