import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { generateSerialNumber, formatMaterialCode, extractSupplierCode } from "../../lib/utils";
import { Save, CheckCircle, Package, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import * as XLSX from "xlsx";

export default function FormRM001() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    recordId: generateSerialNumber("RM", Math.floor(Math.random() * 10000)),
    code: "",
    name: "",
    category: "مادة خام",
    description: "",
    unit: "كجم",
    warehouse_id: "",
    balance: 0,
    barcode: "",
    scientificName: "",
    purchasePrice: "",
    expiryDate: "",
    supplierName: "",
    batchNumber: "",
    countryOfOrigin: "",
    coaFileUrl: "",
    msdsFileUrl: "",
    tdsFileUrl: "",
    allergyFileUrl: "",
  });

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [rmsForms, setRmsForms] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [editFormRecordId, setEditFormRecordId] = useState<string | null>(null);

  // Excel bulk import
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [bulkRows, setBulkRows] = useState<any[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ inserted: number; skipped: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/warehouses")
      .then((r) => r.json())
      .then((data) => {
        setWarehouses(Array.isArray(data) ? data : []);
      })
      .catch(console.error);

    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((data) => {
        setSuppliers(Array.isArray(data) ? data : []);
      })
      .catch(console.error);

    fetch("/api/forms")
      .then(r => r.json())
      .then(data => {
        setRmsForms(data.filter((f: any) => f.form_id === "F-INV-RM-001"));
      })
      .catch(console.error);

    fetch("/api/materials")
      .then(r => r.json())
      .then(data => {
        setMaterials(data.filter((m: any) => m.category === 'مادة خام' || m.category === 'Raw Material' || (m.code && m.code.startsWith('RM'))));
      })
      .catch(console.error);

    const editId = new URLSearchParams(window.location.search).get("edit");
    if (editId) {
      fetch(`/api/forms/record/${editId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.data) {
            setFormData(data.data);
          }
        })
        .catch(console.error);
    }
  }, []);

  const handleSelectMaterial = (material: any) => {
    const existingForm = rmsForms.find((f: any) => f.data?.code === material.code);
    if (existingForm) {
      setFormData(existingForm.data);
      setEditFormRecordId(existingForm.record_id);
      setIsEditingForm(true);
    } else {
      setFormData({
        ...formData,
        recordId: generateSerialNumber("RM", Math.floor(Math.random() * 10000)),
        code: material.code || "",
        name: material.name || "",
        category: material.category || "مادة خام",
        description: material.description || "",
        unit: material.unit || "كجم",
        warehouse_id: material.warehouse_id || "",
        balance: material.balance || 0,
      });
      setIsEditingForm(false);
      setEditFormRecordId(null);
    }
    setShowSearchModal(false);
  };

  // Auto-fill supplier from last 2 digits of material code (XXXX-YY)
  const handleCodeChange = (raw: string) => {
    const formatted = formatMaterialCode(raw, true);
    const supplierCode = extractSupplierCode(formatted);

    let newSupplierName = formData.supplierName;
    if (supplierCode && suppliers.length > 0) {
      // Match supplier whose code ends with the 2-digit suffix (e.g. "SUP-05" matches "05")
      const matched = suppliers.find(
        (s: any) =>
          s.code === supplierCode ||
          s.code?.endsWith(`-${supplierCode}`) ||
          s.code?.endsWith(supplierCode)
      );
      if (matched) newSupplierName = matched.name;
    }

    setFormData({ ...formData, code: formatted, supplierName: newSupplierName });
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [fieldName]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent, status: any) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      recordId: formData.recordId,
      formId: "F-INV-RM-001",
      department: "INV",
      creatorId: user?.id,
      status,
      data: formData,
    };

    try {
      const editId = editFormRecordId || new URLSearchParams(window.location.search).get("edit");
      const url = editId ? `/api/forms/record/${editId}` : "/api/forms";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        navigate("/inv");
      } else {
        const errData = await res.json().catch(() => ({ error: "حدث خطأ أثناء الحفظ" }));
        alert(errData.error || "حدث خطأ أثناء الحفظ");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ في الاتصال");
    }
    setLoading(false);
  };

  // ── Excel template download ──────────────────────────────────────────────
  const downloadTemplate = () => {
    const headers = [
      "كود المادة*", "اسم المادة بالعربي*", "اسم المادة بالإنجليزي*",
      "الفئة*", "الوحدة القياسية*", "كود المستودع*",
      "الرصيد الافتتاحي", "الحد الأدنى للمخزون",
      "الوصف", "الاسم العلمي", "بلد المنشأ", "اسم المورد",
      "سعر الشراء", "الباركود",
    ];
    const keys = [
      "code", "name", "name_en", "category", "unit", "warehouse_code",
      "balance", "min_balance",
      "description", "scientific_name", "country_of_origin", "supplier_name",
      "purchase_price", "barcode",
    ];
    const example = [
      "RM-001", "كحول إيثيلي 70%", "Ethanol 70%",
      "مادة خام", "لتر", "WH-RAW",
      "0", "50",
      "مادة سائلة قابلة للاشتعال", "Ethanol", "السعودية", "مورد رقم 1",
      "25.00", "",
    ];
    const notes = [
      "الفئات المتاحة: مادة خام | مادة تغليف | منتج نهائي",
      "الوحدات: كجم | جرام | لتر | مل | قطعة",
      "كود المستودع: WH-RAW (مواد خام) | WH-FIN (منتج نهائي)",
      "* الحقول الإلزامية", "", "", "", "", "", "", "", "", "", "",
    ];

    const wb = XLSX.utils.book_new();

    // Sheet 1: Template
    const ws = XLSX.utils.aoa_to_sheet([headers, keys, example]);
    ws["!cols"] = headers.map(() => ({ wch: 22 }));

    // Style header row (limited support in xlsx community edition)
    XLSX.utils.book_append_sheet(wb, ws, "نموذج الاستيراد");

    // Sheet 2: Instructions
    const instructions = [
      ["تعليمات ملء النموذج"],
      [""],
      ["1. الحقول المطلوبة (*):", "كود المادة، اسم المادة بالعربي، اسم المادة بالإنجليزي، الفئة، الوحدة القياسية، كود المستودع"],
      ["2. الفئات المتاحة:", "مادة خام | مادة تغليف | منتج نهائي"],
      ["3. الوحدات المتاحة:", "كجم | جرام | لتر | مل | قطعة"],
      ["4. أكواد المستودعات:", "WH-RAW (مستودع المواد الخام) | WH-FIN (مستودع المنتج النهائي)"],
      ["5. تاريخ الإنتاج وانتهاء الصلاحية:", "لا تُدرج هنا — تُسجّل عند استلام الشراء (فاتورة الشراء PIN)"],
      ["6. رقم التشغيلة (Batch):", "لا تُدرج هنا — تُسجّل عند استلام الشراء (فاتورة الشراء PIN)"],
      [""],
      ["ملاحظة:", "إذا كان كود المادة موجوداً مسبقاً سيتم تخطي السطر (لن يُضاف مرتين)"],
    ];
    const wsInst = XLSX.utils.aoa_to_sheet(instructions);
    wsInst["!cols"] = [{ wch: 35 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(wb, wsInst, "التعليمات");

    XLSX.writeFile(wb, "نموذج_استيراد_المواد_الخام.xlsx");
  };

  // ── Parse uploaded Excel ──────────────────────────────────────────────────
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkErrors([]);
    setBulkResult(null);

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
        const parsed = dataRows.map((row, idx) => {
          const obj: Record<string, string> = {};
          keyRow.forEach((k, ci) => { obj[k] = String(row[ci] ?? "").trim(); });
          if (!obj.code) errs.push(`الصف ${idx + 3}: كود المادة مفقود`);
          if (!obj.name) errs.push(`الصف ${idx + 3}: اسم المادة بالعربي مفقود`);
          if (!obj.name_en) errs.push(`الصف ${idx + 3}: اسم المادة بالإنجليزي مفقود`);
          if (!obj.unit) errs.push(`الصف ${idx + 3}: الوحدة القياسية مفقودة`);
          if (!obj.warehouse_code) errs.push(`الصف ${idx + 3}: كود المستودع مفقود`);
          return obj;
        });

        // Auto-fill supplier_name from code suffix if not provided
        const enriched = parsed.map((obj) => {
          if (!obj.supplier_name && obj.code) {
            const supCode = extractSupplierCode(obj.code);
            if (supCode) {
              const matched = suppliers.find(
                (s: any) =>
                  s.code === supCode ||
                  s.code?.endsWith(`-${supCode}`) ||
                  s.code?.endsWith(supCode)
              );
              if (matched) obj.supplier_name = matched.name;
            }
          }
          return obj;
        });

        setBulkErrors(errs);
        setBulkRows(enriched);
      } catch {
        setBulkErrors(["فشل في قراءة الملف. تأكد أنه ملف Excel صالح (.xlsx)"]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ── Submit bulk import ────────────────────────────────────────────────────
  const handleBulkImport = async () => {
    if (bulkRows.length === 0) return;
    setBulkImporting(true);
    try {
      const res = await fetch("/api/materials/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ rows: bulkRows }),
      });
      const data = await res.json();
      if (res.ok) {
        setBulkResult(data);
        setBulkRows([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setBulkErrors([data.error || "فشل الاستيراد"]);
      }
    } catch {
      setBulkErrors(["خطأ في الاتصال بالخادم"]);
    }
    setBulkImporting(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-stone-50 border-b border-stone-100 p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              الشركة الحديثة للتجميل
            </h1>
            <h2 className="text-xl font-bold text-slate-800 mb-1">
              إضافة أو تعديل مواد خام (RM)
            </h2>
            <p className="text-sm text-stone-600 font-medium">
              نموذج مخصص لإضافة أو تعديل المواد الخام وتوثيقها
            </p>
          </div>
          <div className="text-left">
            <p className="text-sm text-slate-500 mb-1">
              رقم الوثيقة: F-INV-RM-001
            </p>
            <p className="text-xs text-slate-400">الإصدار: 1.0</p>
          </div>
        </div>

        {/* Tab selector */}
        <div className="border-b border-slate-200 px-6 pt-2 flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("single")}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${activeTab === "single" ? "border-stone-700 text-stone-800 bg-white" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            <Package className="w-4 h-4 inline ml-1" />
            إضافة مادة واحدة
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bulk")}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${activeTab === "bulk" ? "border-stone-700 text-stone-800 bg-white" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            <FileSpreadsheet className="w-4 h-4 inline ml-1" />
            استيراد جماعي من Excel
          </button>
        </div>

        {/* ── BULK IMPORT TAB ── */}
        {activeTab === "bulk" && (
          <div className="p-8 space-y-6">
            {/* Step 1: Download template */}
            <div className="bg-stone-50 rounded-xl border border-stone-200 p-5">
              <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                <span className="w-6 h-6 bg-stone-700 text-white text-xs font-bold rounded-full flex items-center justify-center">1</span>
                تحميل نموذج Excel
              </h3>
              <p className="text-sm text-slate-500 mb-4 mr-8">
                حمّل النموذج الجاهز، أضف بيانات المواد، ثم ارفعه في الخطوة التالية.
                <br />
                <span className="text-amber-600 font-semibold">ملاحظة: رقم التشغيلة وتاريخ الانتهاء تُسجّل في فاتورة الشراء (PIN) عند الاستلام الفعلي.</span>
              </p>
              <button
                type="button"
                onClick={downloadTemplate}
                className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                تحميل نموذج Excel الجاهز
              </button>
            </div>

            {/* Step 2: Upload file */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                <span className="w-6 h-6 bg-stone-700 text-white text-xs font-bold rounded-full flex items-center justify-center">2</span>
                رفع ملف Excel المعبأ
              </h3>
              <p className="text-sm text-slate-500 mb-4 mr-8">يجب استخدام النموذج المحمّل في الخطوة السابقة فقط.</p>
              <label className="flex items-center gap-3 bg-white border-2 border-dashed border-slate-300 rounded-xl p-5 cursor-pointer hover:border-stone-400 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-slate-700 text-sm">انقر لاختيار ملف Excel</div>
                  <div className="text-xs text-slate-400 mt-0.5">xlsx. فقط</div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleExcelUpload}
                />
              </label>
            </div>

            {/* Errors */}
            {bulkErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 font-bold text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" /> أخطاء في الملف
                </div>
                <ul className="space-y-1">
                  {bulkErrors.map((e, i) => (
                    <li key={i} className="text-xs text-red-600">{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Result */}
            {bulkResult && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-2 font-bold text-emerald-700 text-sm mb-1">
                  <CheckCircle2 className="w-4 h-4" /> تم الاستيراد بنجاح
                </div>
                <p className="text-sm text-emerald-700">
                  تمت إضافة <strong>{bulkResult.inserted}</strong> مادة ·
                  تم تخطي <strong>{bulkResult.skipped}</strong> (موجودة مسبقاً)
                </p>
                {bulkResult.errors.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {bulkResult.errors.map((e, i) => <li key={i} className="text-xs text-amber-600">{e}</li>)}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => navigate("/inv")}
                  className="mt-3 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700"
                >
                  العودة للمخزون
                </button>
              </div>
            )}

            {/* Step 3: Preview & import */}
            {bulkRows.length > 0 && bulkErrors.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
                  <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 bg-stone-700 text-white text-xs font-bold rounded-full flex items-center justify-center">3</span>
                    معاينة البيانات ({bulkRows.length} صف)
                  </span>
                  <button
                    type="button"
                    onClick={() => { setBulkRows([]); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold">
                      <tr>
                        <th className="px-3 py-2 border-b">#</th>
                        <th className="px-3 py-2 border-b">كود المادة</th>
                        <th className="px-3 py-2 border-b">الاسم بالعربي</th>
                        <th className="px-3 py-2 border-b">الاسم بالإنجليزي</th>
                        <th className="px-3 py-2 border-b">الفئة</th>
                        <th className="px-3 py-2 border-b">الوحدة</th>
                        <th className="px-3 py-2 border-b">المستودع</th>
                        <th className="px-3 py-2 border-b">المورد</th>
                        <th className="px-3 py-2 border-b">الرصيد</th>
                        <th className="px-3 py-2 border-b">الحد الأدنى</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bulkRows.map((row, i) => (
                        <tr key={i} className={!row.code || !row.name || !row.name_en ? "bg-red-50" : "hover:bg-slate-50"}>
                          <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                          <td className="px-3 py-2 font-mono font-bold text-indigo-700">{row.code || <span className="text-red-500">مفقود</span>}</td>
                          <td className="px-3 py-2 font-medium">{row.name || <span className="text-red-500">مفقود</span>}</td>
                          <td className="px-3 py-2 text-slate-600">{row.name_en || <span className="text-red-500">مفقود</span>}</td>
                          <td className="px-3 py-2">{row.category}</td>
                          <td className="px-3 py-2">{row.unit}</td>
                          <td className="px-3 py-2 font-mono">{row.warehouse_code}</td>
                          <td className="px-3 py-2">
                            {row.supplier_name
                              ? <span className="text-emerald-700 font-semibold">{row.supplier_name}</span>
                              : <span className="text-slate-400 text-[11px]">—</span>}
                          </td>
                          <td className="px-3 py-2">{row.balance || "0"}</td>
                          <td className="px-3 py-2">{row.min_balance || "0"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                  <button
                    type="button"
                    onClick={handleBulkImport}
                    disabled={bulkImporting}
                    className="flex items-center gap-2 bg-stone-800 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-stone-900 transition-colors text-sm disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    {bulkImporting ? "جاري الاستيراد..." : `استيراد ${bulkRows.length} مادة`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SINGLE ENTRY TAB ── */}
        {activeTab === "single" && (
        <form className="p-8">
          {/* Section 1: Basic Material Info */}
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center">
            <Package className="w-5 h-5 ml-2 text-stone-500" /> المعلومات
            الأساسية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                كود المادة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: 001-0001 (F3 للبحث)"
                value={formData.code}
                onKeyDown={(e) => {
                  if (e.key === "F3") {
                    e.preventDefault();
                    setShowSearchModal(true);
                  }
                }}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 font-mono text-sm py-2"
              />
              {formData.code && extractSupplierCode(formData.code) && (
                <p className="text-[11px] mt-1 text-slate-400">
                  رقم المورد:{" "}
                  <span className="font-bold text-stone-600">{extractSupplierCode(formData.code)}</span>
                  {formData.supplierName && (
                    <> · تم التعرّف: <span className="text-emerald-600 font-bold">{formData.supplierName}</span></>
                  )}
                </p>
              )}
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                اسم الصنف / الاسم التجاري{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 text-sm py-2"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                الاسم العلمي للمادة
              </label>
              <input
                type="text"
                value={formData.scientificName}
                onChange={(e) =>
                  setFormData({ ...formData, scientificName: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 text-sm py-2"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                رقم الباركود
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) =>
                  setFormData({ ...formData, barcode: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 font-mono text-sm py-2"
              />
            </div>
          </div>

          {/* Section 2: Supply & Storing */}
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center">
            التوريد والتخزين
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                اسم المورد <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="suppliers-list-rm"
                required
                placeholder="ابحث بكود أو اسم المورد..."
                value={formData.supplierName}
                onChange={(e) =>
                  setFormData({ ...formData, supplierName: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 text-sm py-2"
              />
              <datalist id="suppliers-list-rm">
                {suppliers.map((s, i) => (
                  <option key={i} value={s.name}>
                    {s.code}
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                بلد المنشأ
              </label>
              <input
                type="text"
                value={formData.countryOfOrigin}
                onChange={(e) =>
                  setFormData({ ...formData, countryOfOrigin: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 text-sm py-2"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                رقم التشغيلة (Batch Number){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.batchNumber}
                onChange={(e) =>
                  setFormData({ ...formData, batchNumber: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 text-sm py-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                تاريخ الانتهاء <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData({ ...formData, expiryDate: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 text-sm py-2"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                الوحدة القياسية <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 text-sm py-2"
              >
                <option>كجم</option>
                <option>جرام</option>
                <option>لتر</option>
                <option>مل</option>
                <option>قطعة</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                موقع التخزين المفضل <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.warehouse_id}
                onChange={(e) =>
                  setFormData({ ...formData, warehouse_id: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 text-sm py-2"
              >
                <option value="">-- اختر موقع التخزين --</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                سعر الشراء المتوقع
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) =>
                  setFormData({ ...formData, purchasePrice: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 text-sm py-2"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                الرصيد الافتتاحي (في حال الجرد)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.balance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    balance: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 text-sm py-2"
              />
            </div>
          </div>

          {/* Section 3: Technical Documents */}
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center">
            الشهادات والوثائق الفنية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                شهادة التحليل (COA)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, "coaFileUrl")}
                  className="w-full border border-slate-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 text-sm"
                />
                {formData.coaFileUrl && (
                  <span className="absolute left-2 top-3 text-emerald-500 text-xs font-bold">
                    تم الرفق ✓
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                صحيفة بيانات السلامة (MSDS)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, "msdsFileUrl")}
                  className="w-full border border-slate-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 text-sm"
                />
                {formData.msdsFileUrl && (
                  <span className="absolute left-2 top-3 text-emerald-500 text-xs font-bold">
                    تم الرفق ✓
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                المواصفات الفنية (TDS)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, "tdsFileUrl")}
                  className="w-full border border-slate-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 text-sm"
                />
                {formData.tdsFileUrl && (
                  <span className="absolute left-2 top-3 text-emerald-500 text-xs font-bold">
                    تم الرفق ✓
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                شهادة الحساسية (Allergen Info)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, "allergyFileUrl")}
                  className="w-full border border-slate-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 text-sm"
                />
                {formData.allergyFileUrl && (
                  <span className="absolute left-2 top-3 text-emerald-500 text-xs font-bold">
                    تم الرفق ✓
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              ملاحظات إضافية
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-stone-400 text-sm p-3"
            ></textarea>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-4">
            {isEditingForm && (
              <button
                type="button"
                onClick={() => {
                  setIsEditingForm(false);
                  setEditFormRecordId(null);
                  setFormData({
                    recordId: generateSerialNumber("RM", Math.floor(Math.random() * 10000)),
                    code: "",
                    name: "",
                    category: "مادة خام",
                    description: "",
                    unit: "كجم",
                    warehouse_id: "",
                    balance: 0,
                    barcode: "",
                    scientificName: "",
                    purchasePrice: "",
                    expiryDate: "",
                    supplierName: "",
                    batchNumber: "",
                    countryOfOrigin: "",
                    coaFileUrl: "",
                    msdsFileUrl: "",
                    tdsFileUrl: "",
                    allergyFileUrl: "",
                  });
                }}
                className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 px-6 rounded-xl border border-slate-200 hover:bg-slate-200 transition-colors flex items-center justify-center min-w-[200px]"
              >
                إلغاء التعديل
              </button>
            )}
            <button
              type="button"
              onClick={(e) => handleSubmit(e, "draft")}
              disabled={loading}
              className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 px-6 rounded-xl border border-slate-300 hover:bg-slate-200 transition-colors flex items-center justify-center min-w-[200px]"
            >
              <Save className="w-5 h-5 ml-2 text-slate-500" />
              حفظ كمسودة
            </button>
            {user?.level <= 2 ? (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, "approved")}
                disabled={loading}
                className="flex-1 bg-stone-800 text-white font-bold py-3 px-6 rounded-xl hover:bg-stone-900 transition-colors flex items-center justify-center"
              >
                {user?.level <= 2 ? (
                  <>
                    <CheckCircle className="w-5 h-5 ml-2" />
                    اعتماد وتسجيل المادة الخام
                  </>
                ) : (
                  "إرسال للمراجعة / الاعتماد"
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) =>
                  handleSubmit(
                    e,
                    user?.level === 3 ? "pending_approval" : "pending_review",
                  )
                }
                disabled={loading}
                className="flex-1 bg-sky-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-sky-700 transition-colors flex items-center justify-center"
              >
                {user?.level <= 2
                  ? "إرسال للمراجعة / الاعتماد"
                  : "إرسال للمراجعة / الاعتماد"}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) navigate(-1);
                else navigate("/inv");
              }}
              className="flex-1 bg-white text-slate-700 font-bold py-3 px-6 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center"
            >
              إغلاق والعودة
            </button>
          </div>
        </form>
        )} {/* end single tab */}
      </div>

      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[80vh] overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">بحث عن مواد خام مضافة سابقاً (F3)</h2>
              <button 
                type="button" 
                onClick={() => setShowSearchModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="p-5 border-b border-slate-100">
              <input
                type="text"
                placeholder="ابحث بالاسم أو الكود..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border-slate-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-stone-400 focus:border-stone-400 shadow-sm"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto p-0">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="p-3 border-b text-slate-600 font-semibold">رقم الوثيقة</th>
                    <th className="p-3 border-b text-slate-600 font-semibold">كود المادة</th>
                    <th className="p-3 border-b text-slate-600 font-semibold">الاسم</th>
                    <th className="p-3 border-b text-slate-600 font-semibold w-24">تحديد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.from(new Map([...materials.filter((m: any) => 
          m.category === "مادة خام" || m.category === "Raw Material" || m.code?.startsWith("RM")
        ).map((m: any) => [m.code, { ...m, isDraft: false }]), ...rmsForms.filter(f => f.data?.code).map(f => [f.data.code, { ...f.data, isDraft: true, record_id: f.record_id }])].filter(x => x[0])).values())
                    .filter(
                      (m: any) => 
                        (m.name || "").includes(searchTerm) || 
                        (m.code || "").includes(searchTerm)
                    )
                    .map((m: any) => (
                    <tr key={m.code} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-slate-500 text-xs">
                        {m.record_id || rmsForms.find(f => f.data?.code === m.code)?.record_id || "لا يوجد مسودة"}
                      </td>
                      <td className="p-3">{m.code}</td>
                      <td className="p-3 font-medium text-slate-800">{m.name}</td>
                      <td className="p-3">
                        <button 
                          type="button" 
                          onClick={() => handleSelectMaterial(m)} 
                          className="text-stone-600 font-bold px-3 py-1.5 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors w-full"
                        >
                          تحديد
                        </button>
                      </td>
                    </tr>
                  ))}
                  {Array.from(new Map([...materials.filter((m: any) => 
          m.category === "مادة خام" || m.category === "Raw Material" || m.code?.startsWith("RM")
        ).map((m: any) => [m.code, m]), ...rmsForms.filter(f => f.data?.code).map(f => [f.data.code, f.data])].filter(x => x[0])).values()).filter(
                      (m: any) => 
                        (m.name || "").includes(searchTerm) || 
                        (m.code || "").includes(searchTerm)
                    ).length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500">
                          لم يتم العثور على أي مواد مطابقة
                        </td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
