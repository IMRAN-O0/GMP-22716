import { useState, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, PackageCheck, Boxes } from "lucide-react";
import { StatusBadge } from "../../components/StatusBadge";
import DepartmentNotifications from "../../components/DepartmentNotifications";
import { getAuthHeaders, formatDate } from "../../lib/utils";
import { PACKAGING_FORMS, getPackagingFormById } from "./packagingForms.config";

const STAGE_LABEL: Record<string, string> = {
  pre: "ما قبل",
  during: "أثناء",
  post: "ما بعد",
};

export default function PKGIndex() {
  const [forms, setForms] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/forms/dept/PKG", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => setForms(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const groups: { key: "filling" | "packaging"; title: string; icon: ReactNode }[] = [
    { key: "filling", title: "نماذج التعبئة (Filling)", icon: <PackageCheck className="w-5 h-5 text-sky-500" /> },
    { key: "packaging", title: "نماذج التغليف (Packaging)", icon: <Boxes className="w-5 h-5 text-amber-500" /> },
  ];

  return (
    <div className="space-y-6">
      <DepartmentNotifications />

      <div>
        <h1 className="text-[28px] font-bold text-slate-900 m-0">التعبئة والتغليف (PKG)</h1>
        <p className="text-[14px] text-slate-500 mt-1">
          نماذج تصفية الخطوط، الفحص أثناء العملية، التسوية، وتسليم المنتج النهائي للمستودع.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="block text-[13px] font-semibold text-slate-500 mb-2">المسودات</span>
          <div className="text-[24px] font-bold text-slate-900">{forms.filter((f) => f.status === "draft").length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="block text-[13px] font-semibold text-slate-500 mb-2">قيد المراجعة/الاعتماد</span>
          <div className="text-[24px] font-bold text-slate-900">
            {forms.filter((f) => f.status === "pending_review" || f.status === "pending_approval").length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="block text-[13px] font-semibold text-slate-500 mb-2">المعتمدة</span>
          <div className="text-[24px] font-bold text-slate-900">{forms.filter((f) => f.status === "approved").length}</div>
        </div>
      </div>

      {/* Form creation buttons grouped by filling/packaging */}
      {groups.map((g) => (
        <div key={g.key} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
            {g.icon} {g.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PACKAGING_FORMS.filter((f) => f.group === g.key).map((f) => (
              <Link
                key={f.key}
                to={`/pkg/form/${f.key}`}
                className="flex items-start gap-2 p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition-colors"
              >
                <PlusCircle className="w-4 h-4 mt-0.5 text-sky-500 flex-shrink-0" />
                <div>
                  <div className="text-[13px] font-semibold text-slate-800">{f.title}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {f.formId} · {STAGE_LABEL[f.stage]}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Records table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <h2 className="font-bold text-slate-800 p-5 border-b border-slate-100">سجلات القسم</h2>
        {forms.length === 0 ? (
          <p className="p-6 text-center text-slate-400 text-sm">لا توجد سجلات بعد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-right">
                  <th className="p-3 font-semibold">رقم السجل</th>
                  <th className="p-3 font-semibold">النموذج</th>
                  <th className="p-3 font-semibold">التشغيلة</th>
                  <th className="p-3 font-semibold">التاريخ</th>
                  <th className="p-3 font-semibold">الحالة</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {forms.map((f) => (
                  <tr key={f.record_id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-3 font-mono text-xs text-slate-600">{f.record_id}</td>
                    <td className="p-3 text-slate-700">{getPackagingFormById(f.form_id)?.title || f.form_id}</td>
                    <td className="p-3 text-slate-600">{f.data?.batchNumber || "—"}</td>
                    <td className="p-3 text-slate-500">{formatDate(f.created_at)}</td>
                    <td className="p-3"><StatusBadge status={f.status} /></td>
                    <td className="p-3">
                      <Link to={`/pkg/view/${f.record_id}`} className="text-sky-600 hover:text-sky-800 font-semibold text-xs">
                        عرض
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
