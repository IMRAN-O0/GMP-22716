import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAuthHeaders, getJsonHeaders } from "../../lib/utils";
import {
  Save,
  ArrowRight,
  PlusCircle,
  Trash2,
  Calculator,
  History,
  Pencil,
  Printer,
  Beaker,
  Package,
} from "lucide-react";
import { SearchModal } from "../../components/SearchModal";
import { StatusBadge } from "../../components/StatusBadge";

type CostRow = {
  code: string;
  name: string;
  supplier: string;
  lastPrice: string; // آخر سعر شراء (للكمية المشتراة)
  purchasedQty: string; // الكمية المشتراة (وحدة السعر)
  percentage: string; // النسبة في التركيبة (للمواد الخام)
  usedQty: string; // الكمية المستخدمة (للتغليف — تُدخل يدوياً)
  unit: string;
};

type IndirectRow = { label: string; amount: string };

const emptyRow = (): CostRow => ({
  code: "",
  name: "",
  supplier: "",
  lastPrice: "",
  purchasedQty: "1",
  percentage: "",
  usedQty: "",
  unit: "",
});

// Normalize Arabic-Indic (٠-٩) and Persian (۰-۹) digits to Latin so number
// fields accept typing from an Arabic keyboard, and keep only valid numeric chars.
const normalizeDigits = (v: string) => {
  if (!v) return v;
  let out = "";
  for (const ch of v) {
    const code = ch.charCodeAt(0);
    if (code >= 0x0660 && code <= 0x0669) out += String(code - 0x0660); // ٠-٩
    else if (code >= 0x06f0 && code <= 0x06f9) out += String(code - 0x06f0); // ۰-۹
    else out += ch;
  }
  return out.replace(/[^\d.-]/g, "");
};

const num = (v: any) => {
  const n = parseFloat(normalizeDigits(String(v ?? "")));
  return isFinite(n) ? n : 0;
};
const money = (n: number) => (isFinite(n) ? n : 0).toFixed(2);

// Convert a weight/volume value to grams (density ≈ 1) for unit-count math.
const toGrams = (v: number, unit: string) => {
  if (unit === "كجم" || unit === "لتر") return v * 1000;
  return v; // جم / مل / قطعة
};

