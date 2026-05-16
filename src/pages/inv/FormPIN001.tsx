import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateSerialNumber, formatMaterialCode } from "../../lib/utils";
import { Save, CheckCircle, Plus, Trash2, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function FormPIN001() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    invoiceId: generateSerialNumber("PIN", Math.floor(Math.random() * 10000)),
    invoiceDate: new Date().toISOString().split("T")[0],
    supplierName: "",
    linkedPrqId: "",
    warehouseId: "",
    notes: "",
    taxRate: 15,
    items: [] as {
      materialCode: string;
      materialName: string;
      unit: string;
      quantity: string;
      unitPrice: string;
    }[],
  });

  const [materials, setMaterials] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [prqList, setPrqList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/materials")
      .then((r) => r.json())
      .then((data) => {
        setMaterials(Array.isArray(data) ? data : []);
      })
      .catch(console.error);

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

    // Fetch approved PRQs
    fetch("/api/forms")
      .then((res) => res.json())
      .then((data: any[]) => {
        const prqs = data.filter(
          (f) => f.form_id === "F-INV-PRQ-001" && f.status === "approved",
        );
        setPrqList(prqs);
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

  const handlePrqSelect = (prqId: string) => {
    setFormData((prev) => ({ ...prev, linkedPrqId: prqId }));

    const prq = prqList.find(
      (p) => p.record_id === prqId || p.data?.requestId === prqId,
    );
    if (prq && prq.data) {
      setFormData((prev) => ({
        ...prev,
        supplierName: prq.data.supplierName || prev.supplierName,
        warehouseId: prq.data.warehouseId || prev.warehouseId,
        items: (prq.data.items || []).map((item: any) => ({
          materialCode: item.materialCode,
          materialName: item.materialName,
          unit: item.unit || "",
          quantity: item.quantity,
          unitPrice: item.expectedPrice || "0",
        })),
      }));
    }
  };

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
          unitPrice: "0",
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

  const calculateSubtotal = () => {
    return formData.items.reduce(
      (sum, item) =>
        sum +
        parseFloat(item.quantity || "0") * parseFloat(item.unitPrice || "0"),
      0,
    );
  };

  const calculateTax = () => {
    return calculateSubtotal() * (formData.taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e: React.FormEvent, status: any) => {
    e.preventDefault();
    setLoading(true);

    if (formData.items.length === 0) {
      alert("يجب إضافة مادة واحدة على الأقل في الفاتورة.");
      setLoading(false);
      return;
    }

    const payload = {
      recordId: formData.invoiceId,
      formId: "F-INV-PIN-001",
      department: "INV",
      creatorId: user?.id,
      status,
      data: {
        ...formData,
        subTotal: calculateSubtotal(),
        taxAmount: calculateTax(),
        netTotal: calculateTotal(),
      },
    };

    try {
      const editId = new URLSearchParams(window.location.search).get("edit");
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
        alert("حدث خطأ أثناء الحفظ");
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
        <div className="bg-sky-50 border-b border-sky-100 p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              الشركة الحديثة للتجميل
            </h1>
            <h2 className="text-xl font-bold text-slate-800 mb-1">
              فاتورة مشتريات مواد (PIN)
            </h2>
            <p className="text-sm text-sky-600 font-medium">
              سجل لاستلام وتتبع فواتير شراء المواد الخام وربطها بطلبات الشراء
            </p>
          </div>
          <div className="text-left">
            <p className="text-sm text-slate-500 mb-1">
              رقم الوثيقة: F-INV-PIN-001
            </p>
            <p className="text-xs text-slate-400">الإصدار: 1.0</p>
          </div>
        </div>

        <form className="p-8">
          {/* Section 1: Fetch from PRQ */}
          <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">
              ربط الفاتورة بطلب شراء مسبق (اختياري)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                list="prq-list"
                placeholder="ابحث برقم طلب الشراء (PRQ)..."
                value={formData.linkedPrqId}
                onChange={(e) => handlePrqSelect(e.target.value)}
                className="flex-1 border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2 px-3"
              />
              <datalist id="prq-list">
                {prqList.map((prq) => (
                  <option key={prq.record_id} value={prq.record_id}>
                    {prq.record_id} - المورد: {prq.data?.supplierName || "---"}
                  </option>
                ))}
              </datalist>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              عند اختيار طلب شراء معتمد، سيتم سحب المواد والمورد تلقائياً ويمكنك
              التعديل عليها.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                رقم الفاتورة (النظام)
              </label>
              <input
                type="text"
                readOnly
                disabled
                value={formData.invoiceId}
                className="w-full bg-slate-50 border-slate-200 text-slate-500 rounded-lg shadow-sm text-sm py-2"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                تاريخ الفاتورة <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.invoiceDate}
                onChange={(e) =>
                  setFormData({ ...formData, invoiceDate: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                اسم المورد (الشركة) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="suppliers-list-pin"
                required
                placeholder="ابحث بكود أو اسم المورد..."
                value={formData.supplierName}
                onChange={(e) =>
                  setFormData({ ...formData, supplierName: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
              />
              <datalist id="suppliers-list-pin">
                {suppliers.map((s, i) => (
                  <option key={i} value={s.name}>
                    {s.code}
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                توجيه إلى مستودع
              </label>
              <select
                value={formData.warehouseId}
                onChange={(e) =>
                  setFormData({ ...formData, warehouseId: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
              >
                <option value="">-- اختر المستودع الموجه إليه --</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                نسبة ضريبة القيمة المضافة (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={formData.taxRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    taxRate: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm py-2"
              />
            </div>
          </div>

          {/* Items Data */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                تفاصيل الفاتورة
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center text-sm font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg transition-colors"
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
                    <th className="p-3 font-semibold w-20">الوحدة</th>
                    <th className="p-3 font-semibold w-24">
                      الكمية <span className="text-red-500">*</span>
                    </th>
                    <th className="p-3 font-semibold w-28">سعر الوحدة</th>
                    <th className="p-3 font-semibold w-28 text-left">
                      الإجمالي
                    </th>
                    <th className="p-3 font-semibold w-12 text-center">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-6 text-center text-slate-400 text-sm bg-white"
                      >
                        لا توجد مواد مضافة.
                      </td>
                    </tr>
                  ) : (
                    formData.items.map((item, i) => (
                      <tr
                        key={i}
                        className="bg-white hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="text"
                            list="materials-list-pin"
                            required
                            placeholder="بحث بكود أو اسم..."
                            value={item.materialCode}
                            onChange={(e) =>
                              updateItem(
                                i,
                                "materialCode",
                                formatMaterialCode(e.target.value),
                              )
                            }
                            className="w-full bg-transparent border-slate-200 focus:ring-1 focus:ring-sky-400 rounded text-sm py-1.5 px-2"
                          />
                        </td>
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="text"
                            readOnly
                            disabled
                            placeholder="..."
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
                            className="w-full bg-transparent border-slate-200 focus:ring-1 focus:ring-sky-400 rounded text-sm py-1.5 px-2 text-center"
                          />
                        </td>
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItem(i, "unitPrice", e.target.value)
                            }
                            className="w-full bg-transparent border-slate-200 focus:ring-1 focus:ring-sky-400 rounded text-sm py-1.5 px-2 text-center"
                          />
                        </td>
                        <td className="p-2 border-r border-slate-100 text-left font-semibold text-slate-700 bg-slate-50">
                          {(
                            parseFloat(item.quantity || "0") *
                            parseFloat(item.unitPrice || "0")
                          ).toLocaleString()}
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
              <datalist id="materials-list-pin">
                {materials
                  .filter(
                    (m) =>
                      m.category === "مادة خام" ||
                      m.category === "مواد تعبئة وتغليف" ||
                      m.code?.startsWith("RM") ||
                      m.code?.startsWith("PKG") ||
                      m.category === "Raw Material" ||
                      m.category === "Packaging",
                  )
                  .map((m: any) => (
                    <option key={m.id} value={`${m.code} - ${m.name}`} />
                  ))}
              </datalist>
            </div>

            {/* Totals Box */}
            <div className="flex justify-end mt-4">
              <div className="w-64 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-2 text-sm">
                  <span className="text-slate-600">المجموع (قبل الضريبة):</span>
                  <span className="font-semibold text-slate-800">
                    {calculateSubtotal().toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}{" "}
                    SAR
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2 text-sm">
                  <span className="text-slate-600">
                    الضريبة ({formData.taxRate}%):
                  </span>
                  <span className="font-semibold text-slate-800">
                    {calculateTax().toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}{" "}
                    SAR
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-2">
                  <span className="font-bold text-slate-800">
                    الإجمالي النهائي:
                  </span>
                  <span className="font-bold text-sky-600 text-lg">
                    {calculateTotal().toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}{" "}
                    SAR
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              ملاحظات الفاتورة
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 text-sm p-3"
            ></textarea>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4">
            {user?.level <= 2 ? (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, "approved")}
                disabled={loading}
                className="flex-1 bg-sky-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-sky-700 transition-colors flex items-center justify-center"
              >
                {user?.level <= 2 ? (
                  <>
                    <CheckCircle className="w-5 h-5 ml-2" />
                    تسجيل واعتماد الفاتورة
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
    </div>
  );
}
