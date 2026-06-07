import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, CheckCircle, Pencil, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { nextSequentialId, getAuthHeaders } from "../../lib/utils";

const BASE_FORM = {
  fullNameAr: "", fullNameEn: "", idNumber: "", dob: "", nationality: "",
  maritalStatus: "أعزب", phone: "", email: "", address: "",
  employeeNumber: "",
  joinDate: "", department: "", jobTitle: "", supervisor: "",
  contractType: "دوام كامل", basicSalary: "", allowances: "",
};

export default function FormHR002() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [allHrIds, setAllHrIds] = useState<string[]>([]);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [company, setCompany] = useState<any>({});

  const [formData, setFormData] = useState(BASE_FORM);
  const [date] = useState(new Date().toLocaleDateString("ar-EG"));

  const h = getAuthHeaders();

  // Next employee number, derived from the employee numbers already in use.
  const nextEmployeeNumber = (recs: any[]) =>
    nextSequentialId(
      "EMP",
      recs.map((f: any) => f?.data?.employeeNumber).filter(Boolean),
      3,
    );

  useEffect(() => {
    const editId = new URLSearchParams(window.location.search).get("edit");

    fetch("/api/company", { headers: h })
      .then((r) => r.json())
      .then((d) => setCompany(d || {}))
      .catch(() => {});

    fetch("/api/forms/dept/HR", { headers: h })
      .then(r => r.json())
      .then(data => {
        const rows = Array.isArray(data) ? data : [];
        const hr002 = rows.filter((f: any) => f.form_id === "F-HR-002");
        setRecords(hr002);
        setAllHrIds(rows.map((f: any) => f.record_id).filter(Boolean));
        // Pre-fill a fresh employee number only when creating a new file.
        if (!editId) {
          setFormData((prev) =>
            prev.employeeNumber ? prev : { ...prev, employeeNumber: nextEmployeeNumber(hr002) },
          );
        }
      })
      .catch(() => {});

    // Support URL param edit (from HRIndex edit button)
    if (editId) {
      fetch(`/api/forms/record/${editId}`, { headers: h })
        .then(r => r.json())
        .then(data => {
          if (data?.data) {
            setFormData(prev => ({ ...prev, ...data.data, employeeNumber: data.data.employeeNumber || prev.employeeNumber }));
            setEditingRecordId(editId);
          }
        })
        .catch(() => {});
    }
  }, []);

  const startEdit = (record: any) => {
    setEditingRecordId(record.record_id);
    setFormData(prev => ({ ...prev, ...record.data, employeeNumber: record.data.employeeNumber || prev.employeeNumber }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingRecordId(null);
    setFormData({ ...BASE_FORM, employeeNumber: nextEmployeeNumber(records) });
  };

  const handleSubmit = async (e: React.FormEvent, status: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = editingRecordId !== null;
      const recordId = isEdit ? editingRecordId! : nextSequentialId("HR", allHrIds);
      const payload = { recordId, formId: "F-HR-002", department: "HR", creatorId: user?.id, status, data: formData };
      const res = await fetch(
        isEdit ? `/api/forms/record/${editingRecordId}` : "/api/forms",
        { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json", ...h }, body: JSON.stringify(payload) }
      );
      if (res.ok) {
        alert(isEdit ? "تم تعديل بيانات الموظف بنجاح" : `تم الحفظ بنجاح. رقم المستند: ${recordId}`);
        if (isEdit) {
          setRecords(prev => prev.map(r => r.record_id === editingRecordId ? { ...r, data: formData, status } : r));
          cancelEdit();
        } else {
          navigate("/hr");
        }
      } else {
        const errData = await res.json().catch(() => ({ error: "حدث خطأ أثناء الحفظ" }));
        alert(errData.error || "حدث خطأ أثناء الحفظ");
      }
    } catch (err) {
      console.error(err);
      alert("تعذّر الاتصال بالخادم. تحقق من اتصالك وحاول مرة أخرى.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden">
      <div className="border-b border-slate-200 p-6 flex justify-between items-center bg-slate-50">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{company.name_ar || "نظام الجودة"}</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">ISO 22716 - GMP</p>
        </div>
        <div className="text-left">
          <h2 className="text-xl font-bold text-slate-800 mb-1">ملف الموظف الشخصي</h2>
          <p className="text-sm font-mono text-slate-500">نموذج: F-HR-002</p>
          <p className="text-sm font-mono text-slate-500">تاريخ الإصدار: {date}</p>
        </div>
      </div>

      <form className="p-8">
        {editingRecordId && (
          <div className="flex items-center justify-between mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-[13px] font-bold text-amber-800">
              <Pencil className="w-4 h-4 inline ml-1" />
              وضع التعديل — قم بتعديل البيانات ثم اضغط "حفظ التعديل"
            </span>
            <button type="button" onClick={cancelEdit} className="flex items-center gap-1 text-[12px] text-amber-700 hover:text-red-600 font-semibold">
              <X className="w-4 h-4" /> إلغاء التعديل
            </button>
          </div>
        )}

        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">البيانات الشخصية</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">الاسم الكامل (عربي) <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.fullNameAr} onChange={e => setFormData({ ...formData, fullNameAr: e.target.value })} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">الاسم الكامل (إنجليزي) <span className="text-red-500">*</span></label>
            <input type="text" required dir="ltr" value={formData.fullNameEn} onChange={e => setFormData({ ...formData, fullNameEn: e.target.value })} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2 text-left" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">الهوية / الإقامة <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.idNumber} onChange={e => setFormData({ ...formData, idNumber: e.target.value })} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">تاريخ الميلاد <span className="text-red-500">*</span></label>
            <input type="date" required value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">الجنسية <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">الحالة الاجتماعية</label>
            <select value={formData.maritalStatus} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2">
              <option>أعزب</option><option>متزوج</option><option>مطلق</option><option>أرمل</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">رقم الهاتف <span className="text-red-500">*</span></label>
            <input type="tel" required dir="ltr" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2 text-left" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">البريد الإلكتروني</label>
            <input type="email" dir="ltr" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2 text-left" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">العنوان بالتفصيل <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">البيانات الوظيفية</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">رقم الموظف (تلقائي)</label>
            <input type="text" disabled value={formData.employeeNumber} className="w-full border-transparent bg-slate-100 rounded-lg shadow-sm text-sm py-2 text-slate-600 font-mono" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">تاريخ الالتحاق <span className="text-red-500">*</span></label>
            <input type="date" required value={formData.joinDate} onChange={e => setFormData({ ...formData, joinDate: e.target.value })} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">القسم <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">المسمى الوظيفي <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.jobTitle} onChange={e => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">المشرف المباشر <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.supervisor} onChange={e => setFormData({ ...formData, supervisor: e.target.value })} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">نوع العقد <span className="text-red-500">*</span></label>
            <select value={formData.contractType} onChange={e => setFormData({ ...formData, contractType: e.target.value })} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2">
              <option>دوام كامل</option><option>دوام جزئي</option><option>تدريب</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">الراتب الأساسي</label>
            <input type="number" value={formData.basicSalary} onChange={e => setFormData({ ...formData, basicSalary: e.target.value })} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">البدلات</label>
            <input type="text" value={formData.allowances} onChange={e => setFormData({ ...formData, allowances: e.target.value })} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2" />
          </div>
        </div>

        <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl my-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><span className="font-semibold block text-slate-600 mb-1">أعدّه (تلقائي):</span><div className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-slate-700">{user?.name || "---"}</div></div>
          <div><span className="font-semibold block text-slate-600 mb-1">تاريخ الإعداد:</span><div className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-slate-700">{date}</div></div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-200">
          {!editingRecordId && (
            <button type="button" disabled={loading} onClick={e => handleSubmit(e, "draft")} className="flex items-center px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[14px]">حفظ كمسودة</button>
          )}
          {editingRecordId ? (
            <button type="button" disabled={loading} onClick={e => handleSubmit(e, "approved")} className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-semibold text-[14px]">
              <Pencil className="w-4 h-4" /> حفظ التعديل
            </button>
          ) : user?.level <= 2 ? (
            <button type="button" disabled={loading} onClick={e => handleSubmit(e, "approved")} className="flex items-center px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold text-[14px]">حفظ واعتماد</button>
          ) : (
            <button type="button" disabled={loading} onClick={e => handleSubmit(e, user?.level === 3 ? "pending_approval" : "pending_review")} className="flex items-center px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold text-[14px]">إرسال للمراجعة</button>
          )}
          <div className="flex-1"></div>
          <button type="button" disabled={loading} onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")} className="text-slate-500 hover:text-slate-700 font-semibold text-[14px]">إغلاق والعودة</button>
        </div>
      </form>

      {/* Existing employee records */}
      {records.length > 0 && (
        <div className="border-t border-slate-200 px-8 py-6">
          <h3 className="text-[15px] font-bold text-slate-700 mb-3">ملفات الموظفين المسجلة</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[13px]">
                  <th className="p-3 border-b font-semibold">رقم الموظف</th>
                  <th className="p-3 border-b font-semibold">الاسم</th>
                  <th className="p-3 border-b font-semibold">القسم</th>
                  <th className="p-3 border-b font-semibold">المسمى الوظيفي</th>
                  <th className="p-3 border-b font-semibold text-center w-24">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.record_id} className={`border-b border-slate-100 hover:bg-slate-50 ${editingRecordId === r.record_id ? "bg-amber-50" : ""}`}>
                    <td className="p-3 font-mono text-sky-700 font-bold">{r.data?.employeeNumber || r.record_id}</td>
                    <td className="p-3 text-slate-800 font-semibold">{r.data?.fullNameAr || "—"}</td>
                    <td className="p-3 text-slate-600">{r.data?.department || "—"}</td>
                    <td className="p-3 text-slate-600">{r.data?.jobTitle || "—"}</td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => startEdit(r)}
                        className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-[11px] font-bold border border-amber-200 transition-colors mx-auto"
                      >
                        <Pencil className="w-3 h-3" /> تعديل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
