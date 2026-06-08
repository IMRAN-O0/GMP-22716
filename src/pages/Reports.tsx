import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ReportPrintHeader from "../components/ReportPrintHeader";
import {
  Package,
  Repeat,
  ShieldCheck,
  Truck,
  RotateCcw,
  AlertTriangle,
  ClipboardList,
  Trash2,
  Activity,
  Users,
  AlertCircle,
  FileWarning,
  Thermometer,
  Wrench,
  CalendarDays,
  ShieldAlert,
  Route,
  Clock,
  Boxes,
  Scale,
  Search,
} from "lucide-react";
import ReportBalances from "./reports/ReportBalances";
import ReportTransactions from "./reports/ReportTransactions";
import ReportSuppliers from "./reports/ReportSuppliers";
import ReportShipments from "./reports/ReportShipments";
import ReportReturns from "./reports/ReportReturns";

import ReportProductionOrders from "./reports/ReportProductionOrders";
import ReportProductionWaste from "./reports/ReportProductionWaste";
import ReportProcessMonitoring from "./reports/ReportProcessMonitoring";
import ReportLaborEfficiency from "./reports/ReportLaborEfficiency";
import ReportBOMvsActual from "./reports/ReportBOMvsActual";

import ReportNCR from "./reports/ReportNCR";
import ReportCAPA from "./reports/ReportCAPA";
import ReportRiskRegister from "./reports/ReportRiskRegister";
import ReportMaintenance from "./reports/ReportMaintenance";
import ReportEnvMonitoring from "./reports/ReportEnvMonitoring";
import ReportCalibration from "./reports/ReportCalibration";
import ReportRecall from "./reports/ReportRecall";

import ReportBatchTraceability from "./reports/ReportBatchTraceability";
import ReportExecutiveDashboard from "./reports/ReportExecutiveDashboard";
import ReportExpiryWatch from "./reports/ReportExpiryWatch";

import ReportReleaseReadiness from "./reports/ReportReleaseReadiness";
import ReportPkgReconciliation from "./reports/ReportPkgReconciliation";
import ReportPkgBatchLog from "./reports/ReportPkgBatchLog";
import ReportPkgDowntime from "./reports/ReportPkgDowntime";

