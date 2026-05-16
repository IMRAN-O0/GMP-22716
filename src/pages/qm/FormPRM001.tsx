import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Building2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function FormPRM001() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    inspectionDate: new Date().toISOString().split("T")[0],
    inspectionArea: "Production Area", // Production, Warehouse, QC Lab
    cleanlinessStatus: "Pass", // Pass, Action Required, Fail
    pestControlStatus: "Pass",
    maintenanceRequired: false,
    maintenanceNotes: "",
    generalNotes: "",
    inspectorName: user?.name || "",
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
          recordId: `QM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          formId: "F-PRM-001",
          department: "QM",
          creatorId: user?.id,
          status: status,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert("تم حفظ نموذج تفتيش المباني بنجاح: " + saved.record_id);
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
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-sky-200 shadow-sm border-r-4 border-r-sky-500">
        <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
          <Building2 className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            تفتيش المباني والمرافق (Premises Inspection)
          </h1>
          <p className="text-slate-500">
            النموذج: F-PRM-001 | قسم الجودة - نظافة وسلامة المرافق
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                تاريخ التفتيش
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                value={formData.inspectionDate}
                onChange={(e) =>
                  setFormData({ ...formData, inspectionDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                المفتش (Inspector)
              </label>
              <input
                type="text"
                readOnly
                className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                value={formData.inspectorName}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              المنطقة او المرفق (Inspected Area)
            </label>
            <select
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg"
              value={formData.inspectionArea}
              onChange={(e) =>
                setFormData({ ...formData, inspectionArea: e.target.value })
              }
            >
              <option value="Production Area">
                منطقة الإنتاج (Production)
              </option>
              <option value="Raw Material Warehouse">
                مستودع المواد الخام (RM Warehouse)
              </option>
              <option value="Finished Goods Warehouse">
                مستودع المنتجات النهائية (FG Warehouse)
              </option>
              <option value="Packaging Area">
                منطقة التعبئة والتغليف (Packaging)
              </option>
              <option value="QC Lab">مختبر الجودة (QC Lab)</option>
              <option value="Washing Area">منطقة الغسيل (Washing)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                حالة النظافة العامة والصرف (Cleanliness)
              </label>
              <select
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg"
                value={formData.cleanlinessStatus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cleanlinessStatus: e.target.value,
                  })
                }
              >
                <option value="Pass">مطابق (Pass) - نظيف وجاف</option>
                <option value="Action Required">
                  ملاحظات (Action Required) - يحتاج عناية
                </option>
                <option value="Fail">غير مطابق (Fail) - غير نظيف</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                فحص مكافحة الآفات (Pest Control)
              </label>
              <select
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg"
                value={formData.pestControlStatus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pestControlStatus: e.target.value,
                  })
                }
              >
                <option value="Pass">لا يوجد نشاط (Clear)</option>
                <option value="Action Required">
                  اكتشاف نشاط - يتطلب رش (Action Required)
                </option>
                <option value="Fail">غزو - خطر شديد (Critical Fail)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <input
              type="checkbox"
              id="maintReq"
              className="w-5 h-5 text-sky-600 rounded"
              checked={formData.maintenanceRequired}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maintenanceRequired: e.target.checked,
                })
              }
            />
            <label
              htmlFor="maintReq"
              className="font-semibold text-slate-800 cursor-pointer"
            >
              هل توجد أعطال في المبنى تتطلب صيانة (مثل: تشققات في الحوائط، تسريب
              سقف)؟
            </label>
          </div>

          {formData.maintenanceRequired && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                وصف العطل في المرفق (Maintenance Details)
              </label>
              <textarea
                rows={2}
                className="w-full px-4 py-2 bg-rose-50 border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                placeholder="وصف أعمال الصيانة المطلوبة للحفاظ على الـ GMP..."
                value={formData.maintenanceNotes}
                onChange={(e) =>
                  setFormData({ ...formData, maintenanceNotes: e.target.value })
                }
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              ملاحظات والتوجيهات (General Notes)
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
              placeholder="أي ملاحظات إضافية حول الإضاءة، التهوية، إلخ..."
              value={formData.generalNotes}
              onChange={(e) =>
                setFormData({ ...formData, generalNotes: e.target.value })
              }
            />
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
