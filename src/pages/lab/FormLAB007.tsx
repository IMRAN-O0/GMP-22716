import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Plus, Trash2, FlaskConical } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateSerialNumber } from "../../lib/utils";
import { SearchModal, SearchField } from "../../components/SearchModal";

export default function FormLAB007() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/materials", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then((r) => r.json())
      .then((data) => setMaterials(data))
      .catch(console.error);

    const editId = new URLSearchParams(window.location.search).get("edit");
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

  const [formData, setFormData] = useState({
    requestId: generateSerialNumber(
      "LAB-MAT-REQ",
      Math.floor(Math.random() * 10000),
    ),
    requestDate: new Date().toISOString().split("T")[0],
    requestedBy: user?.name || "",
    purpose: "تركيبات تجريبية (R&D)",
    notes: "",
    items: [] as {
      materialCode: string;
      materialName: string;
      unit: string;
      quantity: string;
    }[],
  });

  const selectMaterialForRow = (idx: number, m: any) => {
    const newItems = [...formData.items];
    newItems[idx] = { ...newItems[idx], materialCode: m.code, materialName: m.name, unit: m.unit || "" };
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    if (field === "materialCode") {
      const codeMatch = value.match(/^([A-Za-z0-9-]+) - /);
      const code = codeMatch ? codeMatch[1] : value;
      const mat = materials.find((m) => m.code === code);
      newItems[index] = {
        ...newItems[index],
        materialCode: value,
        materialName: mat ? mat.name : "",
        unit: mat ? mat.unit : "",
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setFormData({ ...formData, items: newItems });
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
          quantity: "",
        },
      ],
    });
  };

  const removeItem = (idx: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== idx),
    });
  };

  const handleSubmit = async (e: React.FormEvent, status: any = "approved") => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert("يجب إضافة مادة واحدة على الأقل");
      return;
    }
    
    setLoading(true);
    try {
      const editIdPatch = newSearchParams().get("edit");
      const fetchUrl = editIdPatch
        ? `/api/forms/record/${editIdPatch}`
        : "/api/forms";
      const fetchMethod = editIdPatch ? "PUT" : "POST";
      const res = await fetch(fetchUrl, {
        method: fetchMethod,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          recordId: formData.requestId,
          formId: "F-LAB-007",
          department: "LAB",
          creatorId: user?.id,
          status: status,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert(
        `تم التوثيق بنجاح (${status === "draft" ? "مسودة" : "معتمد"}): ` +
          saved.record_id,
      );
      navigate("/lab");
    } catch (err) {
      console.error(err);
      alert("فشل حفظ النموذج");
    } finally {
      setLoading(false);
    }
  };

  const newSearchParams = () => new URLSearchParams(window.location.search);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-indigo-200 shadow-sm border-r-4 border-r-indigo-600">
        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
          <FlaskConical className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            طلب مواد خام للتركيبات التجريبية
          </h1>
          <p className="text-slate-500">
            النموذج: F-LAB-007 | قطاع المختبر (LAB)
          </p>
        </div>
      </div>

      <form className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-8">
          <div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  الرقم المرجعي (تلقائي)
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                  value={formData.requestId}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  تاريخ الطلب <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.requestDate}
                  onChange={(e) =>
                    setFormData({ ...formData, requestDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  الغرض من الطلب
                </label>
                <select
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData({ ...formData, purpose: e.target.value })
                  }
                >
                  <option value="تركيبات تجريبية (R&D)">تركيبات تجريبية (R&D)</option>
                  <option value="اختبار مواد">اختبار مواد (Material Testing)</option>
                  <option value="تحليل عينات">تحليل عينات (Sample Analysis)</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  مقدم الطلب
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                  value={formData.requestedBy}
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                ملاحظات
              </label>
              <textarea
                rows={2}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>
          </div>
          
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                قائمة المواد الخام المطلوبة
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
                      كود المادة واسم المادة{" "}
                      <span className="text-red-500">*</span>
                    </th>
                    <th className="p-3 font-semibold">المادة المختارة</th>
                    <th className="p-3 font-semibold w-24">الوحدة</th>
                    <th className="p-3 font-semibold w-32">
                      الكمية <span className="text-red-500">*</span>
                    </th>
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
                              onChange={(e) => updateItem(i, "materialCode", e.target.value)}
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
          title="بحث عن مادة خام (F3)"
          items={materials.filter((m: any) =>
            m.category === "مادة خام" || m.category === "Raw Material"
          )}
          columns={[
            { key: "code", label: "كود المادة", className: "font-mono w-28" },
            { key: "name", label: "اسم المادة" },
            { key: "unit", label: "الوحدة", className: "w-20" },
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
