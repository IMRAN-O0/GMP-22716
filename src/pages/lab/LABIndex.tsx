import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Beaker,
  FileText,
  FlaskConical,
  Stethoscope,
  TestTube2,
  Scale,
  Search,
  Archive,
} from "lucide-react";
import { StatusBadge } from "../../components/StatusBadge";
import DepartmentNotifications from "../../components/DepartmentNotifications";
import { getAuthHeaders } from "../../lib/utils";

export default function LABIndex() {
  const [forms, setForms] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/forms/dept/LAB", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => setForms(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <DepartmentNotifications />
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            قطاع المختبر (LAB)
          </h1>
          <p className="text-slate-500">
            إدارة طلبات الاختبار، العينات، النتائج، شهادات التحليل، ودراسات
            الاستقرارية.
          </p>
        </div>
        <div className="flex bg-white px-4 py-2 border border-slate-200 rounded-xl shadow-sm gap-2 text-indigo-600 font-bold items-center">
          <Beaker className="w-5 h-5 text-indigo-500" />
          <span>إجمالي السجلات: {forms.length}</span>
        </div>
      </div>

      {/* Forms Grid */}
      <section>
        <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
          <FlaskConical className="w-6 h-6 text-indigo-500" />
          <h2 className="text-xl font-bold text-slate-800">
            نماذج العمليات المخبرية
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/lab/lab-001"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileText className="text-indigo-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-LAB-001</h4>
            <p className="text-sm text-slate-500 mt-1">طلبات الاختبار</p>
          </Link>
          <Link
            to="/lab/lab-002"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <TestTube2 className="text-indigo-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-LAB-002</h4>
            <p className="text-sm text-slate-500 mt-1">
              سجلات العينات واستلامها
            </p>
          </Link>
          <Link
            to="/lab/lab-003"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Stethoscope className="text-indigo-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-LAB-003</h4>
            <p className="text-sm text-slate-500 mt-1">نتائج الاختبارات</p>
          </Link>
          <Link
            to="/lab/lab-004"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Beaker className="text-indigo-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-LAB-004</h4>
            <p className="text-sm text-slate-500 mt-1">شهادات التحليل (COA)</p>
          </Link>
          <Link
            to="/lab/lab-005"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FlaskConical className="text-indigo-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-LAB-005</h4>
            <p className="text-sm text-slate-500 mt-1">اختبارات الاستقرارية</p>
          </Link>
          <Link
            to="/lab/lab-006"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Scale className="text-indigo-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-LAB-006</h4>
            <p className="text-sm text-slate-500 mt-1">معايرة أجهزة المختبر</p>
          </Link>
          <Link
            to="/lab/lab-007"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FlaskConical className="text-indigo-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-LAB-007</h4>
            <p className="text-sm text-slate-500 mt-1">طلب مواد (R&D)</p>
          </Link>
        </div>
      </section>

      {/* Database View / Data Table */}
      <div className="mt-8 bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col pt-2">
        <div className="px-6 py-4 flex justify-between items-center mb-2">
          <span className="text-[16px] font-bold text-slate-900">
            أحدث النماذج والسجلات المتصلة (المختبر)
          </span>
          <div className="relative">
            <input
              type="text"
              placeholder="بحث برقم السجل..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-[14px] w-64 focus:ring-indigo-400 focus:border-indigo-400 text-slate-500"
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
                    className="hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {f.record_id}
                    </td>
                    <td className="px-6 py-4">{f.form_id}</td>
                    <td className="px-6 py-4">
                      {new Date(f.created_at).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="px-6 py-4">مستخدم ({f.creator_id})</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={f.status} />
                    </td>
                    <td className="px-6 py-4 text-indigo-500 font-semibold hover:underline cursor-pointer">
                      <Link
                        to={`/lab/view/${f.record_id}`}
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
