import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { Save, ArrowRight, Plus, Trash2 } from "lucide-react";
import { getAuthHeaders, getJsonHeaders } from "../../lib/utils";
import { getPackagingForm, type PkgField } from "./packagingForms.config";

const YEAR = new Date().getFullYear();

// A reasonably unique, human-readable record id: e.g. "FIL-001-4821-2026".
const makeRecordId = (formId: string) =>
  `${formId.replace(/^F-/, "")}-${Math.floor(1000 + Math.random() * 9000)}-${YEAR}`;

export default function PackagingFormRenderer() {
  const navigate = useNavigate();
  const { formKey } = useParams();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const def = useMemo(() => getPackagingForm(formKey || ""), [formKey]);

  const [data, setData] = useState<any>({
    batchNumber: "",
    productCode: "",
    productName: "",
    productionOrderNo: "",
    formDate: new Date().toISOString().slice(0, 10),
  });
  const [recordId, setRecordId] = useState("");
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Production batches (approved batch records) for linking by batch number.
  useEffect(() => {
    fetch("/api/forms/dept/PRD", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((rows) => setBatches(Array.isArray(rows) ? rows : []))
      .catch(() => {});
  }, []);

  // Generate a fresh record id for new forms, or load an existing record to edit.
  useEffect(() => {
    if (!def) return;
    if (editId) {
      fetch(`/api/forms/record/${editId}`, { headers: getAuthHeaders() })
        .then((r) => r.json())
        .then((rec) => {
          if (rec && rec.data) {
            setData(rec.data);
            setRecordId(rec.record_id || editId);
          }
        })
        .catch(() => {});
    } else {
      setRecordId(makeRecordId(def.formId));
    }
  }, [def, editId]);

  const set = (name: string, value: any) => setData((p: any) => ({ ...p, [name]: value }));

  const setRow = (table: string, idx: number, col: string, value: any) =>
    setData((p: any) => {
      const rows = [...(p[table] || [])];
      rows[idx] = { ...rows[idx], [col]: value };
      return { ...p, [table]: rows };
    });

  const addRow = (table: string) =>
    setData((p: any) => ({ ...p, [table]: [...(p[table] || []), {}] }));

  const removeRow = (table: string, idx: number) =>
    setData((p: any) => ({ ...p, [table]: (p[table] || []).filter((_: any, i: number) => i !== idx) }));

  const submit = async (status: string) => {
    if (!def) return;
    if (!data.batchNumber) {
      alert("يرجى إدخال رقم التشغيلة (Batch) لربط النموذج بالمنتج.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(editId ? `/api/forms/record/${editId}` : "/api/forms", {
        method: editId ? "PUT" : "POST",
        headers: getJsonHeaders(),
        body: JSON.stringify({
          recordId,
          formId: def.formId,
          department: "PKG",
          status,
          data: { ...data, formId: def.formId },
        }),
      });
      if (res.ok) {
        alert("تم الحفظ بنجاح.");
        navigate("/pkg");
      } else {
        const e = await res.json().catch(() => ({}));
        alert(e.error || "تعذّر الحفظ.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!def) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 mb-4">النموذج غير موجود.</p>
        <Link to="/pkg" className="text-sky-600 font-semibold">العودة لقسم التعبئة والتغليف</Link>
      </div>
    );
  }

  const renderField = (f: PkgField) => {
    const common =
      "w-full border border-slate-300 rounded-lg shadow-sm focus:border-sky-500 focus:ring-sky-500 py-2 px-3 text-sm";
    if (f.type === "select") {
      return (
        <select className={common} value={data[f.name] || ""} onChange={(e) => set(f.name, e.target.value)}>
          <option value="">— اختر —</option>
          {(f.options || []).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
    }
    if (f.type === "textarea") {
      return <textarea className={common} rows={2} value={data[f.name] || ""} onChange={(e) => set(f.name, e.target.value)} />;
    }
    return (
      <input
        type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "time" ? "time" : "text"}
        className={common}
        value={data[f.name] || ""}
        onChange={(e) => set(f.name, e.target.value)}
      />
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{def.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{def.description}</p>
          <p className="text-xs text-slate-400 mt-1 font-mono">{def.formId} · {recordId}</p>
        </div>
        <button onClick={() => navigate(-1)} className="flex items-center text-slate-600 hover:text-slate-900 text-sm">
          <ArrowRight className="w-4 h-4 ml-1" /> رجوع
        </button>
      </div>

      {/* Shared header — links the form to the batch/product */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4">بيانات التشغيلة والمنتج</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">رقم التشغيلة (Batch) *</label>
            <input
              list="pkg-batches"
              className="w-full border border-slate-300 rounded-lg py-2 px-3 text-sm"
              value={data.batchNumber}
              onChange={(e) => {
                const bn = e.target.value;
                const match = batches.find((b) => (b.data?.batchNumber || "") === bn);
                set("batchNumber", bn);
                if (match) {
                  set("productCode", match.data?.productCode || data.productCode);
                  set("productName", match.data?.productName || data.productName);
                  set("productionOrderNo", match.data?.productionOrderNo || match.record_id);
                }
              }}
            />
            <datalist id="pkg-batches">
              {batches.filter((b) => b.data?.batchNumber).map((b) => (
                <option key={b.record_id} value={b.data.batchNumber}>{b.data?.productName || ""}</option>
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">كود المنتج</label>
            <input className="w-full border border-slate-300 rounded-lg py-2 px-3 text-sm" value={data.productCode} onChange={(e) => set("productCode", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">اسم المنتج</label>
            <input className="w-full border border-slate-300 rounded-lg py-2 px-3 text-sm" value={data.productName} onChange={(e) => set("productName", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">التاريخ</label>
            <input type="date" className="w-full border border-slate-300 rounded-lg py-2 px-3 text-sm" value={data.formDate} onChange={(e) => set("formDate", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Sections from config */}
      {def.sections.map((section, si) => (
        <div key={si} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">{section.title}</h3>

          {section.fields && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields.map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    {f.label} {f.required && <span className="text-rose-500">*</span>} {f.unit && <span className="text-slate-400">({f.unit})</span>}
                  </label>
                  {renderField(f)}
                </div>
              ))}
            </div>
          )}

          {section.checklist && (
            <div className="space-y-2">
              {section.checklist.map((item) => (
                <div key={item.name} className="flex items-center justify-between border-b border-slate-100 py-2">
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <div className="flex gap-2">
                    {["نعم", "لا", "لا ينطبق"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => set(item.name, opt)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                          data[item.name] === opt
                            ? opt === "نعم"
                              ? "bg-emerald-500 text-white border-emerald-500"
                              : opt === "لا"
                                ? "bg-rose-500 text-white border-rose-500"
                                : "bg-slate-400 text-white border-slate-400"
                            : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {section.table && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600">
                    {section.table.columns.map((c) => (
                      <th key={c.name} className="p-2 text-right font-semibold whitespace-nowrap">{c.label}</th>
                    ))}
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {(data[section.table.name] || []).map((row: any, ri: number) => (
                    <tr key={ri} className="border-b border-slate-100">
                      {section.table!.columns.map((c) => (
                        <td key={c.name} className="p-1">
                          <input
                            type={c.type === "number" ? "number" : "text"}
                            className="w-full border border-slate-200 rounded px-2 py-1 text-sm"
                            value={row[c.name] || ""}
                            onChange={(e) => setRow(section.table!.name, ri, c.name, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="p-1 text-center">
                        <button type="button" onClick={() => removeRow(section.table!.name, ri)} className="text-rose-500 hover:text-rose-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                type="button"
                onClick={() => addRow(section.table!.name)}
                className="mt-3 flex items-center text-sm text-sky-600 font-semibold hover:text-sky-800"
              >
                <Plus className="w-4 h-4 ml-1" /> إضافة سطر
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => submit("draft")}
          className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          حفظ كمسودة
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => submit("pending_review")}
          className="flex items-center px-5 py-2.5 bg-sky-600 text-white rounded-lg font-semibold text-sm hover:bg-sky-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4 ml-2" /> حفظ وإرسال
        </button>
      </div>
    </div>
  );
}
