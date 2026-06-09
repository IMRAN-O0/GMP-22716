import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckSquare } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { nextSequentialId, getAuthHeaders, getJsonHeaders } from "../../lib/utils";

export default function FormHRT013() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading] = useState(false);
  const [formData, setFormData] = useState({
    clearanceId: "",
    employeeName: "",
    employeeId: "",
    department: "",
    lastWorkingDay: "",
    clearanceItems: [
      { task: "تسليم العهدة (أجهزة / أدوات / معدات)", done: false },
      { task: "تسليم بطاقات الدخول والمفاتيح", done: false },
      { task: "إغلاق حسابات الأنظمة والبريد الإلكتروني", done: false },
      { task: "تسوية السلف والمستحقات المالية", done: false },
      { task: "إخلاء طرف من قسم تقنية المعلومات", done: false },
      { task: "إخلاء طرف من المخازن", done: false },
    ] as { task: string; done: boolean }[],
    finalSettlement: "",
    clearanceDate: new Date().toISOString().split("T")[0],
    notes: "",
    preparedBy: user?.name || "",
    status: "Draft",
  });

  const toggleItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      clearanceItems: prev.clearanceItems.map((a, i) => (i === index ? { ...a, done: !a.done } : a)),
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
          recordId: formData.clearanceId || nextSequentialId("HRT-CLR", []),
          formId: "F-HRT-013",
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
          const ids = rows.filter((f: any) => f.form_id === "F-HRT-013").map((f: any) => f.record_id);
          setFormData((prev) => ({ ...prev, clearanceId: nextSequentialId("HRT-CLR", ids) }));
        })
        .catch(() => {});
    }
  }, []);

  const inputCls = "w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-sky-200 shadow-sm border-r-4 border-r-sky-500">
        <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
          <CheckSquare className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">إخلاء طرف (Clearance)</h1>
          <p className="text-slate-500">النموذج: F-HRT-013 | الموارد البشرية والتدريب</p>
        </div>
      </div>

      <form className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-8">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm font-semibold">
            ⚠ يتضمن تسوية مستحقات مالية — يُمنح بصلاحية خاصة.
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">بيانات الموظف</h3>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">رقم إخلاء الطرف (تلقائي)</label>
                <input type="text" readOnly className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500" value={formData.clearanceId} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">تاريخ إخلاء الطرف <span className="text-red-500">*</span></label>
                <input type="date" required className={inputCls} value={formData.clearanceDate} onChange={(e) => setFormData({ ...formData, clearanceDate: e.target.value })} />
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">آخر يوم عمل</label>
                <input type="date" className={inputCls} value={formData.lastWorkingDay} onChange={(e) => setFormData({ ...formData, lastWorkingDay: e.target.value })} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">بنود إخلاء الطرف</h3>
            <div className="space-y-3">
              {formData.clearanceItems.map((a, i) => (
                <label key={i} className="flex items-center gap-3 bg-slate-50 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100">
                  <input type="checkbox" className="w-5 h-5 text-sky-600 rounded focus:ring-sky-500" checked={a.done} onChange={() => toggleItem(i)} />
                  <span className="text-sm font-semibold text-slate-700">{a.task}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">التسوية المالية</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">إجمالي مستحقات نهاية الخدمة</label>
                <input type="number" className={inputCls} value={formData.finalSettlement} onChange={(e) => setFormData({ ...formData, finalSettlement: e.target.value })} />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">ملاحظات</label>
              <textarea rows={2} className={inputCls} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>
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
