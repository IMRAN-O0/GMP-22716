import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateSerialNumber } from "../../lib/utils";

export default function FormHR002() {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Generate employee number pseudo-randomly for demo, usually sequentially from DB
  const [loading, setLoading] = useState(false);
  const [employeeId] = useState(
    `EMP-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`,
  );
  const [formData, setFormData] = useState({
    fullNameAr: "",
    fullNameEn: "",
    idNumber: "",
    dob: "",
    nationality: "",
    maritalStatus: "أعزب",
    phone: "",
    email: "",
    address: "",
    employeeNumber: "",
    joinDate: "",
    department: "",
    jobTitle: "",
    supervisor: "",
    contractType: "دوام كامل",
    basicSalary: "",
    allowances: "",
  });

  const [date] = useState(new Date().toLocaleDateString("ar-EG"));

  const handleSubmit = async (e: React.FormEvent, status: any) => {
    e.preventDefault();
    const recordId = generateSerialNumber(
      "HR",
      Math.floor(Math.random() * 1000),
    );

    const payload = {
      recordId,
      formId: "F-HR-002",
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
            ملف الموظف الشخصي
          </h2>
          <p className="text-sm font-mono text-slate-500">نموذج: F-HR-002</p>
          <p className="text-sm font-mono text-slate-500">
            تاريخ الإصدار: 01-01-2025
          </p>
        </div>
      </div>

      <form className="p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
          البيانات الشخصية
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              الاسم الكامل (عربي) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.fullNameAr}
              onChange={(e) =>
                setFormData({ ...formData, fullNameAr: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              الاسم الكامل (إنجليزي) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              dir="ltr"
              value={formData.fullNameEn}
              onChange={(e) =>
                setFormData({ ...formData, fullNameEn: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2 text-left"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              الهوية / الإقامة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.idNumber}
              onChange={(e) =>
                setFormData({ ...formData, idNumber: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              تاريخ الميلاد <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.dob}
              onChange={(e) =>
                setFormData({ ...formData, dob: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              الجنسية <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nationality}
              onChange={(e) =>
                setFormData({ ...formData, nationality: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              الحالة الاجتماعية
            </label>
            <select
              value={formData.maritalStatus}
              onChange={(e) =>
                setFormData({ ...formData, maritalStatus: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            >
              <option>أعزب</option>
              <option>متزوج</option>
              <option>مطلق</option>
              <option>أرمل</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              رقم الهاتف <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              dir="ltr"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2 text-left"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              dir="ltr"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2 text-left"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              العنوان بالتفصيل <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
          البيانات الوظيفية
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
              تاريخ الالتحاق <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.joinDate}
              onChange={(e) =>
                setFormData({ ...formData, joinDate: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              القسم <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              المسمى الوظيفي <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.jobTitle}
              onChange={(e) =>
                setFormData({ ...formData, jobTitle: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              المشرف المباشر <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.supervisor}
              onChange={(e) =>
                setFormData({ ...formData, supervisor: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              نوع العقد <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.contractType}
              onChange={(e) =>
                setFormData({ ...formData, contractType: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            >
              <option>دوام كامل</option>
              <option>دوام جزئي</option>
              <option>تدريب</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              الراتب الأساسي
            </label>
            <input
              type="number"
              value={formData.basicSalary}
              onChange={(e) =>
                setFormData({ ...formData, basicSalary: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">
              البدلات
            </label>
            <input
              type="text"
              value={formData.allowances}
              onChange={(e) =>
                setFormData({ ...formData, allowances: e.target.value })
              }
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2"
            />
          </div>
        </div>

        {/* Form Footer (Auto filled / Read Only) */}
        <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl my-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold block text-slate-600 mb-1">
              أعدّه (تلقائي):
            </span>
            <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-slate-700">
              {user?.name || "---"}
            </div>
          </div>
          <div>
            <span className="font-semibold block text-slate-600 mb-1">
              تاريخ الإعداد:
            </span>
            <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-slate-700">
              {date}
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
