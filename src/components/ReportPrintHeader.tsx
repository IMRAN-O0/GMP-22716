import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getAuthHeaders } from "../lib/utils";

interface ReportPrintHeaderProps {
  /** Report title shown on the printout, e.g. "تقرير أرصدة المواد". */
  title: string;
  /** Optional extra line under the title (e.g. "رقم الدفعة: B-1024"). */
  subtitle?: string;
}

/**
 * Unified print-only header for reports: company logo + name (ar/en) +
 * license number on the right, report title + print date + the user who
 * printed it on the left. Hidden on screen, shown only when printing.
 *
 * Company info is fetched once from /api/company.
 */
export default function ReportPrintHeader({ title, subtitle }: ReportPrintHeaderProps) {
  const { user } = useAuth();
  const [company, setCompany] = useState<any>({});

  useEffect(() => {
    fetch("/api/company", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => setCompany(d || {}))
      .catch(() => {});
  }, []);

  const printedAt = new Date().toLocaleString("ar-EG");

  return (
    <div className="hidden print:block mb-4 border-b-2 border-slate-700 pb-3">
      <div className="flex items-start justify-between gap-4">
        {/* Company identity */}
        <div className="flex items-center gap-3">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt="شعار"
              className="h-16 w-16 object-contain border border-slate-200 rounded-lg p-0.5"
            />
          ) : (
            <div className="h-16 w-16 border-2 border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-xs font-bold">
              شعار
            </div>
          )}
          <div>
            <div className="font-bold text-xl text-slate-900">
              {company.name_ar || "الشركة"}
            </div>
            {company.name_en && (
              <div className="text-sm text-slate-500">{company.name_en}</div>
            )}
            {company.license_number && (
              <div className="text-xs text-slate-400">
                رقم الترخيص (SFDA): {company.license_number}
              </div>
            )}
          </div>
        </div>

        {/* Report meta */}
        <div className="text-left">
          <div className="font-bold text-lg text-slate-800">{title}</div>
          {subtitle && (
            <div className="text-sm text-slate-600 mt-0.5">{subtitle}</div>
          )}
          <div className="text-sm text-slate-500 mt-1">
            تاريخ الطباعة: {printedAt}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            طُبع بواسطة: {user?.name || "—"}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            نظام الجودة ISO 22716
          </div>
        </div>
      </div>
    </div>
  );
}
