import React from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { getJsonHeaders } from "../../../lib/utils";

/* ------------------------------------------------------------------ *
 * Shared helpers for QM tabular/checklist forms.
 * Keeps submit + footer + repeatable-table logic in one place so the
 * individual forms stay declarative.
 * ------------------------------------------------------------------ */

/** Canonical list of factory facility areas, reused by every premises form. */
export const FACILITY_AREAS: string[] = [
  "منطقة الإنتاج / التصنيع",
  "منطقة التعبئة والتغليف",
  "مستودع المواد الخام",
  "مستودع مواد التعبئة",
  "مستودع المنتجات النهائية",
  "مختبر مراقبة الجودة",
  "غرفة الوزن",
  "منطقة الغسيل وتنظيف المعدات",
  "غرف تبديل ملابس العاملين",
  "دورات المياه",
  "الممرات والمداخل",
  "منطقة استقبال المواد",
];

export interface ColumnDef {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "time" | "select";
  options?: { value: string; label: string }[];
  width?: string;
  placeholder?: string;
}

interface RepeatableTableProps<T> {
  columns: ColumnDef[];
  rows: T[];
  onChange: (rows: T[]) => void;
  newRow: () => T;
  addLabel?: string;
  /** Hide per-row delete + the add button (fixed checklist). */
  fixed?: boolean;
}

export function RepeatableTable<T extends Record<string, any>>({
  columns,
  rows,
  onChange,
  newRow,
  addLabel = "إضافة صف",
  fixed = false,
}: RepeatableTableProps<T>) {
  const update = (i: number, key: string, value: any) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r));
    onChange(next);
  };
  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-right text-[13px] border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
              {columns.map((c) => (
                <th key={c.key} className="p-2.5 font-semibold border-l border-slate-200 last:border-l-0" style={c.width ? { width: c.width } : undefined}>
                  {c.label}
                </th>
              ))}
              {!fixed && <th className="p-2.5 w-10"></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                {columns.map((c) => (
                  <td key={c.key} className="p-1.5 border-l border-slate-100 last:border-l-0 align-top">
                    {c.type === "select" ? (
                      <select
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-[13px]"
                        value={row[c.key] ?? ""}
                        onChange={(e) => update(i, c.key, e.target.value)}
                      >
                        {(c.options || []).map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={c.type === "number" ? "number" : c.type === "date" ? "date" : c.type === "time" ? "time" : "text"}
                        step={c.type === "number" ? "any" : undefined}
                        placeholder={c.placeholder}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-[13px]"
                        value={row[c.key] ?? ""}
                        onChange={(e) => update(i, c.key, e.target.value)}
                      />
                    )}
                  </td>
                ))}
                {!fixed && (
                  <td className="p-1.5 text-center align-middle">
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="text-slate-400 hover:text-rose-600"
                      aria-label="حذف الصف"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + (fixed ? 0 : 1)} className="p-6 text-center text-slate-400">
                  لا توجد صفوف — اضغط «{addLabel}».
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!fixed && (
        <button
          type="button"
          onClick={() => onChange([...rows, newRow()])}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-[13px] font-semibold hover:bg-sky-100"
        >
          <Plus className="w-4 h-4" /> {addLabel}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function useQmFormSubmit(formId: string, successMessage: string) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const submit = async (data: any, status: string) => {
    try {
      const editId = new URLSearchParams(window.location.search).get("edit");
      const url = editId ? `/api/forms/record/${editId}` : "/api/forms";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: getJsonHeaders(),
        body: JSON.stringify({
          recordId: `QM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          formId,
          department: "QM",
          creatorId: user?.id,
          status,
          data,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert(`${successMessage}: ${saved.record_id || ""}`);
      navigate("/qm");
    } catch (err) {
      console.error(err);
      alert("فشل حفظ النموذج");
    }
  };

  return { user, submit };
}

interface FormActionsProps {
  onSubmit: (status: string) => void;
}

/** Standard draft / approve / send-for-review footer, role-aware. */
export function FormActions({ onSubmit }: FormActionsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-200">
      <button
        type="button"
        onClick={() => onSubmit("draft")}
        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[14px]"
      >
        حفظ كمسودة
      </button>
      {Number(user?.level) <= 2 ? (
        <button
          type="button"
          onClick={() => onSubmit("approved")}
          className="px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold text-[14px]"
        >
          حفظ واعتماد
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onSubmit(Number(user?.level) === 3 ? "pending_approval" : "pending_review")}
          className="px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold text-[14px]"
        >
          إرسال للمراجعة
        </button>
      )}
      <div className="flex-1" />
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
        className="text-slate-500 hover:text-slate-700 font-semibold text-[14px]"
      >
        إغلاق والعودة
      </button>
    </div>
  );
}

/* Load an existing record into form state when ?edit= is present. */
export function useEditLoader(setData: (updater: (prev: any) => any) => void) {
  React.useEffect(() => {
    const editId = new URLSearchParams(window.location.search).get("edit");
    if (!editId) return;
    fetch(`/api/forms/record/${editId}`)
      .then((r) => r.json())
      .then((rec) => {
        if (rec && rec.data) setData((prev: any) => ({ ...prev, ...rec.data }));
      })
      .catch(console.error);
  }, [setData]);
}
