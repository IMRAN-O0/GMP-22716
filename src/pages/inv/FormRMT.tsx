import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateSerialNumber, formatMaterialCode, getAuthHeaders, getJsonHeaders } from "../../lib/utils";
import { SearchModal, SearchField } from "../../components/SearchModal";

export default function FormRMT() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [materials, setMaterials] = useState<any[]>([]);
  const [issueRequests, setIssueRequests] = useState<any[]>([]);
  const [pinForms, setPinForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sysDate] = useState(new Date().toLocaleDateString("ar-EG"));
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    transactionId: generateSerialNumber(
      "TRN",
      Math.floor(Math.random() * 10000),
    ),
    transactionType: "Receive",
    items: [{ materialCode: "", materialName: "", quantity: "" }] as any[],
    referenceDocument: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/materials", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => setMaterials(data))
      .catch(console.error);

    fetch("/api/forms", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        setIssueRequests(
          rows.filter(
            (f: any) =>
              (f.form_id === "F-PRD-001" || f.form_id === "F-LAB-007") &&
              f.status === "approved",
          ),
        );
        setPinForms(
          rows.filter((f: any) => f.form_id === "F-INV-PIN-001" && f.status === "approved"),
        );
      })
      .catch(console.error);
  }, []);

  const selectMaterialForRow = (idx: number, m: any) => {
    const newItems = [...formData.items];
    newItems[idx] = { ...newItems[idx], materialCode: m.code, materialName: m.name };
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { materialCode: "", materialName: "", quantity: "" },
      ],
    });
  };

  const removeItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];

    let actualValue = value;
    if (field === "materialCode") {
      const codeMatch = value.match(/^([A-Za-z0-9-]+) - /);
      if (codeMatch) {
        actualValue = codeMatch[1];
      }
    }

    newItems[index] = { ...newItems[index], [field]: actualValue };

    // Auto-fill material name if code changes
    if (field === "materialCode") {
      const found = materials.find((m: any) => m.code === actualValue);
      if (found) {
        newItems[index].materialName = found.name;
      } else {
        newItems[index].materialName = "";
      }
    }

    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent, status: any) => {
    e.preventDefault();
    const payload = {
      recordId: formData.transactionId,
      formId: "F-INV-RMT-001",
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
      if (res.ok) {
        alert(`تم الحفظ بنجاح. رقم الحركة: ${formData.transactionId}`);
        navigate("/inv");
      } else {
        const errData = await res.json().catch(() => ({ error: "حدث خطأ أثناء الحفظ" }));
        alert(errData.error || "حدث خطأ أثناء الحفظ");
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  return (
    <div className="max-w-4xl mx-auto bg-white border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden">
      <div className="border-b border-slate-200 p-6 flex justify-between items-center bg-slate-50">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            الشركة الحديثة للتجميل
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            تتبع حركة المخزون واستلام وصرف المواد
          </p>
        </div>
        <div className="text-left">
          <h2 className="text-xl font-bold text-slate-800 mb-1">
            استلام وصرف المواد (RMT)
          </h2>
          <p className="text-sm font-mono text-slate-500">
            رقم الحركة: {formData.transactionId}
          </p>
        </div>
      </div>

      <form className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              نوع الحركة <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.transactionType}
              onChange={(e) => {
                const type = e.target.value;
                setFormData({
                  ...formData,
                  transactionType: type,
                  referenceDocument: "",
                  items: [{ materialCode: "", materialName: "", quantity: "" }],
                });
              }}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            >
              <option value="Receive">استلام (إضافة للرصيد)</option>
              <option value="Issue">صرف (سحب من الرصيد)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            {formData.transactionType === "Issue" ? (
              <>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                  المستند المرتبط (أمر إنتاج أو طلب صرف مختبر)
                </label>
                <select
                  value={formData.referenceDocument}
                  onChange={(e) => {
                    const val = e.target.value;

                    if (val) {
                      const selectedDoc = issueRequests.find(
                        (po) => po.record_id === val,
                      );
                      
                      let newItems: any[] = [];
                      if (selectedDoc) {
                        if (selectedDoc.form_id === "F-PRD-001" && selectedDoc.data?.rawMaterials?.length > 0) {
                          newItems = selectedDoc.data.rawMaterials.map(
                            (rm: any) => ({
                              materialCode: rm.materialCode || "",
                              materialName: rm.materialName || "",
                              quantity: rm.requiredQuantity || "",
                            }),
                          );
                        } else if (selectedDoc.form_id === "F-LAB-007" && selectedDoc.data?.items?.length > 0) {
                          newItems = selectedDoc.data.items.map(
                            (itm: any) => ({
                              materialCode: itm.materialCode || "",
                              materialName: itm.materialName || "",
                              quantity: itm.quantity || "",
                            }),
                          );
                        }
                      }

                      setFormData((prev) => ({
                        ...prev,
                        referenceDocument: val,
                        items:
                          newItems.length > 0
                            ? newItems
                            : [
                                {
                                  materialCode: "",
                                  materialName: "",
                                  quantity: "",
                                },
                              ],
                      }));
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        referenceDocument: val,
                      }));
                    }
                  }}
                  className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
                >
                  <option value="">-- اختر المستند المرتبط --</option>
                  {issueRequests.map((doc) => (
                    <option key={doc.id} value={doc.record_id}>
                      {doc.record_id} - {doc.form_id === "F-PRD-001" ? `أمر إنتاج (${doc.data?.productName || ""})` : "طلب صرف مختبر"}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                  ربط بفاتورة شراء (PIN) — اختياري
                </label>
                <select
                  value={formData.referenceDocument}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setFormData((prev: any) => ({ ...prev, referenceDocument: "" }));
                      return;
                    }
                    const pin = pinForms.find((f: any) => f.record_id === val);
                    if (pin) {
                      const pinData = pin.data || {};
                      const newItems = Array.isArray(pinData.items) && pinData.items.length > 0
                        ? pinData.items.map((itm: any) => ({
                            materialCode: itm.materialCode || "",
                            materialName: itm.materialName || "",
                            quantity: itm.quantity || itm.receivedQuantity || "",
                          }))
                        : [{ materialCode: "", materialName: "", quantity: "" }];
                      setFormData((prev: any) => ({ ...prev, referenceDocument: val, items: newItems }));
                    } else {
                      setFormData((prev: any) => ({ ...prev, referenceDocument: val }));
                    }
                  }}
                  className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
                >
                  <option value="">-- بدون ربط بفاتورة شراء --</option>
                  {pinForms.map((f: any) => {
                    const d = f.data || {};
                    return (
                      <option key={f.record_id} value={f.record_id}>
                        {f.record_id} — {d.supplierName || ""}
                      </option>
                    );
                  })}
                </select>
              </>
            )}
          </div>

          <div className="md:col-span-2 mt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[13px] font-semibold text-slate-600">
                جدول المواد <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center text-xs text-sky-600 font-bold hover:text-sky-700 bg-sky-50 px-2.5 py-1.5 rounded-lg border border-sky-100"
              >
                + إضافة مادة
              </button>
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-right border-collapse">
                <thead className="bg-slate-50 text-[12px] text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3 border-r border-slate-200 w-1/3">
                      كود المادة
                    </th>
                    <th className="p-3 border-r border-slate-200">
                      الاسم والوصف
                    </th>
                    <th className="p-3 border-r border-slate-200 w-32">
                      الكمية
                    </th>
                    <th className="p-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-100 bg-white last:border-0"
                    >
                      <td className="p-2 border-r border-slate-100">
                        <div className="flex gap-1">
                          <input
                            type="text"
                            required
                            placeholder="الكود…"
                            value={item.materialCode}
                            onChange={(e) => updateItem(i, "materialCode", formatMaterialCode(e.target.value))}
                            className="w-full bg-transparent border-slate-200 focus:ring-1 focus:ring-sky-400 rounded text-sm py-1.5 px-2"
                          />
                          <button
                            type="button"
                            title="F3 — بحث عن مادة"
                            onClick={() => { setEditingItemIdx(i); setShowMaterialModal(true); }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[11px] font-bold text-slate-500 flex-shrink-0"
                          >F3</button>
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-100">
                        <input
                          type="text"
                          readOnly
                          disabled
                          placeholder="يتم سحبه تلقائياً..."
                          value={item.materialName}
                          className="w-full bg-transparent border-0 text-slate-500 text-sm py-1.5"
                        />
                      </td>
                      <td className="p-2 border-r border-slate-100">
                        <input
                          type="number"
                          required
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(i, "quantity", e.target.value)
                          }
                          className="w-full bg-transparent border-0 focus:ring-1 focus:ring-sky-400 rounded text-sm py-1.5"
                        />
                      </td>
                      <td className="p-2 text-center">
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(i)}
                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              ملاحظات والتوجيه
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            ></textarea>
          </div>
        </div>

        <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl my-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold block text-slate-600 mb-1">
              تمت الحركة بواسطة:
            </span>
            <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-slate-700">
              {user?.name || "---"}
            </div>
          </div>
          <div>
            <span className="font-semibold block text-slate-600 mb-1">
              تاريخ ووقت الحركة:
            </span>
            <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-slate-700">
              {sysDate}
            </div>
          </div>
        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-200">
          <button
            type="button"
            disabled={loading}
            onClick={(e) => handleSubmit(e, "draft")}
            className="flex items-center px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[14px]"
          >
            حفظ كمسودة
          </button>
          
          {user?.level <= 2 ? (
            <button
              type="button"
              disabled={loading}
              onClick={(e) => handleSubmit(e, "approved")}
              className="flex items-center px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold text-[14px]"
            >
              حفظ واعتماد
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
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
            disabled={loading}
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
      {showMaterialModal && editingItemIdx !== null && (
        <SearchModal
          title="بحث عن مادة (F3)"
          items={materials}
          columns={[
            { key: "code", label: "كود المادة", className: "font-mono w-28" },
            { key: "name", label: "اسم المادة" },
            { key: "unit", label: "الوحدة", className: "w-20" },
            { key: "balance", label: "الرصيد", className: "w-20" },
          ]}
          searchKeys={["code", "name"]}
          placeholder="ابحث بالكود أو الاسم…"
          onSelect={(m) => {
            selectMaterialForRow(editingItemIdx!, m);
            setShowMaterialModal(false);
            setEditingItemIdx(null);
          }}
          onClose={() => { setShowMaterialModal(false); setEditingItemIdx(null); }}
        />
      )}
    </div>
  );
}
