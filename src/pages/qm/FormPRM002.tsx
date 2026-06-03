import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, ThermometerSun } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getJsonHeaders } from "../../lib/utils";

export default function FormPRM002() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    logDate: new Date().toISOString().split("T")[0],
    logTime: new Date().toTimeString().split(" ")[0].substring(0, 5),
    monitoredArea: "مستودع المواد الخام",
    recordedTemp: "",
    tempStatus: "ضمن الحدود",
    recordedHumidity: "",
    humidityStatus: "ضمن الحدود",
    remarks: "",
    recordedBy: user?.name || "",
  });

  const checkLimits = () => {
    let t_stat = "ضمن الحدود";
    let h_stat = "ضمن الحدود";
    const t = parseFloat(formData.recordedTemp);
    const h = parseFloat(formData.recordedHumidity);
    if (!isNaN(t) && (t < 10 || t > 30)) t_stat = "خارج الحدود";
    if (!isNaN(h) && (h < 30 || h > 70)) h_stat = "خارج الحدود";
    setFormData({ ...formData, tempStatus: t_stat, humidityStatus: h_stat });
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
          recordId: `QM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          formId: "F-PRM-002",
          department: "QM",
          creatorId: user?.id,
          status: status,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert("تم تسجيل القراءات بنجاح: " + saved.record_id);
      navigate("/qm");
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
          <ThermometerSun className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            مراقبة الحرارة والرطوبة
          </h1>
          <p className="text-slate-500">
            النموذج: F-PRM-002 | قسم الجودة - السيطرة البيئية
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        onBlur={checkLimits}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                تاريخ القراءة
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                value={formData.logDate}
                onChange={(e) =>
                  setFormData({ ...formData, logDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                وقت القراءة
              </label>
              <input
                type="time"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                value={formData.logTime}
                onChange={(e) =>
                  setFormData({ ...formData, logTime: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                المُسجّل
              </label>
              <input
                type="text"
                readOnly
                className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                value={formData.recordedBy}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              المنطقة المراقبة
            </label>
            <select
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg"
              value={formData.monitoredArea}
              onChange={(e) =>
                setFormData({ ...formData, monitoredArea: e.target.value })
              }
            >
              <option value="مستودع المواد الخام">مستودع المواد الخام (15-25°C)</option>
              <option value="الغرفة المبردة">الغرفة المبردة (2-8°C)</option>
              <option value="منطقة الإنتاج">منطقة الإنتاج (20-25°C)</option>
              <option value="مستودع المنتج النهائي">مستودع المنتج النهائي</option>
              <option value="مختبر الجودة">مختبر الجودة</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                قراءة درجة الحرارة (°C)
              </label>
              <input
                type="number"
                step="0.1"
                required
                className={`w-full px-4 py-3 border rounded-lg font-bold text-lg focus:ring-2 ${formData.tempStatus === "خارج الحدود" ? "bg-rose-50 border-rose-300 text-rose-700 focus:ring-rose-500" : "bg-white border-slate-300 text-slate-900 focus:ring-sky-500"}`}
                placeholder="مثال: 22.5"
                value={formData.recordedTemp}
                onChange={(e) =>
                  setFormData({ ...formData, recordedTemp: e.target.value })
                }
                onBlur={checkLimits}
              />
              {formData.tempStatus === "خارج الحدود" && (
                <p className="text-xs font-bold text-rose-600 mt-2">
                  خارج النطاق المسموح! يجب الإبلاغ الفوري.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                قراءة الرطوبة النسبية (% RH)
              </label>
              <input
                type="number"
                step="0.1"
                required
                className={`w-full px-4 py-3 border rounded-lg font-bold text-lg focus:ring-2 ${formData.humidityStatus === "خارج الحدود" ? "bg-rose-50 border-rose-300 text-rose-700 focus:ring-rose-500" : "bg-white border-slate-300 text-slate-900 focus:ring-sky-500"}`}
                placeholder="مثال: 45.0"
                value={formData.recordedHumidity}
                onChange={(e) =>
                  setFormData({ ...formData, recordedHumidity: e.target.value })
                }
                onBlur={checkLimits}
              />
              {formData.humidityStatus === "خارج الحدود" && (
                <p className="text-xs font-bold text-rose-600 mt-2">
                  خارج النطاق المسموح! يجب الإبلاغ الفوري.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              ملاحظات وإجراءات
            </label>
            <textarea
              rows={2}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
              placeholder="سجل أي تبرير إذا كانت القراءات قريبة من الحد الأقصى أو خارج النطاق..."
              value={formData.remarks}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
            />
          </div>
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
