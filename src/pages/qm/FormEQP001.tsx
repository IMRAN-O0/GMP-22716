import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Settings } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function FormEQP001() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    equipmentId: "",
    equipmentName: "",
    calibrationDate: "",
    nextCalibrationDate: "",
    status: "Operational", // Operational, Out of Order, UnderMaintenance
    remarks: "",
    recorder: user?.name || "",
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
          formId: "F-EQP-001",
          department: "QM",
          creatorId: user?.id,
          status: status,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert("تم حفظ نموذج المعدات بنجاح: " + saved.record_id);
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
          <Settings className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            سجلات وفحوصات المعدات ومعايرتها (Equipment Log)
          </h1>
          <p className="text-slate-500">النموذج: F-EQP-001</p>
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">رمز المعدة/الماكينة (Eq. ID)</label>
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
            <label className="block mb-1">اسم المعدة (Eq. Name)</label>
            <input
              type="text"
              required
              className="w-full border p-2 rounded"
              value={formData.equipmentName}
              onChange={(e) =>
                setFormData({ ...formData, equipmentName: e.target.value })
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">تاريخ المعايرة / الفحص الأخير</label>
            <input
              type="date"
              required
              className="w-full border p-2 rounded"
              value={formData.calibrationDate}
              onChange={(e) =>
                setFormData({ ...formData, calibrationDate: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block mb-1">تاريخ المعايرة المستهدف القادم</label>
            <input
              type="date"
              required
              className="w-full border p-2 rounded"
              value={formData.nextCalibrationDate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nextCalibrationDate: e.target.value,
                })
              }
            />
          </div>
        </div>
        <div>
          <label className="block mb-1">حالة المعدة الحالية</label>
          <select
            className="w-full border p-2 rounded font-bold"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
          >
            <option value="Operational" className="text-emerald-700">
              تعمل بكفاءة ومعايرة (Operational)
            </option>
            <option value="UnderMaintenance" className="text-amber-700">
              تحت الصيانة (Under Maintenance)
            </option>
            <option value="Out of Order" className="text-rose-700">
              خارج الخدمة (Out of Order)
            </option>
          </select>
        </div>
        <div>
          <label className="block mb-1">ملاحظات والتصليحات الأخيرة</label>
          <textarea
            className="w-full border p-2 rounded"
            rows={3}
            value={formData.remarks}
            onChange={(e) =>
              setFormData({ ...formData, remarks: e.target.value })
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
