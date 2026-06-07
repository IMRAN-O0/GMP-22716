import { useEffect, useState } from "react";
import { Scale, AlertTriangle } from "lucide-react";
import { getAuthHeaders } from "../../lib/utils";

// Reconciliation forms: F-FIL-007 (filling) and F-PKG-007 (packaging).
const RECON_FORMS: Record<string, string> = {
  "F-FIL-007": "تسوية مواد التعبئة",
  "F-PKG-007": "تسوية مواد التغليف",
};

interface ReconRow {
  recordId: string;
  formLabel: string;
  batch: string;
  product: string;
  material: string;
  received: number;
  used: number;
  damaged: number;
  returned: number;
  difference: number;
  withinTolerance: string;
}

const num = (v: any) => Number(v) || 0;

export default function ReportPkgReconciliation() {
  const [rows, setRows] = useState<ReconRow[]>([]);

  useEffect(() => {
    fetch("/api/reports/all", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((records: any[]) => {
        if (!Array.isArray(records)) return;
        const out: ReconRow[] = [];
        records
          .filter((r) => RECON_FORMS[r.form_id])
          .forEach((rec) => {
            const table = Array.isArray(rec.data?.reconciliation) ? rec.data.reconciliation : [];
            table.forEach((line: any) => {
              const received = num(line.received);
              const used = num(line.used);
              const damaged = num(line.damaged);
              const returned = num(line.returned);
              // Difference = received - (used + damaged + returned); should be ~0.
              const difference =
                line.difference !== undefined && line.difference !== ""
                  ? num(line.difference)
                  : received - (used + damaged + returned);
              out.push({
                recordId: rec.record_id,
                formLabel: RECON_FORMS[rec.form_id],
                batch: rec.data?.batchNumber || "—",
                product: rec.data?.productName || "—",
                material: line.material || "—",
                received,
                used,
                damaged,
                returned,
                difference,
                withinTolerance: rec.data?.withinTolerance || "—",
              });
            });
          });
        setRows(out);
      })
      .catch(console.error);
  }, []);

  const flagged = rows.filter((r) => r.difference !== 0 || r.withinTolerance === "لا");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <Scale className="w-5 h-5" /> إجمالي سطور التسوية
          </div>
          <div className="text-3xl font-black text-slate-800">{rows.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm">
          <div className="flex items-center gap-2 text-rose-500 text-sm mb-2">
            <AlertTriangle className="w-5 h-5" /> فروقات تحتاج تحقيقاً
          </div>
          <div className="text-3xl font-black text-rose-600">{flagged.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800">تسوية مواد التعبئة والتغليف لكل دفعة</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-3 font-semibold">التشغيلة</th>
                <th className="p-3 font-semibold">النموذج</th>
                <th className="p-3 font-semibold">الصنف</th>
                <th className="p-3 font-semibold">المستلم</th>
                <th className="p-3 font-semibold">المستخدم</th>
                <th className="p-3 font-semibold">التالف</th>
                <th className="p-3 font-semibold">المرتجع</th>
                <th className="p-3 font-semibold">الفرق</th>
                <th className="p-3 font-semibold">ضمن الحدود</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, i) => {
                const bad = r.difference !== 0 || r.withinTolerance === "لا";
                return (
                  <tr key={i} className={bad ? "bg-rose-50/60" : "hover:bg-slate-50"}>
                    <td className="p-3 font-mono text-slate-700">{r.batch}</td>
                    <td className="p-3 text-slate-600">{r.formLabel}</td>
                    <td className="p-3 text-slate-700">{r.material}</td>
                    <td className="p-3 text-slate-600">{r.received}</td>
                    <td className="p-3 text-slate-600">{r.used}</td>
                    <td className="p-3 text-slate-600">{r.damaged}</td>
                    <td className="p-3 text-slate-600">{r.returned}</td>
                    <td className={`p-3 font-bold ${r.difference !== 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {r.difference}
                    </td>
                    <td className="p-3">{r.withinTolerance}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">لا توجد سجلات تسوية بعد.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
