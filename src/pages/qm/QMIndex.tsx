import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  Users,
  FileText,
  CheckCircle,
  Search,
  Settings,
  ArrowRight,
  AlertTriangle,
  Activity,
  PenTool,
  LayoutDashboard,
  Database,
  FileBox,
  FileSearch,
  Building2,
  Wind,
  Droplets,
  ThermometerSun,
  Lightbulb,
  Wrench,
  FileBarChart2,
  Pencil,
} from "lucide-react";
import DepartmentNotifications from "../../components/DepartmentNotifications";

export default function QMIndex() {
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/forms/dept/QM", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then((res) => res.json())
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-8">
      <DepartmentNotifications />
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 m-0">
            إدارة الجودة (QM)
          </h1>
          <p className="text-[14px] text-slate-500 mt-1">
            نظام إدارة الجودة الشامل وفق متطلبات ISO 22716 - للإنتاج، المخزون
            والتفتيش.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Link
            to="/reports"
            className="flex items-center px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 font-semibold text-[13px] transition-colors border border-amber-200 shadow-sm"
          >
            <FileBarChart2 className="w-4 h-4 ml-2" />
            التقارير
          </Link>
        </div>
      </div>

      {/* QM Records & CAPA */}
      <section>
        <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
          <ShieldAlert className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-800">
            سجلات الجودة وحالات عدم المطابقة (QM & CAPA)
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/qm/qm-001"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileBarChart2 className="text-indigo-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-QM-001</h4>
            <p className="text-sm text-slate-500 mt-1">مراجعات الإدارة</p>
          </Link>
          <Link
            to="/qm/qm-002"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <AlertTriangle className="text-indigo-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-QM-002</h4>
            <p className="text-sm text-slate-500 mt-1">تقييم المخاطر</p>
          </Link>
          <Link
            to="/qm/qm-003"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Users className="text-indigo-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-QM-003</h4>
            <p className="text-sm text-slate-500 mt-1">
              تقييم الموردين{" "}
              <span className="text-xs block text-slate-400">
                (مرتبط بالمخزون)
              </span>
            </p>
          </Link>
          <Link
            to="/qm/qm-004"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Activity className="text-indigo-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-QM-004</h4>
            <p className="text-sm text-slate-500 mt-1">مؤشرات الأداء KPIs</p>
          </Link>
          <Link
            to="/qm/qm-005"
            className="bg-white border border-indigo-200 bg-indigo-50/50 rounded-xl p-6 hover:shadow-md hover:border-indigo-400 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileSearch className="text-indigo-600 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-QM-005</h4>
            <p className="text-sm text-slate-500 mt-1 font-semibold text-indigo-700">
              تقارير عدم المطابقة NCR
            </p>
          </Link>
          <Link
            to="/qm/qm-006"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <CheckCircle className="text-indigo-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-QM-006</h4>
            <p className="text-sm text-slate-500 mt-1">نماذج CAPA</p>
          </Link>
        </div>
      </section>

      {/* Deviations */}
      <section>
        <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
          <Activity className="w-6 h-6 text-rose-500" />
          <h2 className="text-xl font-bold text-slate-800">
            الانحرافات وإجراءات التصحيح (Deviations)
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/qm/dev-001"
            className="bg-white border border-rose-200 bg-rose-50/50 rounded-xl p-6 hover:shadow-md hover:border-rose-400 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <AlertTriangle className="text-rose-600 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-DEV-001</h4>
            <p className="text-sm text-slate-500 mt-1 font-semibold text-rose-700">
              تقرير الانحراف{" "}
              <span className="text-xs block text-slate-400 font-normal">
                (مرتبط بالإنتاج)
              </span>
            </p>
          </Link>
          <Link
            to="/qm/dev-002"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-rose-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Search className="text-rose-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-DEV-002</h4>
            <p className="text-sm text-slate-500 mt-1">
              تحليل السبب الجذري RCA
            </p>
          </Link>
          <Link
            to="/qm/dev-003"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-rose-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <CheckCircle className="text-rose-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-DEV-003</h4>
            <p className="text-sm text-slate-500 mt-1">خطة الإجراء التصحيحي</p>
          </Link>
          <Link
            to="/qm/dev-004"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-rose-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Activity className="text-rose-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-DEV-004</h4>
            <p className="text-sm text-slate-500 mt-1">تقييم فعالية CAPA</p>
          </Link>
        </div>
      </section>

      {/* Complaints and Recalls */}
      <section>
        <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
          <AlertTriangle className="w-6 h-6 text-fuchsia-500" />
          <h2 className="text-xl font-bold text-slate-800">
            الشكاوى وسحب المنتجات (Complaints & Recalls)
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/qm/cmp-001"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-fuchsia-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-fuchsia-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <AlertTriangle className="text-fuchsia-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-CMP-001</h4>
            <p className="text-sm text-slate-500 mt-1">
              تسجيل وتحقيق والرد على الشكاوى
            </p>
          </Link>
          <Link
            to="/qm/rcl-001"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-fuchsia-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-fuchsia-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Activity className="text-fuchsia-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-RCL-001</h4>
            <p className="text-sm text-slate-500 mt-1">
              قرارات وخطط وتقارير السحب
            </p>
          </Link>
        </div>
      </section>

      {/* Facilities & Premises */}
      <section>
        <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
          <Building2 className="w-6 h-6 text-sky-500" />
          <h2 className="text-xl font-bold text-slate-800">
            تفتيش المباني والمرافق (Premises)
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link
            to="/qm/prm-001"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-sky-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Building2 className="text-sky-500 w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-800">F-PRM-001</h4>
            <p className="text-[12px] text-slate-500 mt-1">تفتيش المباني</p>
          </Link>
          <Link
            to="/qm/prm-002"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-sky-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ThermometerSun className="text-sky-500 w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-800">F-PRM-002</h4>
            <p className="text-[12px] text-slate-500 mt-1">الحرارة والرطوبة</p>
          </Link>
          <Link
            to="/qm/prm-003"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-sky-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Lightbulb className="text-sky-500 w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-800">F-PRM-003</h4>
            <p className="text-[12px] text-slate-500 mt-1">أنظمة الإضاءة</p>
          </Link>
          <Link
            to="/qm/prm-004"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-sky-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Wind className="text-sky-500 w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-800">F-PRM-004</h4>
            <p className="text-[12px] text-slate-500 mt-1">جودة الهواء</p>
          </Link>
          <Link
            to="/qm/prm-005"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-sky-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Droplets className="text-sky-500 w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-800">F-PRM-005</h4>
            <p className="text-[12px] text-slate-500 mt-1">أنظمة الصرف</p>
          </Link>
        </div>
      </section>

      {/* Equipment Maintenance */}
      <section>
        <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
          <Wrench className="w-6 h-6 text-emerald-500" />
          <h2 className="text-xl font-bold text-slate-800">
            دعم المعدات والصيانة (Equipment)
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/qm/eqp-001"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-emerald-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Settings className="text-emerald-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-EQP-001</h4>
            <p className="text-sm text-slate-500 mt-1">سجلات وفحوصات المعدات</p>
          </Link>
          <Link
            to="/qm/mnt-001"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-emerald-300 transition-all flex flex-col items-center group text-center"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <PenTool className="text-emerald-500 w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">F-MNT-001</h4>
            <p className="text-sm text-slate-500 mt-1">خطط وسجلات الصيانة</p>
          </Link>
        </div>
      </section>

      {/* QM Records List */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-800">
              سجل النماذج المعتمدة (QM Records)
            </h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-[13px] border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold w-1/4">رقم السجل</th>
                <th className="p-4 font-semibold">رقم النموذج</th>
                <th className="p-4 font-semibold">تاريخ الإنشاء</th>
                <th className="p-4 font-semibold text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="text-[14px]">
              {records.filter((r) => r.record_id && r.form_id).length > 0 ? (
                records
                  .filter((r) => r.record_id && r.form_id)
                  .map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4 font-mono font-bold text-slate-700">
                        {r.record_id}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-md text-xs">
                          {r.form_id}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(r.created_at).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          {r.form_id === "F-EQP-001" && (
                            <Link
                              to={`/qm/eqp-001?edit=${r.record_id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold rounded-lg text-xs border border-amber-200 transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                              تعديل
                            </Link>
                          )}
                          <Link
                            to={`/qm/view/${r.record_id}`}
                            className="inline-block px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 font-bold rounded-lg text-xs transition-colors"
                          >
                            عرض / طباعة
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    لا توجد سجلات بعد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
