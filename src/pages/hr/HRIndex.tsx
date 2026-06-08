import { useState, useEffect, useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  FileSignature,
  Pencil,
  AlertCircle,
  Users,
  UserPlus,
  Stethoscope,
  ClipboardList,
  FileText,
  ShieldCheck,
  CalendarDays,
  Boxes,
  GraduationCap,
  Calendar,
  Award,
} from "lucide-react";
import { StatusBadge } from "../../components/StatusBadge";
import DepartmentNotifications from "../../components/DepartmentNotifications";
import { getAuthHeaders } from "../../lib/utils";
import { FORM_LABELS } from "../../constants/formLabels";

// Forms grouped into the five HR/Training categories. Each entry links to its
// route; F-HR-002 also supports edit-in-place from the records table below.
const FORM_GROUPS: {
  category: string;
  items: { id: string; label: string; route: string; icon: ReactNode }[];
}[] = [
  {
    category: "التوظيف والتهيئة",
    items: [
      { id: "F-HR-001", label: "طلب احتياج وظيفي", route: "/hr/new-request", icon: <UserPlus className="w-6 h-6" /> },
      { id: "F-HR-003", label: "فحص طبي", route: "/hr/medical-exam", icon: <Stethoscope className="w-6 h-6" /> },
      { id: "F-HRT-005", label: "خطة تهيئة موظف جديد", route: "/hr/onboarding", icon: <ClipboardList className="w-6 h-6" /> },
    ],
  },
  {
    category: "شؤون الموظفين والعمليات",
    items: [
      { id: "F-HR-002", label: "ملف موظف", route: "/hr/employee-file", icon: <FileText className="w-6 h-6" /> },
      { id: "F-HRT-001", label: "إقرار الالتزام بالسلامة و GMP", route: "/hr/safety-pledge", icon: <ShieldCheck className="w-6 h-6" /> },
      { id: "F-HRT-002", label: "طلب إجازة", route: "/hr/leave-request", icon: <CalendarDays className="w-6 h-6" /> },
      { id: "F-HRT-003", label: "تسليم واستلام عُهدة", route: "/hr/custody-handover", icon: <Boxes className="w-6 h-6" /> },
    ],
  },
  {
    category: "التدريب والتطوير",
    items: [
      { id: "F-HRT-004", label: "حصر الاحتياجات التدريبية (TNA)", route: "/hr/training-needs", icon: <GraduationCap className="w-6 h-6" /> },
      { id: "F-TRN-001", label: "خطة التدريب السنوية", route: "/trn/trn-001", icon: <Calendar className="w-6 h-6" /> },
      { id: "F-TRN-002", label: "سجل التدريب الفردي", route: "/trn/trn-002", icon: <FileText className="w-6 h-6" /> },
      { id: "F-TRN-003", label: "تقييم فعالية التدريب", route: "/trn/trn-003", icon: <GraduationCap className="w-6 h-6" /> },
      { id: "F-TRN-004", label: "اعتماد كفاءة", route: "/trn/trn-004", icon: <Award className="w-6 h-6" /> },
    ],
  },
];

export default function HRIndex() {
  const [forms, setForms] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/forms/dept/HRT", { headers: getAuthHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error("فشل تحميل السجلات");
        return r.json();
      })
      .then((data) => setForms(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setError("تعذّر تحميل سجلات الموارد البشرية والتدريب. تأكد من الاتصال وحاول مجدداً.");
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 m-0">
            الموارد البشرية والتدريب (HRT)
          </h1>
          <p className="text-[14px] text-slate-500 mt-1">
            التوظيف والتهيئة، شؤون الموظفين، التدريب والتطوير — في قسم واحد موحّد.
          </p>
        </div>
        <div className="flex bg-white px-4 py-2 border border-slate-200 rounded-xl shadow-sm gap-2 text-sky-600 font-bold items-center">
          <Users className="w-5 h-5 text-sky-500" />
          <span>إجمالي السجلات: {forms.length}</span>
        </div>
      </div>

      {/* Form categories */}
      {FORM_GROUPS.map((group) => (
        <section key={group.category}>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-slate-700">{group.category}</h2>
            <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">
              {group.items.length}
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {group.items.map((item) => (
              <Link
                key={item.id}
                to={item.route}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-sky-300 transition-all flex flex-col items-center group text-center"
              >
                <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h4 className="font-bold text-slate-800 text-[13px] font-mono">{item.id}</h4>
                <p className="text-sm text-slate-500 mt-1">{item.label}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* Records table */}
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
                <th className="px-6 py-4 font-semibold border-b border-slate-100">رقم السجل</th>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">النموذج</th>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">تاريخ الإنشاء</th>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">المنشئ</th>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">الحالة</th>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">إجراء</th>
              </tr>
            </thead>
            <tbody className="text-[14px] text-slate-600">
              {filteredForms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    {search ? "لا توجد نتائج مطابقة للبحث" : "لا توجد سجلات حتى الآن"}
                  </td>
                </tr>
              ) : (
                filteredForms.map((f, i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900">{f.record_id}</td>
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
