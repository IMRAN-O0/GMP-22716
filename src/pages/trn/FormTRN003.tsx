import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, GraduationCap, CheckSquare } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateSerialNumber } from "../../lib/utils";

export default function FormTRN003() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((data) => setEmployees(data))
      .catch(console.error);
  }, []);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    evalId: generateSerialNumber("TRN-EVAL", Math.floor(Math.random() * 10000)),
    date: new Date().toISOString().split("T")[0],
    employeeId: "",
    employeeName: "",
    department: "",
    trainingCourse: "",
    evalDate: new Date().toISOString().split("T")[0],
    jobKnowledgeScore: "3",
    qualityOfWorkScore: "3",
    productivityScore: "3",
    overallScore: "3",
    evaluatorRemarks: "",
    isEffective: "Yes",
    evaluatorName: user?.name || "",
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          recordId: formData.evalId,
          formId: "F-TRN-003",
          department: "TRN",
          creatorId: user?.id,
          status: status,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert(
        `تم التقييم بنجاح (${status === "draft" ? "مسودة" : "معتمد"}): ` +
          saved.record_id,
      );
      navigate("/trn");
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
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-teal-200 shadow-sm border-r-4 border-r-teal-500">
        <div className="p-3 bg-teal-50 rounded-lg text-teal-600">
          <GraduationCap className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            تقييم فعالية التدريب ومردوده
          </h1>
          <p className="text-slate-500">
            النموذج: F-TRN-003 | قطاع التدريب والتطوير
          </p>
        </div>
      </div>

      <form className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-8">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
              البيانات الأساسية
            </h3>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  رقم التقييم (تلقائي)
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                  value={formData.evalId}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  تاريخ التقييم
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  value={formData.evalDate}
                  onChange={(e) =>
                    setFormData({ ...formData, evalDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  الموظف (المتدرب) <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={handleEmployeeSelect}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-700"
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
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                  value={formData.department}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                اسم الدورة التدريبية التي يتم قياس فعاليتها{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="مثال: الإنعاش القلبي والاسعافات"
                value={formData.trainingCourse}
                onChange={(e) =>
                  setFormData({ ...formData, trainingCourse: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-teal-600" />
              عناصر التقييم (بعد التدريب)
            </h3>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 text-sm w-1/2">
                  مدى تحسن المعرفة بالعمليات ومهام الوظيفة
                </span>
                <select
                  className="w-1/2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                  value={formData.jobKnowledgeScore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      jobKnowledgeScore: e.target.value,
                    })
                  }
                >
                  <option value="5">ممتاز (5)</option>
                  <option value="4">جيد جداً (4)</option>
                  <option value="3">مقبول (3)</option>
                  <option value="2">ضعيف (2)</option>
                  <option value="1">لم يطرأ تحسن (1)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 text-sm w-1/2">
                  مستوى دقة وجودة المخرجات بعد التدريب
                </span>
                <select
                  className="w-1/2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                  value={formData.qualityOfWorkScore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      qualityOfWorkScore: e.target.value,
                    })
                  }
                >
                  <option value="5">ممتاز (5)</option>
                  <option value="4">جيد جداً (4)</option>
                  <option value="3">مقبول (3)</option>
                  <option value="2">ضعيف (2)</option>
                  <option value="1">لم يطرأ تحسن (1)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 text-sm w-1/2">
                  سرعة الانجاز والإنتاجية
                </span>
                <select
                  className="w-1/2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                  value={formData.productivityScore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      productivityScore: e.target.value,
                    })
                  }
                >
                  <option value="5">ممتاز (5)</option>
                  <option value="4">جيد جداً (4)</option>
                  <option value="3">مقبول (3)</option>
                  <option value="2">ضعيف (2)</option>
                  <option value="1">لم يطرأ تحسن (1)</option>
                </select>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 mt-4 pt-4">
                <span className="font-bold text-teal-800 w-1/2 text-lg">
                  التقييم العام للفعالية
                </span>
                <select
                  className="w-1/2 px-4 py-2 bg-white border border-teal-400 font-bold text-teal-700 rounded-lg focus:ring-2 focus:ring-teal-500 shadow-sm"
                  value={formData.overallScore}
                  onChange={(e) =>
                    setFormData({ ...formData, overallScore: e.target.value })
                  }
                >
                  <option value="5">تأثير ملحوظ وفائق (5)</option>
                  <option value="4">تأثير واضح وجيد (4)</option>
                  <option value="3">تأثير طفيف (3)</option>
                  <option value="1">غير فعال ويحتاج إعادة (1)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  القرار النهائي للمشرف
                </label>
                <select
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  value={formData.isEffective}
                  onChange={(e) =>
                    setFormData({ ...formData, isEffective: e.target.value })
                  }
                >
                  <option value="Yes">
                    يعتبر التدريب فعالاً ومحققاً لأهدافه
                  </option>
                  <option value="No">
                    التدريب غير فعال (يوصى بإعادة التدريب أو تعديل البرنامج)
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  اسم المشرف المقيِم <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  value={formData.evaluatorName}
                  onChange={(e) =>
                    setFormData({ ...formData, evaluatorName: e.target.value })
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
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="ما هي النقاط التي يحتاج الموظف للتركيز عليها مستقبلاً؟"
                value={formData.evaluatorRemarks}
                onChange={(e) =>
                  setFormData({ ...formData, evaluatorRemarks: e.target.value })
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
