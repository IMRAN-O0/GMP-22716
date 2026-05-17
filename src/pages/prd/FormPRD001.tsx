import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, CheckCircle, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateSerialNumber, formatMaterialCode } from "../../lib/utils";

export default function FormPRD001() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Auto-generated fields
  const [loading, setLoading] = useState(false);
  const [productionOrderNo, setProductionOrderNo] = useState(() =>
    generateSerialNumber("PO", Math.floor(Math.random() * 10000)),
  );
  const [batchNumber, setBatchNumber] = useState(() =>
    generateSerialNumber("BAT", Math.floor(Math.random() * 10000)),
  );
  const [sysDate] = useState(new Date().toLocaleDateString("ar-EG"));

  const [inventoryMaterials, setInventoryMaterials] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [compositions, setCompositions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [lastAppliedBOM, setLastAppliedBOM] = useState({ item: "", batch: "" });

  useEffect(() => {
    fetch("/api/materials")
      .then((r) => r.json())
      .then((data) => {
        setInventoryMaterials(
          data.filter((m: any) => m.category !== "منتج نهائي"),
        );
        setProducts(data.filter((m: any) => m.category === "منتج نهائي"));
      })
      .catch(console.error);

    fetch("/api/customers")
      .then((r) => r.json())
      .then((data) => {
        setCustomers(Array.isArray(data) ? data : []);
      })
      .catch(console.error);

    fetch("/api/forms")
      .then((r) => r.json())
      .then((data) => {
        setCompositions(
          data.filter(
            (f: any) => f.form_id === "F-INV-BOM" && f.status === "approved",
          ),
        );
      })
      .catch(console.error);

    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    if (editId) {
      fetch(`/api/forms/record/${editId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.data) {
            setFormData(data.data);
            if (data.record_id) setProductionOrderNo(data.record_id);
            if (data.data.batchNumber) setBatchNumber(data.data.batchNumber);
          }
        })
        .catch(console.error);
    }
  }, []);

  const [formData, setFormData] = useState({
    productionOrderNo,
    issueDate: new Date().toISOString().split("T")[0],
    productName: "",
    itemNumber: "",
    batchNumber,
    requiredBatchSize: "",
    unit: "كجم",
    plannedStartDate: "",
    plannedEndDate: "",
    clientName: "",
    rawMaterials: [] as {
      materialCode: string;
      materialName: string;
      requiredQuantity: string;
      unit: string;
    }[],
    productionManagerName: "",
  });

  const addRawMaterial = () => {
    setFormData((prev) => ({
      ...prev,
      rawMaterials: [
        ...prev.rawMaterials,
        {
          materialCode: "",
          materialName: "",
          requiredQuantity: "",
          unit: "كجم",
        },
      ],
    }));
  };

  const removeRawMaterial = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      rawMaterials: prev.rawMaterials.filter((_, i) => i !== index),
    }));
  };

  const updateRawMaterial = (index: number, field: string, value: string) => {
    const newMaterials = [...formData.rawMaterials];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    setFormData((prev) => ({ ...prev, rawMaterials: newMaterials }));
  };

  useEffect(() => {
    const { itemNumber, requiredBatchSize, unit } = formData;
    if (itemNumber && requiredBatchSize) {
      if (
        lastAppliedBOM.item !== itemNumber ||
        lastAppliedBOM.batch !== requiredBatchSize
      ) {
        const batchSize = parseFloat(requiredBatchSize);
        if (!isNaN(batchSize) && batchSize > 0 && compositions.length > 0) {
          const bomsForProduct = compositions.filter(
            (c) => c.data?.productCode === itemNumber,
          );
          if (bomsForProduct.length > 0) {
            const bom = bomsForProduct[bomsForProduct.length - 1].data;
            const totalParts = bom.materials.reduce(
              (sum: number, m: any) => sum + (parseFloat(m.percentage) || 0),
              0,
            );

            if (totalParts > 0) {
              const newRawMaterials = bom.materials.map((m: any) => {
                const part = parseFloat(m.percentage) || 0;
                let requiredQty = 0;
                if (m.unit === "%") {
                  requiredQty = (batchSize * part) / 100;
                } else {
                  // Divide required batch by composition total and multiply by part
                  requiredQty = (batchSize / totalParts) * part;
                }

                const invItem = inventoryMaterials.find(
                  (inv) => inv.code === m.materialCode,
                );
                const outUnit =
                  m.unit === "%" ? (invItem ? invItem.unit : unit) : m.unit;

                return {
                  materialCode: m.materialCode,
                  materialName: m.materialName,
                  requiredQuantity: requiredQty.toFixed(3),
                  unit: outUnit || unit,
                };
              });
              setFormData((prev) => ({
                ...prev,
                rawMaterials: newRawMaterials,
              }));
            }
          }
        }
        setLastAppliedBOM({ item: itemNumber, batch: requiredBatchSize });
      }
    }
  }, [
    formData.itemNumber,
    formData.requiredBatchSize,
    compositions,
    inventoryMaterials,
    formData.unit,
  ]);

  const handleSubmit = async (e: React.FormEvent, status: any) => {
    e.preventDefault();

    if (status !== "draft") {
      let insufficientMaterials = [];
      for (const item of formData.rawMaterials) {
        if (!item.materialCode) continue;
        const inventoryMaterial = inventoryMaterials.find(m => m.code === item.materialCode);
        const requiredQty = parseFloat(item.requiredQuantity || "0");
        const availableQty = inventoryMaterial ? (inventoryMaterial.balance || 0) : 0;
        if (requiredQty > availableQty) {
          insufficientMaterials.push(`${item.materialName} (مطلوب: ${requiredQty}, متاح: ${availableQty})`);
        }
      }
      if (insufficientMaterials.length > 0) {
        const confirmMsg = "تحذير: المواد التالية غير متوفرة بالكمية الكافية في المستودع:\n" + insufficientMaterials.join("\n") + "\n\nهل تريد المتابعة على أية حال؟";
        if (!window.confirm(confirmMsg)) {
          return;
        }
      }
    }

    // Use PRD order number as the overall record ID for tracking
    const recordId = productionOrderNo;

    const payload = {
      recordId,
      formId: "F-PRD-001",
      department: "PRD",
      creatorId: user?.id,
      status,
      data: formData,
    };

    try {
      const params = new URLSearchParams(window.location.search);
      const editId = params.get("edit");
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
        alert(`تم الحفظ بنجاح. رقم المستند: ${recordId}`);
        navigate("/prd");
      } else {
        const errData = await res.json().catch(() => ({ error: "حدث خطأ أثناء الحفظ" }));
        alert(errData.error || "حدث خطأ أثناء الحفظ");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden">
      <div className="border-b border-slate-200 p-6 flex justify-between items-center bg-slate-50">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            الشركة الحديثة للتجميل
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            ISO 22716 - GMP
          </p>
        </div>
        <div className="text-left">
          <h2 className="text-xl font-bold text-slate-800 mb-1">أمر الإنتاج</h2>
          <p className="text-sm font-mono text-slate-500">نموذج: F-PRD-001</p>
          <p className="text-sm font-mono text-slate-500">
            تاريخ الإصدار: 01-01-2025
          </p>
        </div>
      </div>

      <form className="p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
          بيانات أمر الإنتاج
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              رقم أمر الإنتاج (تلقائي)
            </label>
            <input
              type="text"
              readOnly
              disabled
              value={formData.productionOrderNo}
              className="w-full border-slate-200 bg-slate-50 rounded-lg shadow-sm text-sm py-2 text-slate-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              تاريخ إصدار الأمر <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.issueDate}
              onChange={(e) =>
                setFormData({ ...formData, issueDate: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              كود المنتج (Item Number) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              list="products-list-prd001"
              required
              placeholder="ابحث بكود أو اسم المنتج..."
              value={formData.itemNumber}
              onChange={(e) => {
                const currentVal = e.target.value;
                const codeMatch = currentVal.match(/^([A-Za-z0-9-]+) - /);
                const code = codeMatch ? codeMatch[1] : currentVal;
                const foundProduct = products.find((p: any) => p.code === code);
                setFormData({
                  ...formData,
                  itemNumber: formatMaterialCode(code),
                  productName: foundProduct
                    ? foundProduct.name
                    : formData.productName,
                });
              }}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
            <datalist id="products-list-prd001">
              {products.map((p: any) => (
                <option key={p.id} value={`${p.code} - ${p.name}`} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              اسم المنتج <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              readOnly
              disabled
              placeholder="يتم سحبه تلقائياً..."
              value={formData.productName}
              onChange={(e) =>
                setFormData({ ...formData, productName: e.target.value })
              }
              className="w-full border-slate-300 bg-slate-50 text-slate-600 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              رقم الدفعة (تلقائي)
            </label>
            <input
              type="text"
              readOnly
              disabled
              value={formData.batchNumber}
              className="w-full border-slate-200 bg-slate-50 rounded-lg shadow-sm text-sm py-2 text-slate-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              حجم الدفعة المطلوبة <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                required
                min="1"
                value={formData.requiredBatchSize}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requiredBatchSize: e.target.value,
                  })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2 flex-1"
              />
              <select
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                className="border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2 w-24"
              >
                <option>كجم</option>
                <option>لتر</option>
                <option>قطعة</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              تاريخ البدء المخطط <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.plannedStartDate}
              onChange={(e) =>
                setFormData({ ...formData, plannedStartDate: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              تاريخ الانتهاء المخطط <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.plannedEndDate}
              onChange={(e) =>
                setFormData({ ...formData, plannedEndDate: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[13px] font-semibold text-slate-600">
                قائمة المواد الخام المطلوبة{" "}
                <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addRawMaterial}
                className="flex items-center text-xs text-sky-600 font-bold hover:text-sky-700 bg-sky-50 px-2.5 py-1.5 rounded-lg border border-sky-100"
              >
                <Plus className="w-3 h-3 ml-1" /> إضافة مادة
              </button>
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-right border-collapse">
                <thead className="bg-slate-50 text-[12px] text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-2 border-r border-slate-200 w-1/4">
                      كود المادة
                    </th>
                    <th className="p-2 border-r border-slate-200">
                      اسم ووصف المادة
                    </th>
                    <th className="p-2 border-r border-slate-200 w-32">
                      الكمية المطلوبة
                    </th>
                    <th className="p-2 border-r border-slate-200 w-24">
                      الوحدة
                    </th>
                    <th className="p-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.rawMaterials.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-4 text-center text-slate-400 text-sm bg-white"
                      >
                        يرجى إضافة المواد الخام المطلوبة لهذا الأمر
                      </td>
                    </tr>
                  ) : (
                    formData.rawMaterials.map((material, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-100 bg-white last:border-0"
                      >
                        <td className="p-1.5 border-r border-slate-100">
                          <select
                            required
                            value={material.materialCode}
                            onChange={(e) => {
                              const code = e.target.value;
                              const found = inventoryMaterials.find(
                                (m) => m.code === code,
                              );
                              const newMaterials = [...formData.rawMaterials];
                              newMaterials[i] = {
                                ...newMaterials[i],
                                materialCode: formatMaterialCode(code),
                                materialName: found
                                  ? found.name
                                  : material.materialName,
                                unit: found ? found.unit : material.unit,
                              };
                              setFormData((prev) => ({
                                ...prev,
                                rawMaterials: newMaterials,
                              }));
                            }}
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-sky-400 rounded text-sm py-1"
                          >
                            <option value="">-- كود المادة --</option>
                            {inventoryMaterials.map((invMat) => (
                              <option key={invMat.id} value={invMat.code}>
                                {invMat.code} ({invMat.name})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-1.5 border-r border-slate-100">
                          <input
                            type="text"
                            readOnly
                            disabled
                            placeholder="يتم السحب تلقائياً..."
                            value={material.materialName}
                            onChange={(e) =>
                              updateRawMaterial(
                                i,
                                "materialName",
                                e.target.value,
                              )
                            }
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-sky-400 rounded text-sm py-1 text-slate-500"
                          />
                        </td>
                        <td className="p-1.5 border-r border-slate-100">
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={material.requiredQuantity}
                            onChange={(e) =>
                              updateRawMaterial(
                                i,
                                "requiredQuantity",
                                e.target.value,
                              )
                            }
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-sky-400 rounded text-sm py-1"
                          />
                        </td>
                        <td className="p-1.5 border-r border-slate-100">
                          <select
                            value={material.unit}
                            onChange={(e) =>
                              updateRawMaterial(i, "unit", e.target.value)
                            }
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-sky-400 rounded text-sm py-1 text-slate-600"
                          >
                            <option>كجم</option>
                            <option>جرام</option>
                            <option>لتر</option>
                            <option>مل</option>
                            <option>قطعة</option>
                          </select>
                        </td>
                        <td className="p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeRawMaterial(i)}
                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                اسم العميل (اختياري)
              </label>
              <input
                type="text"
                list="customers-list-prd001"
                value={formData.clientName}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value })
                }
                placeholder="ابحث بكود أو اسم العميل..."
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
              />
              <datalist id="customers-list-prd001">
                {customers.map((c, i) => (
                  <option key={i} value={c.name}>
                    {c.code}
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                اسم مدير الإنتاج <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.productionManagerName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    productionManagerName: e.target.value,
                  })
                }
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
              />
            </div>
          </div>
        </div>

        {/* Form Footer (Auto filled / Read Only) */}
        <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl my-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold block text-slate-600 mb-1">
              أعدّه (تلقائي):
            </span>
            <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-slate-700">
              {user?.name || "---"}
            </div>
          </div>
          <div>
            <span className="font-semibold block text-slate-600 mb-1">
              تاريخ الإعداد:
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
    </div>
  );
}
