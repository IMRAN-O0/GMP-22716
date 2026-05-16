import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, AlertTriangle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function FormQM002() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    assessmentDate: new Date().toISOString().split("T")[0],
    departmentContext: "Production",
    hazardDescription: "",
    probability: 1,
    severity: 1,
    currentControls: "",
    mitigationPlan: "",
    assessorName: user?.name || "",
  });

  const getRiskLevel = (p: number, s: number) => {
    const score = p * s;
    if (score <= 4)
      return { label: "منخفض (Low)", color: "bg-emerald-100 text-emerald-800" };
    if (score <= 12)
      return { label: "متوسط (Medium)", color: "bg-amber-100 text-amber-800" };
    return { label: "عالي (High)", color: "bg-rose-100 text-rose-800" };
  };

  const risk = getRiskLevel(formData.probability, formData.severity);

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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          recordId: `QM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          formId: "F-QM-002",
          department: "QM",
          creatorId: user?.id,
          status: status,
          data: {
            ...formData,
            riskScore: formData.probability * formData.severity,
            riskLevel: risk.label,
          },
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert("تم حفظ نموذج تقييم المخاطر بنجاح: " + saved.record_id);
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
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-indigo-200 shadow-sm border-r-4 border-r-indigo-500">
        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            تقييم المخاطر (Risk Assessment)
          </h1>
          <p className="text-slate-500">
            النموذج: F-QM-002 | قسم الجودة - تسجيل وتحليل المخاطر
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
                تاريخ التقييم
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={formData.assessmentDate}
                onChange={(e) =>
                  setFormData({ ...formData, assessmentDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                مُقيّم المخاطر
              </label>
              <input
                type="text"
                readOnly
                className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                value={formData.assessorName}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              القسم / العملية المرتبطة بالخطر
            </label>
            <select
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg"
              value={formData.departmentContext}
              onChange={(e) =>
                setFormData({ ...formData, departmentContext: e.target.value })
              }
            >
              <option value="Production">الإنتاج والتصنيع</option>
              <option value="Inventory">المخازن والمواد</option>
              <option value="QC">مختبرات الجودة</option>
              <option value="Maintenance">الصيانة والمرافق</option>
              <option value="Supply Chain">سلاسل الإمداد الموردين</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              وصف الخطر (Hazard Description)
            </label>
            <textarea
              required
              rows={3}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="ما هو الخطر المحتمل؟ (مثل: تلوث متبادل، تعطل ماكينة، تأخر توريد...)"
              value={formData.hazardDescription}
              onChange={(e) =>
                setFormData({ ...formData, hazardDescription: e.target.value })
              }
            />
          </div>

          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 grid grid-cols-3 gap-6 text-center">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                الاحتمالية (Probability)
              </label>
              <input
                type="range"
                min="1"
                max="5"
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                value={formData.probability}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    probability: parseInt(e.target.value),
                  })
                }
              />
              <div className="text-xl font-bold mt-2">
                {formData.probability} / 5
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                الشدة/التأثير (Severity)
              </label>
              <input
                type="range"
                min="1"
                max="5"
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                value={formData.severity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    severity: parseInt(e.target.value),
                  })
                }
              />
              <div className="text-xl font-bold mt-2">
                {formData.severity} / 5
              </div>
            </div>
            <div className="border-r border-slate-200 pt-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                مستوى الخطر النهائي
              </label>
              <div
                className={`inline-block px-4 py-2 rounded-xl font-black text-lg ${risk.color}`}
              >
                {formData.probability * formData.severity} - {risk.label}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              ضوابط التحكم الحالية (Current Controls)
            </label>
            <textarea
              rows={2}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="الإجراءات الحالية لمنع أو تقليل هذا الخطر..."
              value={formData.currentControls}
              onChange={(e) =>
                setFormData({ ...formData, currentControls: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              خطة التخفيف/الإجراء الوقائي (Mitigation Plan / CAPA)
            </label>
            <textarea
              required
              rows={3}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="ما هي الخطوات الإضافية التي سيتم اتخاذها للسيطرة على الخطر؟"
              value={formData.mitigationPlan}
              onChange={(e) =>
                setFormData({ ...formData, mitigationPlan: e.target.value })
              }
            />
          </div>
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
