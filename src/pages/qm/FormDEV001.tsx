import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, AlertTriangle, ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getJsonHeaders } from "../../lib/utils";

export default function FormDEV001() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [productionOrders, setProductionOrders] = useState<any[]>([]);

  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    issueDate: new Date().toISOString().split("T")[0],
    productionOrderNo: "",
    batchNumber: "",
    productionStage: "",
    deviationClassification: "Minor", // Minor, Major, Critical
    deviationType: "Process", // Process, Equipment, Material, Documentation, Environment
    description: "",
    initialImpactAssessment: "",
    immediateAction: "",
    reportedBy: user?.name || "",
    capaRequired: false,
  });

  useEffect(() => {
    // Fetch production orders
    fetch("/api/forms/dept/PRD")
      .then((r) => r.json())
      .then((data) => {
        const orders = data.filter(
          (f: any) => f.form_id === "F-PRD-001" && f.status === "approved",
        );
        setProductionOrders(orders);
      })
      .catch(console.error);

    // Read URL params for pre-filling from PRD004
    const params = new URLSearchParams(window.location.search);
    const fromBatch = params.get('fromBatch');
    const fromStage = params.get('fromStage');
    if (fromBatch) {
      setFormData(prev => ({ ...prev, batchNumber: fromBatch }));
    }
    if (fromStage) {
      setFormData(prev => ({ ...prev, productionStage: fromStage }));
    }
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
        headers: getJsonHeaders(),
        body: JSON.stringify({
          recordId: `QM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          formId: "F-DEV-001",
          department: "QM",
          creatorId: user?.id,
          status: status,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      setSavedRecordId(saved.recordId || saved.record_id);
      alert(
        "تم حفظ نموذج تقرير الانحراف (F-DEV-001) بنجاح: " + saved.record_id,
      );
      if (!formData.capaRequired) {
        navigate("/qm");
      }
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
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-rose-200 shadow-sm border-r-4 border-r-rose-500">
        <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            تقرير انحراف (Deviation Report)
          </h1>
          <p className="text-slate-500">
            النموذج: F-DEV-001 | قسم الجودة - مرتبط بالتصنيع
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
                تاريخ تسجيل الانحراف
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
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

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              أمر الإنتاج المرتبط بالانحراف{" "}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              list="production-orders-list-dev001"
              required
              placeholder="ابحث برقم أمر الإنتاج أو اسم المنتج..."
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-rose-500"
              value={formData.productionOrderNo}
              onChange={(e) => {
                const currentVal = e.target.value;
                const codeMatch = currentVal.match(/^([A-Za-z0-9-]+) - /);
                setFormData({
                  ...formData,
                  productionOrderNo: codeMatch ? codeMatch[1] : currentVal,
                });
              }}
            />
            <datalist id="production-orders-list-dev001">
              {productionOrders.map((order) => {
                const orderNo = order.data.ProductionOrderNo || order.record_id;
                return (
                  <option
                    key={order.record_id}
                    value={`${orderNo} - ${order.data.ProductName || ""} (${order.data.BatchNumber || ""})`}
                  />
                );
              })}
            </datalist>
            <p className="text-xs text-slate-500 mt-2">
              يجب ربط الانحراف بأمر الإنتاج أو التشغيلة التي حدث فيها الخروج عن
              المسار المعتمد.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                تصنيف الانحراف (Classification)
              </label>
              <select
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg"
                value={formData.deviationClassification}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deviationClassification: e.target.value,
                  })
                }
              >
                <option value="Minor">طفيف (Minor)</option>
                <option value="Major">رئيسي (Major)</option>
                <option value="Critical">حرج (Critical)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                نوع الانحراف (Type)
              </label>
              <select
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg"
                value={formData.deviationType}
                onChange={(e) =>
                  setFormData({ ...formData, deviationType: e.target.value })
                }
              >
                <option value="Process">عملية تصنيع (Process)</option>
                <option value="Equipment">معدات أو ماكينات (Equipment)</option>
                <option value="Material">مواد (Material)</option>
                <option value="Documentation">توثيق (Documentation)</option>
                <option value="Environment">بيئة العمل (Environment)</option>
                <option value="Other">أخرى (Other)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              وصف الانحراف بالتفصيل (Description of Deviation)
            </label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
              placeholder="ما الذي حدث ولم يكن مطابقاً لإجراءات التشغيل القياسية (SOPs)؟"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              التقييم المبدئي للتأثير الجودة (Initial Quality Impact Assessment)
            </label>
            <textarea
              required
              rows={3}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
              placeholder="هل أثر هذا الانحراف على جودة المنتج؟"
              value={formData.initialImpactAssessment}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  initialImpactAssessment: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              الإجراء الفوري المتخذ للتصحيح (Immediate Action)
            </label>
            <textarea
              required
              rows={3}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
              placeholder="ماذا تم فعله فور اكتشاف الانحراف؟"
              value={formData.immediateAction}
              onChange={(e) =>
                setFormData({ ...formData, immediateAction: e.target.value })
              }
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-lg">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="capaReq"
                  className="w-5 h-5 text-rose-600 rounded"
                  checked={formData.capaRequired}
                  onChange={(e) =>
                    setFormData({ ...formData, capaRequired: e.target.checked })
                  }
                />
                <label
                  htmlFor="capaReq"
                  className="font-bold text-rose-900 cursor-pointer"
                >
                  تصعيد إلى خطة إجراء تصحيحي ووقائي (CAPA F-DEV-003)
                </label>
              </div>
              <p className="text-xs text-rose-700 mt-1 mr-7">
                يُرجى التحديد إذا كان الانحراف يستدعي فتح تحقيق معمق وتحليل
                السبب الجذري لمنع تكراره.
              </p>
            </div>
          </div>
        </div>

        {savedRecordId && formData.capaRequired && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-amber-900">تم حفظ تقرير الانحراف بنجاح</p>
              <p className="text-sm text-amber-700">لقد حددت أن هذا الانحراف يستدعي CAPA — سيتم إنشاؤه تلقائياً في قسم الجودة، أو يمكنك فتح نموذج CAPA الآن وتعبئته يدوياً.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/qm/qm-006?fromDev=${savedRecordId}`)}
              className="flex-shrink-0 px-4 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 text-sm"
            >
              فتح نموذج CAPA ←
            </button>
          </div>
        )}

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
