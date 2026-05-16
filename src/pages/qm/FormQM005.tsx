import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, AlertTriangle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function FormQM005() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<any[]>([]);
  const [productionOrders, setProductionOrders] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    issueDate: new Date().toISOString().split("T")[0],
    ncrSource: "Production", // Incoming, Production, Customer Complaint
    materialOrProductCode: "",
    productionOrderNo: "",
    batchNumber: "",
    quantityAffected: "",
    descriptionOfNonConformance: "",
    immediateActionTaken: "",
    reportedBy: user?.name || "",
    investigationRequired: false,
  });

  useEffect(() => {
    // Fetch materials/products for dropdowns
    fetch("/api/materials")
      .then((r) => r.json())
      .then((data) => setMaterials(data))
      .catch(console.error);

    // Fetch PRD forms for linking
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

  const handleSubmit = async (e: React.FormEvent, status: any = "approved") => {
    e.preventDefault();
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          recordId: `QM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          formId: "F-QM-005",
          department: "QM",
          creatorId: user?.id,
          status: status,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert("تم حفظ نموذج F-QM-005 بنجاح: " + saved.record_id);
      navigate("/qm");
    } catch (err) {
      console.error(err);
      alert("فشل حفظ النموذج");
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-indigo-200 shadow-sm border-r-4 border-r-indigo-500">
        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            تقرير حالة عدم مطابقة (NCR)
          </h1>
          <p className="text-slate-500">
            النموذج: F-QM-005 | قسم الجودة - ISO 22716
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div className="p-6 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                تاريخ التقرير
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.issueDate}
                onChange={(e) =>
                  setFormData({ ...formData, issueDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                المُبلّغ (Reported By)
              </label>
              <input
                type="text"
                readOnly
                className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                value={formData.reportedBy}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                مصدر الجودة المعيبة
              </label>
              <select
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg"
                value={formData.ncrSource}
                onChange={(e) =>
                  setFormData({ ...formData, ncrSource: e.target.value })
                }
              >
                <option value="Incoming">
                  فحص المواد الواردة (Incoming Inspection)
                </option>
                <option value="Production">أثناء الإنتاج (In-Process)</option>
                <option value="Finished">
                  فحص المنتج النهائي (Finished Product)
                </option>
                <option value="Customer Complaint">
                  شكوى عميل (Customer Complaint)
                </option>
                <option value="Internal Audit">
                  تدقيق داخلي (Internal Audit)
                </option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                أمر الإنتاج المرتبط (اختياري)
              </label>
              <select
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg"
                value={formData.productionOrderNo}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    productionOrderNo: e.target.value,
                  })
                }
              >
                <option value="">لا يوجد ارتباط بأمر إنتاج محدد --</option>
                {productionOrders.map((order) => (
                  <option
                    key={order.record_id}
                    value={order.data.ProductionOrderNo || order.record_id}
                  >
                    {order.data.ProductCode || order.data.ProductName} - (
                    {order.record_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                رمز المادة/المنتج
              </label>
              <select
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg"
                value={formData.materialOrProductCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    materialOrProductCode: e.target.value,
                  })
                }
              >
                <option value="">اختر المادة...</option>
                {materials.map((m) => (
                  <option key={m.code} value={m.code}>
                    [{m.code}] {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                رقم التشغيلة (Batch/Lot No)
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-left font-mono"
                dir="ltr"
                placeholder="BAT-..."
                value={formData.batchNumber}
                onChange={(e) =>
                  setFormData({ ...formData, batchNumber: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                الكمية المتأثرة (Quantity Affected)
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={formData.quantityAffected}
                onChange={(e) =>
                  setFormData({ ...formData, quantityAffected: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              وصف حالة عدم المطابقة بدقة (Description of Non-Conformance)
            </label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="وصف تفصيلي للمشكلة وكيفية اكتشافها..."
              value={formData.descriptionOfNonConformance}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  descriptionOfNonConformance: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              الإجراء الفوري المتخذ (Immediate Action Taken)
            </label>
            <textarea
              required
              rows={3}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="مثال: تم إيقاف الماكينة أو عزل المواد..."
              value={formData.immediateActionTaken}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  immediateActionTaken: e.target.value,
                })
              }
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
            <input
              type="checkbox"
              id="invReq"
              className="w-5 h-5 text-indigo-600 rounded"
              checked={formData.investigationRequired}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  investigationRequired: e.target.checked,
                })
              }
            />
            <label
              htmlFor="invReq"
              className="font-semibold text-indigo-900 cursor-pointer"
            >
              تصعيد الحالة لتتطلب تحقيق رسمي وإجراء CAPA (Corrective Action).
            </label>
          </div>
        </div>

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
    </div>
  );
}
