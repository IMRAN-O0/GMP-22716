import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Award } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { nextSequentialId, getAuthHeaders, getJsonHeaders } from "../../lib/utils";

export default function FormTRN004() {
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
    certId: "",
    issueDate: new Date().toISOString().split("T")[0],
    employeeId: "",
    employeeName: "",
    trainingCourse: "",
    completionDate: "",
    providerName: "",
    hours: "",
    grade: "Passed",
    notes: "",
    issuerName: user?.name || "",
  });

  const handleEmployeeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const empId = e.target.value;
    const emp = employees.find((emp) => emp.id.toString() === empId);
    if (emp) {
      setFormData({
        ...formData,
        employeeId: empId,
        employeeName: emp.full_name_ar || emp.full_name_en || "",
      });
    } else {
      setFormData({
        ...formData,
        employeeId: "",
        employeeName: "",
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
          recordId: formData.certId || nextSequentialId("TRN-CERT", []),
          formId: "F-TRN-004",
          department: "HRT",
          creatorId: user?.id,
          status: status,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert(
        `تم التوثيق بنجاح (${status === "draft" ? "مسودة" : "معتمد"}): ` +
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
            .filter((f: any) => f.form_id === "F-TRN-004")
            .map((f: any) => f.record_id);
          setFormData((prev) => ({ ...prev, certId: nextSequentialId("TRN-CERT", ids) }));
        })
        .catch(() => {});
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-indigo-200 shadow-sm border-r-4 border-r-indigo-600">
        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
          <Award className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            سجل وتوثيق شهادة إتمام التدريب
          </h1>
          <p className="text-slate-500">
            النموذج: F-TRN-004 | قطاع التدريب والتطوير
          </p>
        </div>
      </div>

      <form className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-8">
          <div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  الرقم المرجعي (تلقائي)
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                  value={formData.certId}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  تاريخ إصدار التوثيق <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.issueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, issueDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  اسم الموظف الحاصل على الشهادة{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={handleEmployeeSelect}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-700"
                >
                  <option value="">-- اختر موظفاً --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name_ar || emp.full_name_en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                اسم البرنامج التدريبي / الشهادة الممنوحة{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="مثال: دورة النظافة الصناعية وتطبيقاتها"
                value={formData.trainingCourse}
                onChange={(e) =>
                  setFormData({ ...formData, trainingCourse: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  الجهة المانحة (Provider){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.providerName}
                  onChange={(e) =>
                    setFormData({ ...formData, providerName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  ساعات التدريب
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.hours}
                  onChange={(e) =>
                    setFormData({ ...formData, hours: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  تاريخ الانتهاء
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.completionDate}
                  onChange={(e) =>
                    setFormData({ ...formData, completionDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  تقرير الدرجة / الاجتياز
                </label>
                <select
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.grade}
                  onChange={(e) =>
                    setFormData({ ...formData, grade: e.target.value })
                  }
                >
                  <option value="Passed">اجتياز (Passed)</option>
                  <option value="Excellent">تفوّق (Excellent)</option>
                  <option value="Attended Only">حضور فقط (Attended)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  اسم معتمد السجل <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.issuerName}
                  onChange={(e) =>
                    setFormData({ ...formData, issuerName: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                أية ملاحظات إضافية بخصوص شهادة الاعتماد
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
