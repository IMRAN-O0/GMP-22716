import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateSerialNumber, formatMaterialCode } from "../../lib/utils";
import { Save, CheckCircle, Plus, Trash2, Paperclip } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

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
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                اسم المورد (الشركة) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="suppliers-list-prq"
                required
                placeholder="ابحث بكود أو اسم المورد..."
                value={formData.supplierName}
                onChange={(e) =>
                  setFormData({ ...formData, supplierName: e.target.value })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-400 text-sm py-2"
              />
              <datalist id="suppliers-list-prq">
                {suppliers.map((s, i) => (
                  <option key={i} value={s.name}>
                    {s.code}
                  </option>
                ))}
              </datalist>
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
                          <input
                            type="text"
                            list="materials-list-prq"
                            required
                            placeholder="ابحث بكود أو اسم المادة..."
                            value={item.materialCode}
                            onChange={(e) =>
                              updateItem(
                                i,
                                "materialCode",
                                formatMaterialCode(e.target.value),
                              )
                            }
                            className="w-full bg-transparent border-slate-200 focus:ring-1 focus:ring-indigo-400 rounded text-sm py-1.5 px-2"
                          />
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
              <datalist id="materials-list-prq">
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
              onClick={(e) => handleSubmit(e, "draft")}
              disabled={loading}
              className="flex-1 bg-white text-slate-700 font-bold py-3 px-6 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center"
            >
              {user?.level <= 2 ? (
                <>
                  <Save className="w-5 h-5 ml-2" />
                  حفظ كمسودة
                </>
              ) : (
                "إرسال للمراجعة / الاعتماد"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
