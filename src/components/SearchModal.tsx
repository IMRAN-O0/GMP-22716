import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

export interface SearchColumn {
  key: string;
  label: string;
  className?: string;
}

interface SearchModalProps {
  title: string;
  items: any[];
  columns: SearchColumn[];
  searchKeys: string[];
  onSelect: (item: any) => void;
  onClose: () => void;
  placeholder?: string;
}

export function SearchModal({
  title, items, columns, searchKeys, onSelect, onClose, placeholder,
}: SearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = items.filter((item) =>
    searchKeys.some((k) =>
      String(item[k] ?? "").toLowerCase().includes(query.toLowerCase())
    )
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder ?? "ابحث…"}
              className="w-full border border-slate-200 rounded-lg py-2.5 pr-9 pl-3 text-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className={`px-4 py-2.5 border-b border-slate-200 font-semibold text-slate-600 text-[12px] ${col.className ?? ""}`}>
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-2.5 border-b border-slate-200 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-slate-400 text-sm">
                    لا توجد نتائج مطابقة
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-sky-50 cursor-pointer transition-colors"
                    onClick={() => { onSelect(item); onClose(); }}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-2.5 text-slate-700 ${col.className ?? ""}`}>
                        {item[col.key] ?? "—"}
                      </td>
                    ))}
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        className="text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 px-3 py-1 rounded-lg transition-colors"
                        onClick={() => { onSelect(item); onClose(); }}
                      >
                        تحديد
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 rounded-b-2xl">
          {filtered.length} نتيجة · اضغط ESC للإغلاق · انقر على الصف للتحديد
        </div>
      </div>
    </div>
  );
}

// ── Trigger button (F3 style) ──────────────────────────────────────────────
interface SearchFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onF3: () => void;
  placeholder?: string;
  required?: boolean;
  hint?: string;
}

export function SearchField({ label, value, onChange, onF3, placeholder, required, hint }: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for F3 key when this input is focused OR anywhere on the page while focused
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "F3") {
      e.preventDefault();
      e.stopPropagation();
      onF3();
    }
  };

  return (
    <div>
      <label className="block text-[13px] font-semibold text-slate-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2 px-3"
        />
        <button
          type="button"
          onClick={onF3}
          title="اضغط F3 من الكيبورد أو انقر هنا"
          className="px-3 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-bold text-sky-700 transition-colors flex-shrink-0 flex items-center gap-1"
        >
          <Search className="w-3 h-3" />
          F3
        </button>
      </div>
      {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}
