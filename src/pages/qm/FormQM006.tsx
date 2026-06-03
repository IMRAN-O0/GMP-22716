import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getJsonHeaders } from "../../lib/utils";

export default function FormQM006() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ncrAndDevs, setNcrAndDevs] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    issueDate: new Date().toISOString().split("T")[0],
    sourceFormId: "",
    sourceDocumentNo: "",
    description: "",
    rootCause: "",
    correctiveAction: "",
    preventiveAction: "",
    targetDate: "",
    responsiblePerson: "",
    verificationDate: "",
    effectivenessCheck: "",
    status: "Open", // Open, In Progress, Closed, Verified
    approvedBy: user?.name || "",
  });

  useEffect(() => {
    // Fetch NCRs and Deviations to link CAPA to
    fetch("/api/forms/dept/QM")
      .then((r) => r.json())
      .then((data) => {
        const sources = data.filter(
          (f: any) =>
            f.form_id === "F-QM-005" ||
            f.form_id === "F-DEV-001" ||
            f.form_id === "F-CMP-001",
        );
        setNcrAndDevs(sources);
      })
      .catch(console.error);

    // Read URL params for pre-filling from DEV001 or CMP001
    const params = new URLSearchParams(window.location.search);
    const fromDev = params.get("fromDev");
    const fromCmp = params.get("fromCmp");
    if (fromDev) {
      setFormData((prev) => ({
        ...prev,
        sourceDocumentNo: fromDev,
        sourceFormId: "F-DEV-001",
      }));
    }
    if (fromCmp) {
      setFormData((prev) => ({
        ...prev,
        sourceDocumentNo: fromCmp,
        sourceFormId: "F-CMP-001",
      }));
    }
  }, []);

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
          formId: "F-QM-006",
          department: "QM",
          creatorId: user?.id,
          status: status,
          data: formData,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert(
        "تم حفظ نموذج الإجراء التصحيحي والوقائي (CAPA) بنجاح: " +
          saved.record_id,
      );
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
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-teal-200 shadow-sm border-r-4 border-r-teal-500">
        <div className="p-3 bg-teal-50 rounded-lg text-teal-600">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            إجراء تصحيحي ووقائي (CAPA)
          </h1>
          <p className="text-slate-500">
            النموذج: F-QM-006 | قسم الجودة - ISO 22716
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div className="p-6 space-y-8">
          {/* Row 1: Issue Date + Approved By */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                تاريخ إصدار CAPA <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                value={formData.issueDate}
                onChange={(e) =>
                  setFormData({ ...formData, issueDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                المعتمد (Approved By)
              </label>
              <input
                type="text"
                readOnly
                className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                value={formData.approvedBy}
              />
            </div>
          </div>

          {/* Source Form + Source Document */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
            <h3 className="font-bold text-slate-700 border-b border-slate-200 pb-2">
              مصدر الـ CAPA (Source Linkage)
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  نوع المستند المرجعي <span className="text-teal-600">*</span>
                </label>
                <select
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-teal-500"
                  value={formData.sourceFormId}
                  onChange={(e) =>
                    setFormData({ ...formData, sourceFormId: e.target.value })
                  }
                >
                  <option value="">-- اختر نوع المستند --</option>
                  <option value="F-DEV-001">F-DEV-001 (تقرير انحراف)</option>
                  <option value="F-CMP-001">F-CMP-001 (شكوى عميل)</option>
                  <option value="F-QM-005">F-QM-005 (تقرير NCR)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  رقم المستند المرجعي (Document No.)
                </label>
                <input
                  type="text"
                  list="ncr-dev-list-qm006"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="اكتب رقم المستند أو اختر من القائمة..."
                  value={formData.sourceDocumentNo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sourceDocumentNo: e.target.value,
                    })
                  }
                />
                <datalist id="ncr-dev-list-qm006">
                  {ncrAndDevs.map((doc) => (
                    <option key={doc.record_id} value={doc.record_id}>
                      {doc.form_id} - {doc.record_id}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              1. وصف المشكلة (Problem Description){" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="وصف قصير للمشكلة التي تطلبت CAPA..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Root Cause */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              2. السبب الجذري (Root Cause Analysis){" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="ما هو السبب الرئيسي لحدوث المشكلة؟"
              value={formData.rootCause}
              onChange={(e) =>
                setFormData({ ...formData, rootCause: e.target.value })
              }
            />
          </div>

          {/* Corrective Action */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              3. الإجراء التصحيحي (Corrective Action){" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="كيف سيتم إصلاح المشكلة الحالية؟"
              value={formData.correctiveAction}
              onChange={(e) =>
                setFormData({ ...formData, correctiveAction: e.target.value })
              }
            />
          </div>

          {/* Preventive Action */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              4. الإجراء الوقائي (Preventive Action){" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="كيف سيتم منع المشكلة من التكرار في المستقبل؟"
              value={formData.preventiveAction}
              onChange={(e) =>
                setFormData({ ...formData, preventiveAction: e.target.value })
              }
            />
          </div>

          {/* Responsible + Dates */}
          <div className="grid grid-cols-3 gap-6 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                المسؤول عن التنفيذ (Responsible Person){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="اسم المسؤول..."
                value={formData.responsiblePerson}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    responsiblePerson: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                تاريخ التنفيذ المستهدف (Target Date){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                value={formData.targetDate}
                onChange={(e) =>
                  setFormData({ ...formData, targetDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                تاريخ التحقق من الفعالية (Verification Date)
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                value={formData.verificationDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    verificationDate: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* Effectiveness Check */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              5. فحص الفعالية (Effectiveness Check)
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="نتائج مراجعة فعالية الإجراء التصحيحي - هل تكررت المشكلة بعد التطبيق؟"
              value={formData.effectivenessCheck}
              onChange={(e) =>
                setFormData({ ...formData, effectivenessCheck: e.target.value })
              }
            />
          </div>

          {/* Status */}
          <div className="flex justify-end p-4 bg-teal-50 border border-teal-200 rounded-xl">
            <div className="w-1/2">
              <label className="block text-lg font-bold text-teal-900 mb-2">
                حالة نموذج CAPA الحالي
              </label>
              <select
                className="w-full px-4 py-2 bg-white border border-teal-300 rounded-lg text-teal-800 font-bold"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="Open">مفتوح (Open)</option>
                <option value="In Progress">قيد التنفيذ (In Progress)</option>
                <option value="Closed">مغلق (Closed)</option>
                <option value="Verified">
                  تم التحقق (Verified) - تأكدت الفعالية
                </option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-200 p-6">
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
                  user?.level === 3 ? "pending_approval" : "pending_review",
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