export default function CostCalculator() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [materialsList, setMaterialsList] = useState<any[]>([]);
  const [formulas, setFormulas] = useState<any[]>([]);
  const [previous, setPrevious] = useState<any[]>([]);

  const [search, setSearch] = useState<{ table: "raw" | "pkg"; idx: number } | null>(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  const [formData, setFormData] = useState({
    costNo: `CST-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    formulaNo: "",
    productCode: "",
    productName: "",
    batchNo: "",
    date: new Date().toISOString().slice(0, 10),
    // وزن العبوة الواحدة (يُربط تلقائياً من المنتج النهائي، قابل للتعديل)
    unitWeight: "",
    unitWeightUnit: "جم",
    // حجم/وزن الدفعة الإجمالي
    batchTotal: "1",
    batchTotalUnit: "كجم",
    wastePct: "",
    rawMaterials: [] as CostRow[],
    packaging: [] as CostRow[],
    customerProvidesPackaging: false,
    indirect: [
      { label: "أجور العمالة", amount: "" },
      { label: "إيجار", amount: "" },
      { label: "كهرباء", amount: "" },
      { label: "ماء", amount: "" },
      { label: "إهلاك ومصاريف أخرى", amount: "" },
    ] as IndirectRow[],
    operatingPct: "15",
    profitPct: "40",
    notes: "",
    preparedBy: user?.name || "",
  });

  useEffect(() => {
    fetch("/api/materials", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => setMaterialsList(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const loadFormulasAndPrevious = React.useCallback(() => {
    fetch("/api/forms", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        setFormulas(rows.filter((f: any) => f.form_id === "F-INV-BOM"));
        setPrevious(rows.filter((f: any) => f.form_id === "F-INV-COST"));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    loadFormulasAndPrevious();
  }, [loadFormulasAndPrevious]);

  const loadCosting = React.useCallback((recordId: string) => {
    fetch(`/api/forms/record/${recordId}`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.data) {
          setFormData((prev) => ({ ...prev, ...data.data }));
          window.history.replaceState(null, "", `?edit=${recordId}`);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const editId = new URLSearchParams(window.location.search).get("edit");
    if (editId) loadCosting(editId);
  }, [loadCosting]);

  // Build a cost row from a material record (auto-fills price + supplier).
  const rowFromMaterial = (m: any, base: Partial<CostRow> = {}): CostRow => ({
    ...emptyRow(),
    code: m.code || "",
    name: m.name || "",
    supplier: m.supplier_name || "",
    lastPrice: m.purchase_price ? String(m.purchase_price) : "",
    purchasedQty: m.package_size ? String(m.package_size) : "1",
    unit: m.unit || "",
    ...base,
  });

  // Look up a final product (has package_size = unit weight) by code.

  // When a formula (BOM) is selected: load materials + auto-link the unit weight.
  const applyFormula = (recordId: string) => {
    fetch(`/api/forms/record/${recordId}`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        const d = data?.data;
        if (!d) return;
        const rows: CostRow[] = (d.materials || []).map((mat: any) => {
          const found = materialsList.find((x) => x.code === mat.materialCode);
          if (found) return rowFromMaterial(found, { percentage: mat.percentage || "" });
          return {
            ...emptyRow(),
            code: mat.materialCode || "",
            name: mat.materialName || "",
            percentage: mat.percentage || "",
            unit: mat.unit || "",
          };
        });
        // Auto-link the unit weight from the linked final product's package size.
        const prod = materialsList.find((m) => m.code === d.productCode);
        setFormData((prev) => ({
          ...prev,
          formulaNo: d.compositionNo || recordId,
          productCode: d.productCode || "",
          productName: d.productName || (prod ? prod.name : ""),
          unitWeight: prod?.package_size ? String(prod.package_size) : prev.unitWeight,
          unitWeightUnit: prod?.package_size_unit || prev.unitWeightUnit,
          rawMaterials: rows,
        }));
      })
      .catch(console.error);
  };

  // ── Row helpers ────────────────────────────────────────────────────────────
  const updateRow = (table: "rawMaterials" | "packaging", idx: number, field: keyof CostRow, value: string) => {
    setFormData((prev) => {
      const rows = [...prev[table]];
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...prev, [table]: rows };
    });
  };
  const addRow = (table: "rawMaterials" | "packaging") =>
    setFormData((prev) => ({ ...prev, [table]: [...prev[table], emptyRow()] }));
  const removeRow = (table: "rawMaterials" | "packaging", idx: number) =>
    setFormData((prev) => ({ ...prev, [table]: prev[table].filter((_, i) => i !== idx) }));

  const onPickMaterial = (m: any) => {
    if (!search) return;
    const table = search.table === "raw" ? "rawMaterials" : "packaging";
    setFormData((prev) => {
      const rows = [...prev[table]];
      const old = rows[search.idx] || emptyRow();
      rows[search.idx] = rowFromMaterial(m, { percentage: old.percentage, usedQty: old.usedQty });
      return { ...prev, [table]: rows };
    });
    setSearch(null);
  };

  // ── Calculations ─────────────────────────────────────────────────────────
  const batchTotal = num(formData.batchTotal);
  const rowUnitPrice = (r: CostRow) => {
    const pq = num(r.purchasedQty);
    return pq > 0 ? num(r.lastPrice) / pq : 0;
  };
  // Raw material quantity in the batch = percentage % × total batch size.
  const rawUsedQty = (r: CostRow) => (num(r.percentage) / 100) * batchTotal;
  const rawCost = (r: CostRow) => rowUnitPrice(r) * rawUsedQty(r);
  // Packaging quantity is entered directly (e.g. number of bottles).
  const pkgCost = (r: CostRow) => rowUnitPrice(r) * num(r.usedQty);

  const totalRaw = formData.rawMaterials.reduce((s, r) => s + rawCost(r), 0);
  const totalPkg = formData.customerProvidesPackaging
    ? 0
    : formData.packaging.reduce((s, r) => s + pkgCost(r), 0);
  const totalIndirect = formData.indirect.reduce((s, i) => s + num(i.amount), 0);
  const totalBatchCost = totalRaw + totalPkg + totalIndirect;

  const unitWeightG = toGrams(num(formData.unitWeight), formData.unitWeightUnit);
  const batchTotalG = toGrams(batchTotal, formData.batchTotalUnit);
  const totalUnits = unitWeightG > 0 ? batchTotalG / unitWeightG : 0;
  const netUnits = totalUnits * (1 - num(formData.wastePct) / 100);
  const unitCost = netUnits > 0 ? totalBatchCost / netUnits : 0;

  const operatingValue = unitCost * (num(formData.operatingPct) / 100);
  const totalUnitCost = unitCost + operatingValue;
  const suggestedPrice = totalUnitCost * (1 + num(formData.profitPct) / 100);
  const unitProfit = suggestedPrice - totalUnitCost;
  const piecesPerKilo = unitWeightG > 0 ? 1000 / unitWeightG : 0;

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent, status: any) => {
    e.preventDefault();
    const payload = {
      recordId: formData.costNo,
      formId: "F-INV-COST",
      department: "INV",
      creatorId: user?.id,
      status,
      data: {
        ...formData,
        _summary: {
          totalRaw, totalPkg, totalIndirect, totalBatchCost,
          totalUnits, netUnits, unitCost, totalUnitCost, suggestedPrice, unitProfit,
        },
      },
    };
    try {
      const editId = new URLSearchParams(window.location.search).get("edit");
      const url = editId ? `/api/forms/record/${editId}` : "/api/forms";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: getJsonHeaders(), body: JSON.stringify(payload) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "حدث خطأ أثناء الحفظ" }));
        alert(err.error || "حدث خطأ أثناء الحفظ");
        return;
      }
      alert("تم حفظ حساب التكلفة بنجاح!");
      navigate("/inv");
    } catch (err) {
      console.error(err);
      alert("حدث خطأ في الاتصال");
    }
  };

  const inputCls =
    "w-full bg-white border border-slate-200 focus:ring-1 focus:ring-sky-500 rounded-lg text-sm py-1.5 px-2";

  const rawForSearch = materialsList.filter((m) => m.category !== "منتج نهائي");
  const pkgForSearch = materialsList.filter(
    (m) => (m.category || "").includes("تغليف") || (m.category || "").includes("تعبئة"),
  );

  // ── Material table (raw uses % → qty, packaging uses entered qty) ───────────
  const renderMaterialTable = (
    mode: "raw" | "pkg",
    title: string,
    color: string,
    total: number,
    icon: React.ReactNode,
  ) => {
    const table = mode === "raw" ? "rawMaterials" : "packaging";
    const rows = formData[table];
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">{icon}{title}</h2>
          <button
            type="button"
            onClick={() => addRow(table)}
            className={`flex items-center gap-1.5 px-3 py-1.5 ${color} font-bold rounded-lg text-sm transition-colors`}
          >
            <PlusCircle className="w-4 h-4" />
            إضافة صف
          </button>
        </div>
        <div className="border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-right min-w-[900px]">
            <thead className="bg-slate-50 text-slate-600 text-[13px] border-b border-slate-200">
              <tr>
                <th className="p-2 font-semibold w-[22%]">المكوّن</th>
                <th className="p-2 font-semibold">المورد</th>
                <th className="p-2 font-semibold w-24">آخر سعر شراء</th>
                <th className="p-2 font-semibold w-24">الكمية المشتراة</th>
                <th className="p-2 font-semibold w-24">سعر الوحدة</th>
                {mode === "raw" ? (
                  <th className="p-2 font-semibold w-20">النسبة %</th>
                ) : null}
                <th className="p-2 font-semibold w-28">الكمية المستخدمة</th>
                <th className="p-2 font-semibold w-24">التكلفة</th>
                <th className="p-2 font-semibold w-10 text-center">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={mode === "raw" ? 9 : 8} className="p-6 text-center text-slate-400 text-sm">
                    {mode === "raw"
                      ? "اختر تركيبة أعلاه أو أضف المواد يدوياً"
                      : "أضف مواد التعبئة والتغليف (عبوة، غطاء، ملصق...)"}
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 align-top">
                    <td className="p-2 border-l border-slate-100">
                      <div className="flex gap-1">
                        <input
                          type="text"
                          placeholder="الكود…"
                          value={r.code}
                          onChange={(e) => {
                            const code = e.target.value;
                            const found = materialsList.find((m) => m.code === code);
                            if (found) {
                              setFormData((prev) => {
                                const arr = [...prev[table]];
                                arr[i] = rowFromMaterial(found, { percentage: arr[i].percentage, usedQty: arr[i].usedQty });
                                return { ...prev, [table]: arr };
                              });
                            } else {
                              updateRow(table, i, "code", code);
                            }
                          }}
                          className={inputCls}
                        />
                        <button
                          type="button"
                          title="بحث عن مادة"
                          onClick={() => setSearch({ table: mode, idx: i })}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[11px] font-bold text-slate-500 flex-shrink-0"
                        >
                          F3
                        </button>
                      </div>
                      {r.name && <p className="text-[11px] text-emerald-600 mt-1 font-semibold">{r.name}</p>}
                    </td>
                    <td className="p-2 border-l border-slate-100">
                      <input type="text" value={r.supplier} onChange={(e) => updateRow(table, i, "supplier", e.target.value)} placeholder="المورد" className={inputCls} />
                    </td>
                    <td className="p-2 border-l border-slate-100">
                      <input type="text" inputMode="decimal" value={r.lastPrice}
                        onChange={(e) => updateRow(table, i, "lastPrice", normalizeDigits(e.target.value))} className={inputCls} placeholder="0.00" />
                    </td>
                    <td className="p-2 border-l border-slate-100">
                      <input type="text" inputMode="decimal" value={r.purchasedQty}
                        onChange={(e) => updateRow(table, i, "purchasedQty", normalizeDigits(e.target.value))} className={inputCls} placeholder="1" />
                    </td>
                    <td className="p-2 border-l border-slate-100 text-sm text-slate-600 font-mono">
                      {money(rowUnitPrice(r))}
                    </td>
                    {mode === "raw" ? (
                      <td className="p-2 border-l border-slate-100">
                        <input type="text" inputMode="decimal" value={r.percentage}
                          onChange={(e) => updateRow(table, i, "percentage", normalizeDigits(e.target.value))} className={inputCls} placeholder="0" />
                      </td>
                    ) : null}
                    <td className="p-2 border-l border-slate-100">
                      {mode === "raw" ? (
                        <span className="text-sm text-slate-700 font-mono">
                          {money(rawUsedQty(r))} <span className="text-[11px] text-slate-400">{formData.batchTotalUnit}</span>
                        </span>
                      ) : (
                        <input type="text" inputMode="decimal" value={r.usedQty}
                          onChange={(e) => updateRow(table, i, "usedQty", normalizeDigits(e.target.value))} className={inputCls} placeholder={String(Math.round(totalUnits) || "")} />
                      )}
                    </td>
                    <td className="p-2 border-l border-slate-100 text-sm font-bold text-slate-700 font-mono">
                      {money(mode === "raw" ? rawCost(r) : pkgCost(r))}
                    </td>
                    <td className="p-2 text-center">
                      <button type="button" onClick={() => removeRow(table, i)}
                        className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 inline-block">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200">
              <tr>
                <td colSpan={mode === "raw" ? 7 : 6} className="p-3 text-left font-bold text-slate-700">الإجمالي:</td>
                <td className="p-3 font-bold text-slate-900 font-mono">ر.س {money(total)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        {mode === "raw" && (
          <p className="text-[12px] text-slate-500 mt-2">
            الكمية المستخدمة = النسبة% × حجم الدفعة ({formData.batchTotal || 0} {formData.batchTotalUnit}). تأكد أن «آخر سعر شراء» و«الكمية المشتراة» بنفس وحدة حجم الدفعة.
          </p>
        )}
      </div>
    );
  };

  const SummaryRow = ({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: string }) => (
    <div className={`flex items-center justify-between py-2 px-4 ${strong ? "bg-slate-50 font-bold" : ""}`}>
      <span className={`text-sm ${strong ? "text-slate-800" : "text-slate-600"}`}>{label}</span>
      <span className={`font-mono text-sm font-bold ${accent || "text-slate-900"}`}>{value}</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/inv")} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-lg">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Calculator className="w-6 h-6 text-sky-600" />
            <div>
              <h1 className="text-lg font-bold text-slate-900 m-0">أداة حساب تكاليف المنتج</h1>
              <p className="text-[13px] font-semibold text-slate-500">القسم: المخزون (INV)</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-left">
          <span className="text-[12px] font-bold text-slate-500">رقم الحساب:</span>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <span className="bg-sky-50 text-sky-700 font-bold text-[12px] px-2 py-1 border-l border-slate-200">CST-</span>
            <input
              type="text"
              maxLength={4}
              value={formData.costNo.replace(/^CST-/i, "")}
              onChange={(e) => setFormData({ ...formData, costNo: `CST-${e.target.value.replace(/\D/g, "").slice(0, 4)}` })}
              className="w-14 text-center font-mono font-bold text-[13px] text-slate-800 border-0 focus:ring-0 py-1"
            />
          </div>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, "approved")} className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="p-8">
          {/* Batch info */}
          <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">أولاً: معلومات الدفعة والعبوة</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4">
            <div className="md:col-span-2">
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">التركيبة (BOM)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={formData.formulaNo ? `${formData.formulaNo} — ${formData.productName}` : ""}
                  placeholder="اختر تركيبة لجلب موادها ووزن عبوتها تلقائياً…"
                  className="flex-1 bg-slate-50 border-slate-300 rounded-lg text-sm py-2 px-3 text-slate-700"
                />
                <button type="button" onClick={() => setShowFormulaModal(true)}
                  className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg text-sm whitespace-nowrap">
                  اختيار تركيبة
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">اسم المنتج</label>
              <input type="text" value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="w-full border-slate-300 rounded-lg text-sm py-2 px-3" placeholder="اسم المنتج" />
            </div>

            {/* وزن العبوة — مربوط تلقائياً من المنتج، قابل للتعديل */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                وزن/حجم العبوة الواحدة
                <span className="text-emerald-600 font-normal mr-1">(تلقائي من المنتج)</span>
              </label>
              <div className="flex gap-2">
                <input type="text" inputMode="decimal" value={formData.unitWeight}
                  onChange={(e) => setFormData({ ...formData, unitWeight: normalizeDigits(e.target.value) })}
                  className="flex-1 border-slate-300 rounded-lg text-sm py-2 px-3" placeholder="50" />
                <select value={formData.unitWeightUnit} onChange={(e) => setFormData({ ...formData, unitWeightUnit: e.target.value })}
                  className="w-24 border-slate-300 rounded-lg text-sm py-2">
                  <option value="جم">جم</option>
                  <option value="كجم">كجم</option>
                  <option value="مل">مل</option>
                  <option value="لتر">لتر</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">حجم/وزن الدفعة الإجمالي</label>
              <div className="flex gap-2">
                <input type="text" inputMode="decimal" value={formData.batchTotal}
                  onChange={(e) => setFormData({ ...formData, batchTotal: normalizeDigits(e.target.value) })}
                  className="flex-1 border-slate-300 rounded-lg text-sm py-2 px-3" placeholder="1" />
                <select value={formData.batchTotalUnit} onChange={(e) => setFormData({ ...formData, batchTotalUnit: e.target.value })}
                  className="w-24 border-slate-300 rounded-lg text-sm py-2">
                  <option value="كجم">كجم</option>
                  <option value="جم">جم</option>
                  <option value="لتر">لتر</option>
                  <option value="مل">مل</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">نسبة الهدر %</label>
              <input type="text" inputMode="decimal" value={formData.wastePct}
                onChange={(e) => setFormData({ ...formData, wastePct: normalizeDigits(e.target.value) })}
                className="w-full border-slate-300 rounded-lg text-sm py-2 px-3" placeholder="5" />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">رقم الدفعة / التاريخ</label>
              <div className="flex gap-2">
                <input type="text" value={formData.batchNo} onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
                  placeholder="B-001" className="w-1/2 border-slate-300 rounded-lg text-sm py-2 px-2" />
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-1/2 border-slate-300 rounded-lg text-sm py-2 px-2" />
              </div>
            </div>
            <div className="bg-sky-50 border border-sky-100 rounded-lg px-3 py-2 flex flex-col justify-center">
              <span className="text-[12px] font-semibold text-sky-700">عدد العبوات (الدفعة ÷ العبوة)</span>
              <span className="text-xl font-bold text-sky-800 font-mono">{Math.round(totalUnits) || 0}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex flex-col justify-center">
              <span className="text-[12px] font-semibold text-emerald-700">الوحدات الصافية (بعد الهدر)</span>
              <span className="text-xl font-bold text-emerald-800 font-mono">{Math.round(netUnits) || 0}</span>
            </div>
          </div>
          <p className="text-[12px] text-slate-500 mb-8">
            عدد العبوات يُحسب تلقائياً = حجم الدفعة ÷ وزن العبوة. {piecesPerKilo ? `(كل كيلو ≈ ${piecesPerKilo.toFixed(1)} عبوة)` : ""}
          </p>

          {/* Raw materials */}
          {renderMaterialTable("raw", "ثانياً: المواد الخام",
            "bg-emerald-50 text-emerald-600 hover:bg-emerald-100", totalRaw, <Beaker className="w-5 h-5 text-emerald-600" />)}

          {/* Packaging (optional) */}
          <label className="flex items-center gap-2 mb-3 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={formData.customerProvidesPackaging}
              onChange={(e) => setFormData({ ...formData, customerProvidesPackaging: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm font-semibold text-slate-700">العميل يوفّر مواد التغليف (لا تُحتسب تكلفتها)</span>
          </label>
          {formData.customerProvidesPackaging ? (
            <div className="mb-8 border border-dashed border-amber-300 bg-amber-50/50 rounded-xl p-5 flex items-center gap-2 text-amber-700 text-sm font-semibold">
              <Package className="w-5 h-5" />
              مواد التغليف من توريد العميل — لن تُضاف أي تكلفة تغليف إلى تكلفة الدفعة.
            </div>
          ) : (
            renderMaterialTable("pkg", "ثالثاً: مواد التعبئة والتغليف",
              "bg-amber-50 text-amber-600 hover:bg-amber-100", totalPkg, <Package className="w-5 h-5 text-amber-600" />)
          )}

          {/* Indirect costs */}
          <div className="mb-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
              <h2 className="text-lg font-bold text-slate-800">رابعاً: العمالة والتكاليف غير المباشرة</h2>
              <button type="button"
                onClick={() => setFormData((p) => ({ ...p, indirect: [...p.indirect, { label: "", amount: "" }] }))}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold rounded-lg text-sm">
                <PlusCircle className="w-4 h-4" />إضافة بند
              </button>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-600 text-[13px] border-b border-slate-200">
                  <tr>
                    <th className="p-2 font-semibold">البند</th>
                    <th className="p-2 font-semibold w-40">القيمة (للدفعة)</th>
                    <th className="p-2 font-semibold w-10 text-center">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.indirect.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2 border-l border-slate-100">
                        <input type="text" value={row.label}
                          onChange={(e) => setFormData((p) => { const a = [...p.indirect]; a[i] = { ...a[i], label: e.target.value }; return { ...p, indirect: a }; })}
                          className={inputCls} placeholder="اسم البند" />
                      </td>
                      <td className="p-2 border-l border-slate-100">
                        <input type="text" inputMode="decimal" value={row.amount}
                          onChange={(e) => setFormData((p) => { const a = [...p.indirect]; a[i] = { ...a[i], amount: normalizeDigits(e.target.value) }; return { ...p, indirect: a }; })}
                          className={inputCls} placeholder="0.00" />
                      </td>
                      <td className="p-2 text-center">
                        <button type="button" onClick={() => setFormData((p) => ({ ...p, indirect: p.indirect.filter((_, x) => x !== i) }))}
                          className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 inline-block">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200">
                  <tr>
                    <td className="p-3 text-left font-bold text-slate-700">الإجمالي:</td>
                    <td className="p-3 font-bold text-slate-900 font-mono">ر.س {money(totalIndirect)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Summary + pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 text-sm">خامساً: ملخص التكاليف</div>
              <div className="divide-y divide-slate-100">
                <SummaryRow label="إجمالي المواد الخام" value={`ر.س ${money(totalRaw)}`} />
                <SummaryRow label="إجمالي التعبئة والتغليف" value={`ر.س ${money(totalPkg)}`} />
                <SummaryRow label="العمالة والتكاليف غير المباشرة" value={`ر.س ${money(totalIndirect)}`} />
                <SummaryRow label="إجمالي تكلفة الدفعة" value={`ر.س ${money(totalBatchCost)}`} strong />
                <SummaryRow label="عدد الوحدات الصافية" value={String(Math.round(netUnits) || 0)} />
                <SummaryRow label="تكلفة الوحدة الواحدة" value={`ر.س ${money(unitCost)}`} strong accent="text-emerald-700" />
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 text-sm">سادساً: التسعير المقترح</div>
              <div className="divide-y divide-slate-100">
                <SummaryRow label="تكلفة الوحدة" value={`ر.س ${money(unitCost)}`} />
                <div className="flex items-center justify-between py-1.5 px-4">
                  <span className="text-sm text-slate-600">% التكاليف التشغيلية (تسويق/إداري/توزيع)</span>
                  <input type="text" inputMode="decimal" value={formData.operatingPct}
                    onChange={(e) => setFormData({ ...formData, operatingPct: normalizeDigits(e.target.value) })}
                    className="w-20 border border-slate-200 rounded-lg text-sm py-1 px-2 text-center" />
                </div>
                <SummaryRow label="قيمة التكاليف التشغيلية" value={`ر.س ${money(operatingValue)}`} />
                <SummaryRow label="التكلفة الكلية للوحدة" value={`ر.س ${money(totalUnitCost)}`} strong />
                <div className="flex items-center justify-between py-1.5 px-4">
                  <span className="text-sm text-slate-600">% هامش الربح</span>
                  <input type="text" inputMode="decimal" value={formData.profitPct}
                    onChange={(e) => setFormData({ ...formData, profitPct: normalizeDigits(e.target.value) })}
                    className="w-20 border border-slate-200 rounded-lg text-sm py-1 px-2 text-center" />
                </div>
                <SummaryRow label="سعر البيع المقترح للوحدة" value={`ر.س ${money(suggestedPrice)}`} strong accent="text-sky-700" />
                <SummaryRow label="ربح الوحدة الواحدة" value={`ر.س ${money(unitProfit)}`} accent="text-emerald-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex flex-wrap items-center gap-3 p-6 border-t border-slate-200">
          <button type="button" onClick={(e) => handleSubmit(e, "draft")}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[14px]">
            <Save className="w-4 h-4" />حفظ كمسودة
          </button>
          {user && user.level <= 2 ? (
            <button type="button" onClick={(e) => handleSubmit(e, "approved")}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold text-[14px]">
              <Save className="w-4 h-4" />حفظ واعتماد
            </button>
          ) : (
            <button type="button" onClick={(e) => handleSubmit(e, user?.level === 3 ? "pending_approval" : "pending_review")}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold text-[14px]">
              <Save className="w-4 h-4" />إرسال للمراجعة
            </button>
          )}
          <button type="button" onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[14px]">
            <Printer className="w-4 h-4" />طباعة
          </button>
          <div className="flex-1" />
          <button type="button" onClick={() => navigate("/inv")}
            className="text-slate-500 hover:text-slate-700 font-semibold text-[14px]">إغلاق والعودة</button>
        </div>
      </form>

      {/* Saved costings */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-sky-600" />
            <h2 className="text-lg font-bold text-slate-800 m-0">حسابات التكاليف السابقة</h2>
            <span className="bg-slate-100 text-slate-600 text-[12px] font-bold px-2 py-0.5 rounded-full">{previous.length}</span>
          </div>
          <button type="button" onClick={loadFormulasAndPrevious} className="text-[13px] font-semibold text-sky-600 hover:text-sky-700">تحديث</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
              <tr>
                <th className="p-3 font-semibold">رقم الحساب</th>
                <th className="p-3 font-semibold">المنتج</th>
                <th className="p-3 font-semibold w-28 text-center">تكلفة الوحدة</th>
                <th className="p-3 font-semibold w-28 text-center">سعر البيع</th>
                <th className="p-3 font-semibold w-28 text-center">الحالة</th>
                <th className="p-3 font-semibold w-16 text-center">فتح</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {previous.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400 text-sm">لا توجد حسابات محفوظة بعد.</td></tr>
              ) : (
                previous.map((c) => (
                  <tr key={c.record_id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-700 text-sm">{c.record_id}</td>
                    <td className="p-3 text-sm text-slate-700">{c.data?.productName || "—"}</td>
                    <td className="p-3 text-center text-sm font-mono text-emerald-700">
                      {c.data?._summary ? `ر.س ${money(c.data._summary.unitCost)}` : "—"}
                    </td>
                    <td className="p-3 text-center text-sm font-mono text-sky-700">
                      {c.data?._summary ? `ر.س ${money(c.data._summary.suggestedPrice)}` : "—"}
                    </td>
                    <td className="p-3 text-center"><StatusBadge status={c.status} /></td>
                    <td className="p-3 text-center">
                      <button type="button" title="فتح للتعديل" onClick={() => loadCosting(c.record_id)}
                        className="text-sky-500 hover:text-sky-700 p-1.5 rounded-lg hover:bg-sky-50 inline-block">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showFormulaModal && (
        <SearchModal
          title="اختيار تركيبة (BOM)"
          items={formulas.map((f) => ({
            record_id: f.record_id,
            productName: f.data?.productName || "",
            productCode: f.data?.productCode || "",
            count: Array.isArray(f.data?.materials) ? f.data.materials.length : 0,
          }))}
          columns={[
            { key: "record_id", label: "رقم التركيبة", className: "font-mono w-28" },
            { key: "productName", label: "المنتج" },
            { key: "productCode", label: "الكود", className: "font-mono w-24" },
            { key: "count", label: "عدد المواد", className: "w-24 text-center" },
          ]}
          searchKeys={["record_id", "productName", "productCode"]}
          placeholder="ابحث برقم التركيبة أو المنتج…"
          onSelect={(f) => { applyFormula(f.record_id); setShowFormulaModal(false); }}
          onClose={() => setShowFormulaModal(false)}
        />
      )}
      {search && (
        <SearchModal
          title={search.table === "raw" ? "بحث عن مادة خام" : "بحث عن مادة تعبئة/تغليف"}
          items={search.table === "raw" ? rawForSearch : pkgForSearch}
          columns={[
            { key: "code", label: "الكود", className: "font-mono w-28" },
            { key: "name", label: "الاسم" },
            { key: "supplier_name", label: "المورد", className: "w-32" },
            { key: "purchase_price", label: "السعر", className: "w-20" },
          ]}
          searchKeys={["code", "name", "supplier_name"]}
          placeholder="ابحث بالكود أو الاسم…"
          onSelect={onPickMaterial}
          onClose={() => setSearch(null)}
        />
      )}
    </div>
  );
}
