import { useEffect, useState, type ReactNode } from "react";
import { Truck, CheckCircle, Clock, PackageCheck, Factory } from "lucide-react";
import { getAuthHeaders } from "../../lib/utils";
import { PACKAGING_FORMS } from "../pkg/packagingForms.config";

const PKG_FORM_IDS = PACKAGING_FORMS.map((f) => f.formId);
const norm = (v: any) => (v || "").toString().trim().toLowerCase();

type Stage = "manufactured" | "packaging" | "packaged" | "released";

interface Row {
  batch: string;
  product: string;
  manufacturedAt: string;
  pkgFormsCount: number;
  packaged: boolean;
  released: boolean;
  stage: Stage;
}

const STAGE_META: Record<Stage, { label: string; cls: string }> = {
  manufactured: { label: "بانتظار التعبئة", cls: "bg-amber-100 text-amber-700" },
  packaging: { label: "قيد التعبئة/التغليف", cls: "bg-blue-100 text-blue-700" },
  packaged: { label: "جاهزة للإفراج", cls: "bg-emerald-100 text-emerald-700" },
  released: { label: "تم الإفراج", cls: "bg-slate-200 text-slate-700" },
};

export default function ReportReleaseReadiness() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    fetch("/api/reports/all", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((records: any[]) => {
        if (!Array.isArray(records)) return;
        const manufactured = records.filter(
          (r) => r.form_id === "F-PRD-002" && r.data?.batchNumber,
        );
        const out: Row[] = manufactured.map((m) => {
          const batch = norm(m.data.batchNumber);
          const pkgForms = records.filter(
            (r) => PKG_FORM_IDS.includes(r.form_id) && norm(r.data?.batchNumber) === batch,
          );
          const packaged = records.some(
            (r) => r.form_id === "F-PKG-009" && norm(r.data?.batchNumber) === batch,
          );
          const released = records.some(
            (r) => r.form_id === "F-FP-001" && norm(r.data?.batchNumber) === batch,
          );
          const stage: Stage = released
            ? "released"
            : packaged
              ? "packaged"
              : pkgForms.length > 0
                ? "packaging"
                : "manufactured";
          return {
            batch: m.data.batchNumber,
            product: m.data.productName || "—",
            manufacturedAt: m.created_at,
            pkgFormsCount: pkgForms.length,
            packaged,
            released,
            stage,
          };
        });
        setRows(out);
      })
      .catch(console.error);
  }, []);

  const count = (s: Stage) => rows.filter((r) => r.stage === s).length;

  const cards: { stage: Stage; icon: ReactNode }[] = [
    { stage: "manufactured", icon: <Factory className="w-5 h-5" /> },
    { stage: "packaging", icon: <Clock className="w-5 h-5" /> },
    { stage: "packaged", icon: <PackageCheck className="w-5 h-5" /> },
    { stage: "released", icon: <Truck className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.stage} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
              {c.icon} {STAGE_META[c.stage].label}
            </div>
            <div className="text-3xl font-black text-slate-800">{count(c.stage)}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800">حالة الدفعات: من التصنيع إلى الإفراج</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-4 font-semibold">رقم التشغيلة</th>
                <th className="p-4 font-semibold">المنتج</th>
                <th className="p-4 font-semibold">نماذج التعبئة/التغليف</th>
                <th className="p-4 font-semibold">تم التغليف</th>
                <th className="p-4 font-semibold">تم الإفراج</th>
                <th className="p-4 font-semibold">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-4 font-mono font-medium text-slate-700">{r.batch}</td>
                  <td className="p-4 text-slate-700">{r.product}</td>
                  <td className="p-4 text-slate-600">{r.pkgFormsCount}</td>
                  <td className="p-4">{r.packaged ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : "—"}</td>
                  <td className="p-4">{r.released ? <CheckCircle className="w-5 h-5 text-slate-500" /> : "—"}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${STAGE_META[r.stage].cls}`}>
                      {STAGE_META[r.stage].label}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">لا توجد دفعات مُصنّعة بعد.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
