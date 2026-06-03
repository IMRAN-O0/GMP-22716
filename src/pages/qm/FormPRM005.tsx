import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Droplets } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getJsonHeaders } from "../../lib/utils";

export default function FormPRM005() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    area: "Production",
    drainStatus: "Clean", // Clean, Blocked, Needs Maintenance
    odorsPresent: "No",
    notes: "",
    inspector: user?.name || "",
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
          formId: "F-PRM-005",
          department: "QM",
          creatorId: user?.id,
          status: status,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert("تم حفظ نموذج الصرف بنجاح: " + saved.record_id);
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
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-sky-200 shadow-sm border-r-4 border-r-sky-500">
        <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
          <Droplets className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            فحص أنظمة الصرف (Drainage Inspection)
          </h1>
          <p className="text-slate-500">النموذج: F-PRM-005</p>
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">التاريخ</label>
            <input
              type="date"
              className="w-full border p-2 rounded"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block mb-1">المفتش</label>
            <input
              type="text"
              readOnly
              className="w-full border p-2 rounded bg-slate-50"
              value={formData.inspector}
            />
          </div>
        </div>
        <div>
          <label className="block mb-1">المنطقة</label>
          <select
            className="w-full border p-2 rounded"
            value={formData.area}
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
          >
            <option value="Production">الإنتاج</option>
            <option value="Washing Area">منطقة الغسيل</option>
            <option value="Warehouse">المستودع</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">حالة المصارف (Drain Status)</label>
            <select
              className="w-full border p-2 rounded"
              value={formData.drainStatus}
              onChange={(e) =>
                setFormData({ ...formData, drainStatus: e.target.value })
              }
            >
              <option value="Clean">نظيفة وسالكة (Clean)</option>
              <option value="Blocked">مسدودة (Blocked)</option>
              <option value="Needs Maintenance">
                تحتاج صيانة (Needs Maintenance)
              </option>
            </select>
          </div>
          <div>
            <label className="block mb-1">
              انبعاث روائح راجعة (Odors Present)
            </label>
            <select
              className="w-full border p-2 rounded"
              value={formData.odorsPresent}
              onChange={(e) =>
                setFormData({ ...formData, odorsPresent: e.target.value })
              }
            >
              <option value="No">لا توجد</option>
              <option value="Yes">نعم توجد روائح</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block mb-1">ملاحظات</label>
          <textarea
            className="w-full border p-2 rounded"
            rows={2}
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
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
