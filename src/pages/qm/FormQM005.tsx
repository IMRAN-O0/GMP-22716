import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function FormQM005() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    ncrId: `NCR-${Date.now()}`,
    issueDate: new Date().toISOString().split("T")[0],
    department: "Production",
    productName: "",
    batchNumber: "",
    nonConformityType: "Product",
    severity: "Minor",
    description: "",
    immediateAction: "",
    disposition: "Quarantine",
    capaRequired: false,
    reportedBy: user?.name || "",
  });

  useEffect(() => {
    fetch("/api/materials")
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

  const handleSubmit = async (e: React.FormEvent, status: any = "approved") => {
    e.preventDefault();
    try {
      const editIdPatch = new URLSearchParams(window.location.search).get("edit");
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
          recordId: formData.ncrId,
          formId: "F-QM-005",
          department: "QM",
          creatorId: user?.id,
          status: status,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert(
        `تم حفظ تقرير عدم المطابقة (NCR) بنجاح (${status === "draft" ? "مسودة" : "معتمد"}): ` +
          saved.record_id,
      );
      navigate("/qm");
    } catch (err) {
      console.error(err);
      alert("فشل حفظ النموذج");
    }
  };

  const severityColors: Record<string, string> = {
    Minor: "bg-amber-50 border-amber-200 text-amber-800",
    Major: "bg-orange-50 border-orange-200 text-orange-800",
    Critical: "bg-red-50 border-red-200 text-red-800",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-red-200 shadow-sm border-r-4 border-r-red-600">
        <div className="p-3 bg-red-50 rounded-lg text-red-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            تقرير عدم المطابقة (NCR)
          </h1>
          <p className="text-slate-500">
            النموذج: F-QM-005 | قسم الجودة - ISO 22716
          </p>
        </div>
      </div>

      <form className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Row 1: NCR ID + Issue Date */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                رقم NCR (تلقائي)
              </label>
              <input
                type="text"
                readOnly
                className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono text-sm"
                value={formData.ncrId}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                تاريخ الإصدار <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500"
                value={formData.issueDate}
                onChange={(e) =>
                  setFormData({ ...formData, issueDate: e.target.value })
                }
              />
            </div>
          </div>

          {/* Row 2: Department + Reported By */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                القسم الذي رصد عدم المطابقة <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
              >
                <option value="Production">الإنتاج (Production)</option>
                <option value="Quality">الجودة (QC/QA)</option>
                <option value="Inventory">المخازن (Inventory)</option>
                <option value="Maintenance">الصيانة (Maintenance)</option>
                <option value="Lab">المختبر (Lab)</option>
                <option value="Customer">عميل (Customer)</option>
              </select>
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

          {/* Row 3: Product Name + Batch Number */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                اسم المنتج / المادة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                list="materials-list-qm005"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="ابحث باسم أو كود المنتج..."
                value={formData.productName}
                onChange={(e) =>
                  setFormData({ ...formData, productName: e.target.value })
                }
              />
              <datalist id="materials-list-qm005">
                {materials.map((m) => (
                  <option key={m.code} value={`${m.code} - ${m.name}`} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                رقم التشغيلة / الدفعة (Batch No.)
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 font-mono"
                dir="ltr"
                placeholder="BAT-..."
                value={formData.batchNumber}
                onChange={(e) =>
                  setFormData({ ...formData, batchNumber: e.target.value })
                }
              />
            </div>
          </div>

          {/* Row 4: Non-Conformity Type + Severity */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                نوع عدم المطابقة <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500"
                value={formData.nonConformityType}
                onChange={(e) =>
                  setFormData({ ...formData, nonConformityType: e.target.value })
                }
              >
                <option value="Product">منتج (Product)</option>
                <option value="Process">عملية (Process)</option>
                <option value="Material">مادة خام (Material)</option>
                <option value="Documentation">توثيق (Documentation)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                درجة الخطورة (Severity) <span className="text-red-500">*</span>
              </label>
              <select
                required
                className={`w-full px-4 py-2 border rounded-lg font-bold focus:ring-2 focus:ring-red-500 ${severityColors[formData.severity] || ""}`}
                value={formData.severity}
                onChange={(e) =>
                  setFormData({ ...formData, severity: e.target.value })
                }
              >
                <option value="Minor">طفيف (Minor)</option>
                <option value="Major">رئيسي (Major)</option>
                <option value="Critical">حرج (Critical)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              وصف تفصيلي لعدم المطابقة <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="وصف واضح ومحدد للمشكلة وكيفية اكتشافها..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Immediate Action */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              الإجراء الفوري المتخذ (Immediate Action) <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="مثال: تم عزل الدفعة، إيقاف الإنتاج، إخطار المسؤول..."
              value={formData.immediateAction}
              onChange={(e) =>
                setFormData({ ...formData, immediateAction: e.target.value })
              }
            />
          </div>

          {/* Disposition */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              التصرف في المنتج / المادة (Disposition) <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500"
              value={formData.disposition}
              onChange={(e) =>
                setFormData({ ...formData, disposition: e.target.value })
              }
            >
              <option value="Use As Is">قبول واستخدام كما هو (Use As Is)</option>
              <option value="Rework">إعادة معالجة (Rework)</option>
              <option value="Reject">رفض وإتلاف (Reject)</option>
              <option value="Quarantine">حجز للمراجعة (Quarantine)</option>
            </select>
          </div>

          {/* CAPA Required */}
          <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <input
              type="checkbox"
              id="capaRequired"
              className="w-5 h-5 text-orange-600 rounded"
              checked={formData.capaRequired}
              onChange={(e) =>
                setFormData({ ...formData, capaRequired: e.target.checked })
              }
            />
            <label
              htmlFor="capaRequired"
              className="font-semibold text-orange-900 cursor-pointer"
            >
              يتطلب إجراء CAPA (تصحيحي / وقائي) - Corrective &amp; Preventive Action Required
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-200 p-6">
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
                  user?.level === 3 ? "pending_approval" : "pending_review",
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
            onClick={() => navigate(-1)}
            className="text-slate-500 hover:text-slate-700 font-semibold text-[14px]"
          >
            إغلاق والعودة
          </button>
        </div>
      </form>
    </div>
  );
}
