import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Activity } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getJsonHeaders } from "../../lib/utils";

export default function FormDEV004() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [capaPlans, setCapaPlans] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    reviewDate: new Date().toISOString().split("T")[0],
    sourceCapaPlan: "", // Links to F-DEV-003 or F-QM-006
    effectivenessCriteria: "",
    reviewResults: "",
    isEffective: "Yes", // Yes, No, Partially
    furtherActionRequired: "",
    reviewerName: user?.name || "",
  });

  useEffect(() => {
    // Fetch CAPA Plans to link review
    fetch("/api/forms/dept/QM")
      .then((r) => r.json())
      .then((data) => {
        const sources = data.filter(
          (f: any) => f.form_id === "F-DEV-003" || f.form_id === "F-QM-006",
        );
        setCapaPlans(sources);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent, status: any = "approved") => {
    e.preventDefault();
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
        body: JSON.stringify({
          recordId: `QM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          formId: "F-DEV-004",
          department: "QM",
          creatorId: user?.id,
          status: status,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert("تم حفظ تقييم فعالية الإجراء المكتمل بنجاح: " + saved.record_id);
      navigate("/qm");
    } catch (err) {
      console.error(err);
      alert("فشل حفظ النموذج");
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-rose-200 shadow-sm border-r-4 border-r-rose-500">
        <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
          <Activity className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            تقييم فعالية الإجراء (CAPA Effectiveness Review)
          </h1>
          <p className="text-slate-500">
            النموذج: F-DEV-004 | قسم الجودة - التحقق من معالجة الانحرافات
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                تاريخ التقييم والمراجعة الفنية
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                value={formData.reviewDate}
                onChange={(e) =>
                  setFormData({ ...formData, reviewDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                المُقيّم (Reviewer)
              </label>
              <input
                type="text"
                readOnly
                className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                value={formData.reviewerName}
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              خطة الإجراء المراد تقييمها (CAPA Plan No.){" "}
              <span className="text-rose-500">*</span>
            </label>
            <select
              required
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-rose-500"
              value={formData.sourceCapaPlan}
              onChange={(e) =>
                setFormData({ ...formData, sourceCapaPlan: e.target.value })
              }
            >
              <option value="">-- اختر خطة CAPA المكتملة --</option>
              {capaPlans.length === 0 && (
                <option disabled>لا توجد خطط مسجلة</option>
              )}
              {capaPlans.map((doc) => (
                <option key={doc.record_id} value={doc.record_id}>
                  CAPA / DEV: {doc.record_id} - {doc.form_id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              معايير التقييم المتفق عليها (Effectiveness Criteria)
            </label>
            <textarea
              required
              rows={3}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
              placeholder="ما هي المعايير التي تم قياس نجاح الخطة بناءً عليها؟"
              value={formData.effectivenessCriteria}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  effectivenessCriteria: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              ملخص بيانات المراجعة والنتائج (Review Results)
            </label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
              placeholder="ملخص للبيانات والمشاهدات التي تؤكد أو تنفي فعالية الإجراء المطبق..."
              value={formData.reviewResults}
              onChange={(e) =>
                setFormData({ ...formData, reviewResults: e.target.value })
              }
            />
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
            <label className="block text-lg font-bold text-rose-900 mb-3">
              هل أثبتت الإجراءات فعاليتها لمنع تكرار الانحراف؟
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 border border-slate-200 rounded-lg">
                <input
                  type="radio"
                  name="isEffective"
                  value="Yes"
                  checked={formData.isEffective === "Yes"}
                  onChange={(e) =>
                    setFormData({ ...formData, isEffective: e.target.value })
                  }
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-emerald-700">
                  نعم (فعال - إغلاق الحالة)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 border border-slate-200 rounded-lg">
                <input
                  type="radio"
                  name="isEffective"
                  value="Partially"
                  checked={formData.isEffective === "Partially"}
                  onChange={(e) =>
                    setFormData({ ...formData, isEffective: e.target.value })
                  }
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                />
                <span className="font-bold text-amber-700">
                  جزئيا (يتطلب تعديلات)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 border border-slate-200 rounded-lg">
                <input
                  type="radio"
                  name="isEffective"
                  value="No"
                  checked={formData.isEffective === "No"}
                  onChange={(e) =>
                    setFormData({ ...formData, isEffective: e.target.value })
                  }
                  className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                />
                <span className="font-bold text-rose-700">
                  لا (يجب إعادة فتح تحقيق جديد)
                </span>
              </label>
            </div>
          </div>

          {formData.isEffective !== "Yes" && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                الإجراءات التالية المطلوبة (Further Action Required)
              </label>
              <textarea
                required
                rows={3}
                className="w-full px-4 py-2 bg-rose-50 border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                placeholder="ما هي الخطوات الإضافية اللازمة؟"
                value={formData.furtherActionRequired}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    furtherActionRequired: e.target.value,
                  })
                }
              />
            </div>
          )}
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
    </div>
  );
}
