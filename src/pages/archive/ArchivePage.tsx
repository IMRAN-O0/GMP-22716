import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Archive,
  Search,
  Filter,
  FileSignature,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileEdit,
  XCircle,
  Inbox,
} from "lucide-react";
import { StatusBadge } from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";

// ── Form ID → Arabic label mapping ──────────────────────────────────────────
const FORM_LABELS: Record<string, string> = {
  "F-HR-001":      "طلب توظيف",
  "F-HR-002":      "ملف موظف",
  "F-HR-003":      "فحص طبي",
  "F-INV-RM-001":  "استلام مواد خام",
  "F-INV-MAT":     "تسجيل مادة",
  "F-INV-WH":      "تكويد مستودع",
  "F-INV-PRQ-001": "طلب شراء",
  "F-INV-PIN-001": "إدخال مخزون",
  "F-INV-RMT-001": "أمر صرف",
  "F-INV-BOM":     "تركيبة منتج",
  "F-INV-GENERIC": "نموذج مخزون عام",
  "F-FP-001":      "إفراج منتج نهائي",
  "F-FP-002":      "تخزين منتج نهائي",
  "F-FP-003":      "شحن وتوزيع",
  "F-FP-004":      "مرتجعات",
  "F-FP-005":      "إتلاف",
  "F-FP-006":      "جرد منتج نهائي",
  "F-PRD-001":     "أمر الإنتاج",
  "F-PRD-002":     "سجل التصنيع",
  "F-PRD-003":     "قائمة تدقيق الإنتاج",
  "F-PRD-004":     "مراقبة العملية",
  "F-QM-001":      "فحص استلام المواد",
  "F-QM-002":      "فحص أثناء الإنتاج",
  "F-QM-003":      "تقرير انحراف",
  "F-QM-004":      "تقرير CAPA",
  "F-QM-005":      "نموذج شكاوى",
  "F-QM-006":      "مراجعة الإدارة",
  "F-DEV-001":     "طلب تطوير منتج",
  "F-DEV-002":     "خطة التطوير",
  "F-DEV-003":     "تقرير التحقق",
  "F-DEV-004":     "اعتماد التطوير",
  "F-CMP-001":     "سجل الشكاوى",
  "F-RCL-001":     "استدعاء المنتج",
  "F-PRM-001":     "إجراء تشغيلي (SOP)",
  "F-PRM-002":     "تعديل إجراء",
  "F-PRM-003":     "سياسة جودة",
  "F-PRM-004":     "مراجعة وثيقة",
  "F-PRM-005":     "توزيع وثيقة",
  "F-EQP-001":     "سجل المعدات",
  "F-MNT-001":     "طلب صيانة",
  "F-TRN-001":     "خطة تدريب",
  "F-TRN-002":     "محضر تدريب",
  "F-TRN-003":     "تقييم تدريب",
  "F-TRN-004":     "اعتماد كفاءة",
  "F-LAB-001":     "تحليل مواد خام",
  "F-LAB-002":     "تحليل منتج وسيط",
  "F-LAB-003":     "تحليل منتج نهائي",
  "F-LAB-004":     "معايرة أجهزة",
  "F-LAB-005":     "سجل بيئة المختبر",
  "F-LAB-006":     "تقرير نتائج",
  "F-LAB-007":     "ضبط جودة المختبر",
};

// ── Department → view base path ──────────────────────────────────────────────
const DEPT_VIEW: Record<string, string> = {
  HR:  "/hr/view",
  INV: "/inv/view",
  PRD: "/prd/view",
  QM:  "/qm/view",
  TRN: "/trn/view",
  LAB: "/lab/view",
};

const DEPT_LABELS: Record<string, string> = {
  HR:  "الموارد البشرية",
  INV: "المخزون",
  PRD: "الإنتاج",
  QM:  "ضمان الجودة",
  TRN: "التدريب",
  LAB: "المختبر",
};

