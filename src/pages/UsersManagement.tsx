import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Shield,
  ArrowRight,
  Save,
} from "lucide-react";
import { Navigate } from "react-router-dom";

const DEPT_PERMISSIONS: Record<
  string,
  { category: string; items: { id: string; label: string }[] }[]
> = {
  INV: [
    {
      category: "نماذج المواد الخام",
      items: [
        { id: "F-INV-RMT-001", label: "استلام مادة خام" },
        { id: "F-INV-MV-001", label: "حركات المخزون" },
        { id: "F-INV-RM-001", label: "إنشاء مادة جديدة" },
        { id: "F-INV-BOM", label: "قائمة المكونات BOM" },
      ],
    },
    {
      category: "نماذج المنتج النهائي",
      items: [
        { id: "F-FP-001", label: "إفراج عن منتج" },
        { id: "F-FP-002", label: "تسجيل تخزين" },
        { id: "F-FP-003", label: "شحن للعميل" },
        { id: "F-FP-004", label: "تسجيل مرتجع" },
        { id: "F-FP-005", label: "إتلاف منتج" },
        { id: "F-FP-006", label: "إعادة تدوير" },
      ],
    },
    {
      category: "المشتريات",
      items: [
        { id: "F-PRQ-001", label: "طلب شراء PRQ" },
        { id: "F-PIN-001", label: "فاتورة استلام" },
      ],
    },
    {
      category: "التقارير",
      items: [
        { id: "REP-INV-BAL", label: "تقرير الأرصدة" },
        { id: "REP-INV-SHP", label: "تقرير الشحنات" },
        { id: "REP-INV-SUP", label: "تقرير الموردين" },
        { id: "REP-INV-TRN", label: "تقرير حركات المخزون" },
        { id: "REP-INV-RET", label: "تقرير المرتجعات والإتلاف" },
      ],
    },
  ],
  PRD: [
    {
      category: "الإنتاج المجسد",
      items: [
        { id: "F-PRD-001", label: "أمر إنتاج" },
        { id: "F-PRD-002", label: "سجل التصنيع والتشغيل" },
        { id: "F-PRD-003", label: "قائمة مراجعة الإنتاج" },
        { id: "F-PRD-004", label: "مراقبة العملية" },
      ],
    },
    {
      category: "التقارير",
      items: [
        { id: "prd_orders", label: "تقرير أوامر الإنتاج" },
        { id: "prd_waste", label: "تقرير الفاقد الإنتاجي" },
        { id: "prd_monitoring", label: "تقرير رصد المعاملات" },
        { id: "prd_labor", label: "تقرير كفاءة العمالة" },
        { id: "prd_bom", label: "تقرير مقارنة BOM بالاستهلاك" },
      ],
    },
  ],
  QM: [
    {
      category: "إدارة الجودة",
      items: [
        { id: "F-CMP-001", label: "سجل شكاوى العملاء" },
        { id: "F-RCL-001", label: "سجل استدعاء المنتجات" },
        { id: "F-DEV-001", label: "سجل الانحرافات" },
        { id: "F-QM-005", label: "تقرير عدم المطابقة" },
        { id: "F-QM-006", label: "إجراء تصحيحي ووقائي" },
      ],
    },
    {
      category: "التقارير",
      items: [
        { id: "qm_ncr", label: "تقرير عدم المطابقة NCR" },
        { id: "qm_capa", label: "تقرير CAPA" },
        { id: "qm_risk", label: "تقرير تقييم المخاطر" },
        { id: "qm_mnt", label: "تقرير الصيانة والأعطال" },
        { id: "qm_env", label: "مراقبة الحرارة والرطوبة" },
        { id: "qm_cal", label: "تقرير جدول المعايرة" },
        { id: "qm_recall", label: "تقرير الاستدعاءات" },
        { id: "batch_trace", label: "تتبع الدفعة الكامل" },
      ],
    },
  ],
  LAB: [
    {
      category: "المختبر",
      items: [
        { id: "F-LAB-001", label: "استلام عينة" },
        { id: "F-LAB-002", label: "نتائج الاختبار" },
        { id: "F-LAB-003", label: "سجل عينات الاحتفاظ" },
        { id: "F-LAB-004", label: "معايرة الأجهزة" },
        { id: "F-LAB-005", label: "تحضير المواد الكيميائية" },
        { id: "F-LAB-006", label: "مراقبة صلاحية الكواشف" },
      ],
    },
    {
      category: "التقارير",
      items: [{ id: "expiry_watch", label: "تقرير انتهاء الصلاحية" }],
    },
  ],
  HR: [
    {
      category: "الموارد البشرية",
      items: [
        { id: "F-HR-001", label: "إضافة موظف" },
        { id: "F-HR-002", label: "تقييم أداء" },
        { id: "F-HR-003", label: "سجل الإجازات" },
      ],
    },
  ],
  TRN: [
    {
      category: "التدريب",
      items: [
        { id: "F-TRN-001", label: "خطة التدريب" },
        { id: "F-TRN-002", label: "سجل حضور" },
        { id: "F-TRN-003", label: "شهادة اجتياز" },
        { id: "F-TRN-004", label: "تقييم مدرب" },
      ],
    },
  ],
  ALL: [
    {
      category: "لوحات القيادة المستقلة",
      items: [{ id: "exec_dash", label: "لوحة KPI التنفيذية" }],
    },
  ],
};

