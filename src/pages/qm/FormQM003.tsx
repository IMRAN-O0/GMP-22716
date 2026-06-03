import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Users, Star } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { SearchModal, SearchField } from "../../components/SearchModal";
import { getAuthHeaders, getJsonHeaders } from "../../lib/utils";

export default function FormQM003() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  const [formData, setFormData] = useState({
    evaluationDate: new Date().toISOString().split("T")[0],
    supplierName: "",
    supplierContact: "",
    suppliedMaterialCategory: "Raw Material", // Raw Material, Packaging, Services
    relatedMaterials: [] as string[],
    qualityScore: 5,
    deliveryScore: 5,
    documentationScore: 5,
    issueHistory: "",
    overallDecision: "Approved", // Approved, Approved with conditions, Rejected
    evaluatorName: user?.name || "",
  });

  useEffect(() => {
    // Fetch materials to show what is supplied
    fetch("/api/materials", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => setMaterials(data))
      .catch(console.error);

    fetch("/api/suppliers", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => setSuppliers(data))
      .catch(console.error);
  }, []);

  const handleMaterialToggle = (code: string) => {
    setFormData((prev) => {
      const current = [...prev.relatedMaterials];
      if (current.includes(code)) {
        return { ...prev, relatedMaterials: current.filter((c) => c !== code) };
      } else {
        return { ...prev, relatedMaterials: [...current, code] };
      }
    });
  };

  const calculateTotalScore = () => {
    // average out of 5
    return (
      (formData.qualityScore +
        formData.deliveryScore +
        formData.documentationScore) /
      3
    ).toFixed(1);
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
          formId: "F-QM-003",
          department: "QM",
          creatorId: user?.id,
          status: status,
          data: {
            ...formData,
            totalScore: calculateTotalScore(),
          },
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const saved = await res.json();
      alert("تم حفظ نموذج F-QM-003 تقييم المورد بنجاح: " + saved.record_id);
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
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-blue-200 shadow-sm border-r-4 border-r-blue-500">
        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
          <Users className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            تقييم واعتماد الموردين (Supplier Evaluation)
          </h1>
          <p className="text-slate-500">
            النموذج: F-QM-003 | قسم الجودة - مرتبط بالمخزون والمواد
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div className="p-6 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                تاريخ التقييم
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.evaluationDate}
                onChange={(e) =>
                  setFormData({ ...formData, evaluationDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                المقيّم (Evaluator)
              </label>
              <input
                type="text"
                readOnly
                className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                value={formData.evaluatorName}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                اسم المورد / الشركة
              </label>
              <SearchField
                label=""
                required
                value={formData.supplierName}
                onChange={(v) => setFormData({ ...formData, supplierName: v })}
                onF3={() => setShowSupplierModal(true)}
                placeholder="اكتب أو اضغط F3 للبحث…"
                hint="F3 للبحث في قائمة الموردين"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                معلومات التواصل (هاتف/ايميل)
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.supplierContact}
                onChange={(e) =>
                  setFormData({ ...formData, supplierContact: e.target.value })
                }
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              نوع المواد الموردة
            </label>
            <select
              className="w-full px-4 py-2 mb-4 bg-white border border-slate-200 rounded-lg"
              value={formData.suppliedMaterialCategory}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  suppliedMaterialCategory: e.target.value,
                })
              }
            >
              <option value="Raw Material">مواد خام (Raw Materials)</option>
              <option value="Packaging">مواد تعبئة وتغليف (Packaging)</option>
              <option value="Services">خدمات (Services)</option>
            </select>

            <label className="block text-sm font-semibold text-slate-700 mb-2">
              المواد الموردة من هذا المورد (من قائمة المخزون)
            </label>
            <div className="max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-lg p-3 grid grid-cols-2 gap-2">
              {materials.filter((m: any) =>
                m.category !== "منتج نهائي" && m.category !== "Finished Product" &&
                (!formData.supplierName || m.supplier_name === formData.supplierName)
              ).length === 0 ? (
                <div className="text-sm text-slate-500 p-2">
                  لا توجد مواد مسجلة لهذا المورد.
                </div>
              ) : (
                materials.filter((m: any) =>
                  m.category !== "منتج نهائي" && m.category !== "Finished Product" &&
                  (!formData.supplierName || m.supplier_name === formData.supplierName)
                ).map((m) => (
                  <label
                    key={m.code}
                    className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer p-1 hover:bg-slate-50 rounded"
                  >
                    <input
                      type="checkbox"
                      className="rounded text-blue-600 focus:ring-blue-500"
                      checked={formData.relatedMaterials.includes(m.code)}
                      onChange={() => handleMaterialToggle(m.code)}
                    />
                    <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-xs">
                      {m.code}
                    </span>
                    <span className="truncate">{m.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" /> تقييم الأداء (من 1 إلى
              5 حيث 5 هو ممتاز)
            </h3>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  جودة المواد (Quality)
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  value={formData.qualityScore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      qualityScore: parseInt(e.target.value),
                    })
                  }
                />
                <div className="text-2xl font-black text-blue-600 mt-2">
                  {formData.qualityScore} / 5
                </div>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  التسليم في الموعد (Delivery)
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  value={formData.deliveryScore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryScore: parseInt(e.target.value),
                    })
                  }
                />
                <div className="text-2xl font-black text-blue-600 mt-2">
                  {formData.deliveryScore} / 5
                </div>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  دقة الوثائق (COA/MSDS)
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  value={formData.documentationScore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      documentationScore: parseInt(e.target.value),
                    })
                  }
                />
                <div className="text-2xl font-black text-blue-600 mt-2">
                  {formData.documentationScore} / 5
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              سجلات عدم المطابقة السابقة إن وجدت (Issue History)
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="هل تم رفض توريدات سابقة من هذا المورد؟"
              value={formData.issueHistory}
              onChange={(e) =>
                setFormData({ ...formData, issueHistory: e.target.value })
              }
            />
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
            <div>
              <label className="block text-lg font-bold text-blue-900 mb-2">
                القرار النهائي لاعتماد المورد (Overall Decision)
              </label>
              <p className="text-sm text-blue-700">
                متوسط التقييم الحالي:{" "}
                <strong className="text-xl">{calculateTotalScore()} / 5</strong>
              </p>
            </div>
            <div className="w-1/2">
              <select
                className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl text-blue-900 font-bold focus:ring-2 focus:ring-blue-500"
                value={formData.overallDecision}
                onChange={(e) =>
                  setFormData({ ...formData, overallDecision: e.target.value })
                }
              >
                <option value="Approved">معتمد (Approved)</option>
                <option value="Approved with conditions">
                  معتمد مع شروط (Approved with conditions)
                </option>
                <option value="Rejected">مرفوض (Rejected)</option>
              </select>
            </div>
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
      {showSupplierModal && (
        <SearchModal
          title="بحث عن مورد (F3)"
          items={suppliers}
          columns={[
            { key: "code", label: "كود المورد", className: "font-mono w-28" },
            { key: "name", label: "اسم المورد" },
            { key: "phone", label: "الهاتف", className: "w-32" },
          ]}
          searchKeys={["code", "name"]}
          placeholder="ابحث بكود أو اسم المورد…"
          onSelect={(s) => {
            setFormData({ ...formData, supplierName: s.name, supplierContact: s.phone || s.email || "" });
            setShowSupplierModal(false);
          }}
          onClose={() => setShowSupplierModal(false)}
        />
      )}
    </div>
  );
}
