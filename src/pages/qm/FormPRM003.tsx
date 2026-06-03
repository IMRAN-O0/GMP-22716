import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Lightbulb } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getJsonHeaders } from "../../lib/utils";

export default function FormPRM003() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    inspectionDate: new Date().toISOString().split("T")[0],
    area: "Production Area",
    luxReading: "",
    lightCoversIntact: "Yes",
    fixturesClean: "Yes",
    notes: "",
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
        headers: getJsonHeaders(),
        body: JSON.stringify({
          recordId: `QM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          formId: "F-PRM-003",
          department: "QM",
          creatorId: user?.id,
          status: status,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert("تم حفظ نموذج الإضاءة بنجاح: " + saved.record_id);
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
          <Lightbulb className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            فحص أنظمة الإضاءة (Lighting Inspection)
          </h1>
          <p className="text-slate-500">النموذج: F-PRM-003 | قسم الجودة</p>
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
                تاريخ الفحص
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
                المفتش
              </label>
              <input
                type="text"
                readOnly
                className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                value={formData.inspectorName}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                المنطقة
              </label>
              <select
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg"
                value={formData.area}
                onChange={(e) =>
                  setFormData({ ...formData, area: e.target.value })
                }
              >
                <option value="Production Area">الإنتاج</option>
                <option value="QC Lab">المختبر</option>
                <option value="Warehouse">المستودع</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                شدة الإضاءة باللوكس (Lux Reading)
              </label>
              <input
                type="number"
                required
                placeholder="مثال: 500"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                value={formData.luxReading}
                onChange={(e) =>
                  setFormData({ ...formData, luxReading: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                هل أغطية الحماية سليمة؟ (Covers Intact)
              </label>
              <select
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg"
                value={formData.lightCoversIntact}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lightCoversIntact: e.target.value,
                  })
                }
              >
                <option value="Yes">نعم - سليمة</option>
                <option value="No">لا - يوجد كسر أو مفقودة</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                هل لمبات الإضاءة نظيفة؟ (Fixtures Clean)
              </label>
              <select
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg"
                value={formData.fixturesClean}
                onChange={(e) =>
                  setFormData({ ...formData, fixturesClean: e.target.value })
                }
              >
                <option value="Yes">نعم</option>
                <option value="No">لا</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              ملاحظات (Notes)
            </label>
            <textarea
              rows={2}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
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
