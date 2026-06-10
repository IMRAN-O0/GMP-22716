import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, ShieldCheck, FileText } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { nextSequentialId, getAuthHeaders, getJsonHeaders } from "../../lib/utils";

export default function FormHRT001() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pledgeId: "",
    employeeName: "",
    employeeId: "",
    department: "",
    jobTitle: "",
    pledgeDate: new Date().toISOString().split("T")[0],
    acknowledgements: [
      { task: "الالتزام بارتداء معدات الوقاية الشخصية (PPE)", done: false },
      {
        task: "الالتزام بقواعد النظافة الشخصية وممارسات التصنيع الجيد (GMP)",
        done: false,
      },
      { task: "الإبلاغ الفوري عن أي مخاطر أو حوادث أو إصابات", done: false },
      { task: "عدم الأكل أو الشرب أو التدخين في مناطق الإنتاج", done: false },
      { task: "اتباع إجراءات التشغيل القياسية (SOPs) المعتمدة", done: false },
    ] as { task: string; done: boolean }[],
    declaration:
      "أقر بأنني اطلعت على سياسات السلامة والصحة المهنية وألتزم بتطبيقها بالكامل.",
    notes: "",
    preparedBy: user?.name || "",
    date: new Date().toISOString().split("T")[0],
    status: "Draft",
  });

  const toggleAcknowledgement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      acknowledgements: prev.acknowledgements.map((a, i) =>
        i === index ? { ...a, done: !a.done } : a,
      ),
    }));
  };

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
          recordId: formData.pledgeId || nextSequentialId("HRT-SAF", []),
          formId: "F-HRT-001",
          department: "HRT",
          creatorId: user?.id,
          status: status,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert(
        `تم الحفظ بنجاح (${status === "draft" ? "مسودة" : "معتمد"}): ` +
          saved.record_id,
      );
      navigate("/hr");
    } catch (err) {
      console.error(err);
      alert("فشل حفظ النموذج");
    }
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    if (editId) {
      fetch(`/api/forms/record/${editId}`, { headers: getAuthHeaders() })
        .then((r) => r.json())
        .then((data) => {
          if (data && data.data) {
            setFormData((prev) => ({ ...prev, ...data.data }));
          }
        })
        .catch(() => {});
    } else {
      fetch("/api/forms/dept/HRT", { headers: getAuthHeaders() })
        .then((r) => r.json())
        .then((data) => {
          const rows = Array.isArray(data) ? data : [];
          const ids = rows
            .filter((f: any) => f.form_id === "F-HRT-001")
            .map((f: any) => f.record_id);
          setFormData((prev) => ({
            ...prev,
            pledgeId: nextSequentialId("HRT-SAF", ids),
          }));
        })
        .catch(() => {});
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-sky-200 shadow-sm border-r-4 border-r-sky-500">
        <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            إقرار الالتزام بالسلامة والصحة المهنية و GMP
          </h1>
          <p className="text-slate-500">
            النموذج: F-HRT-001 | الموارد البشرية والتدريب
          </p>
        </div>
      </div>

      <form className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-8">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
              بيانات الموظف
            </h3>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  رقم الإقرار (تلقائي)
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                  value={formData.pledgeId}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  تاريخ الإقرار <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                  value={formData.pledgeDate}
                  onChange={(e) =>
                    setFormData({ ...formData, pledgeDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  اسم الموظف <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                  value={formData.employeeName}
                  onChange={(e) =>
                    setFormData({ ...formData, employeeName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  الرقم الوظيفي
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                  value={formData.employeeId}
                  onChange={(e) =>
                    setFormData({ ...formData, employeeId: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  القسم
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  المسمى الوظيفي
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                  value={formData.jobTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, jobTitle: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
              بنود الإقرار
            </h3>
            <div className="space-y-3">
              {formData.acknowledgements.map((a, i) => (
                <label
                  key={i}
                  className="flex items-center gap-3 bg-slate-50 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100"
                >
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-sky-600 rounded focus:ring-sky-500"
                    checked={a.done}
                    onChange={() => toggleAcknowledgement(i)}
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    {a.task}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
              الإقرار والملاحظات
            </h3>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                نص الإقرار
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                value={formData.declaration}
                onChange={(e) =>
                  setFormData({ ...formData, declaration: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                ملاحظات
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
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
