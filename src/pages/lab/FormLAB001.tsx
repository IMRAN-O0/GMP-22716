import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, FileText, FlaskConical } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateSerialNumber } from "../../lib/utils";
import { SearchModal, SearchField } from "../../components/SearchModal";

export default function FormLAB001() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [materials, setMaterials] = useState<any[]>([]);
  const [productionOrders, setProductionOrders] = useState<any[]>([]);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  useEffect(() => {
    fetch("/api/materials", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then((r) => r.json())
      .then((data) => setMaterials(data))
      .catch(console.error);
    fetch("/api/forms/dept/PRD", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
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
                <SearchField
                  label=""
                  required
                  value={formData.itemCode}
                  onChange={(v) => {
                    const mat = materials.find((m) => m.code === v || m.name === v);
                    setFormData({ ...formData, itemCode: v, itemName: mat ? mat.name : "" });
                  }}
                  onF3={() => setShowMaterialModal(true)}
                  placeholder="اكتب أو اضغط F3 للبحث…"
                  hint="F3 للبحث في قائمة المواد"
                />
                {formData.itemName && (
                  <p className="text-xs text-emerald-600 mt-1 font-semibold">{formData.itemName}</p>
                )}
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
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setFormData({ ...formData, productionOrderNo: "" });
                      return;
                    }
                    const order = productionOrders.find((o) => o.record_id === val);
                    if (order) {
                      const oData = JSON.parse(order.data_json);
                      setFormData({
                        ...formData,
                        productionOrderNo: val,
                        itemCode: oData.itemNumber || oData.productCode || formData.itemCode,
                        itemName: oData.productName || formData.itemName,
                        batchNumber: oData.batchNumber || formData.batchNumber,
                      });
                    } else {
                      setFormData({ ...formData, productionOrderNo: val });
                    }
                  }}
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
      {showMaterialModal && (
        <SearchModal
          title="بحث عن مادة (F3)"
          items={
            formData.sampleType === "Raw Material"
              ? materials.filter((m: any) => m.category === "مادة خام" || m.category === "Raw Material")
              : formData.sampleType === "Packaging"
              ? materials.filter((m: any) => m.category === "مواد تعبئة وتغليف" || m.category === "Packaging")
              : formData.sampleType === "Finished Product"
              ? materials.filter((m: any) => m.category === "منتج نهائي" || m.category === "Finished Product")
              : materials
          }
          columns={[
            { key: "code", label: "كود المادة", className: "font-mono w-28" },
            { key: "name", label: "اسم المادة" },
            { key: "unit", label: "الوحدة", className: "w-20" },
          ]}
          searchKeys={["code", "name"]}
          placeholder="ابحث بالكود أو الاسم…"
          onSelect={(m) => {
            setFormData({ ...formData, itemCode: m.code, itemName: m.name });
            setShowMaterialModal(false);
          }}
          onClose={() => setShowMaterialModal(false)}
        />
      )}
    </div>
  );
}
