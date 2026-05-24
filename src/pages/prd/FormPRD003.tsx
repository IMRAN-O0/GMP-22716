import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateSerialNumber } from "../../lib/utils";

export default function FormPRD003() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [sysDate] = useState(new Date().toLocaleDateString("ar-EG"));
  const [productionOrders, setProductionOrders] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    batchNumber: "",
    auditorName: "",
    checksBefore: {
      cleanMachine: false,
      materialsReady: false,
      areaClear: false,
    },
    checksDuring: {
      tempNormal: false,
      noLeaks: false,
      speedNormal: false,
    },
    checksAfter: {
      machineOff: false,
      areaCleaned: false,
      productHandedOver: false,
    },
  });

  useEffect(() => {
    fetch("/api/forms/dept/PRD")
      .then((r) => r.json())
      .then((data) => {
        // Get approved PRD001 forms carrying batchNumber
        const orders = data.filter(
          (f: any) => f.form_id === "F-PRD-001" && f.status === "approved",
        );
        setProductionOrders(orders);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent, status: any) => {
    e.preventDefault();
    const recordId = generateSerialNumber(
      "CHK",
      Math.floor(Math.random() * 10000),
    );

    const payload = {
      recordId,
      formId: "F-PRD-003",
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
        const errData = await res.json().catch(() => ({ error: "حدث خطأ أثناء الحفظ" }));
        alert(errData.error || "حدث خطأ أثناء الحفظ");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckboxChange = (
    category: "checksBefore" | "checksDuring" | "checksAfter",
    key: string,
    value: boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
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
            قائمة مراجعة الإنتاج
          </h2>
          <p className="text-sm font-mono text-slate-500">نموذج: F-PRD-003</p>
          <p className="text-sm font-mono text-slate-500">
            تاريخ الإصدار: 01-01-2025
          </p>
        </div>
      </div>

      <form className="p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
          بيانات الدفعة والمراجعة
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              رقم الدفعة (مجلب من أمر الإنتاج){" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.batchNumber}
              onChange={(e) =>
                setFormData({ ...formData, batchNumber: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            >
              <option value="">-- اختر أمر إنتاج متوفر --</option>
              {productionOrders.map((order, i) => (
                <option key={i} value={order.data?.batchNumber}>
                  {order.data?.batchNumber} - {order.data?.productName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              اسم المدقق / المراجع <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.auditorName}
              onChange={(e) =>
                setFormData({ ...formData, auditorName: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
        </div>

        <div className="space-y-6 mb-8">
          {/* Before Production */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-3 text-sm">
              البنود قبل البدء في الإنتاج
            </h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-sky-500 rounded border-gray-300"
                  checked={formData.checksBefore.cleanMachine}
                  onChange={(e) =>
                    handleCheckboxChange(
                      "checksBefore",
                      "cleanMachine",
                      e.target.checked,
                    )
                  }
                />
                <span className="ml-2 mr-2 text-sm text-slate-700 font-semibold">
                  نظافة الماكينات والمعدات وجاهزيتها للعمل.
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-sky-500 rounded border-gray-300"
                  checked={formData.checksBefore.materialsReady}
                  onChange={(e) =>
                    handleCheckboxChange(
                      "checksBefore",
                      "materialsReady",
                      e.target.checked,
                    )
                  }
                />
                <span className="ml-2 mr-2 text-sm text-slate-700 font-semibold">
                  توفر كافة المواد الخام الموزونة وفق أمر الإنتاج.
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-sky-500 rounded border-gray-300"
                  checked={formData.checksBefore.areaClear}
                  onChange={(e) =>
                    handleCheckboxChange(
                      "checksBefore",
                      "areaClear",
                      e.target.checked,
                    )
                  }
                />
                <span className="ml-2 mr-2 text-sm text-slate-700 font-semibold">
                  خلو منطقة العمل من أي مواد سابقة التجهيز (Line Clearance).
                </span>
              </label>
            </div>
          </div>

          {/* During Production */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-3 text-sm">
              البنود أثناء التشغيل
            </h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-sky-500 rounded border-gray-300"
                  checked={formData.checksDuring.tempNormal}
                  onChange={(e) =>
                    handleCheckboxChange(
                      "checksDuring",
                      "tempNormal",
                      e.target.checked,
                    )
                  }
                />
                <span className="ml-2 mr-2 text-sm text-slate-700 font-semibold">
                  درجات الحرارة والضغط ضمن المواصفات المعتمدة للمنتج.
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-sky-500 rounded border-gray-300"
                  checked={formData.checksDuring.noLeaks}
                  onChange={(e) =>
                    handleCheckboxChange(
                      "checksDuring",
                      "noLeaks",
                      e.target.checked,
                    )
                  }
                />
                <span className="ml-2 mr-2 text-sm text-slate-700 font-semibold">
                  لا يوجد أي تسريبات أو أصوات غريبة من المعدات.
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-sky-500 rounded border-gray-300"
                  checked={formData.checksDuring.speedNormal}
                  onChange={(e) =>
                    handleCheckboxChange(
                      "checksDuring",
                      "speedNormal",
                      e.target.checked,
                    )
                  }
                />
                <span className="ml-2 mr-2 text-sm text-slate-700 font-semibold">
                  سرعة الإنتاج والخلط تتم بالشكل والوقت المطلوب.
                </span>
              </label>
            </div>
          </div>

          {/* After Production */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-3 text-sm">
              البنود عند الانتهاء
            </h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-sky-500 rounded border-gray-300"
                  checked={formData.checksAfter.machineOff}
                  onChange={(e) =>
                    handleCheckboxChange(
                      "checksAfter",
                      "machineOff",
                      e.target.checked,
                    )
                  }
                />
                <span className="ml-2 mr-2 text-sm text-slate-700 font-semibold">
                  إغلاق الماكينات وفصل مصادر الطاقة بشكل آمن.
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-sky-500 rounded border-gray-300"
                  checked={formData.checksAfter.areaCleaned}
                  onChange={(e) =>
                    handleCheckboxChange(
                      "checksAfter",
                      "areaCleaned",
                      e.target.checked,
                    )
                  }
                />
                <span className="ml-2 mr-2 text-sm text-slate-700 font-semibold">
                  تنظيف منطقة العمل وإزالة المخلفات.
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-sky-500 rounded border-gray-300"
                  checked={formData.checksAfter.productHandedOver}
                  onChange={(e) =>
                    handleCheckboxChange(
                      "checksAfter",
                      "productHandedOver",
                      e.target.checked,
                    )
                  }
                />
                <span className="ml-2 mr-2 text-sm text-slate-700 font-semibold">
                  تسليم المنتج لمنطقة الحجر الصحي / التعبئة مع بطاقة البيان.
                </span>
              </label>
            </div>
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
              تاريخ توقيع المدقق:
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