export default function Reports() {
  const { user } = useAuth();
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Only show reports to authorized departments
  const isAuthorized =
    user &&
    (user.department === "INV" ||
      user.department === "PRD" ||
      user.department === "QM" ||
      user.department === "PKG" ||
      user.department === "ALL" ||
      Number(user.level) === 1);
  if (!user || !isAuthorized) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          عذراً، غير مصرح لك
        </h2>
        <p className="text-slate-600">
          لا تملك الصلاحيات الكافية لعرض هذه التقارير.
        </p>
      </div>
    );
  }

  const allReportTypes = [
    {
      id: "exec_dash",
      title: "لوحة KPI التنفيذية",
      icon: <Activity className="w-6 h-6" />,
      color: "bg-slate-800",
      desc: "أهم مؤشرات الأداء لصاحب القرار",
      dept: "ALL",
    },
    {
      id: "batch_trace",
      title: "تتبع الدفعة الكامل",
      icon: <Route className="w-6 h-6" />,
      color: "bg-indigo-600",
      desc: "مسار الدفعة من المواد حتى الشحن",
      dept: "ALL",
    },
    {
      id: "expiry_watch",
      title: "تقرير انتهاء الصلاحية",
      icon: <Clock className="w-6 h-6" />,
      color: "bg-red-500",
      desc: "المواد والمنتجات مرتبة حسب أقرب انتهاء",
      dept: "ALL",
    },
    {
      id: "REP-INV-BAL",
      title: "تقرير أرصدة المواد المخزنية",
      icon: <Package className="w-6 h-6" />,
      color: "bg-emerald-500",
      desc: "أرصدة كل مادة والمستودعات",
      dept: "INV",
    },
    {
      id: "REP-INV-TRN",
      title: "تقرير حركات المخزون",
      icon: <Repeat className="w-6 h-6" />,
      color: "bg-blue-500",
      desc: "استلام، صرف، وتحويل",
      dept: "INV",
    },
    {
      id: "REP-INV-SUP",
      title: "تقرير تقييمات الموردين",
      icon: <ShieldCheck className="w-6 h-6" />,
      color: "bg-purple-500",
      desc: "نتائج التقييم والاعتماد",
      dept: "INV",
    },
    {
      id: "REP-INV-SHP",
      title: "تقرير الشحنات والتسليمات",
      icon: <Truck className="w-6 h-6" />,
      color: "bg-orange-500",
      desc: "شحنات المنتجات النهائية",
      dept: "INV",
    },
    {
      id: "REP-INV-RET",
      title: "تقرير المرتجعات والإتلاف",
      icon: <RotateCcw className="w-6 h-6" />,
      color: "bg-rose-500",
      desc: "إرجاع البضاعة وعمليات الإتلاف",
      dept: "INV",
    },
    {
      id: "prd_orders",
      title: "تقرير أوامر الإنتاج",
      icon: <ClipboardList className="w-6 h-6" />,
      color: "bg-indigo-500",
      desc: "أوامر الإنتاج ونسب الإنجاز",
      dept: "PRD",
    },
    {
      id: "prd_waste",
      title: "تقرير الفاقد الإنتاجي",
      icon: <Trash2 className="w-6 h-6" />,
      color: "bg-red-500",
      desc: "تحليل أسباب وكميات الفاقد",
      dept: "PRD",
    },
    {
      id: "prd_monitoring",
      title: "تقرير رصد المعاملات",
      icon: <Activity className="w-6 h-6" />,
      color: "bg-sky-500",
      desc: "قراءات الحرارة والضغط والحدود",
      dept: "PRD",
    },
    {
      id: "prd_labor",
      title: "تقرير كفاءة العمالة",
      icon: <Users className="w-6 h-6" />,
      color: "bg-amber-500",
      desc: "إنتاجية العمال وساعات العمل",
      dept: "PRD",
    },
    {
      id: "prd_bom",
      title: "تقرير مقارنة BOM بالاستهلاك",
      icon: <Package className="w-6 h-6" />,
      color: "bg-teal-500",
      desc: "المخطط مقابل الاستهلاك الفعلي",
      dept: "PRD",
    },
    {
      id: "qm_ncr",
      title: "تقرير عدم المطابقة NCR",
      icon: <AlertCircle className="w-6 h-6" />,
      color: "bg-red-500",
      desc: "حالات عدم المطابقة ونسبة الإغلاق",
      dept: "QM",
    },
    {
      id: "qm_capa",
      title: "تقرير CAPA",
      icon: <FileWarning className="w-6 h-6" />,
      color: "bg-orange-500",
      desc: "الإجراءات التصحيحية والوقائية المفتوحة والمغلقة",
      dept: "QM",
    },
    {
      id: "qm_risk",
      title: "تقرير تقييم المخاطر",
      icon: <Activity className="w-6 h-6" />,
      color: "bg-rose-500",
      desc: "مصفوفة وسجل المخاطر، مستوى الخطر",
      dept: "QM",
    },
    {
      id: "qm_mnt",
      title: "تقرير الصيانة والأعطال",
      icon: <Wrench className="w-6 h-6" />,
      color: "bg-slate-500",
      desc: "أعمال الصيانة الوقائية والتصحيحية",
      dept: "QM",
    },
    {
      id: "qm_env",
      title: "مراقبة الحرارة والرطوبة",
      icon: <Thermometer className="w-6 h-6" />,
      color: "bg-sky-500",
      desc: "قراءات البيئة وتذبذبها والانحرافات",
      dept: "QM",
    },
    {
      id: "qm_cal",
      title: "تقرير جدول المعايرة",
      icon: <CalendarDays className="w-6 h-6" />,
      color: "bg-indigo-500",
      desc: "مواعيد معايرة الأجهزة وحالتها",
      dept: "QM",
    },
    {
      id: "qm_recall",
      title: "تقرير الاستدعاءات",
      icon: <ShieldAlert className="w-6 h-6" />,
      color: "bg-red-600",
      desc: "استدعاءات المنتجات وسجل الاسترداد",
      dept: "QM",
    },
    {
      id: "pkg_release_ready",
      title: "تقرير جاهزية الإفراج",
      icon: <Truck className="w-6 h-6" />,
      color: "bg-rose-600",
      desc: "حالة الدفعات: تصنيع ← تغليف ← جاهزة للإفراج ← إفراج",
      dept: "PKG",
    },
    {
      id: "pkg_reconciliation",
      title: "تقرير تسوية مواد التعبئة/التغليف",
      icon: <Scale className="w-6 h-6" />,
      color: "bg-amber-600",
      desc: "فروقات المواد لكل دفعة وإبراز التجاوزات",
      dept: "PKG",
    },
    {
      id: "pkg_batch_log",
      title: "سجل التعبئة والتغليف للدفعة",
      icon: <Boxes className="w-6 h-6" />,
      color: "bg-rose-500",
      desc: "كل نماذج التعبئة/التغليف لدفعة واحدة",
      dept: "PKG",
    },
    {
      id: "pkg_downtime",
      title: "تقرير التوقفات والأعطال",
      icon: <Clock className="w-6 h-6" />,
      color: "bg-sky-600",
      desc: "تحليل توقفات خطوط التعبئة وأسبابها",
      dept: "PKG",
    },
  ];

  const reportTypes = allReportTypes.filter((rt) => {
    if (user.level === 1 || user.department === "ALL") return true;

    // Explicit permission allows viewing any report
    if (user.permissions && user.permissions[rt.id]) return true;

    // Reject if no explicit permission and the report belongs to another department
    // (except ALL dept reports - they might be shown if not explicitly blocked, but let's just let ANY explicit permission system control them, or default to yes for ALL dept).
    if (rt.dept !== "ALL" && rt.dept !== user.department) return false;

    // Fallback if not explicitly granted (for backward compatibility before full perm rollout)
    if (!user.permissions || Object.keys(user.permissions).length === 0)
      return true;

    // If it's from their own department, only show it if they have it explicitly in their permissions array,
    // OR if their permissions array contains no reports from their department yet.
    return user.permissions[rt.id];
  });

  if (activeReport) {
    return (
      <div className="space-y-6 print:space-y-4 print:p-0">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200 print:hidden">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {reportTypes.find((r) => r.id === activeReport)?.icon}
            {reportTypes.find((r) => r.id === activeReport)?.title}
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { const api = (window as any).electronAPI; if (api?.printPreview) { api.printPreview(); } else { window.print(); } }}
              className="px-5 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              طباعة التقرير
            </button>
            <button
              onClick={() => setActiveReport(null)}
              className="px-5 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition-colors"
            >
              العودة للقائمة
            </button>
          </div>
        </div>

        {/* Unified print header (batch trace renders its own with batch no.) */}
        {activeReport !== "batch_trace" && (
          <ReportPrintHeader
            title={reportTypes.find((r) => r.id === activeReport)?.title || "تقرير"}
          />
        )}

        <div className="print:text-sm">
          {activeReport === "exec_dash" && <ReportExecutiveDashboard />}
          {activeReport === "batch_trace" && <ReportBatchTraceability />}
          {activeReport === "expiry_watch" && <ReportExpiryWatch />}

          {activeReport === "REP-INV-BAL" && <ReportBalances />}
          {activeReport === "REP-INV-TRN" && <ReportTransactions />}
          {activeReport === "REP-INV-SUP" && <ReportSuppliers />}
          {activeReport === "REP-INV-SHP" && <ReportShipments />}
          {activeReport === "REP-INV-RET" && <ReportReturns />}

          {activeReport === "prd_orders" && <ReportProductionOrders />}
          {activeReport === "prd_waste" && <ReportProductionWaste />}
          {activeReport === "prd_monitoring" && <ReportProcessMonitoring />}
          {activeReport === "prd_labor" && <ReportLaborEfficiency />}
          {activeReport === "prd_bom" && <ReportBOMvsActual />}

          {activeReport === "qm_ncr" && <ReportNCR />}
          {activeReport === "qm_capa" && <ReportCAPA />}
          {activeReport === "qm_risk" && <ReportRiskRegister />}
          {activeReport === "qm_mnt" && <ReportMaintenance />}
          {activeReport === "qm_env" && <ReportEnvMonitoring />}
          {activeReport === "qm_cal" && <ReportCalibration />}
          {activeReport === "qm_recall" && <ReportRecall />}

          {activeReport === "pkg_release_ready" && <ReportReleaseReadiness />}
          {activeReport === "pkg_reconciliation" && <ReportPkgReconciliation />}
          {activeReport === "pkg_batch_log" && <ReportPkgBatchLog />}
          {activeReport === "pkg_downtime" && <ReportPkgDowntime />}
        </div>
      </div>
    );
  }

  // Group reports by department for an organized landing page.
  const GROUPS: { dept: string; label: string }[] = [
    { dept: "ALL", label: "تقارير عامة" },
    { dept: "INV", label: "المخزون (INV)" },
    { dept: "PRD", label: "الإنتاج (PRD)" },
    { dept: "QM", label: "إدارة الجودة (QM)" },
    { dept: "PKG", label: "التعبئة والتغليف (PKG)" },
  ];

  const q = search.trim().toLowerCase();
  const visibleReports = reportTypes.filter(
    (r) =>
      !q ||
      r.title.toLowerCase().includes(q) ||
      r.desc.toLowerCase().includes(q),
  );
  const groups = GROUPS.map((g) => ({
    ...g,
    items: visibleReports.filter((r) => r.dept === g.dept),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">التقارير</h1>
          <p className="text-slate-500 mt-2">
            اختر التقرير المطلوب لعرض البيانات والتحليلات
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن تقرير بالاسم أو الوصف…"
            className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-slate-700 bg-white shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
          لا توجد تقارير مطابقة لبحثك.
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.dept}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-slate-700">{group.label}</h2>
              <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">
                {group.items.length}
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.items.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setActiveReport(report.id)}
                  className="text-right bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-sky-300 transition-all group flex flex-col gap-4"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl ${report.color} text-white flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}
                  >
                    {report.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">
                      {report.title}
                    </h3>
                    <p className="text-slate-500 text-sm">{report.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
