import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function FormDEV002() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deviations, setDeviations] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    analysisDate: new Date().toISOString().split("T")[0],
    sourceDocumentNo: "", // Links to Deviation
    analysisMethod: "5 Why", // 5 Why, Ishikawa
    why1: "",
    why2: "",
    why3: "",
    why4: "",
    why5: "",
    rootCauseConclusion: "",
    analystName: user?.name || "",
  });

  useEffect(() => {
    // Fetch Deviations to link RCA to
    fetch("/api/forms/dept/QM")
      .then((r) => r.json())
      .then((data) => {
        const sources = data.filter(
          (f: any) => f.form_id === "F-DEV-001" && f.status !== "rejected",
        );
        setDeviations(sources);
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          recordId: `QM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          formId: "F-DEV-002",
          department: "QM",
          creatorId: user?.id,
          status: status,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert("تم حفظ تحليل السبب الجذري بنجاح: " + saved.record_id);
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
          <Search className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            تحليل السبب الجذري (Root Cause Analysis - RCA)
          </h1>
          <p className="text-slate-500">
            النموذج: F-DEV-002 | قسم الجودة - التحقيق في الانحرافات
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
                تاريخ التحليل
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                value={formData.analysisDate}
                onChange={(e) =>
                  setFormData({ ...formData, analysisDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                المحقق / المحلل (Analyst)
              </label>
              <input
                type="text"
                readOnly
                className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                value={formData.analystName}
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              تقرير الانحراف المرتبط (Deviation No.){" "}
              <span className="text-rose-500">*</span>
            </label>
            <select
              required
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-rose-500"
              value={formData.sourceDocumentNo}
              onChange={(e) =>
                setFormData({ ...formData, sourceDocumentNo: e.target.value })
              }
            >
              <option value="">-- اختر الانحراف --</option>
              {deviations.length === 0 && (
                <option disabled>لا توجد تقارير انحراف مسجلة أو معتمدة</option>
              )}
              {deviations.map((doc) => (
                <option key={doc.record_id} value={doc.record_id}>
                  انحراف: {doc.record_id} - بتاريخ{" "}
                  {doc.created_at
                    ? new Date(doc.created_at).toLocaleDateString("ar-EG")
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
            <h3 className="font-bold text-slate-800 border-b pb-2">
              منهجية الـ 5 لماذا (5 Whys Analysis)
            </h3>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                لماذا حدث ذلك؟ (Why 1)
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                value={formData.why1}
                onChange={(e) =>
                  setFormData({ ...formData, why1: e.target.value })
                }
              />
            </div>
            <div className="pl-6 border-r-2 border-rose-200">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                لماذا (إجابة السؤال السابق) حدث؟ (Why 2)
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                value={formData.why2}
                onChange={(e) =>
                  setFormData({ ...formData, why2: e.target.value })
                }
              />
            </div>
            <div className="pl-12 border-r-2 border-rose-300">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                لماذا؟ (Why 3)
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                value={formData.why3}
                onChange={(e) =>
                  setFormData({ ...formData, why3: e.target.value })
                }
              />
            </div>
            <div className="pl-16 border-r-2 border-rose-400">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                لماذا؟ (Why 4)
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                value={formData.why4}
                onChange={(e) =>
                  setFormData({ ...formData, why4: e.target.value })
                }
              />
            </div>
            <div className="pl-20 border-r-2 border-rose-500">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                لماذا؟ (Why 5 - وغالبا ما يكون بسبب نظام أو إجراء مفقود)
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                value={formData.why5}
                onChange={(e) =>
                  setFormData({ ...formData, why5: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-rose-800 mb-2">
              الاستنتاج - السبب الجذري المؤكد (Root Cause Conclusion)
            </label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-2 bg-rose-50 border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              placeholder="اكتب الاستنتاج النهائي بناءً على تحليل السلسلة السابقة والتأكد من الأدلة..."
              value={formData.rootCauseConclusion}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rootCauseConclusion: e.target.value,
                })
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