export default function UsersManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>({
    id: null,
    userId: "",
    name: "",
    department: "INV",
    level: 4,
    password: "",
    permissions: {},
  });

  if (user?.level !== 1) {
    return <Navigate to="/" />;
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent, status: any = "approved") => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    try {
      const isEdit = !!formData.id;
      const url = isEdit ? `/api/users/${formData.id}` : "/api/users";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowModal(false);
        fetchUsers();
      } else {
        const json = await res.json();
        alert(json.error || "Failed to save user");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving user");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1:
        return {
          label: "مدير النظام (Level 1)",
          color: "bg-purple-100 text-purple-700",
        };
      case 2:
        return {
          label: "مدير القسم (Level 2)",
          color: "bg-emerald-100 text-emerald-700",
        };
      case 3:
        return {
          label: "مُراجع القسم (Level 3)",
          color: "bg-amber-100 text-amber-700",
        };
      case 4:
        return {
          label: "منفذ / موظف (Level 4)",
          color: "bg-blue-100 text-blue-700",
        };
      default:
        return { label: "مجهول", color: "bg-stone-100 text-stone-700" };
    }
  };

  const togglePermission = (id: string) => {
    setFormData((prev: any) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [id]: !prev.permissions[id],
      },
    }));
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <Shield className="w-6 h-6 ml-2 text-indigo-500" />
            إدارة المستخدمين والصلاحيات
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            إضافة، تعديل، وتحديد مستويات الوصول
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              id: null,
              userId: "",
              name: "",
              department: "HR",
              level: 4,
              password: "",
            });
            setShowModal(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center justify-center font-semibold hover:bg-indigo-700 transition"
        >
          <Plus className="w-5 h-5 ml-2" /> مستخدم جديد
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-600">
                  كود المستخدم
                </th>
                <th className="p-4 text-sm font-semibold text-slate-600">
                  الاسم
                </th>
                <th className="p-4 text-sm font-semibold text-slate-600">
                  القسم
                </th>
                <th className="p-4 text-sm font-semibold text-slate-600">
                  المستوى (Level)
                </th>
                <th className="p-4 text-sm font-semibold text-slate-600">
                  حالة الحساب
                </th>
                <th className="p-4 text-sm font-semibold text-slate-600">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const lvl = getLevelLabel(u.level);
                return (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 text-sm font-bold text-slate-700">
                      {u.user_id}
                    </td>
                    <td className="p-4 text-sm text-slate-800 font-medium">
                      {u.name}
                    </td>
                    <td className="p-4 text-sm">
                      <span className="bg-stone-100 text-stone-700 px-2 py-1 rounded-md text-xs font-bold border border-stone-200">
                        {u.department}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-bold ${lvl.color}`}
                      >
                        {lvl.label}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-bold ${u.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                      >
                        {u.status === "active" ? "نشط" : "موقف"}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() => {
                          let perms = {};
                          if (u.permissions) {
                            try {
                              perms = JSON.parse(u.permissions);
                            } catch (e) {}
                          }
                          setFormData({
                            id: u.id,
                            userId: u.user_id,
                            name: u.name,
                            department: u.department,
                            level: u.level,
                            password: "",
                            permissions: perms,
                          });
                          setStep(1);
                          setShowModal(true);
                        }}
                        className="p-1.5 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    لا يوجد مستخدمون
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex flex-col justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 text-lg">
                {formData.id ? "تعديل المستخدم" : "مستخدم جديد"}{" "}
                {step === 2 && "- تحديد الصلاحيات"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              {step === 1 ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      كود المستخدم (User ID)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.userId}
                      disabled={!!formData.id}
                      onChange={(e) =>
                        setFormData({ ...formData, userId: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 sm:text-sm font-mono disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      الاسم الكامل
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 sm:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        القسم
                      </label>
                      <select
                        required
                        value={formData.department}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            department: e.target.value,
                          })
                        }
                        className="w-full border border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 sm:text-sm"
                      >
                        {[
                          "INV",
                          "PRD",
                          "QM",
                          "LAB",
                          "HR",
                          "TRN",
                          "SLA",
                          "ALL",
                        ].map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        مستوى الصلاحية (Level)
                      </label>
                      <select
                        required
                        value={formData.level}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            level: parseInt(e.target.value),
                          })
                        }
                        className="w-full border border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 sm:text-sm"
                      >
                        <option value={1}>Level 1 - مدير النظام</option>
                        <option value={2}>Level 2 - مدير القسم</option>
                        <option value={3}>Level 3 - مُراجع القسم</option>
                        <option value={4}>Level 4 - منفذ / موظف</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      كلمة المرور{" "}
                      {formData.id && (
                        <span className="text-xs text-slate-400">
                          (اتركها فارغة لعدم التغيير)
                        </span>
                      )}
                    </label>
                    <input
                      type="password"
                      required={!formData.id}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 sm:text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pl-2">
                  {(formData.department === "ALL"
                    ? Object.entries(DEPT_PERMISSIONS)
                    : [
                        [
                          formData.department,
                          DEPT_PERMISSIONS[formData.department] || [],
                        ],
                      ]
                  ).map(([deptKey, deptCats]) => (
                    <div key={deptKey as string} className="mb-6">
                      {formData.department === "ALL" && (
                        <h3 className="font-bold text-lg text-slate-800 mb-3 border-b border-slate-200 pb-2">
                          قسم {deptKey as string}
                        </h3>
                      )}
                      <div className="space-y-4">
                        {(
                          deptCats as {
                            category: string;
                            items: { id: string; label: string }[];
                          }[]
                        ).map((cat) => (
                          <div
                            key={cat.category}
                            className="border border-slate-200 rounded-xl overflow-hidden"
                          >
                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-bold text-slate-800">
                              {cat.category}
                            </div>
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {cat.items.map((item) => (
                                <label
                                  key={item.id}
                                  className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition border border-slate-50"
                                >
                                  <div
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formData.permissions[item.id] ? "bg-indigo-600" : "bg-slate-300"}`}
                                  >
                                    <span
                                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${formData.permissions[item.id] ? "-translate-x-4" : "-translate-x-1"}`}
                                    />
                                  </div>
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={!!formData.permissions[item.id]}
                                    onChange={() => togglePermission(item.id)}
                                  />
                                  <span className="text-[13px] font-semibold text-slate-700">
                                    {item.label}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 flex justify-between gap-3 border-t border-slate-100 pt-5">
                {step === 2 ? (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
                  >
                    رجوع
                  </button>
                ) : (
                  <div></div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-semibold transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center shadow-sm"
                  >
                    {step === 1 ? (
                      <>
                        التالي: تحديد الصلاحيات{" "}
                        <ArrowRight className="w-4 h-4 mr-2" />
                      </>
                    ) : (
                      <>
                        حفظ وإنشاء الحساب <Save className="w-4 h-4 mr-2" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
