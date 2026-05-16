import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  FileStack,
  AlertTriangle,
  CheckCircle2,
  Package,
  FileText,
} from "lucide-react";
import DepartmentNotifications from "../components/DepartmentNotifications";

export default function Dashboard() {
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(console.error);
  }, []);

  const totalForms = stats.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="space-y-6">
      <DepartmentNotifications />
      <div className="flex justify-between items-center mb-3">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 m-0">
            نظرة عامة على النظام
          </h1>
          <p className="text-[14px] text-slate-500 mt-1">
            ملخص النشاط والتنبيهات للحالة الراهنة
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex items-center">
          <div>
            <span className="block text-[13px] font-semibold text-slate-500 mb-2">
              إجمالي النماذج
            </span>
            <div className="text-[24px] font-bold text-slate-900">
              {totalForms || 0}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg text-slate-500 mr-auto">
            <FileStack className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex items-center">
          <div>
            <span className="block text-[13px] font-semibold text-slate-500 mb-2">
              تنبيهات معايرة
            </span>
            <div className="text-[24px] font-bold text-slate-900">2</div>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg text-orange-500 mr-auto">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex items-center">
          <div>
            <span className="block text-[13px] font-semibold text-slate-500 mb-2">
              CAPA متأخرة
            </span>
            <div className="text-[24px] font-bold text-slate-900">0</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-red-500 mr-auto">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex items-center">
          <div>
            <span className="block text-[13px] font-semibold text-slate-500 mb-2">
              نسبة الإنجاز
            </span>
            <div className="text-[24px] font-bold text-slate-900">98%</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-green-600 mr-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="mt-8 mb-4 flex justify-between items-center">
        <h3 className="text-[16px] font-bold text-slate-900">الأقسام النشطة</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* HR Card */}
        <Link to="/hr" className="block group">
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-200 p-6 hover:shadow-md transition-shadow hover:border-sky-300 flex flex-col h-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-sky-50 flex items-center justify-center rounded text-sky-500 ml-3">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="text-[16px] font-bold text-slate-900">
                  الموارد البشرية (HR)
                </h4>
              </div>
            </div>
            <p className="text-[14px] text-slate-500 mb-6 flex-1">
              إدارة بيانات الموظفين وطلبات التوظيف والفحص الطبي.
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-[13px] font-semibold text-slate-500">
                النماذج المكتملة: <strong className="text-slate-900">12</strong>
              </span>
              <span className="text-sky-500 font-bold text-[13px] bg-sky-50 px-3 py-1 rounded-full group-hover:bg-sky-100 transition-colors">
                دخول
              </span>
            </div>
          </div>
        </Link>

        {/* Placeholder cards for other departments */}
        {[
          "التدريب (TRN)",
          "إدارة الجودة (QM)",
          "الإنتاج (PRD)",
          "المخزون (INV)",
          "المختبر (LAB)",
        ].map((dept, i) => {
          if (dept === "إدارة الجودة (QM)") {
            return (
              <Link to="/qm" key={i} className="block group">
                <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-200 p-6 hover:shadow-md transition-shadow hover:border-sky-300 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-sky-50 flex items-center justify-center rounded text-sky-500 ml-3">
                        <FileText className="w-4 h-4" />
                      </div>
                      <h4 className="text-[16px] font-bold text-slate-900">
                        إدارة الجودة (QM)
                      </h4>
                    </div>
                  </div>
                  <p className="text-[14px] text-slate-500 mb-6 flex-1">
                    إجراءات الجودة والانحرافات والشكاوى.
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-[13px] font-semibold text-slate-500">
                      النماذج المكتملة:{" "}
                      <strong className="text-slate-900">
                        {stats.find((s) => s.department === "QM")
                          ?.approved_count || 0}
                      </strong>
                    </span>
                    <span className="text-sky-500 font-bold text-[13px] bg-sky-50 px-3 py-1 rounded-full group-hover:bg-sky-100 transition-colors">
                      دخول
                    </span>
                  </div>
                </div>
              </Link>
            );
          }
          if (dept === "الإنتاج (PRD)") {
            return (
              <Link to="/prd" key={i} className="block group">
                <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-200 p-6 hover:shadow-md transition-shadow hover:border-sky-300 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-sky-50 flex items-center justify-center rounded text-sky-500 ml-3">
                        <FileStack className="w-4 h-4" />
                      </div>
                      <h4 className="text-[16px] font-bold text-slate-900">
                        الإنتاج (PRD)
                      </h4>
                    </div>
                  </div>
                  <p className="text-[14px] text-slate-500 mb-6 flex-1">
                    سجلات التشغيلات وتقارير الإنتاج والصيانة.
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-[13px] font-semibold text-slate-500">
                      النماذج المكتملة:{" "}
                      <strong className="text-slate-900">
                        {stats.find((s) => s.department === "PRD")
                          ?.approved_count || 0}
                      </strong>
                    </span>
                    <span className="text-sky-500 font-bold text-[13px] bg-sky-50 px-3 py-1 rounded-full group-hover:bg-sky-100 transition-colors">
                      دخول
                    </span>
                  </div>
                </div>
              </Link>
            );
          }
          if (dept === "المخزون (INV)") {
            return (
              <Link to="/inv" key={i} className="block group">
                <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-200 p-6 hover:shadow-md transition-shadow hover:border-sky-300 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-sky-50 flex items-center justify-center rounded text-sky-500 ml-3">
                        <Package className="w-4 h-4" />
                      </div>
                      <h4 className="text-[16px] font-bold text-slate-900">
                        المخزون (INV)
                      </h4>
                    </div>
                  </div>
                  <p className="text-[14px] text-slate-500 mb-6 flex-1">
                    إدارة المستودعات، الأرصدة، والمواد الخام.
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-[13px] font-semibold text-slate-500">
                      النماذج المكتملة:{" "}
                      <strong className="text-slate-900">
                        {stats.find((s) => s.department === "INV")
                          ?.approved_count || 0}
                      </strong>
                    </span>
                    <span className="text-sky-500 font-bold text-[13px] bg-sky-50 px-3 py-1 rounded-full group-hover:bg-sky-100 transition-colors">
                      دخول
                    </span>
                  </div>
                </div>
              </Link>
            );
          }
          return (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-200 p-6 opacity-60 pointer-events-none flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-slate-100 flex items-center justify-center rounded text-slate-500 ml-3">
                    <FileStack className="w-4 h-4" />
                  </div>
                  <h4 className="text-[16px] font-bold text-slate-900">
                    {dept}
                  </h4>
                </div>
              </div>
              <p className="text-[14px] text-slate-500 mb-6 flex-1">
                قسم مسجل في النظام لكن القوالب قيد التطوير...
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-[13px] font-semibold text-slate-500">
                  النماذج المكتملة:{" "}
                  <strong className="text-slate-900">0</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
