import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function FormDEV003() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rcaReports, setRcaReports] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    planDate: new Date().toISOString().split("T")[0],
    sourceRCA: "", // Links to RCA F-DEV-002
    actionType: "Corrective", // Corrective, Preventive
    actionDescription: "",
    resourceRequirements: "",
    responsiblePerson: "",
    deadline: "",
    status: "Planned", // Planned, In Progress, Completed
    approvedBy: user?.name || "",
  });

  useEffect(() => {
    // Fetch RCAs to link CAPA to
    fetch("/api/forms/dept/QM")
      .then((r) => r.json())
      .then((data) => {
        const sources = data.filter((f: any) => f.form_id === "F-DEV-002");
        setRcaReports(sources);
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
          formId: "F-DEV-003",
          department: "QM",
          creatorId: user?.id,
          status: status,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert(
        "تم حفظ خطة الإجراء التصحيحي (CAPA Plan) بنجاح: " + saved.record_id,
      );
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
          <CheckCircle className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            خطة الإجراء التصحيحي (Corrective Action Plan)
          </h1>
          <p className="text-slate-500">
            النموذج: F-DEV-003 | قسم الجودة - متابعة الانحرافات
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
                تاريخ إصدار الخطة
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                value={formData.planDate}
                onChange={(e) =>
                  setFormData({ ...formData, planDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                معتمد الخطة (Approved By)
              </label>
              <input
                type="text"
                readOnly
                className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                value={formData.approvedBy}
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              تقرير تحليل السبب الجذري المرتبط (RCA No.){" "}
              <span className="text-rose-500">*</span>
            </label>
            <select
              required
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-rose-500"
              value={formData.sourceRCA}
              onChange={(e) =>
                setFormData({ ...formData, sourceRCA: e.target.value })
              }
            >
              <option value="">-- اختر تحليل السبب הגذري --</option>
              {rcaReports.length === 0 && (
                <option disabled>لا توجد تقارير RCA مسجلة</option>
              )}
              {rcaReports.map((doc) => (
                <option key={doc.record_id} value={doc.record_id}>
                  RCA: {doc.record_id} - بتاريخ{" "}
                  {doc.created_at
                    ? new Date(doc.created_at).toLocaleDateString("ar-EG")
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              نوع الإجراء
            </label>
            <select
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg"
              value={formData.actionType}
              onChange={(e) =>
                setFormData({ ...formData, actionType: e.target.value })
              }
            >
              <option value="Corrective">إجراء تصحيحي (Corrective)</option>
              <option value="Preventive">إجراء وقائي (Preventive)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              وصف تفصيلي للإجراء المخطط (Action Description)
            </label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
              placeholder="ما هي الخطوات الدقيقة التي سيتم اتخاذها لتصحيح السبب الجذري؟"
              value={formData.actionDescription}
              onChange={(e) =>
                setFormData({ ...formData, actionDescription: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              الموارد المطلوبة (Resource Requirements)
            </label>
            <textarea
              rows={2}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
              placeholder="ميزانية، تدريب، تحديث أنظمة..."
              value={formData.resourceRequirements}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  resourceRequirements: e.target.value,
                })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                المسؤول عن التنفيذ (Person Responsible)
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                value={formData.responsiblePerson}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    responsiblePerson: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                الموعد النهائي للتنفيذ (Deadline)
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <div className="w-1/2">
              <label className="block text-sm font-bold text-rose-800 mb-2">
                حالة الخطة (Status)
              </label>
              <select
                className="w-full px-4 py-2 bg-white border border-rose-200 rounded-lg font-bold text-rose-700"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="Planned">مخطط (Planned)</option>
                <option value="In Progress">قيد التنفيذ (In Progress)</option>
                <option value="Completed">مكتمل (Completed)</option>
              </select>
            </div>
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
