import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { formatMaterialCode, formatProductCode, formatBOMCode, getAuthHeaders, getJsonHeaders } from "../../lib/utils";
import { Save, ArrowRight, PlusCircle, Trash2, Beaker, History, Pencil, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, X } from "lucide-react";
import { SearchModal, SearchField } from "../../components/SearchModal";
import { StatusBadge } from "../../components/StatusBadge";
import * as XLSX from "xlsx";

// One formula parsed from the import file (editable before import).
type ImportFormula = {
  compositionNo: string;
  productCode: string;
  productName: string;
  version: string;
  materials: { materialCode: string; materialName: string; percentage: string; unit: string }[];
};

export default function FormComposition() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [finalProducts, setFinalProducts] = useState<any[]>([]);
  const [rawMaterialsList, setRawMaterialsList] = useState<any[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMatIdx, setEditingMatIdx] = useState<number | null>(null);
  const [previousCompositions, setPreviousCompositions] = useState<any[]>([]);

  // ── Excel bulk import ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [importFormulas, setImportFormulas] = useState<ImportFormula[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ inserted: number; errors: string[] } | null>(null);
  const [importProductIdx, setImportProductIdx] = useState<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    compositionNo: `AH-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    productCode: "",
    productName: "",
    version: "1.0",
    notes: "",
    materials: [] as {
      materialCode: string;
      materialName: string;
      percentage: string;
      unit: string;
    }[],
    preparedBy: user?.name || "",
  });

  useEffect(() => {
    fetch("/api/materials", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        setFinalProducts(data.filter((m: any) => m.category === "منتج نهائي"));
        setRawMaterialsList(
          data.filter((m: any) => m.category !== "منتج نهائي"),
        );
      })
      .catch(console.error);
  }, []);

  // Load previously saved compositions (BOMs) to show below the form.
  const loadPreviousCompositions = React.useCallback(() => {
    fetch("/api/forms", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        setPreviousCompositions(
          rows.filter((f: any) => f.form_id === "F-INV-BOM"),
        );
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    loadPreviousCompositions();
  }, [loadPreviousCompositions]);

  // Load an existing composition into the form for editing.
  const loadComposition = (recordId: string) => {
    fetch(`/api/forms/record/${recordId}`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.data) {
          setFormData((prev) => ({ ...prev, ...data.data }));
          // Mark the form as editing this record so saving updates it.
          window.history.replaceState(null, "", `?edit=${recordId}`);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      })
      .catch(console.error);
  };

  const addMaterial = () => {
    setFormData((prev) => ({
      ...prev,
      materials: [
        ...prev.materials,
        { materialCode: "", materialName: "", percentage: "", unit: "%" },
      ],
    }));
  };

  const removeMaterial = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index),
    }));
  };

  const updateMaterial = (index: number, field: string, value: string) => {
    const newMaterials = [...formData.materials];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    setFormData((prev) => ({ ...prev, materials: newMaterials }));
  };

  const selectMaterialForRow = (idx: number, m: any) => {
    const newMaterials = [...formData.materials];
    newMaterials[idx] = { ...newMaterials[idx], materialCode: m.code, materialName: m.name, unit: m.unit || "%" };
    setFormData((prev) => ({ ...prev, materials: newMaterials }));
  };

  const handleSubmit = async (e: React.FormEvent, status: any) => {
    e.preventDefault();
    const recordId = formData.compositionNo;

    const payload = {
      recordId,
      formId: "F-INV-BOM", // Bill of Materials / التركيبة
      department: "INV",
      creatorId: user?.id,
      status,
      data: formData,
    };

    try {
      const editIdPatch = new URLSearchParams(window.location.search).get(
        "edit",
      );
      const fetchUrl = editIdPatch
        ? `/api/forms/record/${editIdPatch}`
        : "/api/forms";
      const fetchMethod = editIdPatch ? "PUT" : "POST";
      const res = await fetch(fetchUrl, {
        method: fetchMethod,
        headers: getJsonHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "حدث خطأ أثناء الحفظ" }));
        alert(errData.error || "حدث خطأ أثناء الحفظ");
        return;
      }
      alert("تم حفظ التركيبة بنجاح!");
      navigate("/inv");
    } catch (err) {
      console.error(err);
      alert("حدث خطأ في الاتصال");
    }
  };

  const totalPercentage = formData.materials.reduce(
    (sum, m) => sum + (parseFloat(m.percentage) || 0),
    0,
  );

  // --- INJECTED BY PATCH ---
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    if (editId) {
      fetch(`/api/forms/record/${editId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.data) {
            setFormData((prev) => ({ ...prev, ...data.data }));
          }
        })
        .catch(console.error);
    }
  }, []);
  // -------------------------

  // ── Excel template download (compositions / BOM) ───────────────────────────
  const downloadTemplate = () => {
    const headers = [
      "رقم التركيبة*", "كود المنتج*", "اسم المنتج", "رقم الإصدار",
      "كود المادة*", "النسبة/الكمية*", "الوحدة",
    ];
    const keys = ["compositionNo", "productCode", "productName", "version", "materialCode", "percentage", "unit"];
    const example1 = ["AH-0001", "FD-0001", "كريم ترطيب", "1.0", "RM-0001", "70", "%"];
    const example2 = ["AH-0001", "FD-0001", "كريم ترطيب", "1.0", "RM-0002", "30", "%"];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, keys, example1, example2]);
    ws["!cols"] = headers.map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, "نموذج الاستيراد");

    const instructions = [
      ["تعليمات استيراد التركيبات (BOM)"],
      [""],
      ["1. كل سطر يمثل مادة واحدة داخل التركيبة.", ""],
      ["2. اجمع مواد التركيبة الواحدة بنفس (رقم التركيبة).", "مثال: AH-0001 له عدة أسطر بنفس الرقم"],
      ["3. الحقول المطلوبة (*):", "رقم التركيبة، كود المنتج، كود المادة، النسبة/الكمية"],
      ["4. كود المنتج (FD-XXXX):", "يجب أن يكون منتجاً نهائياً موجوداً. سيُطلب منك تأكيد الربط بعد الرفع."],
      ["5. الوحدة:", "% | كجم | جرام | لتر | مل | قطعة (افتراضي %)"],
      [""],
      ["ملاحظة:", "إذا كان رقم التركيبة موجوداً مسبقاً سيتم تحديثه بالبيانات الجديدة."],
    ];
    const wsInst = XLSX.utils.aoa_to_sheet(instructions);
    wsInst["!cols"] = [{ wch: 38 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsInst, "التعليمات");

    XLSX.writeFile(wb, "نموذج_استيراد_التركيبات.xlsx");
  };

  // ── Parse uploaded Excel into grouped formulas ─────────────────────────────
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkErrors([]);
    setBulkResult(null);
    setImportFormulas([]);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        if (raw.length < 3) {
          setBulkErrors(["الملف لا يحتوي على بيانات كافية. تأكد من استخدام النموذج المحدد."]);
          return;
        }

        // Row 0 = Arabic headers, Row 1 = keys, Row 2+ = data
        const keyRow: string[] = (raw[1] as string[]).map((k) => String(k).trim());
        const dataRows = raw.slice(2).filter((row) => row.some((v) => v !== ""));

        const errs: string[] = [];
        const groups = new Map<string, ImportFormula>();
        dataRows.forEach((row, idx) => {
          const obj: Record<string, string> = {};
          keyRow.forEach((k, ci) => { obj[k] = String(row[ci] ?? "").trim(); });
          const rowNo = idx + 3;
          const compNo = formatBOMCode(obj.compositionNo || "");
          if (!compNo) { errs.push(`الصف ${rowNo}: رقم التركيبة مفقود`); return; }
          if (!obj.materialCode) errs.push(`الصف ${rowNo}: كود المادة مفقود`);
          if (!obj.percentage) errs.push(`الصف ${rowNo}: النسبة/الكمية مفقودة`);

          const found = rawMaterialsList.find((m) => m.code === obj.materialCode);
          const matLine = {
            materialCode: obj.materialCode,
            materialName: found ? found.name : obj.materialName || "",
            percentage: obj.percentage,
            unit: obj.unit || "%",
          };

          if (!groups.has(compNo)) {
            const prodCode = obj.productCode ? formatProductCode(obj.productCode) : "";
            const prod = finalProducts.find((p) => p.code === prodCode);
            groups.set(compNo, {
              compositionNo: compNo,
              productCode: prodCode,
              productName: prod ? prod.name : obj.productName || "",
              version: obj.version || "1.0",
              materials: [matLine],
            });
          } else {
            groups.get(compNo)!.materials.push(matLine);
          }
        });

        setBulkErrors(errs);
        setImportFormulas(Array.from(groups.values()));
      } catch {
        setBulkErrors(["فشل في قراءة الملف. تأكد أنه ملف Excel صالح (.xlsx)"]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Link a parsed formula to a product (the required step after upload).
  const setImportProduct = (idx: number, code: string) => {
    const formatted = formatProductCode(code);
    const prod = finalProducts.find((p) => p.code === formatted);
    setImportFormulas((prev) => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], productCode: formatted, productName: prod ? prod.name : arr[idx].productName };
      return arr;
    });
  };

  const importStatus =
    user && user.level <= 2 ? "approved" : user?.level === 3 ? "pending_approval" : "pending_review";

  const handleBulkImport = async () => {
    if (importFormulas.length === 0) return;
    // Require every formula to be linked to a product before importing.
    const unlinked = importFormulas.filter((f) => !f.productCode);
    if (unlinked.length > 0) {
      setBulkErrors([
        `يجب ربط كل تركيبة بمنتج قبل الاستيراد. تركيبات بدون منتج: ${unlinked.map((u) => u.compositionNo).join("، ")}`,
      ]);
      return;
    }
    setBulkImporting(true);
    setBulkResult(null);
    let inserted = 0;
    const errors: string[] = [];
    for (const f of importFormulas) {
      const payload = {
        recordId: f.compositionNo,
        formId: "F-INV-BOM",
        department: "INV",
        creatorId: user?.id,
        status: importStatus,
        data: {
          compositionNo: f.compositionNo,
          productCode: f.productCode,
          productName: f.productName,
          version: f.version,
          notes: "",
          materials: f.materials,
          preparedBy: user?.name || "",
        },
      };
      try {
        const res = await fetch("/api/forms", {
          method: "POST",
          headers: getJsonHeaders(),
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          inserted++;
        } else {
          const err = await res.json().catch(() => ({ error: "خطأ" }));
          errors.push(`${f.compositionNo}: ${err.error || "فشل الحفظ"}`);
        }
      } catch {
        errors.push(`${f.compositionNo}: خطأ في الاتصال`);
      }
    }
    setBulkResult({ inserted, errors });
    setImportFormulas([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    loadPreviousCompositions();
    setBulkImporting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/inv")}
            className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-2 rounded-lg"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Beaker className="w-6 h-6 text-emerald-600" />
            <div>
              <h1 className="text-lg font-bold text-slate-900 m-0">
                تسجيل تركيبة منتج (BOM)
              </h1>
              <p className="text-[13px] font-semibold text-slate-500">
                القسم: المخزون (INV)
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-left">
          <span className="text-[12px] font-bold text-slate-500">رقم التركيبة:</span>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <span className="bg-emerald-50 text-emerald-700 font-bold text-[12px] px-2 py-1 border-l border-slate-200">AH-</span>
            <input
              type="text"
              maxLength={4}
              value={formData.compositionNo.replace(/^AH-/i, "")}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                setFormData({ ...formData, compositionNo: `AH-${digits}` });
              }}
              className="w-14 text-center font-mono font-bold text-[13px] text-slate-800 border-0 focus:ring-0 py-1 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Tabs: manual entry vs Excel import */}
      <div className="flex gap-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("single")}
          className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${activeTab === "single" ? "border-emerald-600 text-emerald-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <Pencil className="w-4 h-4 inline ml-1" />
          إدخال يدوي
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("bulk")}
          className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${activeTab === "bulk" ? "border-emerald-600 text-emerald-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <FileSpreadsheet className="w-4 h-4 inline ml-1" />
          استيراد من Excel
        </button>
      </div>

      {activeTab === "single" && (
      <form
        onSubmit={(e) => handleSubmit(e, "approved")}
        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
      >
        <div className="p-8">
          <h2 className="text-lg font-bold text-slate-800 mb-6 pb-2 border-b border-slate-100">
            بيانات المنتج النهائي
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                اسم المنتج <span className="text-red-500">*</span>
              </label>
              <SearchField
                label=""
                required
                value={formData.productCode}
                onChange={(v) => {
                  const formatted = formatProductCode(v);
                  const found = finalProducts.find((p: any) => p.code === formatted);
                  setFormData({ ...formData, productCode: formatted, productName: found ? found.name : "" });
                }}
                onF3={() => setShowProductModal(true)}
                placeholder="FD-0001 أو اضغط F3…"
                hint="F3 للبحث في المنتجات النهائية (FD-XXXX)"
              />
              {formData.productName && (
                <p className="text-xs text-emerald-600 mt-1 font-semibold">{formData.productName}</p>
              )}
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                رقم الإصدار للتركيبة
              </label>
              <input
                type="text"
                required
                value={formData.version}
                onChange={(e) =>
                  setFormData({ ...formData, version: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                ملاحظات والتفاصيل
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="تفاصيل حول التركيبة أو الاستخدام..."
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4 mt-8">
            <h2 className="text-lg font-bold text-slate-800">
              تفاصيل التركيبة (المواد الخام)
            </h2>
            <button
              type="button"
              onClick={addMaterial}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 font-bold rounded-lg text-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              إضافة مادة للتركيبة
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                <tr>
                  <th className="p-3 font-semibold w-[35%]">
                    المادة الخام (او التعبئة والتغليف){" "}
                    <span className="text-red-500">*</span>
                  </th>
                  <th className="p-3 font-semibold">الاسم والوصف</th>
                  <th className="p-3 font-semibold w-24">
                    النسبة/الكمية <span className="text-red-500">*</span>
                  </th>
                  <th className="p-3 font-semibold w-24">الوحدة</th>
                  <th className="p-3 font-semibold w-12 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formData.materials.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-6 text-center text-slate-400 text-sm"
                    >
                      يرجى إضافة المواد الخام المكونة للتركيبة من الزر أعلاه
                    </td>
                  </tr>
                ) : (
                  formData.materials.map((material, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-100">
                        <div className="flex gap-1">
                          <input
                            required
                            type="text"
                            placeholder="الكود…"
                            value={material.materialCode}
                            onChange={(e) => {
                              const code = e.target.value;
                              const found = rawMaterialsList.find((m) => m.code === code);
                              const newMaterials = [...formData.materials];
                              newMaterials[i] = {
                                ...newMaterials[i],
                                materialCode: code,
                                materialName: found ? found.name : material.materialName,
                                unit: found && found.unit ? found.unit : material.unit,
                              };
                              setFormData((prev) => ({ ...prev, materials: newMaterials }));
                            }}
                            className="w-full bg-transparent border border-slate-200 focus:ring-1 focus:ring-emerald-500 rounded-lg text-sm py-1.5 px-2"
                          />
                          <button
                            type="button"
                            title="F3 — بحث عن مادة"
                            onClick={() => { setEditingMatIdx(i); setShowMaterialModal(true); }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[11px] font-bold text-slate-500 flex-shrink-0"
                          >F3</button>
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-100">
                        <input
                          type="text"
                          readOnly
                          disabled
                          placeholder="يتم السحب تلقائياً..."
                          value={material.materialName}
                          onChange={(e) =>
                            updateMaterial(i, "materialName", e.target.value)
                          }
                          className="w-full bg-transparent border-0 text-sm py-1 text-slate-500"
                        />
                      </td>
                      <td className="p-2 border-r border-slate-100">
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.001"
                          value={material.percentage}
                          onChange={(e) =>
                            updateMaterial(i, "percentage", e.target.value)
                          }
                          className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-emerald-500 rounded-lg text-sm py-1.5 px-2"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-2 border-r border-slate-100">
                        <select
                          value={material.unit}
                          onChange={(e) =>
                            updateMaterial(i, "unit", e.target.value)
                          }
                          className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-emerald-500 rounded-lg text-sm py-1.5 px-2 text-slate-600"
                        >
                          <option value="%">%</option>
                          <option value="كجم">كجم</option>
                          <option value="جرام">جرام</option>
                          <option value="لتر">لتر</option>
                          <option value="مل">مل</option>
                          <option value="قطعة">قطعة</option>
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeMaterial(i)}
                          className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors inline-block"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {formData.materials.length > 0 &&
                formData.materials.every((m) => m.unit === "%") && (
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr>
                      <td
                        colSpan={2}
                        className="p-3 text-left font-bold text-slate-700"
                      >
                        إجمالي النسبة:
                      </td>
                      <td
                        className={`p-3 font-bold ${totalPercentage > 100 ? "text-red-600" : totalPercentage === 100 ? "text-emerald-600" : "text-amber-600"}`}
                      >
                        {totalPercentage.toFixed(2)}%
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
            </table>
          </div>
        </div>

        {/* Form Footer */}
                <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-200">
          <button
            type="button"
            
            onClick={(e) => handleSubmit(e, "draft")}
            className="flex items-center px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[14px]"
          >
            حفظ كمسودة
          </button>
          
          {user?.level <= 2 ? (
            <button
              type="button"
              
              onClick={(e) => handleSubmit(e, "approved")}
              className="flex items-center px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold text-[14px]"
            >
              حفظ واعتماد
            </button>
          ) : (
            <button
              type="button"
              
              onClick={(e) =>
                handleSubmit(
                  e,
                  user?.level === 3 ? "pending_approval" : "pending_review"
                )
              }
              className="flex items-center px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold text-[14px]"
            >
              إرسال للمراجعة
            </button>
          )}

          <div className="flex-1"></div>
          <button
            type="button"
            
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/");
              }
            }}
            className="text-slate-500 hover:text-slate-700 font-semibold text-[14px]"
          >
            إغلاق والعودة
          </button>
        </div>
      </form>
      )}

      {activeTab === "bulk" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Step 1: template */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">1</span>
                <h3 className="font-bold text-slate-800">تحميل نموذج Excel</h3>
              </div>
              <p className="text-sm text-slate-500 mb-3 mr-8">
                حمّل النموذج الجاهز، اجمع مواد كل تركيبة بنفس «رقم التركيبة»، ثم ارفع الملف في الخطوة التالية.
              </p>
              <button
                type="button"
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-sm mr-8"
              >
                <Download className="w-4 h-4" />
                تحميل نموذج Excel الجاهز
              </button>
            </div>

            {/* Step 2: upload */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">2</span>
                <h3 className="font-bold text-slate-800">رفع الملف بعد تعبئته</h3>
              </div>
              <p className="text-sm text-slate-500 mb-3 mr-8">يجب استخدام النموذج المحمّل في الخطوة السابقة فقط.</p>
              <label className="mr-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-6 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <div className="text-sm font-semibold text-slate-600">اضغط لاختيار ملف Excel</div>
                <div className="text-xs text-slate-400 mt-0.5">xlsx. فقط</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Errors */}
            {bulkErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mr-8">
                <div className="flex items-center gap-2 text-red-700 font-bold text-sm mb-2">
                  <AlertCircle className="w-4 h-4" />
                  يوجد ملاحظات على الملف ({bulkErrors.length})
                </div>
                <ul className="list-disc pr-5 space-y-0.5 text-[13px] text-red-600 max-h-40 overflow-y-auto">
                  {bulkErrors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}

            {/* Result */}
            {bulkResult && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mr-8">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  تم استيراد {bulkResult.inserted} تركيبة بنجاح.
                </div>
                {bulkResult.errors.length > 0 && (
                  <ul className="list-disc pr-5 mt-2 space-y-0.5 text-[13px] text-red-600">
                    {bulkResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                )}
              </div>
            )}

            {/* Step 3: link each formula to a product + preview */}
            {importFormulas.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">3</span>
                  <h3 className="font-bold text-slate-800">ربط كل تركيبة بمنتج نهائي</h3>
                </div>
                <p className="text-sm text-slate-500 mb-3 mr-8">
                  راجع التركيبات المكتشفة، وتأكد من ربط كل تركيبة بمنتجها النهائي (FD) قبل الاستيراد.
                </p>
                <div className="space-y-3 mr-8">
                  {importFormulas.map((f, idx) => (
                    <div
                      key={f.compositionNo}
                      className={`border rounded-xl p-4 ${f.productCode ? "border-slate-200" : "border-amber-300 bg-amber-50/40"}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Beaker className="w-4 h-4 text-emerald-600" />
                          <span className="font-mono font-bold text-slate-700 text-sm">{f.compositionNo}</span>
                          <span className="text-[12px] text-slate-500">({f.materials.length} مادة، إصدار {f.version})</span>
                        </div>
                        <div className="w-full md:w-80">
                          <SearchField
                            label=""
                            required
                            value={f.productCode}
                            onChange={(v) => setImportProduct(idx, v)}
                            onF3={() => setImportProductIdx(idx)}
                            placeholder="FD-0001 أو اضغط F3…"
                            hint=""
                          />
                          {f.productName ? (
                            <p className="text-xs text-emerald-600 mt-1 font-semibold">{f.productName}</p>
                          ) : (
                            <p className="text-xs text-amber-600 mt-1 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> لم يتم ربط هذه التركيبة بمنتج بعد
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {f.materials.map((m, mi) => (
                          <span key={mi} className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[12px] rounded-full px-2 py-0.5">
                            <span className="font-mono">{m.materialCode}</span>
                            {m.materialName && <span className="text-slate-400">— {m.materialName}</span>}
                            <span className="font-bold text-slate-700">{m.percentage}{m.unit}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 mt-5 mr-8">
                  <button
                    type="button"
                    disabled={bulkImporting || importFormulas.some((f) => !f.productCode)}
                    onClick={handleBulkImport}
                    className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {bulkImporting ? "جاري الاستيراد…" : `استيراد ${importFormulas.length} تركيبة`}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setImportFormulas([]); setBulkErrors([]); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 font-semibold text-sm"
                  >
                    <X className="w-4 h-4" /> إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Previously saved compositions */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800 m-0">
              التركيبات السابقة
            </h2>
            <span className="bg-slate-100 text-slate-600 text-[12px] font-bold px-2 py-0.5 rounded-full">
              {previousCompositions.length}
            </span>
          </div>
          <button
            type="button"
            onClick={loadPreviousCompositions}
            className="text-[13px] font-semibold text-emerald-600 hover:text-emerald-700"
          >
            تحديث
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
              <tr>
                <th className="p-3 font-semibold">رقم التركيبة</th>
                <th className="p-3 font-semibold">المنتج النهائي</th>
                <th className="p-3 font-semibold w-20 text-center">الإصدار</th>
                <th className="p-3 font-semibold w-24 text-center">عدد المواد</th>
                <th className="p-3 font-semibold w-32 text-center">الحالة</th>
                <th className="p-3 font-semibold w-28">التاريخ</th>
                <th className="p-3 font-semibold w-16 text-center">فتح</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {previousCompositions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-sm">
                    لا توجد تركيبات محفوظة بعد.
                  </td>
                </tr>
              ) : (
                previousCompositions.map((c) => (
                  <tr key={c.record_id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-700 text-sm">
                      {c.record_id}
                    </td>
                    <td className="p-3 text-sm text-slate-700">
                      {c.data?.productName || "—"}
                      {c.data?.productCode && (
                        <span className="text-slate-400 font-mono text-[12px] mr-1">
                          ({c.data.productCode})
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center text-sm text-slate-600">
                      {c.data?.version || "—"}
                    </td>
                    <td className="p-3 text-center text-sm text-slate-600">
                      {Array.isArray(c.data?.materials) ? c.data.materials.length : 0}
                    </td>
                    <td className="p-3 text-center">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="p-3 text-[12px] text-slate-500">
                      {c.created_at
                        ? new Date(c.created_at).toLocaleDateString("ar-EG")
                        : "—"}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        title="فتح للتعديل"
                        onClick={() => loadComposition(c.record_id)}
                        className="text-sky-500 hover:text-sky-700 p-1.5 rounded-lg hover:bg-sky-50 transition-colors inline-block"
                      >
                        <Pencil className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showProductModal && (
        <SearchModal
          title="بحث عن منتج نهائي (F3)"
          items={finalProducts}
          columns={[
            { key: "code", label: "كود المنتج", className: "font-mono w-28" },
            { key: "name", label: "اسم المنتج" },
            { key: "unit", label: "الوحدة", className: "w-20" },
          ]}
          searchKeys={["code", "name"]}
          placeholder="ابحث بالكود أو الاسم…"
          onSelect={(p) => {
            setFormData({ ...formData, productCode: p.code, productName: p.name });
            setShowProductModal(false);
          }}
          onClose={() => setShowProductModal(false)}
        />
      )}
      {importProductIdx !== null && (
        <SearchModal
          title="ربط التركيبة بمنتج نهائي (F3)"
          items={finalProducts}
          columns={[
            { key: "code", label: "كود المنتج", className: "font-mono w-28" },
            { key: "name", label: "اسم المنتج" },
            { key: "unit", label: "الوحدة", className: "w-20" },
          ]}
          searchKeys={["code", "name"]}
          placeholder="ابحث بالكود أو الاسم…"
          onSelect={(p) => { setImportProduct(importProductIdx!, p.code); setImportProductIdx(null); }}
          onClose={() => setImportProductIdx(null)}
        />
      )}
      {showMaterialModal && editingMatIdx !== null && (
        <SearchModal
          title="بحث عن مادة خام (F3)"
          items={rawMaterialsList}
          columns={[
            { key: "code", label: "كود المادة", className: "font-mono w-28" },
            { key: "name", label: "اسم المادة" },
            { key: "unit", label: "الوحدة", className: "w-20" },
          ]}
          searchKeys={["code", "name"]}
          placeholder="ابحث بالكود أو الاسم…"
          onSelect={(m) => {
            selectMaterialForRow(editingMatIdx!, m);
            setShowMaterialModal(false);
            setEditingMatIdx(null);
          }}
          onClose={() => { setShowMaterialModal(false); setEditingMatIdx(null); }}
        />
      )}
    </div>
  );
}
