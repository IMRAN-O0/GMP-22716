import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, FileText, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { nextSequentialId, getAuthHeaders, getJsonHeaders } from "../../lib/utils";

export default function FormTRN002() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/employees", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => setEmployees(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    recordId: "",
    date: new Date().toISOString().split("T")[0],
    employeeId: "",
    employeeName: "",
    department: "",
    trainingCourse: "",
    startDate: "",
    endDate: "",
    totalHours: "",
    provider: "",
    notes: "",
    preparedBy: user?.name || "",
  });

  const handleEmployeeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const empId = e.target.value;
    const emp = employees.find((emp) => emp.id.toString() === empId);
    if (emp) {
      setFormData({
        ...formData,
        employeeId: empId,
        employeeName: emp.full_name_ar || emp.full_name_en || "",
        department: emp.department || "",
      });
    } else {
      setFormData({
        ...formData,
        employeeId: "",
        employeeName: "",
        department: "",
      });
    }
  };

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
          recordId: formData.recordId || nextSequentialId("TRN-REC", []),
          formId: "F-TRN-002",
          department: "HRT",
          creatorId: user?.id,
          status: status,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert(
        `تم الحفظ بنجاح (${status === "draft" ? "مسودة" : "معتمد"}): ` +
          saved.record_id,
      );
      navigate("/hr");
    } catch (err) {
      console.error(err);
      alert("فشل حفظ النموذج");
    }
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    if (editId) {
      fetch(`/api/forms/record/${editId}`, { headers: getAuthHeaders() })
        .then((r) => r.json())
        .then((data) => {
          if (data && data.data) {
            setFormData((prev) => ({ ...prev, ...data.data }));
          }
        })
        .catch(() => {});
    } else {
      fetch("/api/forms/dept/HRT", { headers: getAuthHeaders() })
        .then((r) => r.json())
        .then((data) => {
          const rows = Array.isArray(data) ? data : [];
          const ids = rows
            .filter((f: any) => f.form_id === "F-TRN-002")
            .map((f: any) => f.record_id);
          setFormData((prev) => ({ ...prev, recordId: nextSequentialId("TRN-REC", ids) }));
        })
        .catch(() => {});
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-sky-200 shadow-sm border-r-4 border-r-sky-500">
        <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
          <FileText className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            سجل التدريب الفردي للموظف
          </h1>
          <p className="text-slate-500">
            النموذج: F-TRN-002 | قطاع التدريب والتطوير
          </p>
        </div>
      </div>

      <form className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-8">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-sky-500" />
              بيانات الموظف
            </h3>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  رقم السجل (تلقائي)
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                  value={formData.recordId}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  تاريخ التسجيل
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  اختيار الموظف (من سجلات الموارد البشرية){" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={handleEmployeeSelect}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 text-slate-700"
                >
                  <option value="">-- اختر موظفاً --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name_ar || emp.full_name_en}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  القسم / الإدارة
                </label>
                <input
                  type="text"
                  readOnly
                  placeholder="يتم التعبئة تلقائياً..."
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                  value={formData.department}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
              بيانات الدورة التدريبية
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                اسم الدورة التدريبية <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                placeholder="مثال: الإسعافات الأولية وتدابير السلامة"
                value={formData.trainingCourse}
                onChange={(e) =>
                  setFormData({ ...formData, trainingCourse: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  تاريخ بداية التدريب <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  تاريخ نهاية التدريب <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  إجمالي ساعات التدريب <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                  placeholder="مثال: 16"
                  value={formData.totalHours}
                  onChange={(e) =>
                    setFormData({ ...formData, totalHours: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  جهة التدريب والمحاضر <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                  placeholder="داخلي أو خارجي..."
                  value={formData.provider}
                  onChange={(e) =>
                    setFormData({ ...formData, provider: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                ملاحظات والتوصيات
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                placeholder="أية ملاحظات إضافية حول أداء الموظف خلال التدريب..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
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
