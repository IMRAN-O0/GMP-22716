import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  ArrowRight,
  Printer,
  CheckCircle,
  XCircle,
  Send,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function FormViewer() {
  const { recordId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNotesInput, setShowNotesInput] = useState<{
    show: boolean;
    type: string;
  }>({ show: false, type: "" });
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!recordId) return;

    fetch(`/api/forms/record/${recordId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setRecord(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [recordId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">جاري التحميل...</div>
    );
  }

  if (!record) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          السجل غير موجود
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="text-sky-500 hover:underline"
        >
          العودة
        </button>
      </div>
    );
  }

  const { data } = record;

  const handlePrint = () => {
    window.print();
  };

  const executeStatusChange = async (
    newStatus: string,
    reasonNotes: string = "",
  ) => {
    try {
      const res = await fetch(`/api/forms/record/${recordId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          status: newStatus,
          userId: user?.id,
          notes: reasonNotes,
        }),
      });
      if (res.ok) {
        setRecord({ ...record, status: newStatus });
        setShowNotesInput({ show: false, type: "" });
        setNotes("");
      } else {
        // Custom alert logic could be implemented here, skipping for simplicity or replacing with a toast
        console.error("فشل في التحديث");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === "returned" || newStatus === "rejected") {
      setShowNotesInput({ show: true, type: newStatus });
    } else {
      executeStatusChange(newStatus);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-[#DCFCE7] text-[#166534]">
            معتمد
          </span>
        );
      case "rejected":
        return (
          <span className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-red-100 text-red-700">
            مرفوض
          </span>
        );
      case "returned":
        return (
          <span className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-orange-100 text-orange-700">
            مُعاد بملاحظات
          </span>
        );
      case "pending_review":
        return (
          <span className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-blue-100 text-blue-700">
            في انتظار المراجعة
          </span>
        );
      case "pending_approval":
        return (
          <span className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-purple-100 text-purple-700">
            في انتظار الاعتماد
          </span>
        );
      default:
        return (
          <span className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-slate-100 text-slate-700">
            مسودة
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title & Actions */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-2 rounded-lg"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 m-0">
              تفاصيل النموذج: {record.record_id}
            </h1>
            <p className="text-[13px] font-semibold text-slate-500">
              {record.form_id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {renderStatusBadge(record.status)}

          {(record.status === "draft" || record.status === "returned") && (
            <button
              onClick={() => handleStatusChange("pending_review")}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 font-semibold text-[13px] transition-colors"
            >
              <Send className="w-4 h-4" />
              إرسال للمراجعة
            </button>
          )}

          {user?.level <= 3 && record.status === "pending_review" && (
            <>
              <button
                onClick={() => handleStatusChange("pending_approval")}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-semibold text-[13px] transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                إرسال للمدير
              </button>
              <button
                onClick={() => handleStatusChange("returned")}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold text-[13px] transition-colors"
              >
                <AlertCircle className="w-4 h-4" />
                إعادة للموظف
              </button>
            </>
          )}

          {user?.level <= 2 && record.status === "pending_approval" && (
            <>
              <button
                onClick={() => handleStatusChange("approved")}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-semibold text-[13px] transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                اعتماد نهائي
              </button>
              <button
                onClick={() => handleStatusChange("rejected")}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold text-[13px] transition-colors"
              >
                <XCircle className="w-4 h-4" />
                رفض
              </button>
            </>
          )}

          {(record.status === "draft" || record.status === "returned") && (
            <button
              onClick={() => {
                const formRouteMap: Record<string, string> = {
                  "F-HR-001": "/hr/new-request",
                  "F-HR-002": "/hr/employee-file",
                  "F-HR-003": "/hr/medical-exam",
                  "F-PRD-001": "/prd/production-order",
                  "F-PRD-002": "/prd/batch-record",
                  "F-PRD-003": "/prd/production-checklist",
                  "F-PRD-004": "/prd/process-monitoring",
                  "F-INV-RMT-001": "/inv/rmt",
                  "F-FP-001": "/inv/fp-001",
                  "F-FP-002": "/inv/fp-002",
                  "F-FP-003": "/inv/fp-003",
                  "F-FP-004": "/inv/fp-004",
                  "F-FP-005": "/inv/fp-005",
                  "F-FP-006": "/inv/fp-006",
                  "F-INV-BOM": "/inv/composition",
                  "F-INV-RM-001": "/inv/rm-001",
                  "F-INV-MAT": "/inv/create-material",
                  "F-INV-WH": "/inv/create-warehouse",
                  "F-INV-PRQ-001": "/inv/prq-001",
                  "F-INV-PIN-001": "/inv/pin-001",
                  "F-QM-001": "/qm/qm-001",
                  "F-QM-002": "/qm/qm-002",
                  "F-QM-003": "/qm/qm-003",
                  "F-QM-004": "/qm/qm-004",
                  "F-QM-005": "/qm/qm-005",
                  "F-QM-006": "/qm/qm-006",
                  "F-DEV-001": "/qm/dev-001",
                  "F-DEV-002": "/qm/dev-002",
                  "F-DEV-003": "/qm/dev-003",
                  "F-DEV-004": "/qm/dev-004",
                  "F-CMP-001": "/qm/cmp-001",
                  "F-RCL-001": "/qm/rcl-001",
                  "F-PRM-001": "/qm/prm-001",
                  "F-PRM-002": "/qm/prm-002",
                  "F-PRM-003": "/qm/prm-003",
                  "F-PRM-004": "/qm/prm-004",
                  "F-PRM-005": "/qm/prm-005",
                  "F-EQP-001": "/qm/eqp-001",
                  "F-MNT-001": "/qm/mnt-001",
                  "F-TRN-001": "/trn/trn-001",
                  "F-TRN-002": "/trn/trn-002",
                  "F-TRN-003": "/trn/trn-003",
                  "F-TRN-004": "/trn/trn-004",
                  "F-LAB-001": "/lab/lab-001",
                  "F-LAB-002": "/lab/lab-002",
                  "F-LAB-003": "/lab/lab-003",
                  "F-LAB-004": "/lab/lab-004",
                  "F-LAB-005": "/lab/lab-005",
                  "F-LAB-006": "/lab/lab-006",
                };
                const route = formRouteMap[record.form_id];
                if (route) {
                  navigate(`${route}?edit=${record.record_id}`);
                } else {
                  alert("Edit route not mapped for this form.");
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-semibold text-[13px] transition-colors"
            >
              تعديل المسودة
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-semibold text-[13px] transition-colors"
          >
            <Printer className="w-4 h-4" />
            طباعة PDF
          </button>
        </div>
      </div>

      {showNotesInput.show && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
          <h3 className="text-sm font-bold text-slate-800 mb-2">
            {showNotesInput.type === "rejected"
              ? "سبب الرفض"
              : "ملاحظات الإعادة"}
          </h3>
          <textarea
            className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-sky-500 mb-3"
            rows={2}
            placeholder="اكتب الأسباب والملاحظات هنا..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowNotesInput({ show: false, type: "" })}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold"
            >
              إلغاء
            </button>
            <button
              onClick={() => executeStatusChange(showNotesInput.type, notes)}
              disabled={!notes.trim()}
              className="px-4 py-2 text-white bg-sky-600 hover:bg-sky-700 rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              تأكيد
            </button>
          </div>
        </div>
      )}

      {/* The Printable Form Wrapper */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden print:border-none print:shadow-none shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
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
              سجل إلكتروني
            </h2>
            <p className="text-sm font-mono text-slate-500">
              رقم السجل: {record.record_id}
            </p>
            <p className="text-sm font-mono text-slate-500">
              نموذج: {record.form_id}
            </p>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-2 gap-y-6 gap-x-8">
            {Object.entries(data).map(([key, val], idx) => {
              const displayKey = key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase());

              if (
                Array.isArray(val) &&
                val.length > 0 &&
                typeof val[0] === "object"
              ) {
                return (
                  <div key={idx} className="col-span-2 mt-4">
                    <h3 className="block text-[14px] font-bold text-slate-800 mb-2 border-b pb-2">
                      {displayKey}
                    </h3>
                    <table className="w-full text-right border-collapse">
                      <thead className="bg-slate-50 text-slate-500 text-[12px] border-b border-slate-200">
                        <tr>
                          {Object.keys(val[0]).map((k) => (
                            <th
                              key={k}
                              className="p-2 font-semibold border-l border-slate-200"
                            >
                              {k}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="text-[13px]">
                        {val.map((item: any, i: number) => (
                          <tr
                            key={i}
                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                          >
                            {Object.values(item).map((v: any, j: number) => (
                              <td
                                key={j}
                                className="p-2 border-l border-slate-100"
                              >
                                {String(v || "---")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }

              return (
                <div key={idx} className="border-b border-slate-100 pb-3">
                  <span className="block text-[13px] font-semibold text-slate-500 mb-1">
                    {displayKey}
                  </span>
                  {typeof val === "string" && val.startsWith("data:image/") ? (
                    <div className="mt-2 text-right">
                      <img
                        src={val}
                        alt={displayKey}
                        className="max-w-full h-auto rounded-lg border border-slate-200 mt-2 max-h-64 object-contain inline-block"
                      />
                      <div className="mt-3">
                        <a
                          href={val}
                          download={`attachment_${displayKey}.png`}
                          className="inline-flex items-center text-sm font-semibold text-sky-600 bg-sky-50 px-4 py-2 rounded-lg hover:bg-sky-100 transition-colors border border-sky-200"
                        >
                          <svg
                            className="w-5 h-5 ml-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          تحميل المرفق
                        </a>
                      </div>
                    </div>
                  ) : typeof val === "string" &&
                    val.startsWith("data:application/pdf") ? (
                    <a
                      href={val}
                      download="attachment.pdf"
                      className="text-sky-500 hover:underline"
                    >
                      تحميل ملف PDF المرفق
                    </a>
                  ) : (
                    <span className="block text-[15px] font-semibold text-slate-900 break-words whitespace-pre-wrap">
                      {String(val || "---")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-50 p-6 border-t border-slate-200 grid grid-cols-2 gap-4 text-sm mt-4">
          <div>
            <span className="font-semibold block text-slate-500 mb-1">
              تاريخ الإنشاء:
            </span>
            <div className="font-bold text-slate-800">
              {new Date(record.created_at).toLocaleString("ar-EG")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
