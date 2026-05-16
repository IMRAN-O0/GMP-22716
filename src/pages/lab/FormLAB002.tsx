import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, TestTube2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateSerialNumber } from "../../lib/utils";

export default function FormLAB002() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [labRequests, setLabRequests] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/materials")
      .then((r) => r.json())
      .then((data) => setMaterials(data))
      .catch(console.error);
    fetch("/api/forms/dept/LAB")
      .then((r) => r.json())
      .then((data) => {
        const reqs = data.filter(
          (f: any) => f.form_id === "F-LAB-001" && f.status === "approved",
        );
        setLabRequests(reqs);
      })
      .catch(console.error);
  }, []);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sampleId: generateSerialNumber(
      "LAB-SMP",
      Math.floor(Math.random() * 10000),
    ),
    receiveDate: new Date().toISOString().split("T")[0],
    testRequestId: "",
    itemName: "",
    batchNumber: "",
    sampleQuantity: "",
    containerType: "",
    storageCondition: "Room Temperature",
    receivedBy: user?.name || "",
    conditionOnReceipt: "Intact",
    notes: "",
  });

  const handleRequestSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const reqId = e.target.value;
    const req = labRequests.find((r) => r.record_id === reqId);
    if (req) {
      const reqData = JSON.parse(req.data_json);
      setFormData((prev) => ({
        ...prev,
        testRequestId: reqId,
        itemName: reqData.itemName,
        batchNumber: reqData.batchNumber,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        testRequestId: "",
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          recordId: formData.sampleId,
          formId: "F-LAB-002",
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
          <TestTube2 className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            سجل استلام العينات
          </h1>
          <p className="text-slate-500">
            النموذج: F-LAB-002 | قطاع المختبر (LAB)
          </p>
        </div>
      </div>

      <form className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-8">
          <div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  رقم العينة المختبري (تلقائي)
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                  value={formData.sampleId}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  تاريخ استلام العينة <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.receiveDate}
                  onChange={(e) =>
                    setFormData({ ...formData, receiveDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  مستند طلب الاختبار المرتبط (اختياري)
                </label>
                <select
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.testRequestId}
                  onChange={handleRequestSelect}
                >
                  <option value="">-- بدون طلب مسبق مباشر --</option>
                  {labRequests.map((r) => {
                    const rd = JSON.parse(r.data_json);
                    return (
                      <option key={r.record_id} value={r.record_id}>
                        {r.record_id} - {rd.itemName} (أولوية: {rd.priority})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  اسم المادة / المنتج <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="materials-list"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.itemName}
                  onChange={(e) =>
                    setFormData({ ...formData, itemName: e.target.value })
                  }
                />
                <datalist id="materials-list">
                  {materials.map((m) => (
                    <option key={m.id} value={`${m.code} - ${m.name}`} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  رقم التشغيلة / الدفعة (Batch/Lot){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.batchNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, batchNumber: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  كمية العينة المسحوبة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: 50 gram, 2 bottles"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.sampleQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, sampleQuantity: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  نوع العبوة (Container)
                </label>
                <input
                  type="text"
                  placeholder="مثال: Glass vial, Ziplock bag..."
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.containerType}
                  onChange={(e) =>
                    setFormData({ ...formData, containerType: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  ظروف حفظ العينة في المختبر{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.storageCondition}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      storageCondition: e.target.value,
                    })
                  }
                >
                  <option value="Room Temperature">
                    غرفة مكيفة (Room Temp &lt;= 25&deg;C)
                  </option>
                  <option value="Refrigerator">
                    ثلاجة (2&deg;C - 8&deg;C)
                  </option>
                  <option value="Freezer">
                    تجميد (Freezer &lt; -15&deg;C)
                  </option>
                  <option value="Incubator">حضانة (Incubator)</option>
                  <option value="Desiccator">مجفف (Desiccator)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  حالة العينة عند الاستلام{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.conditionOnReceipt}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditionOnReceipt: e.target.value,
                    })
                  }
                >
                  <option value="Intact">سليمة ومتوافقة (Intact)</option>
                  <option value="Damaged Container">
                    عبوة تالفة (Damaged)
                  </option>
                  <option value="Insufficient">
                    كمية غير كافية (Insufficient)
                  </option>
                  <option value="Incorrect Labeling">
                    بطاقة بيان خاطئة (Incorrect Labeling)
                  </option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  اسم مستلم العينة (فني المختبر)
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                  value={formData.receivedBy}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                ملاحظات والتصرف إزاء العينة
              </label>
              <textarea
                rows={2}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="في حال الاستلام بظروف استثنائية أو تالفة، يرجى تدوين الإجراء المتخذ..."
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
