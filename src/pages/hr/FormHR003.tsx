import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateSerialNumber } from "../../lib/utils";

export default function FormHR003() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeNumber: "",
    department: "",
    examDate: "",
    examType: "فحص دوري",
    facilityName: "",
    result: "لائق",
    medicalNotes: "",
    nextExamDate: "",
    officerName: "",
  });

  const [date] = useState(new Date().toLocaleDateString("ar-EG"));

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((data) => setEmployees(data))
      .catch(console.error);
  }, []);

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const empId = e.target.value;
    const emp = employees.find((x) => x.id.toString() === empId);
    if (emp) {
      setFormData({
        ...formData,
        employeeId: empId,
        employeeNumber: emp.employee_number,
        department: emp.department,
      });
    } else {
      setFormData({
        ...formData,
        employeeId: "",
        employeeNumber: "",
        department: "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent, status: any) => {
    e.preventDefault();
    const recordId = generateSerialNumber(
      "HR",
      Math.floor(Math.random() * 1000),
    );

    const payload = {
      recordId,
      formId: "F-HR-003",
      department: "HR",
      creatorId: user?.id,
      status,
      data: formData,
    };

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
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert(`تم الحفظ بنجاح. رقم المستند: ${recordId}`);
        navigate("/hr");
      } else {
        const errData = await res.json().catch(() => ({ error: "حدث خطأ أثناء الحفظ" }));
        alert(errData.error || "حدث خطأ أثناء الحفظ");
      }
    } catch (err) {
      console.error(err);
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
    <div className="max-w-4xl mx-auto bg-white border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden">
      <div className="border-b border-slate-200 p-6 flex justify-between items-center bg-slate-50">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            الشركة الحديثة للتجميل
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            ISO 22716 - GMP
          </p>
        </div>
        <div className="text-left">
          <h2 className="text-xl font-bold text-slate-800 mb-1">
            الفحص الطبي للموظفين
          </h2>
          <p className="text-sm font-mono text-slate-500">نموذج: F-HR-003</p>
          <p className="text-sm font-mono text-slate-500">
            تاريخ الإصدار: 01-01-2025
          </p>
        </div>
      </div>

      <form className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="md:col-span-2">
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              اسم الموظف <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.employeeId}
              onChange={handleEmployeeChange}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            >
              <option value="">-- اختر الموظف --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name_ar} ({emp.employee_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              رقم الموظف (تلقائي)
            </label>
            <input
              type="text"
              disabled
              value={formData.employeeNumber}
              className="w-full border-transparent bg-slate-100 rounded-lg shadow-sm text-sm py-2 text-slate-600 font-mono"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              القسم (تلقائي)
            </label>
            <input
              type="text"
              disabled
              value={formData.department}
              className="w-full border-transparent bg-slate-100 rounded-lg shadow-sm text-sm py-2 text-slate-600"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              تاريخ الفحص <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.examDate}
              onChange={(e) =>
                setFormData({ ...formData, examDate: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              نوع الفحص <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.examType}
              onChange={(e) =>
                setFormData({ ...formData, examType: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            >
              <option>فحص ما قبل التوظيف</option>
              <option>فحص دوري</option>
              <option>فحص بعد إجازة مرضية طويلة</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              اسم الطبيب أو المنشأة الطبية{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.facilityName}
              onChange={(e) =>
                setFormData({ ...formData, facilityName: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              نتيجة الفحص <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.result}
              onChange={(e) =>
                setFormData({ ...formData, result: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            >
              <option>لائق</option>
              <option>لائق بشروط</option>
              <option>غير لائق</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              تاريخ الفحص القادم
            </label>
            <input
              type="date"
              value={formData.nextExamDate}
              onChange={(e) =>
                setFormData({ ...formData, nextExamDate: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              الملاحظات الطبية
            </label>
            <textarea
              rows={3}
              value={formData.medicalNotes}
              onChange={(e) =>
                setFormData({ ...formData, medicalNotes: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            ></textarea>
          </div>
        </div>

        {/* Form Footer (Auto filled / Read Only) */}
        <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl my-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-semibold block text-slate-600 mb-1">
              أعدّه النظام بتاريخ:
            </span>
            <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-slate-700">
              {date}
            </div>
          </div>
          <div>
            <span className="font-semibold block text-slate-600 mb-1">
              توقيع الموظف (إقرار):
            </span>
            <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-slate-400 italic">
              يُوقع الكترونياً بواسطة الموظف...
            </div>
          </div>
          <div>
            <span className="font-semibold block text-slate-700 mb-1">
              المسؤول الطبي / الاعتماد:
            </span>
            <input
              type="text"
              placeholder="اسم المسؤول..."
              value={formData.officerName}
              onChange={(e) =>
                setFormData({ ...formData, officerName: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 py-2"
            />
          </div>
        </div>

        {/* Actions Toolbar */}
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
