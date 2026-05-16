import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, AlertTriangle, MessageSquare } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateSerialNumber } from "../../lib/utils";

export default function FormCMP001() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [materials, setMaterials] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/materials")
      .then((r) => r.json())
      .then((data) => {
        setMaterials(
          data.filter(
            (m: any) =>
              m.category === "منتج نهائي" ||
              m.category === "Finished Product" ||
              m.code?.startsWith("PRD"),
          ),
        );
      })
      .catch(console.error);

    fetch("/api/customers")
      .then((r) => r.json())
      .then((data) => setCustomers(data))
      .catch(console.error);
  }, []);

  const [loading, setLoading] = useState(false);
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    complaintId: generateSerialNumber("CMP", Math.floor(Math.random() * 10000)),
    complaintDate: new Date().toISOString().split("T")[0],
    customerName: "",
    contactInfo: "",
    productName: "",
    batchNumber: "",
    complaintDetails: "",
    investigationDetails: "",
    rootCause: "",
    correctiveAction: "",
    responseToCustomer: "",
    capaRequired: false,
    status: "Open",
    reportedBy: user?.name || "",
  });

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
          recordId: formData.complaintId,
          formId: "F-CMP-001",
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
        `تم حفظ سجل الشكوى بنجاح (${status === "draft" ? "مسودة" : "معتمد"}): ` +
          saved.record_id,
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
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-fuchsia-200 shadow-sm border-r-4 border-r-fuchsia-500">
        <div className="p-3 bg-fuchsia-50 rounded-lg text-fuchsia-600">
          <MessageSquare className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            تسجيل وتحقيق والرد على الشكاوى
          </h1>
          <p className="text-slate-500">النموذج: F-CMP-001 | قسم الجودة</p>
        </div>
      </div>

      <form className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-8">
          {/* General Data */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
              تفاصيل الشكوى الأولية
            </h3>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  تاريخ تسجيل الشكوى <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  value={formData.complaintDate}
                  onChange={(e) =>
                    setFormData({ ...formData, complaintDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  رقم الشكوى (تلقائي)
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                  value={formData.complaintId}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  اسم العميل / الجهة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  list="customers-list-cmp001"
                  required
                  placeholder="ابحث بكود أو اسم العميل..."
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                />
                <datalist id="customers-list-cmp001">
                  {customers && customers.map((c, i) => (
                    <option key={i} value={c.name}>
                      {c.code}
                    </option>
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  معلومات التواصل
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  placeholder="رقم الهاتف أو البريد الإلكتروني"
                  value={formData.contactInfo}
                  onChange={(e) =>
                    setFormData({ ...formData, contactInfo: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  المنتج المتعلق بالشكوى <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  list="products-list-cmp"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  value={formData.productName}
                  onChange={(e) =>
                    setFormData({ ...formData, productName: e.target.value })
                  }
                />
                <datalist id="products-list-cmp">
                  {materials.map((m) => (
                    <option key={m.id} value={`${m.code} - ${m.name}`} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  رقم التشغيلة (Batch Number){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  value={formData.batchNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, batchNumber: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                تفاصيل الشكوى كما وردت من العميل{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                placeholder="يرجى كتابة التفاصيل الدقيقة للأعطال أو الملاحظات..."
                value={formData.complaintDetails}
                onChange={(e) =>
                  setFormData({ ...formData, complaintDetails: e.target.value })
                }
              />
            </div>
          </div>

          {/* Investigation Data */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
              تحقيق قسم الجودة والقرار
            </h3>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  حالة الشكوى المبدئية
                </label>
                <select
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-fuchsia-500"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="Open">مفتوحة (قيد التحقيق)</option>
                  <option value="Under Review">قيد المراجعة الفنية</option>
                  <option value="Resolved">تم الحل (مغلقة)</option>
                  <option value="Rejected">مرفوضة (غير مبررة)</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                تفاصيل التحقيق (Investigation)
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                placeholder="خطوات التحقيق وما تبين منها..."
                value={formData.investigationDetails}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    investigationDetails: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  السبب الجذري (Root Cause)
                </label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  value={formData.rootCause}
                  onChange={(e) =>
                    setFormData({ ...formData, rootCause: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  الفعل التصحيحي (Corrective Action)
                </label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  value={formData.correctiveAction}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      correctiveAction: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                الرد الرسمي للعميل (Response to Customer)
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                placeholder="ما سيتم إرساله للعميل بناءً على التحقيق..."
                value={formData.responseToCustomer}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    responseToCustomer: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-fuchsia-50 border border-fuchsia-100 rounded-lg mt-6">
              <AlertTriangle className="w-6 h-6 text-fuchsia-500" />
              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="capaReq"
                    className="w-5 h-5 text-fuchsia-600 rounded"
                    checked={formData.capaRequired}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capaRequired: e.target.checked,
                      })
                    }
                  />
                  <label
                    htmlFor="capaReq"
                    className="font-bold text-fuchsia-900 cursor-pointer"
                  >
                    تصعيد إلى خطة إجراء تصحيحي ووقائي (CAPA)
                  </label>
                </div>
                <p className="text-xs text-fuchsia-700 mt-1 mr-7">
                  حدد إذا كانت الشكوى تستدعي إصدار نموذج CAPA لتجنب تكرار الخطأ.
                </p>
              </div>
            </div>
          </div>
        </div>

        {savedRecordId && formData.capaRequired && (
          <div className="p-4 bg-fuchsia-50 border border-fuchsia-200 rounded-xl flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-fuchsia-900">تم حفظ الشكوى بنجاح</p>
              <p className="text-sm text-fuchsia-700">سيتم إنشاء نموذج CAPA تلقائياً في قسم الجودة. يمكنك أيضاً فتحه الآن وتعبئته يدوياً.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/qm/qm-006?fromCmp=${savedRecordId}`)}
              className="flex-shrink-0 px-4 py-2 bg-fuchsia-600 text-white rounded-lg font-bold hover:bg-fuchsia-700 text-sm"
            >
              فتح نموذج CAPA ←
            </button>
          </div>
        )}

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
