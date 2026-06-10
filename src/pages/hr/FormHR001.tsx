import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FilePlus,
  Save,
  CheckCircle,
  FileText,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { nextSequentialId, getAuthHeaders, getJsonHeaders } from "../../lib/utils";

export default function FormHR001() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<any>({});
  const [existingIds, setExistingIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    jobTitle: "",
    requestingDept: "",
    reason: "جديد",
    vacancies: 1,
    qualifications: "",
    experienceYears: 0,
    contractType: "دوام كامل",
    proposedSalary: "",
    dateNeeded: "",
    deptManagerName: "",
    notes: "",
  });

  const [date] = useState(new Date().toLocaleDateString("ar-EG"));

  // Load company info (for the header) and existing record ids (for numbering).
  React.useEffect(() => {
    fetch("/api/company", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => setCompany(d || {}))
      .catch(() => {});
    fetch("/api/forms/dept/HRT", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        setExistingIds(
          rows
            .filter((f: any) => f.form_id === "F-HR-001")
            .map((f: any) => f.record_id),
        );
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent, status: any) => {
    e.preventDefault();
    setLoading(true);

    const editIdPatch = new URLSearchParams(window.location.search).get("edit");
    // Keep the existing id when editing; otherwise issue the next sequential id.
    const recordId = editIdPatch || nextSequentialId("HR", existingIds);

    const payload = {
      recordId,
      formId: "F-HR-001",
      department: "HRT",
      creatorId: user?.id,
      status,
      data: formData,
    };

    try {
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
        navigate("/hr");
      } else {
        const errData = await res.json().catch(() => ({ error: "حدث خطأ أثناء الحفظ" }));
        alert(errData.error || "حدث خطأ أثناء الحفظ");
      }
    } catch (err) {
      console.error(err);
      alert("تعذّر الاتصال بالخادم. تحقق من اتصالك وحاول مرة أخرى.");
    } finally {
      setLoading(false);
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
      {/* Form Header (Auto filled) */}
      <div className="border-b border-slate-200 p-6 flex justify-between items-center bg-slate-50">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {company.name_ar || "نظام الجودة"}
          </h1>
          <p className="text-sm font-medium text-slate-600 mt-1">
            ISO 22716 - GMP
          </p>
        </div>
        <div className="text-left">
          <h2 className="text-xl font-bold text-slate-800 mb-1">
            طلب توظيف جديد
          </h2>
          <p className="text-sm font-mono text-slate-500 text-left">
            نموذج: F-HR-001
          </p>
          <p className="text-sm font-mono text-slate-500 text-left">
            تاريخ الإصدار: {date}
          </p>
        </div>
      </div>

      <form className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              المسمى الوظيفي المطلوب <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.jobTitle}
              onChange={(e) =>
                setFormData({ ...formData, jobTitle: e.target.value })
              }
              className="w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              القسم الطالب <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.requestingDept}
              onChange={(e) =>
                setFormData({ ...formData, requestingDept: e.target.value })
              }
              className="w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              سبب الطلب <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              className="w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="جديد">استحداث منصب جديد</option>
              <option value="استبدال">استبدال موظف</option>
              <option value="توسعة">توسعة (زيادة طاقة)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              عدد الشواغر <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.vacancies}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vacancies: parseInt(e.target.value) || ("" as any),
                })
              }
              className="w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              المؤهلات المطلوبة <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={formData.qualifications}
              onChange={(e) =>
                setFormData({ ...formData, qualifications: e.target.value })
              }
              className="w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-blue-500"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              الخبرة المطلوبة (سنوات) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              value={formData.experienceYears}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  experienceYears: parseInt(e.target.value) || ("" as any),
                })
              }
              className="w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              نوع العقد <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.contractType}
              onChange={(e) =>
                setFormData({ ...formData, contractType: e.target.value })
              }
              className="w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option>دوام كامل</option>
              <option>دوام جزئي</option>
              <option>عقد مؤقت / مقاولة</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              الراتب المقترح / الميزانية
            </label>
            <input
              type="text"
              value={formData.proposedSalary}
              onChange={(e) =>
                setFormData({ ...formData, proposedSalary: e.target.value })
              }
              className="w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              تاريخ الحاجة للموظف <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.dateNeeded}
              onChange={(e) =>
                setFormData({ ...formData, dateNeeded: e.target.value })
              }
              className="w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              ملاحظات إضافية (أقصى 500 حرف)
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-blue-500"
            ></textarea>
          </div>
        </div>

        {/* Form Footer (Auto filled / Read Only) */}
        <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl my-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-semibold block text-slate-600 mb-1">
              أعدّه (تلقائي):
            </span>
            <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-slate-700">
              {user?.name || "---"}
            </div>
          </div>
          <div>
            <span className="font-semibold block text-slate-600 mb-1">
              تاريخ الإعداد:
            </span>
            <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-slate-700">
              {date}
            </div>
          </div>
          <div>
            <span className="font-semibold block text-slate-700 mb-1">
              اعتماد مدير القسم:
            </span>
            <input
              type="text"
              placeholder="يكتب بعد المراجعة"
              value={formData.deptManagerName}
              onChange={(e) =>
                setFormData({ ...formData, deptManagerName: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 py-2"
            />
          </div>
        </div>

        {/* Actions Toolbar */}
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
