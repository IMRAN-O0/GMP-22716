import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Activity } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function FormQM004() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    reportDate: new Date().toISOString().split("T")[0],
    department: "Production",
    metricName: "",
    targetValue: "",
    actualValue: "",
    status: "On Target", // On Target, Needs Attention, Critical
    analysis: "",
    actionPlan: "",
    preparedBy: user?.name || "",
  });

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
          formId: "F-QM-004",
          department: "QM",
          creatorId: user?.id,
          status: status,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert("تم حفظ مؤشر الأداء (KPI) بنجاح: " + saved.record_id);
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
          <Activity className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            مؤشرات أداء الجودة
          </h1>
          <p className="text-slate-500">
            النموذج: F-QM-004 | قسم الجودة - قياس ومراقبة الأداء
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
                تاريخ التقرير
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={formData.reportDate}
                onChange={(e) =>
                  setFormData({ ...formData, reportDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                مُعدّ التقرير
              </label>
              <input
                type="text"
                readOnly
                className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                value={formData.preparedBy}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                القسم المستهدف للقياس
              </label>
              <select
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
              >
                <option value="Quality">الجودة (QC/QA)</option>
                <option value="Production">الإنتاج (Production)</option>
                <option value="Inventory">المخازن والمواد (Inventory)</option>
                <option value="Maintenance">
                  الصيانة والمرافق (Maintenance)
                </option>
                <option value="HR">الموارد البشرية والتدريب (HR)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                طبيعة حالة المؤشر
              </label>
              <select
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg font-bold"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="On Target" className="text-emerald-600">
                  على الهدف
                </option>
                <option value="Needs Attention" className="text-amber-600">
                  يتطلب اهتمام
                </option>
                <option value="Critical" className="text-rose-600">
                  حرج - أقل من الهدف
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              اسم مؤشر الأداء
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="مثال: نسبة المرتجعات، نسبة إنجاز التدريب، أو أعطال الماكينات..."
              value={formData.metricName}
              onChange={(e) =>
                setFormData({ ...formData, metricName: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label className="block text-sm font-bold text-indigo-900 mb-2">
                الهدف المرجو تحقيقه (Target Value)
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-indigo-700 font-mono focus:ring-2 focus:ring-indigo-500"
                placeholder="مثال: < 1% أو 100%"
                value={formData.targetValue}
                onChange={(e) =>
                  setFormData({ ...formData, targetValue: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                القيمة الفعلية المحققة (Actual Value)
              </label>
              <input
                type="text"
                required
                className={`w-full px-4 py-2 bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 ${formData.status !== "On Target" ? "text-rose-600" : "text-emerald-600"}`}
                placeholder="مثال: 2.5%"
                value={formData.actualValue}
                onChange={(e) =>
                  setFormData({ ...formData, actualValue: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              تحليل الأداء (Analysis)
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="لماذا تم أو لم يتم تحقيق الهدف؟"
              value={formData.analysis}
              onChange={(e) =>
                setFormData({ ...formData, analysis: e.target.value })
              }
            />
          </div>

          {formData.status !== "On Target" && (
            <div>
              <label className="block text-sm font-semibold text-rose-700 mb-2">
                خطة العمل التحسينية (Action Plan)
              </label>
              <textarea
                required
                rows={3}
                className="w-full px-4 py-2 bg-rose-50 border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                placeholder="بما أن المؤشر لم يصل للهدف، ما هي خطة العمل؟"
                value={formData.actionPlan}
                onChange={(e) =>
                  setFormData({ ...formData, actionPlan: e.target.value })
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
