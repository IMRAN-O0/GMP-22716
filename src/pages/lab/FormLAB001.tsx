import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, FileText, FlaskConical } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateSerialNumber } from "../../lib/utils";

export default function FormLAB001() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [materials, setMaterials] = useState<any[]>([]);
  const [productionOrders, setProductionOrders] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/materials")
      .then((r) => r.json())
      .then((data) => setMaterials(data))
      .catch(console.error);
    fetch("/api/forms/dept/PRD")
      .then((r) => r.json())
      .then((data) => {
        const orders = data.filter(
          (f: any) => f.form_id === "F-PRD-001" && f.status === "approved",
        );
        setProductionOrders(orders);
      })
      .catch(console.error);
  }, []);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    requestId: generateSerialNumber(
      "LAB-REQ",
      Math.floor(Math.random() * 10000),
    ),
    requestDate: new Date().toISOString().split("T")[0],
    sampleType: "Raw Material",
    itemCode: "",
    itemName: "",
    batchNumber: "",
    productionOrderNo: "",
    requiredTests: "",
    priority: "Normal",
    requestedBy: user?.name || "",
    notes: "",
  });

  const handleItemSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentVal = e.target.value;
    const codeMatch = currentVal.match(/^([A-Za-z0-9-]+) - /);
    const code = codeMatch ? codeMatch[1] : currentVal;
    const mat = materials.find((m) => m.code === code);
    setFormData((prev) => ({
      ...prev,
      itemCode: code,
      itemName: mat ? mat.name : "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent, status: any = "approved") => {
    e.preventDefault();
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
          formId: "F-LAB-001",
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
    }
  };

  // --- INJECTED BY PATCH ---
  const newSearchParams = () => new URLSearchParams(window.location.search);
  React.useEffect(() => {
    const editId = newSearchParams().get("edit");
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-indigo-200 shadow-sm border-r-4 border-r-indigo-600">
        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
          <FileText className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            طلبات الاختبار المخبرية
          </h1>
          <p className="text-slate-500">
            النموذج: F-LAB-001 | قطاع المختبر (LAB)
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
                  نوع العينة / المادة <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.sampleType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sampleType: e.target.value,
                      itemCode: "",
                      itemName: "",
                    })
                  }
                >
                  <option value="Raw Material">مادة خام</option>
                  <option value="Finished Product">منتج نهائي</option>
                  <option value="In-Process">قيد التصنيع (WIP)</option>
                  <option value="Packaging">مواد تعبئة وتغليف</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  اسم المادة / المنتج <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  list="materials-list-lab001"
                  required
                  placeholder="ابحث بكود أو اسم العنصر..."
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-700"
                  value={formData.itemCode}
                  onChange={handleItemSelect}
                />
                <datalist id="materials-list-lab001">
                  {formData.sampleType === "Raw Material"
                    ? materials
                        .filter(
                          (m) =>
                            (m.category === "Raw Material" ||
                              m.category === "مادة خام" ||
                              m.code?.startsWith("RM")) &&
                            !m.code?.startsWith("PKG"),
                        )
                        .map((m) => (
                          <option key={m.id} value={`${m.code} - ${m.name}`} />
                        ))
                    : formData.sampleType === "Packaging"
                      ? materials
                          .filter(
                            (m) =>
                              m.category === "Packaging" ||
                              m.category === "مواد تعبئة وتغليف" ||
                              m.category === "مواد تعبئة" ||
                              m.code?.startsWith("PKG"),
                          )
                          .map((m) => (
                            <option
                              key={m.id}
                              value={`${m.code} - ${m.name}`}
                            />
                          ))
                      : formData.sampleType === "In-Process"
                        ? materials
                            .filter(
                              (m) =>
                                m.category === "In-Process" ||
                                m.category === "قيد التصنيع (WIP)" ||
                                m.category === "قيد التصنيع",
                            )
                            .map((m) => (
                              <option
                                key={m.id}
                                value={`${m.code} - ${m.name}`}
                              />
                            ))
                        : materials
                            .filter(
                              (m) =>
                                m.category === "منتج نهائي" ||
                                m.category === "Finished Product" ||
                                m.code?.startsWith("PRD"),
                            )
                            .map((m) => (
                              <option
                                key={m.id}
                                value={`${m.code} - ${m.name}`}
                              />
                            ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  رقم التشغيلة / الدفعة (Batch/Lot){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.batchNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, batchNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  أمر الإنتاج (اختياري)
                </label>
                <select
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.productionOrderNo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      productionOrderNo: e.target.value,
                    })
                  }
                >
                  <option value="">-- بدون أمر إنتاج --</option>
                  {productionOrders.map((o) => {
                    const oData = JSON.parse(o.data_json);
                    return (
                      <option key={o.record_id} value={o.record_id}>
                        {o.record_id} - {oData.productName}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                الاختبارات المطلوبة <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="مثال: تحليل فيزيائي، كيميائي، مايكروبيولوجي..."
                value={formData.requiredTests}
                onChange={(e) =>
                  setFormData({ ...formData, requiredTests: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  أولوية الطلب
                </label>
                <select
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                >
                  <option value="Normal">عادية (Normal)</option>
                  <option value="High">عاجلة (High/Urgent)</option>
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

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                ملاحظات إضافية بخصوص العينة
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
