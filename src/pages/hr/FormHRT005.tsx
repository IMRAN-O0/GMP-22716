import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, ClipboardList, FileText } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { nextSequentialId, getAuthHeaders, getJsonHeaders } from "../../lib/utils";

export default function FormHRT005() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    onboardingId: "",
    employeeName: "",
    employeeId: "",
    department: "",
    jobTitle: "",
    joinDate: "",
    checklist: [
      { task: "تعريف الموظف بسياسات وأنظمة الشركة", done: false },
      { task: "التهيئة على السلامة والصحة المهنية وممارسات GMP", done: false },
      { task: "تسليم العهدة (أجهزة / بطاقات دخول / معدات حماية)", done: false },
      { task: "جولة تعريفية بموقع العمل وأقسام المنشأة", done: false },
      { task: "إنشاء حسابات الأنظمة والبريد الإلكتروني", done: false },
      { task: "التعريف بالمهام والمسؤوليات الوظيفية", done: false },
    ] as { task: string; done: boolean }[],
    responsiblePerson: "",
    notes: "",
    preparedBy: user?.name || "",
    date: new Date().toISOString().split("T")[0],
    status: "Draft",
  });

  const toggleChecklist = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      checklist: prev.checklist.map((c, i) =>
        i === index ? { ...c, done: !c.done } : c,
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
          recordId: formData.onboardingId || nextSequentialId("HRT-ONB", []),
          formId: "F-HRT-005",
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
            .filter((f: any) => f.form_id === "F-HRT-005")
            .map((f: any) => f.record_id);
          setFormData((prev) => ({
            ...prev,
            onboardingId: nextSequentialId("HRT-ONB", ids),
          }));
        })
        .catch(() => {});
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-sky-200 shadow-sm border-r-4 border-r-sky-500">
        <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
          <ClipboardList className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            خطة تهيئة الموظف الجديد
          </h1>
          <p className="text-slate-500">
            النموذج: F-HRT-005 | الموارد البشرية والتدريب
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
                  رقم الخطة (تلقائي)
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                  value={formData.onboardingId}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  تاريخ الالتحاق <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                  value={formData.joinDate}
                  onChange={(e) =>
                    setFormData({ ...formData, joinDate: e.target.value })
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
              قائمة بنود التهيئة
            </h3>
            <div className="space-y-3">
              {formData.checklist.map((c, i) => (
                <label
                  key={i}
                  className="flex items-center gap-3 bg-slate-50 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100"
                >
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-sky-600 rounded focus:ring-sky-500"
                    checked={c.done}
                    onChange={() => toggleChecklist(i)}
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    {c.task}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
              المسؤولية والملاحظات
            </h3>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                المسؤول عن التهيئة
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
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
