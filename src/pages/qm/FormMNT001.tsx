import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Wrench } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function FormMNT001() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    equipmentId: "",
    maintenanceType: "Preventive", // Preventive, Corrective
    description: "",
    partsReplaced: "",
    results: "",
    technician: user?.name || "",
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
          formId: "F-MNT-001",
          department: "QM",
          creatorId: user?.id,
          status: status,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert("تم حفظ نموذج الصيانة بنجاح: " + saved.record_id);
      navigate("/qm");
    } catch (err) {
      console.error(err);
      alert("فشل حفظ");
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
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-emerald-200 shadow-sm border-r-4 border-r-emerald-500">
        <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
          <Wrench className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            خطط وسجلات الصيانة (Maintenance Record)
          </h1>
          <p className="text-slate-500">النموذج: F-MNT-001</p>
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">رمز الآلة / المعدة (Eq. ID)</label>
            <input
              type="text"
              required
              className="w-full border p-2 rounded"
              value={formData.equipmentId}
              onChange={(e) =>
                setFormData({ ...formData, equipmentId: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block mb-1">نوع الصيانة</label>
            <select
              className="w-full border p-2 rounded"
              value={formData.maintenanceType}
              onChange={(e) =>
                setFormData({ ...formData, maintenanceType: e.target.value })
              }
            >
              <option value="Preventive">دورية وقائية (Preventive)</option>
              <option value="Corrective">علاجية طارئة (Corrective)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block mb-1">وصف العمل الذي تم إنجازه</label>
          <textarea
            required
            className="w-full border p-2 rounded"
            rows={3}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block mb-1">القطع المستبدلة (إن وجدت)</label>
          <textarea
            className="w-full border p-2 rounded"
            rows={2}
            value={formData.partsReplaced}
            onChange={(e) =>
              setFormData({ ...formData, partsReplaced: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block mb-1">
            نتائج فحص ما بعد الصيانة (هل تعمل بكفاءة؟)
          </label>
          <textarea
            required
            className="w-full border p-2 rounded"
            rows={2}
            value={formData.results}
            onChange={(e) =>
              setFormData({ ...formData, results: e.target.value })
            }
          />
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
