import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Beaker, FileBadge } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateSerialNumber, getJsonHeaders } from "../../lib/utils";

export default function FormLAB004() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [labResults, setLabResults] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/forms/dept/LAB")
      .then((r) => r.json())
      .then((data) => {
        const resList = data.filter(
          (f: any) => f.form_id === "F-LAB-003" && f.status === "approved",
        );
        setLabResults(resList);
      })
      .catch(console.error);
  }, []);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    coaId: generateSerialNumber("LAB-COA", Math.floor(Math.random() * 10000)),
    issueDate: new Date().toISOString().split("T")[0],
    testResultId: "",
    itemName: "",
    batchNumber: "",
    productionDate: "",
    expiryDate: "",
    finalStatus: "Approved",
    approvedBy: user?.name || "",
    remarks: "",
  });

  const handleResultSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rId = e.target.value;
    const rRow = labResults.find((r) => r.record_id === rId);
    if (rRow) {
      const rd = JSON.parse(rRow.data_json);
      setFormData((prev) => ({
        ...prev,
        testResultId: rId,
        itemName: rd.itemName,
        batchNumber: rd.batchNumber,
        finalStatus: rd.overallStatus === "Pass" ? "Approved" : "Rejected",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        testResultId: "",
        itemName: "",
        batchNumber: "",
      }));
    }
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
        headers: getJsonHeaders(),
        body: JSON.stringify({
          recordId: formData.coaId,
          formId: "F-LAB-004",
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
          <FileBadge className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            إصدار شهادة تحليل (COA)
          </h1>
          <p className="text-slate-500">
            النموذج: F-LAB-004 | قطاع المختبر (LAB)
          </p>
        </div>
      </div>

      <form className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-8">
          <div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  رقم الشهادة (تلقائي)
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                  value={formData.coaId}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  تاريخ الإصدار <span className="text-red-500">*</span>
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
                  مرجع نتائج الاختبار (F-LAB-003){" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.testResultId}
                  onChange={handleResultSelect}
                >
                  <option value="">-- اختر تقرير النتائج המعتمد --</option>
                  {labResults.map((r) => {
                    const rd = JSON.parse(r.data_json);
                    return (
                      <option key={r.record_id} value={r.record_id}>
                        {r.record_id} - {rd.itemName} (Batch: {rd.batchNumber})
                        - {rd.overallStatus}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  اسم المنتج / المادة
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
                  رقم التشغيلة / الدفعة
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                  value={formData.batchNumber}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  تاريخ الإنتاج (Mfd Date)
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.productionDate}
                  onChange={(e) =>
                    setFormData({ ...formData, productionDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  تاريخ الانتهاء (Exp Date)
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6 border-t border-slate-200 pt-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  القرار النهائي للمنتج (Release Status){" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold"
                  value={formData.finalStatus}
                  onChange={(e) =>
                    setFormData({ ...formData, finalStatus: e.target.value })
                  }
                >
                  <option value="Approved">
                    Release / Approved (معتمد للاستخدام/البيع)
                  </option>
                  <option value="Rejected">Rejected (مرفوض / غير مطابق)</option>
                  <option value="Quarantine">Quarantine (قيد الحجز)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  اسم المسؤول المعتمد للشهادة
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.approvedBy}
                  onChange={(e) =>
                    setFormData({ ...formData, approvedBy: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                ملاحظات / استنتاجات
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                placeholder="المنتج يطابق المواصفات والمعايير المطلوبة للإخراج..."
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
