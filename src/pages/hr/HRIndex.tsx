import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Search, FileSignature, Pencil, AlertCircle } from "lucide-react";
import { StatusBadge } from "../../components/StatusBadge";
import DepartmentNotifications from "../../components/DepartmentNotifications";
import { getAuthHeaders } from "../../lib/utils";
import { FORM_LABELS } from "../../constants/formLabels";

export default function HRIndex() {
  const [forms, setForms] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/forms/dept/HR", { headers: getAuthHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error("فشل تحميل السجلات");
        return r.json();
      })
      .then((data) => setForms(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setError("تعذّر تحميل سجلات الموارد البشرية. تأكد من الاتصال وحاول مجدداً.");
      });
  }, []);

  const filteredForms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return forms;
    return forms.filter((f) => {
      const label = FORM_LABELS[f.form_id] || f.form_id;
      return [f.record_id, f.form_id, label, f.status, f.creator_id]
        .map((v) => String(v ?? "").toLowerCase())
        .some((v) => v.includes(q));
    });
  }, [forms, search]);

  return (
    <div className="space-y-6">
      <DepartmentNotifications />
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 m-0">
            الموارد البشرية (HR)
          </h1>
          <p className="text-[14px] text-slate-500 mt-1">
            إدارة بيانات الموظفين والنماذج الخاصة بالتوظيف والفحص الطبي.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Link
            to="/hr/new-request"
            className="flex items-center px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[13px] transition-colors border border-slate-200 shadow-sm"
          >
            <PlusCircle className="w-4 h-4 ml-2 text-sky-500" />
            طلب توظيف (F-HR-001)
          </Link>
          <Link
            to="/hr/employee-file"
            className="flex items-center px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[13px] transition-colors border border-slate-200 shadow-sm"
          >
            <PlusCircle className="w-4 h-4 ml-2 text-sky-500" />
            ملف موظف (F-HR-002)
          </Link>
          <Link
            to="/hr/medical-exam"
            className="flex items-center px-4 py-2 bg-sky-400 text-white rounded-lg hover:bg-sky-500 font-semibold text-[13px] transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4 ml-2" />
            فحص طبي (F-HR-003)
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex items-center">
          <div>
            <span className="block text-[13px] font-semibold text-slate-500 mb-2">
              الطلبات المفتوحة
            </span>
            <div className="text-[24px] font-bold text-slate-900">
              {forms.filter((f) => f.status === "draft").length} طلب
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex items-center">
          <div>
            <span className="block text-[13px] font-semibold text-slate-500 mb-2">
              الطلبات المعتمدة
            </span>
            <div className="text-[24px] font-bold text-slate-900">
              {forms.filter((f) => f.status === "approved").length} طلب
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex items-center">
          <div>
            <span className="block text-[13px] font-semibold text-slate-500 mb-2">
              إجمالي السجلات
            </span>
            <div className="text-[24px] font-bold text-slate-900">
              {forms.length} سجل
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-200 flex flex-col pt-2">
        <div className="px-6 py-4 flex justify-between items-center mb-2">
          <span className="text-[16px] font-bold text-slate-900">
            أحدث النماذج والسجلات
          </span>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث عن بيانات..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-[14px] w-64 focus:ring-sky-400 focus:border-sky-400 text-slate-700"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-white text-slate-500 text-[13px] font-semibold">
              <tr>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">
                  رقم السجل
                </th>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">
                  النموذج
                </th>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">
                  تاريخ الإنشاء
                </th>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">
                  المنشئ
                </th>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">
                  الحالة
                </th>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">
                  إجراء
                </th>
              </tr>
            </thead>
            <tbody className="text-[14px] text-slate-600">
              {filteredForms.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    {search ? "لا توجد نتائج مطابقة للبحث" : "لا توجد سجلات حتى الآن"}
                  </td>
                </tr>
              ) : (
                filteredForms.map((f, i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {f.record_id}
                    </td>
                    <td className="px-6 py-4">{FORM_LABELS[f.form_id] || f.form_id}</td>
                    <td className="px-6 py-4">
                      {new Date(f.created_at).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="px-6 py-4">{f.creator_id}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={f.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        {f.form_id === "F-HR-002" && (
                          <Link
                            to={`/hr/employee-file?edit=${f.record_id}`}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold rounded-lg text-[12px] border border-amber-200"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            تعديل
                          </Link>
                        )}
                        <Link
                          to={`/hr/view/${f.record_id}`}
                          className="flex items-center gap-1 text-sky-500 hover:text-sky-700 font-semibold text-[13px]"
                        >
                          <FileSignature className="w-4 h-4" />
                          عرض
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
