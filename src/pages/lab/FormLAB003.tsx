import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Stethoscope, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateSerialNumber } from "../../lib/utils";

export default function FormLAB003() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [samples, setSamples] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/materials")
      .then((r) => r.json())
      .then((data) => setMaterials(data))
      .catch(console.error);
    fetch("/api/forms/dept/LAB")
      .then((r) => r.json())
      .then((data) => {
        const smps = data.filter(
          (f: any) => f.form_id === "F-LAB-002" && f.status === "approved",
        );
        setSamples(smps);
      })
      .catch(console.error);
  }, []);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    resultId: generateSerialNumber(
      "LAB-RES",
      Math.floor(Math.random() * 10000),
    ),
    testDate: new Date().toISOString().split("T")[0],
    sampleId: "",
    itemName: "",
    batchNumber: "",
    testType: "Physico-Chemical",
    results: [] as {
      parameter: string;
      specification: string;
      resultValue: string;
      passFail: string;
    }[],
    overallStatus: "Pass",
    testedBy: user?.name || "",
    notes: "",
  });

  const [testInput, setTestInput] = useState({
    parameter: "",
    specification: "",
    resultValue: "",
    passFail: "Pass",
  });

  const handleSampleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value;
    const smp = samples.find((r) => r.record_id === sId);
    if (smp) {
      const sd = JSON.parse(smp.data_json);
      setFormData((prev) => ({
        ...prev,
        sampleId: sId,
        itemName: sd.itemName,
        batchNumber: sd.batchNumber,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        sampleId: "",
        itemName: "",
        batchNumber: "",
      }));
    }
  };

  const addResult = () => {
    if (testInput.parameter && testInput.resultValue) {
      setFormData((prev) => ({
        ...prev,
        results: [...prev.results, testInput],
      }));
      setTestInput({
        parameter: "",
        specification: "",
        resultValue: "",
        passFail: "Pass",
      });
    }
  };

  const removeResult = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      results: prev.results.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent, status: any = "approved") => {
    e.preventDefault();
    try {
      const editIdPatch = newSearchParams().get("edit");
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
          recordId: formData.resultId,
          formId: "F-LAB-003",
          department: "LAB",
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
      navigate("/lab");
    } catch (err) {
      console.error(err);
      alert("فشل حفظ النموذج");
    }
  };

  // --- INJECTED BY PATCH ---
  const newSearchParams = () => new URLSearchParams(window.location.search);
  React.useEffect(() => {
    const editId = newSearchParams().get("edit");
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
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-indigo-200 shadow-sm border-r-4 border-r-indigo-600">
        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
          <Stethoscope className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            سجل نتائج الاختبارات
          </h1>
          <p className="text-slate-500">
            النموذج: F-LAB-003 | قطاع المختبر (LAB)
          </p>
        </div>
      </div>

      <form className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-8">
          <div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  رقم تقرير النتيجة (تلقائي)
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                  value={formData.resultId}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  تاريخ الاختبار <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.testDate}
                  onChange={(e) =>
                    setFormData({ ...formData, testDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  مرجع سجل العينة (F-LAB-002){" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.sampleId}
                  onChange={handleSampleSelect}
                >
                  <option value="">-- اختر العينة المسجلة --</option>
                  {samples.map((r) => {
                    const rd = JSON.parse(r.data_json);
                    return (
                      <option key={r.record_id} value={r.record_id}>
                        {r.record_id} - {rd.itemName} (Batch: {rd.batchNumber})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  نوع الاختبارات <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.testType}
                  onChange={(e) =>
                    setFormData({ ...formData, testType: e.target.value })
                  }
                >
                  <option value="Physico-Chemical">فيزيائي-كيميائي</option>
                  <option value="Microbiological">مايكروبيولوجي</option>
                  <option value="Packaging">
                    فحص التعبئة والتغليف (Packaging)
                  </option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  اسم المادة / المنتج
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                  value={formData.itemName}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  رقم التشغيلة / الدفعة (Batch/Lot)
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                  value={formData.batchNumber}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
              سجل نتائج الفحوصات (Parameters)
            </h3>

            <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg mb-4">
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    معامل الفحص (Parameter)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: pH"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={testInput.parameter}
                    onChange={(e) =>
                      setTestInput({ ...testInput, parameter: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    المواصفة المقررة (Spec limit)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: 5.5 - 6.5"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={testInput.specification}
                    onChange={(e) =>
                      setTestInput({
                        ...testInput,
                        specification: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    النتيجة المسجلة (Result)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={testInput.resultValue}
                    onChange={(e) =>
                      setTestInput({
                        ...testInput,
                        resultValue: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    التقييم (Pass/Fail)
                  </label>
                  <select
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={testInput.passFail}
                    onChange={(e) =>
                      setTestInput({ ...testInput, passFail: e.target.value })
                    }
                  >
                    <option value="Pass">مطابق (Pass)</option>
                    <option value="Fail">غير مطابق (Fail)</option>
                    <option value="OOS">خارج المواصفة (OOS)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addResult}
                  className="flex items-center gap-1 px-4 py-1.5 bg-indigo-600 text-white rounded font-bold text-sm hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  إضافة النتيجة
                </button>
              </div>
            </div>

            {formData.results.length > 0 && (
              <table className="w-full text-right text-sm border-collapse border border-slate-200 mt-4 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="p-3 border-b border-slate-200">م</th>
                    <th className="p-3 border-b border-slate-200">
                      البارامتر (الاختبار)
                    </th>
                    <th className="p-3 border-b border-slate-200">
                      المواصفة المرجعية
                    </th>
                    <th className="p-3 border-b border-slate-200 px-4">
                      النتيجة
                    </th>
                    <th className="p-3 border-b border-slate-200">التقييم</th>
                    <th className="p-3 border-b border-slate-200 text-center">
                      حذف
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {formData.results.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="p-3">{i + 1}</td>
                      <td className="p-3 font-semibold text-slate-800">
                        {r.parameter}
                      </td>
                      <td className="p-3 text-slate-500">{r.specification}</td>
                      <td className="p-3 px-4 font-bold font-mono">
                        {r.resultValue}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${r.passFail === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                        >
                          {r.passFail}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeResult(i)}
                          className="text-red-500 hover:text-red-700 font-bold"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
            <div className="flex items-center gap-6">
              <div className="w-1/2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  التقييم النهائي للتشغيلة/العينة
                </label>
                <select
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold"
                  value={formData.overallStatus}
                  onChange={(e) =>
                    setFormData({ ...formData, overallStatus: e.target.value })
                  }
                >
                  <option value="Pass">مطابقة (Pass / Approved)</option>
                  <option value="Fail">مرفوضة (Fail / Rejected)</option>
                  <option value="Conditionally Approved">
                    قبول مشروط (Conditionally Approved)
                  </option>
                </select>
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  فني المختبر / المحلل (Tested By)
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                  value={formData.testedBy}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                الملاحظات النهائية (Conclusion)
              </label>
              <textarea
                rows={2}
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
