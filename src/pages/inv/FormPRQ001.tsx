import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateSerialNumber, formatMaterialCode, getAuthHeaders, getJsonHeaders } from "../../lib/utils";
import { Save, CheckCircle, Plus, Trash2, Paperclip } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { SearchModal, SearchField } from "../../components/SearchModal";

export default function FormPRQ001() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    requestId: generateSerialNumber("PRQ", Math.floor(Math.random() * 10000)),
    requestDate: new Date().toISOString().split("T")[0],
    supplierName: "",
    warehouseId: "",
    expectedDeliveryDate: "",
    priority: "Normal",
    notes: "",
    attachmentUrl: "",
    items: [] as {
      materialCode: string;
      materialName: string;
      unit: string;
      quantity: string;
      expectedPrice: string;
    }[],
  });

  const [materials, setMaterials] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);

  useEffect(() => {
    const h = getAuthHeaders();

    fetch("/api/materials", { headers: h })
      .then((r) => r.json())
      .then((data) => { setMaterials(Array.isArray(data) ? data : []); })
      .catch(console.error);

    fetch("/api/warehouses", { headers: h })
      .then((r) => r.json())
      .then((data) => { setWarehouses(Array.isArray(data) ? data.filter((w: any) => w.id && w.name && w.name !== "0") : []); })
      .catch(console.error);

    fetch("/api/suppliers", { headers: h })
      .then((r) => r.json())
      .then((data) => { setSuppliers(Array.isArray(data) ? data : []); })
      .catch(console.error);

    const editId = new URLSearchParams(window.location.search).get("edit");
    if (editId) {
      fetch(`/api/forms/record/${editId}`, { headers: h })
        .then((res) => res.json())
        .then((data) => { if (data && data.data) setFormData(data.data); })
        .catch(console.error);
    }
  }, []);

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          materialCode: "",
          materialName: "",
          unit: "",
          quantity: "1",
          expectedPrice: "0",
        },
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

    if (field === "materialCode") {
      const found = materials.find((m: any) => m.code === actualValue);
      if (found) {
        newItems[index].materialName = found.name;
        newItems[index].unit = found.unit || "";
      } else {
        newItems[index].materialName = "";
        newItems[index].unit = "";
      }
    }

    setFormData({ ...formData, items: newItems });
  };

  const selectMaterialForRow = (idx: number, m: any) => {
    const newItems = [...formData.items];
    newItems[idx] = { ...newItems[idx], materialCode: m.code, materialName: m.name, unit: m.unit || "" };
    setFormData({ ...formData, items: newItems });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, attachmentUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent, status: any) => {
    e.preventDefault();
    setLoading(true);

    if (formData.items.length === 0) {
      alert("يجب إضافة مادة واحدة على الأقل في الطلب.");
      setLoading(false);
      return;
    }

    const payload = {
      recordId: formData.requestId,
      formId: "F-INV-PRQ-001",
      department: "INV",
      creatorId: user?.id,
      status,
      data: formData,
    };

    try {
      const editId = new URLSearchParams(window.location.search).get("edit");
      const url = editId ? `/api/forms/record/${editId}` : "/api/forms";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getJsonHeaders(),
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

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-indigo-50 border-b border-indigo-100 p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              الشركة الحديثة للتجميل
            </h1>
            <h2 className="text-xl font-bold text-slate-800 mb-1">
              طلب شراء مواد (PRQ)
            </h2>
            <p className="text-sm text-indigo-600 font-medium">
              نموذج لطلب شراء مواد خام وتعبئة وتغليف
            </p>
          </div>
          <div className="text-left">
            <p className="text-sm text-slate-500 mb-1">
              رقم الوثيقة: F-INV-PRQ-001
            </p>
            <p className="text-xs text-slate-400">الإصدار: 1.0</p>
          </div>
        </div>

        <form className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                تاريخ الطلب
              </label>
              <input
                type="date"
                required
                value={formData.requestDate}
                onChange={(e) =>
                  setFormData({ ...formData, requestDate: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-400 text-sm py-2"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                تاريخ التسليم المتوقع
              </label>
              <input
                type="date"
                required
                value={formData.expectedDeliveryDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expectedDeliveryDate: e.target.value,
                  })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-400 text-sm py-2"
              />
            </div>
            <div>
              <SearchField
                label="اسم المورد (الشركة)"
                required
                value={formData.supplierName}
                onChange={(v) => setFormData({ ...formData, supplierName: v })}
                onF3={() => setShowSupplierModal(true)}
                placeholder="اكتب أو اضغط F3 للبحث…"
                hint="F3 للبحث في قائمة الموردين"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                المستودع المستلم <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.warehouseId}
                onChange={(e) =>
                  setFormData({ ...formData, warehouseId: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-400 text-sm py-2"
              >
                <option value="">-- اختر المستودع --</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                الأولوية
              </label>
              <select
                required
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-400 text-sm py-2"
              >
                <option value="Low">منخفضة</option>
                <option value="Normal">عادية</option>
                <option value="High">عالية</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                عرض السعر (مرفق){" "}
                <span className="text-slate-400 text-xs">(اختياري)</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="w-full border border-slate-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 text-sm"
                />
                {formData.attachmentUrl && (
                  <span className="absolute left-2 top-3 text-emerald-500 text-xs font-bold">
                    تم الرفق ✓
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Items Data */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                قائمة المواد المطلوبة
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 ml-1" /> إضافة مادة
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-semibold">
                      كود المادة واسم المنتج{" "}
                      <span className="text-red-500">*</span>
                    </th>
                    <th className="p-3 font-semibold">الوصف</th>
                    <th className="p-3 font-semibold w-24">الوحدة</th>
                    <th className="p-3 font-semibold w-24">
                      الكمية <span className="text-red-500">*</span>
                    </th>
                    <th className="p-3 font-semibold w-32">السعر المتوقع</th>
                    <th className="p-3 font-semibold w-12 text-center">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-6 text-center text-slate-400 text-sm border-b border-slate-100 bg-white"
                      >
                        لا توجد مواد مضافة. انقر على "إضافة مادة"
                      </td>
                    </tr>
                  ) : (
                    formData.items.map((item, i) => (
                      <tr
                        key={i}
                        className="bg-white hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-2 border-r border-slate-100">
                          <div className="flex gap-1">
                            <input
                              type="text"
                              required
                              placeholder="الكود…"
                              value={item.materialCode}
                              onChange={(e) => {
                                const code = formatMaterialCode(e.target.value);
                                const mat = materials.find((m) => m.code === code);
                                updateItem(i, "materialCode", code);
                                if (mat) {
                                  updateItem(i, "materialName", mat.name);
                                  updateItem(i, "unit", mat.unit || "");
                                }
                              }}
                              className="w-full bg-transparent border-slate-200 focus:ring-1 focus:ring-indigo-400 rounded text-sm py-1.5 px-2"
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
                            className="w-full bg-slate-50 border-0 rounded text-sm py-1.5 px-2 text-slate-500"
                          />
                        </td>
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="text"
                            readOnly
                            disabled
                            placeholder="..."
                            value={item.unit || ""}
                            className="w-full bg-slate-50 border-0 rounded text-sm py-1.5 px-2 text-slate-500 text-center"
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
                            className="w-full bg-transparent border-slate-200 focus:ring-1 focus:ring-indigo-400 rounded text-sm py-1.5 px-2 text-center"
                          />
                        </td>
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.expectedPrice}
                            onChange={(e) =>
                              updateItem(i, "expectedPrice", e.target.value)
                            }
                            className="w-full bg-transparent border-slate-200 focus:ring-1 focus:ring-indigo-400 rounded text-sm py-1.5 px-2 text-center"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(i)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              ملاحظات والتوجيه
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-400 text-sm p-3"
            ></textarea>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4">
            {user?.level <= 2 ? (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, "approved")}
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center"
              >
                {user?.level <= 2 ? (
                  <>
                    <CheckCircle className="w-5 h-5 ml-2" />
                    اعتماد الطلب
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
      </div>

      {/* Supplier search modal */}
      {showSupplierModal && (
        <SearchModal
          title="بحث عن مورد (F3)"
          items={suppliers}
          columns={[
            { key: "code", label: "كود المورد", className: "font-mono w-28" },
            { key: "name", label: "اسم المورد" },
            { key: "phone", label: "الهاتف", className: "w-32" },
          ]}
          searchKeys={["code", "name"]}
          placeholder="ابحث بكود أو اسم المورد…"
          onSelect={(s) => setFormData({ ...formData, supplierName: s.name })}
          onClose={() => setShowSupplierModal(false)}
        />
      )}

      {/* Material search modal — filtered by selected supplier */}
      {showMaterialModal && editingItemIdx !== null && (
        <SearchModal
          title={formData.supplierName ? `مواد المورد: ${formData.supplierName} (F3)` : "بحث عن مادة (F3)"}
          items={formData.supplierName
            ? (() => {
                const sup = suppliers.find((s: any) => s.name === formData.supplierName);
                return materials.filter((m: any) => {
                  if (m.supplier_name === formData.supplierName) return true;
                  if (m.supplierName === formData.supplierName) return true;
                  if (sup?.code && m.code) {
                    const codeStr = String(sup.code).padStart(2, "0");
                    return m.code.endsWith(`-${codeStr}`) || m.code.endsWith(`-${sup.code}`);
                  }
                  return false;
                });
              })()
            : materials}
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
