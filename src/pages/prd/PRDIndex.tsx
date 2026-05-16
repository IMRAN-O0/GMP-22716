import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Search, FileSignature, BarChart3 } from "lucide-react";
import { StatusBadge } from "../../components/StatusBadge";
import DepartmentNotifications from "../../components/DepartmentNotifications";

export default function PRDIndex() {
  const [forms, setForms] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/forms/dept/PRD")
      .then((r) => r.json())
      .then((data) => setForms(data))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <DepartmentNotifications />
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 m-0">
            الإنتاج (PRD)
          </h1>
          <p className="text-[14px] text-slate-500 mt-1">
            إدارة أوامر الإنتاج، سجلات التصنيع، وقوائم المراجعة والمراقبة.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Link
            to="/reports"
            className="flex items-center px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 font-semibold text-[13px] transition-colors border border-amber-200 shadow-sm"
          >
            <BarChart3 className="w-4 h-4 ml-2" />
            تقارير الإنتاج
          </Link>
          <Link
            to="/prd/production-order"
            className="flex items-center px-3 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[13px] transition-colors border border-slate-200 shadow-sm"
          >
            <PlusCircle className="w-4 h-4 ml-2 text-sky-500" />
            أمر الإنتاج (F-PRD-001)
          </Link>
          <Link
            to="/prd/batch-record"
            className="flex items-center px-3 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[13px] transition-colors border border-slate-200 shadow-sm"
          >
            <PlusCircle className="w-4 h-4 ml-2 text-sky-500" />
            سجل التصنيع (F-PRD-002)
          </Link>
          <Link
            to="/prd/production-checklist"
            className="flex items-center px-3 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[13px] transition-colors border border-slate-200 shadow-sm"
          >
            <PlusCircle className="w-4 h-4 ml-2 text-sky-500" />
            قائمة مراجعة الإنتاج (F-PRD-003)
          </Link>
          <Link
            to="/prd/process-monitoring"
            className="flex items-center px-3 py-2 bg-sky-400 text-white rounded-lg hover:bg-sky-500 font-semibold text-[13px] transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4 ml-2" />
            مراقبة العملية (F-PRD-004)
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex items-center">
          <div>
            <span className="block text-[13px] font-semibold text-slate-500 mb-2">
              المسودات المفتوحة
            </span>
            <div className="text-[24px] font-bold text-slate-900">
              {forms.filter((f) => f.status === "draft").length} سجل
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex items-center">
          <div>
            <span className="block text-[13px] font-semibold text-slate-500 mb-2">
              السجلات المعتمدة
            </span>
            <div className="text-[24px] font-bold text-slate-900">
              {forms.filter((f) => f.status === "approved").length} سجل
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex items-center">
          <div>
            <span className="block text-[13px] font-semibold text-slate-500 mb-2">
              إجمالي السجلات المركزية
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
            أحدث النماذج والسجلات المتصلة (الإنتاج)
          </span>
          <div className="relative">
            <input
              type="text"
              placeholder="بحث برقم الأمر او الدفعة..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-[14px] w-64 focus:ring-sky-400 focus:border-sky-400 text-slate-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-white text-slate-500 text-[13px] font-semibold">
              <tr>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">
                  رقم السجل / الدفعة
                </th>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">
                  رقم النموذج
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
              {forms.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    لا توجد سجلات حتى الآن
                  </td>
                </tr>
              ) : (
                forms.map((f, i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {f.record_id}
                    </td>
                    <td className="px-6 py-4">{f.form_id}</td>
                    <td className="px-6 py-4">
                      {new Date(f.created_at).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="px-6 py-4">{f.creator_id}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={f.status} />
                    </td>
                    <td className="px-6 py-4 text-sky-400 font-semibold hover:underline cursor-pointer">
                      <Link
                        to={`/prd/view/${f.record_id}`}
                        className="flex items-center gap-1 justify-end"
                      >
                        <FileSignature className="w-4 h-4" />
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
