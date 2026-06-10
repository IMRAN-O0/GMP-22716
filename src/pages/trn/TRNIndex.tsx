import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  FileText,
  Calendar,
  GraduationCap,
  Award,
  Search,
  Archive,
  AlertCircle,
} from "lucide-react";
import { StatusBadge } from "../../components/StatusBadge";
import DepartmentNotifications from "../../components/DepartmentNotifications";
import { getAuthHeaders } from "../../lib/utils";
import { FORM_LABELS } from "../../constants/formLabels";

export default function TRNIndex() {
  const [forms, setForms] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/forms/dept/TRN", { headers: getAuthHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error("فشل تحميل السجلات");
        return r.json();
      })
      .then((data) => setForms(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setError("تعذّر تحميل سجلات التدريب. تأكد من الاتصال وحاول مجدداً.");
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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            قطاع التدريب والتطوير (TRN)
          </h1>
          <p className="text-slate-500">
            إدارة برامج التدريب، السجلات الفردية، تقييم الفعالية، والشهادات.
          </p>
        </div>
        <div className="flex bg-white px-4 py-2 border border-slate-200 rounded-xl shadow-sm gap-2 text-sky-600 font-bold items-center">
          <BookOpen className="w-5 h-5 text-sky-500" />
          <span>إجمالي السجلات: {forms.length}</span>
        </div>
      </div>

      {/* Forms Grid */}
      <section>
        <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
          <BookOpen className="w-6 h-6 text-sky-500" />
          <h2 className="text-xl font-bold text-slate-800">
            نماذج وإجراءات التدريب
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/trn/trn-001"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-sky-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Calendar className="text-sky-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-TRN-001</h4>
            <p className="text-sm text-slate-500 mt-1">خطة التدريب السنوية</p>
          </Link>
          <Link
            to="/trn/trn-002"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-sky-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileText className="text-sky-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-TRN-002</h4>
            <p className="text-sm text-slate-500 mt-1">سجل التدريب الفردي</p>
          </Link>
          <Link
            to="/trn/trn-003"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-sky-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <GraduationCap className="text-sky-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-TRN-003</h4>
            <p className="text-sm text-slate-500 mt-1">تقييم فعالية التدريب</p>
          </Link>
          <Link
            to="/trn/trn-004"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-sky-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Award className="text-sky-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-TRN-004</h4>
            <p className="text-sm text-slate-500 mt-1">شهادة إتمام التدريب</p>
          </Link>
        </div>
      </section>

      {/* Database View / Data Table */}
      <div className="mt-8 bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col pt-2">
        <div className="px-6 py-4 flex justify-between items-center mb-2">
          <span className="text-[16px] font-bold text-slate-900">
            أحدث النماذج والسجلات المتصلة (التدريب)
          </span>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث برقم السجل أو النموذج..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-[14px] w-64 focus:ring-sky-400 focus:border-sky-400 text-slate-700"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-[13px] font-semibold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-200">
                  رقم السجل
                </th>
                <th className="px-6 py-4 border-b border-slate-200">النموذج</th>
                <th className="px-6 py-4 border-b border-slate-200">
                  تاريخ الإنشاء
                </th>
                <th className="px-6 py-4 border-b border-slate-200">المنشئ</th>
                <th className="px-6 py-4 border-b border-slate-200">الحالة</th>
                <th className="px-6 py-4 border-b border-slate-200">إجراء</th>
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
                    className="hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {f.record_id}
                    </td>
                    <td className="px-6 py-4">{FORM_LABELS[f.form_id] || f.form_id}</td>
                    <td className="px-6 py-4">
                      {new Date(f.created_at).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="px-6 py-4">مستخدم ({f.creator_id})</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={f.status} />
                    </td>
                    <td className="px-6 py-4 text-sky-500 font-semibold hover:underline cursor-pointer">
                      <Link
                        to={`/trn/view/${f.record_id}`}
                        className="flex items-center gap-1"
                      >
                        <Archive className="w-4 h-4" />
                        عرض التفاصيل
                      </Link>
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
