import { useEffect, useMemo, useState } from "react";
import { Search, FileText } from "lucide-react";
import { getAuthHeaders } from "../../lib/utils";
import { PACKAGING_FORMS, PKG_FORM_TITLES } from "../pkg/packagingForms.config";

const PKG_FORM_IDS = PACKAGING_FORMS.map((f) => f.formId);
const norm = (v: any) => (v || "").toString().trim().toLowerCase();
const fmt = (v: string) => {
  try {
    return new Date(v).toLocaleDateString("ar-SA", { year: "numeric", month: "2-digit", day: "2-digit" });
  } catch {
    return v;
  }
};

export default function ReportPkgBatchLog() {
  const [records, setRecords] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/reports/all", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((rows: any[]) => setRecords(Array.isArray(rows) ? rows.filter((r) => PKG_FORM_IDS.includes(r.form_id)) : []))
      .catch(console.error);
  }, []);

  // Batches that have any packaging form, for the picker.
  const batches = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => r.data?.batchNumber && set.add(r.data.batchNumber));
    return Array.from(set);
  }, [records]);

  const matches = useMemo(() => {
    const q = norm(search);
    if (!q) return [];
    return records
      .filter((r) => norm(r.data?.batchNumber) === q)
      .sort((a, b) => a.form_id.localeCompare(b.form_id));
  }, [records, search]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700 mb-2">اختر/اكتب رقم التشغيلة</label>
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
          <input
            list="pkg-log-batches"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="رقم التشغيلة (Batch)"
            className="w-full border border-slate-300 rounded-lg py-2 pr-9 pl-3 text-sm"
          />
          <datalist id="pkg-log-batches">
            {batches.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </div>
      </div>

      {search && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-slate-800">سجل التعبئة والتغليف للتشغيلة: {search}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-3 font-semibold">النموذج</th>
                  <th className="p-3 font-semibold">رقم السجل</th>
                  <th className="p-3 font-semibold">المنتج</th>
                  <th className="p-3 font-semibold">التاريخ</th>
                  <th className="p-3 font-semibold">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matches.map((r) => (
                  <tr key={r.record_id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-700">{PKG_FORM_TITLES[r.form_id] || r.form_id}</td>
                    <td className="p-3 font-mono text-xs text-slate-500">{r.record_id}</td>
                    <td className="p-3 text-slate-600">{r.data?.productName || "—"}</td>
                    <td className="p-3 text-slate-500">{fmt(r.created_at)}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">معتمد</span>
                    </td>
                  </tr>
                ))}
                {matches.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      لا توجد نماذج تعبئة/تغليف معتمدة لهذه التشغيلة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
