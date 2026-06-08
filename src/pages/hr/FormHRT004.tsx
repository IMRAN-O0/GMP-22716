import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, GraduationCap, FileText } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { nextSequentialId, getAuthHeaders, getJsonHeaders } from "../../lib/utils";

export default function FormHRT004() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tnaId: "",
    department: "",
    year: new Date().getFullYear().toString(),
    needs: [] as {
      skillArea: string;
      currentLevel: string;
      requiredLevel: string;
      priority: string;
      suggestedCourse: string;
    }[],
    preparedBy: user?.name || "",
    date: new Date().toISOString().split("T")[0],
    status: "Draft",
  });

  const [needInput, setNeedInput] = useState({
    skillArea: "",
    currentLevel: "",
    requiredLevel: "",
    priority: "عالية",
    suggestedCourse: "",
  });

  const addNeed = () => {
    if (needInput.skillArea && needInput.requiredLevel) {
      setFormData((prev) => ({
        ...prev,
        needs: [...prev.needs, needInput],
      }));
      setNeedInput({
        skillArea: "",
        currentLevel: "",
        requiredLevel: "",
        priority: "عالية",
        suggestedCourse: "",
      });
    }
  };

  const removeNeed = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      needs: prev.needs.filter((_, i) => i !== index),
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
          recordId: formData.tnaId || nextSequentialId("HRT-TNA", []),
          formId: "F-HRT-004",
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
            .filter((f: any) => f.form_id === "F-HRT-004")
            .map((f: any) => f.record_id);
          setFormData((prev) => ({
            ...prev,
            tnaId: nextSequentialId("HRT-TNA", ids),
          }));
        })
        .catch(() => {});
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-sky-200 shadow-sm border-r-4 border-r-sky-500">
        <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
          <GraduationCap className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            حصر الاحتياجات التدريبية (TNA)
          </h1>
          <p className="text-slate-500">
            النموذج: F-HRT-004 | الموارد البشرية والتدريب
          </p>
        </div>
      </div>

      <form className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-8">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
              تفاصيل التقرير
            </h3>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  رقم التقرير (تلقائي)
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                  value={formData.tnaId}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  التاريخ
                </label>
                <input
                  type="date"
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
                  القسم <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  السنة
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
              الاحتياجات التدريبية
            </h3>

            <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg mb-4">
              <div className="grid grid-cols-5 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    المهارة / المجال
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    value={needInput.skillArea}
                    onChange={(e) =>
                      setNeedInput({
                        ...needInput,
                        skillArea: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    المستوى الحالي
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    value={needInput.currentLevel}
                    onChange={(e) =>
                      setNeedInput({
                        ...needInput,
                        currentLevel: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    المستوى المطلوب
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    value={needInput.requiredLevel}
                    onChange={(e) =>
                      setNeedInput({
                        ...needInput,
                        requiredLevel: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    الأولوية
                  </label>
                  <select
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    value={needInput.priority}
                    onChange={(e) =>
                      setNeedInput({
                        ...needInput,
                        priority: e.target.value,
                      })
                    }
                  >
                    <option value="عالية">عالية</option>
                    <option value="متوسطة">متوسطة</option>
                    <option value="منخفضة">منخفضة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    الدورة المقترحة
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    value={needInput.suggestedCourse}
                    onChange={(e) =>
                      setNeedInput({
                        ...needInput,
                        suggestedCourse: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addNeed}
                  className="px-4 py-1.5 bg-sky-600 text-white rounded font-bold text-sm hover:bg-sky-700"
                >
                  إضافة الاحتياج
                </button>
              </div>
            </div>

            {formData.needs.length > 0 && (
              <table className="w-full text-right text-sm border-collapse border border-slate-200 mt-4 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="p-3 border-b border-slate-200">م</th>
                    <th className="p-3 border-b border-slate-200">
                      المهارة / المجال
                    </th>
                    <th className="p-3 border-b border-slate-200">
                      المستوى الحالي
                    </th>
                    <th className="p-3 border-b border-slate-200">
                      المستوى المطلوب
                    </th>
                    <th className="p-3 border-b border-slate-200">الأولوية</th>
                    <th className="p-3 border-b border-slate-200">
                      الدورة المقترحة
                    </th>
                    <th className="p-3 border-b border-slate-200 text-center">
                      حذف
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {formData.needs.map((c, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="p-3">{i + 1}</td>
                      <td className="p-3 font-semibold text-slate-800">
                        {c.skillArea}
                      </td>
                      <td className="p-3">{c.currentLevel}</td>
                      <td className="p-3">{c.requiredLevel}</td>
                      <td className="p-3">{c.priority}</td>
                      <td className="p-3">{c.suggestedCourse}</td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeNeed(i)}
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
