import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Pencil, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getAuthHeaders, getJsonHeaders } from "../../lib/utils";

const emptyForm = {
  date: new Date().toISOString().split("T")[0],
  equipmentId: "",
  equipmentName: "",
  calibrationDate: "",
  nextCalibrationDate: "",
  status: "Operational",
  remarks: "",
  recorder: "",
};

export default function FormEQP001() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ ...emptyForm, recorder: user?.name || "" });
  const [records, setRecords] = useState<any[]>([]);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/forms/dept/QM", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        setRecords(rows.filter((r: any) => r.form_id === "F-EQP-001"));
      })
      .catch(console.error);

    const editId = new URLSearchParams(window.location.search).get("edit");
    if (editId) {
      fetch(`/api/forms/record/${editId}`, { headers: getAuthHeaders() })
        .then((r) => r.json())
        .then((data) => {
          if (data && data.data) {
            setFormData((prev) => ({ ...prev, ...data.data }));
            setEditingRecordId(editId);
          }
        })
        .catch(console.error);
    }
  }, []);

  const startEdit = (record: any) => {
    setEditingRecordId(record.record_id);
    setFormData({ ...emptyForm, ...(record.data || {}) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingRecordId(null);
    setFormData({ ...emptyForm, recorder: user?.name || "" });
  };

  const handleSubmit = async (e: React.FormEvent, status: any = "approved") => {
    e.preventDefault();
    try {
      if (editingRecordId) {
        const res = await fetch(`/api/forms/record/${editingRecordId}`, {
          method: "PUT",
          headers: getJsonHeaders(),
          body: JSON.stringify({ status, data: formData }),
        });
        if (!res.ok) throw new Error("Update failed");
        setRecords((prev) =>
          prev.map((r) =>
            r.record_id === editingRecordId ? { ...r, data: formData, status } : r
          )
        );
        cancelEdit();
        alert("تم تعديل سجل المعدة بنجاح");
        return;
      }

      if (status === "draft") {
        const editIdPatch = new URLSearchParams(window.location.search).get("edit");
        const fetchUrl = editIdPatch ? `/api/forms/record/${editIdPatch}` : "/api/forms";
        const fetchMethod = editIdPatch ? "PUT" : "POST";
        const res = await fetch(fetchUrl, {
          method: fetchMethod,
          headers: getJsonHeaders(),
          body: JSON.stringify({
            recordId: `QM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            formId: "F-EQP-001",
            department: "QM",
            creatorId: user?.id,
            status: "draft",
            data: formData,
          }),
        });
        if (res.ok) {
          alert("تم حفظ المسودة بنجاح");
          window.location.reload();
        } else {
          const err = await res.json().catch(() => ({ error: "Unknown" }));
          alert("حدث خطأ: " + err.error);
        }
        return;
      }

      const res = await fetch("/api/forms", {
        method: "POST",
        headers: getJsonHeaders(),
        body: JSON.stringify({
          recordId: `QM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          formId: "F-EQP-001",
          department: "QM",
          creatorId: user?.id,
          status,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      setRecords((prev) => [{ record_id: saved.record_id, form_id: "F-EQP-001", data: formData, status }, ...prev]);
      setFormData({ ...emptyForm, recorder: user?.name || "" });
      alert("تم حفظ نموذج المعدات بنجاح: " + saved.record_id);
    } catch (err) {
      console.error(err);
      alert("فشل حفظ السجل");
    }
  };

  const statusLabel = (s: string) => {
    if (s === "Operational") return "تعمل بكفاءة";
    if (s === "UnderMaintenance") return "تحت الصيانة";
    if (s === "Out of Order") return "خارج الخدمة";
    return s;
  };

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
        {editingRecordId && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-[13px] font-bold text-amber-800">
              <Pencil className="w-4 h-4 inline ml-1" />
              وضع التعديل — قم بتعديل البيانات ثم اضغط "حفظ التعديل"
            </span>
            <button
              type="button"
              onClick={cancelEdit}
              className="flex items-center gap-1 text-[12px] text-amber-700 hover:text-red-600 font-semibold"
            >
              <X className="w-4 h-4" /> إلغاء التعديل
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">رمز المعدة/الماكينة (Eq. ID)</label>
            <input
              type="text"
              required
              className="w-full border p-2 rounded"
              value={formData.equipmentId}
              onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
            />
          </div>
          <div>
            <label className="block mb-1">اسم المعدة (Eq. Name)</label>
            <input
              type="text"
              required
              className="w-full border p-2 rounded"
              value={formData.equipmentName}
              onChange={(e) => setFormData({ ...formData, equipmentName: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, calibrationDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block mb-1">تاريخ المعايرة المستهدف القادم</label>
            <input
              type="date"
              required
              className="w-full border p-2 rounded"
              value={formData.nextCalibrationDate}
              onChange={(e) => setFormData({ ...formData, nextCalibrationDate: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block mb-1">حالة المعدة الحالية</label>
          <select
            className="w-full border p-2 rounded font-bold"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="Operational">تعمل بكفاءة ومعايرة (Operational)</option>
            <option value="UnderMaintenance">تحت الصيانة (Under Maintenance)</option>
            <option value="Out of Order">خارج الخدمة (Out of Order)</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">ملاحظات والتصليحات الأخيرة</label>
          <textarea
            className="w-full border p-2 rounded"
            rows={3}
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-200">
          {!editingRecordId && (
            <button
              type="button"
              onClick={(e) => handleSubmit(e, "draft")}
              className="flex items-center px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[14px]"
            >
              حفظ كمسودة
            </button>
          )}

          {editingRecordId ? (
            <button
              type="button"
              onClick={(e) => handleSubmit(e, "approved")}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-semibold text-[14px]"
            >
              <Pencil className="w-4 h-4" /> حفظ التعديل
            </button>
          ) : user?.level <= 2 ? (
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
              onClick={(e) => handleSubmit(e, user?.level === 3 ? "pending_approval" : "pending_review")}
              className="flex items-center px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold text-[14px]"
            >
              إرسال للمراجعة
            </button>
          )}

          <div className="flex-1"></div>
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) navigate(-1);
              else navigate("/");
            }}
            className="text-slate-500 hover:text-slate-700 font-semibold text-[14px]"
          >
            إغلاق والعودة
          </button>
        </div>
      </form>

      {records.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-[15px] font-bold text-slate-700">سجلات المعدات المسجلة</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[13px]">
                  <th className="p-3 border-b font-semibold">رمز المعدة</th>
                  <th className="p-3 border-b font-semibold">اسم المعدة</th>
                  <th className="p-3 border-b font-semibold">الحالة</th>
                  <th className="p-3 border-b font-semibold">تاريخ المعايرة</th>
                  {user?.level <= 2 && <th className="p-3 border-b font-semibold text-center w-24">إجراء</th>}
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.record_id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-mono text-emerald-700 font-bold">{r.data?.equipmentId || r.record_id}</td>
                    <td className="p-3 text-slate-800">{r.data?.equipmentName || "—"}</td>
                    <td className="p-3 text-slate-500">{statusLabel(r.data?.status || "")}</td>
                    <td className="p-3 text-slate-500">{r.data?.calibrationDate || "—"}</td>
                    {user?.level <= 2 && (
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => startEdit(r)}
                          className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-[11px] font-bold border border-amber-200 transition-colors mx-auto"
                        >
                          <Pencil className="w-3 h-3" /> تعديل
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