const STATUS_OPTIONS = [
  { value: "",                 label: "كل الحالات" },
  { value: "approved",         label: "معتمد" },
  { value: "pending_approval", label: "بانتظار الاعتماد" },
  { value: "pending_review",   label: "بانتظار المراجعة" },
  { value: "draft",            label: "مسودة" },
  { value: "rejected",         label: "مرفوض" },
];

interface StatRow {
  department: string;
  total: number;
  approved: number;
  pending_review: number;
  pending_approval: number;
  draft: number;
  rejected: number;
}

interface ArchiveRecord {
  id: number;
  record_id: string;
  form_id: string;
  department: string;
  creator_id: number;
  creator_name: string | null;
  creator_user_id: string | null;
  created_at: string;
  status: string;
}

interface ArchiveResponse {
  data: ArchiveRecord[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5 flex items-center gap-4`}>
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-[12px] font-semibold text-slate-500 mb-0.5">{label}</p>
        <p className="text-[22px] font-bold text-slate-900 leading-none">{value.toLocaleString("ar-EG")}</p>
      </div>
    </div>
  );
}

export default function ArchivePage() {
  const { user } = useAuth();

  // ── Filter state ─────────────────────────────────────────────────────────
  const [search,     setSearch]     = useState("");
  const [department, setDepartment] = useState("");
  const [status,     setStatus]     = useState("");
  const [formId,     setFormId]     = useState("");
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState("");
  const [page,       setPage]       = useState(1);
  const limit = 50;

  // ── Data state ───────────────────────────────────────────────────────────
  const [result,  setResult]  = useState<ArchiveResponse | null>(null);
  const [stats,   setStats]   = useState<StatRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch stats once ─────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/archive/stats", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then((d) => setStats(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, []);

  // ── Fetch records (debounced on search) ──────────────────────────────────
  const fetchRecords = useCallback(
    (overridePage?: number) => {
      setLoading(true);
      setError("");
      const p = overridePage ?? page;
      const params = new URLSearchParams({
        page:       String(p),
        limit:      String(limit),
        search,
        department,
        status,
        formId,
        dateFrom,
        dateTo,
      });
      fetch(`/api/archive?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then((r) => {
          if (!r.ok) throw new Error("Server error " + r.status);
          return r.json();
        })
        .then((d: ArchiveResponse) => setResult(d))
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    },
    [page, search, department, status, formId, dateFrom, dateTo]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchRecords(1);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, department, status, formId, dateFrom, dateTo]);

  useEffect(() => {
    fetchRecords();
  }, [page]);

  // ── Summary totals from stats ────────────────────────────────────────────
  const totalAll      = stats.reduce((s, r) => s + r.total, 0);
  const totalApproved = stats.reduce((s, r) => s + r.approved, 0);
  const totalPending  = stats.reduce((s, r) => s + (r.pending_review + r.pending_approval), 0);
  const totalDraft    = stats.reduce((s, r) => s + r.draft, 0);
  const totalRejected = stats.reduce((s, r) => s + r.rejected, 0);

  // ── CSV Export ───────────────────────────────────────────────────────────
  const exportCSV = async () => {
    const params = new URLSearchParams({ search, department, status, formId, dateFrom, dateTo, page: "1", limit: "2000" });
    const r = await fetch(`/api/archive?${params}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!r.ok) return alert("فشل التصدير");
    const d: ArchiveResponse = await r.json();
    const headers = ["رقم السجل", "النموذج", "القسم", "المنشئ", "التاريخ", "الحالة"];
    const rows = d.data.map((rec) => [
      rec.record_id,
      FORM_LABELS[rec.form_id] || rec.form_id,
      DEPT_LABELS[rec.department] || rec.department,
      rec.creator_name || rec.creator_id,
      new Date(rec.created_at).toLocaleDateString("ar-EG"),
      rec.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `archive_${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const viewPath = (rec: ArchiveRecord) => {
    const base = DEPT_VIEW[rec.department] || "/hr/view";
    return `${base}/${rec.record_id}`;
  };

  const availableDepts = user?.department === "ALL" || (user?.level ?? 9) <= 1
    ? Object.keys(DEPT_LABELS)
    : [user?.department].filter(Boolean) as string[];

  // Build unique formId list for filter dropdown (from current result + all known)
  const knownFormIds = Object.keys(FORM_LABELS);

  return (
    <div className="space-y-6" dir="rtl">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-100 rounded-xl">
            <Archive className="w-7 h-7 text-slate-600" />
          </div>
          <div>
            <h1 className="text-[26px] font-bold text-slate-900 leading-tight">الأرشيف المركزي</h1>
            <p className="text-[13px] text-slate-500">جميع نماذج وسجلات النظام عبر الأقسام</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchRecords()}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold text-[13px] shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-[13px] shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            تصدير CSV
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="إجمالي السجلات"  value={totalAll}      color="bg-slate-100 text-slate-600"   icon={<Inbox       className="w-5 h-5" />} />
        <StatCard label="معتمدة"           value={totalApproved} color="bg-emerald-50 text-emerald-600" icon={<CheckCircle2 className="w-5 h-5" />} />
        <StatCard label="بانتظار الإجراء"  value={totalPending}  color="bg-amber-50 text-amber-600"    icon={<Clock        className="w-5 h-5" />} />
        <StatCard label="مسودات"           value={totalDraft}    color="bg-sky-50 text-sky-600"        icon={<FileEdit     className="w-5 h-5" />} />
        <StatCard label="مرفوضة"           value={totalRejected} color="bg-rose-50 text-rose-600"      icon={<XCircle      className="w-5 h-5" />} />
      </div>

      {/* ── Department breakdown ── */}
      {stats.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-400" />
            <span className="text-[14px] font-bold text-slate-700">ملخص حسب القسم</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="px-5 py-3 font-semibold border-b border-slate-100">القسم</th>
                  <th className="px-5 py-3 font-semibold border-b border-slate-100 text-center">الإجمالي</th>
                  <th className="px-5 py-3 font-semibold border-b border-slate-100 text-center text-emerald-600">معتمد</th>
                  <th className="px-5 py-3 font-semibold border-b border-slate-100 text-center text-amber-600">انتظار</th>
                  <th className="px-5 py-3 font-semibold border-b border-slate-100 text-center text-sky-600">مسودة</th>
                  <th className="px-5 py-3 font-semibold border-b border-slate-100 text-center text-rose-500">مرفوض</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.department} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => { setDepartment(s.department); setPage(1); }}>
                    <td className="px-5 py-3 font-bold text-slate-800">
                      {DEPT_LABELS[s.department] || s.department}
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-slate-700">{s.total}</td>
                    <td className="px-5 py-3 text-center text-emerald-700 font-semibold">{s.approved}</td>
                    <td className="px-5 py-3 text-center text-amber-700 font-semibold">
                      {s.pending_review + s.pending_approval}
                    </td>
                    <td className="px-5 py-3 text-center text-sky-700 font-semibold">{s.draft}</td>
                    <td className="px-5 py-3 text-center text-rose-600 font-semibold">{s.rejected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-[14px] font-bold text-slate-700">البحث والتصفية</span>
          {(search || department || status || formId || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(""); setDepartment(""); setStatus(""); setFormId(""); setDateFrom(""); setDateTo(""); }}
              className="mr-auto text-[12px] text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" /> مسح الفلاتر
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Search */}
          <div className="xl:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="بحث برقم السجل أو اسم المنشئ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-9 pl-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:ring-sky-400 focus:border-sky-400 text-slate-700"
            />
          </div>

          {/* Department */}
          <select
            value={department}
            onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
            className="w-full border border-slate-200 rounded-lg text-[13px] py-2 px-3 focus:ring-sky-400 focus:border-sky-400 text-slate-700"
          >
            <option value="">كل الأقسام</option>
            {availableDepts.map((d) => (
              <option key={d} value={d}>{DEPT_LABELS[d] || d}</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="w-full border border-slate-200 rounded-lg text-[13px] py-2 px-3 focus:ring-sky-400 focus:border-sky-400 text-slate-700"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Form type */}
          <select
            value={formId}
            onChange={(e) => { setFormId(e.target.value); setPage(1); }}
            className="w-full border border-slate-200 rounded-lg text-[13px] py-2 px-3 focus:ring-sky-400 focus:border-sky-400 text-slate-700"
          >
            <option value="">كل النماذج</option>
            {knownFormIds.map((id) => (
              <option key={id} value={id}>{FORM_LABELS[id]} ({id})</option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex gap-2 xl:col-span-1">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full border border-slate-200 rounded-lg text-[12px] py-2 px-2 focus:ring-sky-400 focus:border-sky-400 text-slate-700"
              title="من تاريخ"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="w-full border border-slate-200 rounded-lg text-[12px] py-2 px-2 focus:ring-sky-400 focus:border-sky-400 text-slate-700"
              title="إلى تاريخ"
            />
          </div>
        </div>
      </div>

      {/* ── Records Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-[14px] font-bold text-slate-700">
            السجلات
            {result && (
              <span className="mr-2 text-[12px] font-normal text-slate-400">
                ({result.total.toLocaleString("ar-EG")} سجل إجمالاً — الصفحة {result.page} من {result.pages || 1})
              </span>
            )}
          </span>
          {loading && (
            <span className="flex items-center gap-1.5 text-[12px] text-sky-500 font-semibold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> جاري التحميل...
            </span>
          )}
        </div>

        {error && (
          <div className="px-6 py-4 text-[13px] text-rose-600 bg-rose-50 border-b border-rose-100">
            خطأ: {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-[12px] font-semibold">
              <tr>
                <th className="px-5 py-3.5 border-b border-slate-100 font-semibold">#</th>
                <th className="px-5 py-3.5 border-b border-slate-100 font-semibold">رقم السجل</th>
                <th className="px-5 py-3.5 border-b border-slate-100 font-semibold">النموذج</th>
                <th className="px-5 py-3.5 border-b border-slate-100 font-semibold">القسم</th>
                <th className="px-5 py-3.5 border-b border-slate-100 font-semibold">المنشئ</th>
                <th className="px-5 py-3.5 border-b border-slate-100 font-semibold">التاريخ</th>
                <th className="px-5 py-3.5 border-b border-slate-100 font-semibold">الحالة</th>
                <th className="px-5 py-3.5 border-b border-slate-100 font-semibold text-center w-20">عرض</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-slate-700">
              {!loading && result?.data.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <Archive className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    لا توجد سجلات تطابق معايير البحث
                  </td>
                </tr>
              )}
              {result?.data.map((rec, idx) => {
                const rowNum = (page - 1) * limit + idx + 1;
                return (
                  <tr key={rec.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">{rowNum}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-sky-700 text-[12px] whitespace-nowrap">
                      {rec.record_id}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">
                        {FORM_LABELS[rec.form_id] || rec.form_id}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{rec.form_id}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600">
                        {DEPT_LABELS[rec.department] || rec.department}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {rec.creator_name || (rec.creator_user_id ? `#${rec.creator_user_id}` : `#${rec.creator_id}`)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(rec.created_at).toLocaleDateString("ar-EG", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={rec.status} />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Link
                        to={viewPath(rec)}
                        className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-800 font-semibold text-[12px] hover:underline"
                      >
                        <FileSignature className="w-4 h-4" />
                        عرض
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {result && result.pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" /> السابق
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(result.pages, 7) }, (_, i) => {
                let p: number;
                const tp = result.pages;
                if (tp <= 7) { p = i + 1; }
                else if (page <= 4) { p = i + 1; }
                else if (page >= tp - 3) { p = tp - 6 + i; }
                else { p = page - 3 + i; }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-[13px] font-bold transition-colors ${
                      p === page
                        ? "bg-sky-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(result.pages, p + 1))}
              disabled={page >= result.pages}
              className="flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              التالي <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
