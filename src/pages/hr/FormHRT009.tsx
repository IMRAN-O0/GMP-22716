import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { nextSequentialId, getAuthHeaders, getJsonHeaders } from "../../lib/utils";

export default function FormHRT009() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading] = useState(false);
  const [formData, setFormData] = useState({
    probationId: "",
    employeeName: "",
    employeeId: "",
    department: "",
    jobTitle: "",
    joinDate: "",
    evaluationDate: new Date().toISOString().split("T")[0],
    criteria: [
      { criterion: "الأداء الوظيفي وجودة العمل", rating: "", notes: "" },
      { criterion: "الالتزام بالحضور والانضباط", rating: "", notes: "" },
      { criterion: "التعاون والعمل الجماعي", rating: "", notes: "" },
      { criterion: "الالتزام بإجراءات الجودة والسلامة (GMP)", rating: "", notes: "" },
      { criterion: "سرعة التعلّم والتطور", rating: "", notes: "" },
    ] as { criterion: string; rating: string; notes: string }[],
    decision: "",
    notes: "",
    preparedBy: user?.name || "",
    date: new Date().toISOString().split("T")[0],
    status: "Draft",
  });

  const updateCriterion = (i: number, key: "rating" | "notes", val: string) => {
    setFormData((prev) => ({
      ...prev,
      criteria: prev.criteria.map((c, idx) => (idx === i ? { ...c, [key]: val } : c)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent, status: any = "approved") => {
    e.preventDefault();
    try {
      const editIdPatch = new URLSearchParams(window.location.search).get("edit");
      const fetchUrl = editIdPatch ? `/api/forms/record/${editIdPatch}` : "/api/forms";
      const fetchMethod = editIdPatch ? "PUT" : "POST";
      const res = await fetch(fetchUrl, {
        method: fetchMethod,
        headers: getJsonHeaders(),
        body: JSON.stringify({
          recordId: formData.probationId || nextSequentialId("HRT-PRB", []),
          formId: "F-HRT-009",
          department: "HRT",
          creatorId: user?.id,
          status,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert(`تم الحفظ بنجاح (${status === "draft" ? "مسودة" : "معتمد"}): ` + saved.record_id);
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
          if (data && data.data) setFormData((prev) => ({ ...prev, ...data.data }));
        })
        .catch(() => {});
    } else {
      fetch("/api/forms/dept/HRT", { headers: getAuthHeaders() })
        .then((r) => r.json())
        .then((data) => {
          const rows = Array.isArray(data) ? data : [];
          const ids = rows.filter((f: any) => f.form_id === "F-HRT-009").map((f: any) => f.record_id);
          setFormData((prev) => ({ ...prev, probationId: nextSequentialId("HRT-PRB", ids) }));
        })
        .catch(() => {});
    }
  }, []);

  const inputCls = "w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-sky-200 shadow-sm border-r-4 border-r-sky-500">
        <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
          <ClipboardCheck className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">تقييم فترة التجربة (90 يوماً)</h1>
          <p className="text-slate-500">النموذج: F-HRT-009 | الموارد البشرية والتدريب</p>
        </div>
      </div>

      <form className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-8">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">بيانات الموظف</h3>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">رقم التقييم (تلقائي)</label>
                <input type="text" readOnly className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500" value={formData.probationId} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">تاريخ التقييم <span className="text-red-500">*</span></label>
                <input type="date" required className={inputCls} value={formData.evaluationDate} onChange={(e) => setFormData({ ...formData, evaluationDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">اسم الموظف <span className="text-red-500">*</span></label>
                <input type="text" required className={inputCls} value={formData.employeeName} onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">الرقم الوظيفي</label>
                <input type="text" className={inputCls} value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">القسم</label>
                <input type="text" className={inputCls} value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">المسمى الوظيفي</label>
                <input type="text" className={inputCls} value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">تاريخ الالتحاق</label>
                <input type="date" className={inputCls} value={formData.joinDate} onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">القرار النهائي</label>
                <select className={inputCls} value={formData.decision} onChange={(e) => setFormData({ ...formData, decision: e.target.value })}>
                  <option value="">— اختر —</option>
                  <option value="تثبيت">تثبيت</option>
                  <option value="تمديد فترة التجربة">تمديد فترة التجربة</option>
                  <option value="إنهاء الخدمة">إنهاء الخدمة</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">معايير التقييم (من 1 إلى 5)</h3>
            <table className="w-full text-right text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="p-3 border-b border-slate-200">المعيار</th>
                  <th className="p-3 border-b border-slate-200 w-28">التقييم</th>
                  <th className="p-3 border-b border-slate-200">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {formData.criteria.map((c, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="p-3 font-semibold text-slate-800">{c.criterion}</td>
                    <td className="p-3">
                      <input type="number" min={1} max={5} className="w-20 px-2 py-1.5 border border-slate-300 rounded text-sm" value={c.rating} onChange={(e) => updateCriterion(i, "rating", e.target.value)} />
                    </td>
                    <td className="p-3">
                      <input type="text" className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm" value={c.notes} onChange={(e) => updateCriterion(i, "notes", e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">ملاحظات عامة</label>
            <textarea rows={3} className={inputCls} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-200 p-6">
          <button type="button" disabled={loading} onClick={(e) => handleSubmit(e, "draft")} className="flex items-center px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[14px]">حفظ كمسودة</button>
          {user?.level <= 2 ? (
            <button type="button" disabled={loading} onClick={(e) => handleSubmit(e, "approved")} className="flex items-center px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold text-[14px]">حفظ واعتماد</button>
          ) : (
            <button type="button" disabled={loading} onClick={(e) => handleSubmit(e, user?.level === 3 ? "pending_approval" : "pending_review")} className="flex items-center px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold text-[14px]">إرسال للمراجعة</button>
          )}
          <div className="flex-1"></div>
          <button type="button" disabled={loading} onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))} className="text-slate-500 hover:text-slate-700 font-semibold text-[14px]">إغلاق والعودة</button>
        </div>
      </form>
    </div>
  );
}
