import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Calendar, FileText } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateSerialNumber, getJsonHeaders } from "../../lib/utils";

export default function FormTRN001() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    planId: generateSerialNumber("TRN-PLN", Math.floor(Math.random() * 10000)),
    year: new Date().getFullYear().toString(),
    department: "",
    trainingCourses: [] as {
      courseName: string;
      targetAudience: string;
      schedule: string;
      provider: string;
    }[],
    preparedBy: user?.name || "",
    date: new Date().toISOString().split("T")[0],
    status: "Draft",
  });

  const [courseInput, setCourseInput] = useState({
    courseName: "",
    targetAudience: "",
    schedule: "",
    provider: "",
  });

  const addCourse = () => {
    if (courseInput.courseName && courseInput.targetAudience) {
      setFormData((prev) => ({
        ...prev,
        trainingCourses: [...prev.trainingCourses, courseInput],
      }));
      setCourseInput({
        courseName: "",
        targetAudience: "",
        schedule: "",
        provider: "",
      });
    }
  };

  const removeCourse = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      trainingCourses: prev.trainingCourses.filter((_, i) => i !== index),
    }));
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
          recordId: formData.planId,
          formId: "F-TRN-001",
          department: "TRN",
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
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-sky-200 shadow-sm border-r-4 border-r-sky-500">
        <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
          <Calendar className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            خطة التدريب السنوية
          </h1>
          <p className="text-slate-500">
            النموذج: F-TRN-001 | قطاع التدريب والتطوير
          </p>
        </div>
      </div>

      <form className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-8">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
              تفاصيل الخطة
            </h3>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  رقم الخطة المرجعي (تلقائي)
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                  value={formData.planId}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  تاريخ الإصدار
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

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  سنة الخطة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                  placeholder="مثال: 2026"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  القسم المستهدف (أو الكل)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                  placeholder="مثال: قسم الجودة"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
              الدورات التدريبية المجدولة
            </h3>

            <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg mb-4">
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    اسم الدورة
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    value={courseInput.courseName}
                    onChange={(e) =>
                      setCourseInput({
                        ...courseInput,
                        courseName: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    الجمهور المستهدف
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    value={courseInput.targetAudience}
                    onChange={(e) =>
                      setCourseInput({
                        ...courseInput,
                        targetAudience: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    الجدول الزمني (الشهر)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    placeholder="مثال: أغسطس"
                    value={courseInput.schedule}
                    onChange={(e) =>
                      setCourseInput({
                        ...courseInput,
                        schedule: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    جهة التدريب
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    value={courseInput.provider}
                    onChange={(e) =>
                      setCourseInput({
                        ...courseInput,
                        provider: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addCourse}
                  className="px-4 py-1.5 bg-sky-600 text-white rounded font-bold text-sm hover:bg-sky-700"
                >
                  إضافة الدورة
                </button>
              </div>
            </div>

            {formData.trainingCourses.length > 0 && (
              <table className="w-full text-right text-sm border-collapse border border-slate-200 mt-4 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="p-3 border-b border-slate-200">م</th>
                    <th className="p-3 border-b border-slate-200">
                      اسم الدورة
                    </th>
                    <th className="p-3 border-b border-slate-200">
                      الجمهور المستهدف
                    </th>
                    <th className="p-3 border-b border-slate-200">الجدول</th>
                    <th className="p-3 border-b border-slate-200">الجهة</th>
                    <th className="p-3 border-b border-slate-200 text-center">
                      حذف
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {formData.trainingCourses.map((c, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="p-3">{i + 1}</td>
                      <td className="p-3 font-semibold text-slate-800">
                        {c.courseName}
                      </td>
                      <td className="p-3">{c.targetAudience}</td>
                      <td className="p-3">{c.schedule}</td>
                      <td className="p-3">{c.provider}</td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeCourse(i)}
                          className="text-red-500 hover:text-red-700 font-bold"
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
