import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, AlertTriangle, Activity } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateSerialNumber } from "../../lib/utils";

export default function FormRCL001() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [materials, setMaterials] = useState<any[]>([]);

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
  }, []);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    recallId: generateSerialNumber("RCL", Math.floor(Math.random() * 10000)),
    recallDate: new Date().toISOString().split("T")[0],
    productName: "",
    batchNumber: "",
    affectedQuantity: "",
    recoveredQuantity: "",
    reasonForRecall: "",
    actionPlan: "",
    communications: "",
    status: "Open",
    authorizedBy: user?.name || "",
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
          recordId: formData.recallId,
          formId: "F-RCL-001",
          department: "QM",
          creatorId: user?.id,
          status: status,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert(
        `تم حفظ سجل السحب بنجاح (${status === "draft" ? "مسودة" : "معتمد"}): ` +
          saved.record_id,
      );
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
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-rose-200 shadow-sm border-r-4 border-r-rose-600">
        <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
          <Activity className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            سجل وقرارات سحب المنتجات (Recalls)
          </h1>
          <p className="text-slate-500">
            النموذج: F-RCL-001 | قسم الجودة وإدارة المخاطر
          </p>
        </div>
      </div>

      <form className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-8">
          <div className="bg-rose-50 p-4 border border-rose-200 rounded-lg text-rose-800 text-sm mb-6 flex gap-3">
            <AlertTriangle className="w-6 h-6 shrink-0 text-rose-600" />
            <p>
              تحذير: إجراء الاستدعاء أو السحب يُعد قراراً سيادياً مهماً ويتطلب
              المبرر القوي والتنسيق الفوري مع إدارة المبيعات والهيئات الرقابية
              عند الضرورة.
            </p>
          </div>

          {/* General Data */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
              تفاصيل خطة السحب
            </h3>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  تاريخ إصدار القرار <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                  value={formData.recallDate}
                  onChange={(e) =>
                    setFormData({ ...formData, recallDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  الرقم المرجعي (تلقائي)
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                  value={formData.recallId}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  اسم المنتج المراد سحبه <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  list="products-list"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                  placeholder="مثال: كريم مرطب ..."
                  value={formData.productName}
                  onChange={(e) =>
                    setFormData({ ...formData, productName: e.target.value })
                  }
                />
                <datalist id="products-list">
                  {materials.map((m) => (
                    <option key={m.id} value={`${m.code} - ${m.name}`} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  رقم التشغيلة (Batch) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                  value={formData.batchNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, batchNumber: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  الكمية الإجمالية المتأثرة{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                  placeholder="مثال: 5000 عبوة"
                  value={formData.affectedQuantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      affectedQuantity: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  الكمية المستردة حتى الآن
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                  value={formData.recoveredQuantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recoveredQuantity: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                أسباب السحب والاستدعاء (Reason for Recall){" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                placeholder="الأسباب الفنية أو الجودوية التي استدعت السحب..."
                value={formData.reasonForRecall}
                onChange={(e) =>
                  setFormData({ ...formData, reasonForRecall: e.target.value })
                }
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                خطة سحب وإجراءات التخلص من المنتج (Action Plan)
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                placeholder="كيف سيتم التخلص من المنتج المسترد؟ الإتلاف، إعادة التدوير؟"
                value={formData.actionPlan}
                onChange={(e) =>
                  setFormData({ ...formData, actionPlan: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  التواصل مع الجهات والهيئات (Communications)
                </label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                  placeholder="سجل التواصل ونتيجة الإبلاغ..."
                  value={formData.communications}
                  onChange={(e) =>
                    setFormData({ ...formData, communications: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  حالة أمر السحب
                </label>
                <select
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-rose-500"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="Open">جاري السحب والتواصل</option>
                  <option value="Partially Recovered">مسترد جزئياً</option>
                  <option value="Closed">تم إغلاق ملف السحب بالكامل</option>
                </select>
              </div>
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
