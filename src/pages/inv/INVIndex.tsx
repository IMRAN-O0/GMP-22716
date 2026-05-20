import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  PlusCircle,
  Search,
  Package,
  Server,
  Building2,
  CheckCircle,
  Truck,
  RefreshCcw,
  Trash2,
  Archive,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { StatusBadge } from "../../components/StatusBadge";
import DepartmentNotifications from "../../components/DepartmentNotifications";

export default function INVIndex() {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);

  const hasPerm = (id: string) => {
    if (!user) return false;
    if (user.level === 1) return true;
    return !!(user.permissions && user.permissions[id]);
  };

  useEffect(() => {
    fetch("/api/warehouses")
      .then((r) => r.json())
      .then((data) => setWarehouses(data))
      .catch(console.error);

    fetch("/api/materials")
      .then((r) => r.json())
      .then((data) => setMaterials(data))
      .catch(console.error);

    fetch("/api/forms/dept/INV")
      .then((r) => r.json())
      .then((data) => {
        setForms(data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <DepartmentNotifications />
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 m-0">
            المخزون (INV)
          </h1>
          <p className="text-[14px] text-slate-500 mt-1">
            إدارة المستودعات، الأرصدة، حركة المواد الخام والمنتجات النهائية.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {hasPerm("F-INV-RM-001") && (
            <Link
              to="/inv/create-material"
              className="flex items-center px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[13px] transition-colors border border-slate-200 shadow-sm"
            >
              <PlusCircle className="w-4 h-4 ml-2 text-sky-500" />
              إضافة / تعديل منتج نهائي
            </Link>
          )}
          {hasPerm("F-INV-RM-001") && (
            <Link
              to="/inv/rm-001"
              className="flex items-center px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[13px] transition-colors border border-slate-200 shadow-sm"
            >
              <PlusCircle className="w-4 h-4 ml-2 text-stone-600" />
              إضافة / تعديل مادة خام (RM)
            </Link>
          )}
          {hasPerm("F-INV-BOM") && (
            <Link
              to="/inv/composition"
              className="flex items-center px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[13px] transition-colors border border-slate-200 shadow-sm"
            >
              <PlusCircle className="w-4 h-4 ml-2 text-emerald-500" />
              إضافة تركيبة منتج (BOM)
            </Link>
          )}
          {hasPerm("F-PRQ-001") && (
            <Link
              to="/inv/prq-001"
              className="flex items-center px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[13px] transition-colors border border-slate-200 shadow-sm"
            >
              <PlusCircle className="w-4 h-4 ml-2 text-indigo-500" />
              طلب شراء مواد (PRQ)
            </Link>
          )}
          {hasPerm("F-PIN-001") && (
            <Link
              to="/inv/pin-001"
              className="flex items-center px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[13px] transition-colors border border-slate-200 shadow-sm"
            >
              <PlusCircle className="w-4 h-4 ml-2 text-purple-500" />
              فاتورة مشتريات (PIN)
            </Link>
          )}
          {user?.level === 1 && (
            <Link
              to="/inv/create-warehouse"
              className="flex items-center px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[13px] transition-colors border border-slate-200 shadow-sm"
            >
              <PlusCircle className="w-4 h-4 ml-2 text-sky-500" />
              إضافة مستودع
            </Link>
          )}
          {hasPerm("F-PIN-001") && (
            <Link
              to="/inv/create-supplier"
              className="flex items-center px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[13px] transition-colors border border-slate-200 shadow-sm"
            >
              <PlusCircle className="w-4 h-4 ml-2 text-orange-500" />
              إضافة مورد
            </Link>
          )}
          {hasPerm("F-FP-003") && (
            <Link
              to="/inv/create-customer"
              className="flex items-center px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[13px] transition-colors border border-slate-200 shadow-sm"
            >
              <PlusCircle className="w-4 h-4 ml-2 text-pink-500" />
              إضافة عميل
            </Link>
          )}
          <Link
            to="/reports"
            className="flex items-center px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 font-semibold text-[13px] transition-colors border border-amber-200 shadow-sm"
          >
            <BarChart3 className="w-4 h-4 ml-2" />
            التقارير
          </Link>
          {(hasPerm("F-INV-RMT-001") || hasPerm("F-INV-MV-001")) && (
            <Link
              to="/inv/rmt"
              className="flex items-center px-4 py-2 bg-sky-400 text-white rounded-lg hover:bg-sky-500 font-semibold text-[13px] transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4 ml-2" />
              استلام وصرف (RMT/MV)
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex items-center">
          <div>
            <span className="block text-[13px] font-semibold text-slate-500 mb-2">
              المستودعات الرئيسية والفرعية
            </span>
            <div className="text-[24px] font-bold text-slate-900">
              {warehouses.length} مستودع
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex items-center">
          <div>
            <span className="block text-[13px] font-semibold text-slate-500 mb-2">
              أصناف المواد المتاحة
            </span>
            <div className="text-[24px] font-bold text-slate-900">
              {materials.length} صنف
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex items-center">
          <div>
            <span className="block text-[13px] font-semibold text-slate-500 mb-2">
              رصيد المواد
            </span>
            <div className="text-[24px] font-bold text-slate-900">
              {materials.reduce((acc, curr) => acc + curr.balance, 0)} وحدة
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Warehouses Tree */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-200 flex flex-col p-6 lg:col-span-1">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2 flex items-center">
            <Building2 className="w-4 h-4 ml-2 text-sky-500" />
            شجرة المستودعات
          </h3>
          <ul className="space-y-1">
            {warehouses
              .filter((w) => !w.parent_id || w.type === "MAIN")
              .map((main) => (
                <li key={main.id} className="text-[13px] text-slate-700 mb-2">
                  <div className="font-bold flex items-center mb-1">
                    <Server className="w-4 h-4 ml-1 text-slate-400" />
                    {main.name}{" "}
                    <span className="text-[10px] text-slate-400 mr-2 bg-slate-100 px-1 rounded">
                      {main.code}
                    </span>
                  </div>
                  <ul className="pr-4 border-r-2 border-slate-100 mt-1 space-y-1">
                    {warehouses
                      .filter((sub) => sub.parent_id === main.id)
                      .map((sub) => (
                        <li
                          key={sub.id}
                          className="flex items-center text-slate-600 hover:text-sky-600 cursor-pointer"
                        >
                          <div className="w-2 h-[2px] bg-slate-200 ml-2"></div>
                          <Package className="w-3 h-3 ml-1" />
                          {sub.name}{" "}
                          <span className="text-[10px] text-slate-400 mr-2">
                            ({sub.code})
                          </span>
                        </li>
                      ))}
                  </ul>
                </li>
              ))}
          </ul>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-200 flex flex-col pt-2 lg:col-span-3">
          <div className="px-6 py-4 flex justify-between items-center mb-2">
            <span className="text-[16px] font-bold text-slate-900">
              أرصدة الأصناف
            </span>
            <div className="relative">
              <input
                type="text"
                placeholder="بحث باسم أو كود المادة..."
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-[14px] w-64 focus:ring-sky-400 focus:border-sky-400 text-slate-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead className="bg-white text-slate-500 text-[13px] font-semibold">
                <tr>
                  <th className="px-6 py-4 font-semibold border-b border-slate-100">كود المادة</th>
                  <th className="px-6 py-4 font-semibold border-b border-slate-100">اسم ووصف المادة</th>
                  <th className="px-6 py-4 font-semibold border-b border-slate-100">موقع المستودع</th>
                  <th className="px-6 py-4 font-semibold border-b border-slate-100">الوحدة</th>
                  <th className="px-6 py-4 font-semibold border-b border-slate-100">الرصيد</th>
                  {user?.level <= 2 && <th className="px-6 py-4 font-semibold border-b border-slate-100 text-center w-16">حذف</th>}
                </tr>
              </thead>
              <tbody className="text-[14px] text-slate-600">
                {materials.length === 0 ? (
                  <tr>
                    <td colSpan={user?.level <= 2 ? 6 : 5} className="px-6 py-8 text-center text-slate-400">
                      لا توجد مواد مسجلة حتى الآن
                    </td>
                  </tr>
                ) : (
                  materials.map((m, i) => {
                    const warehouse = warehouses.find((w) => w.id === m.warehouse_id);
                    const isLow = m.minBalance && m.balance <= m.minBalance;
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                        <td className="px-6 py-4 font-mono font-bold text-sky-600">{m.code}</td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-800 block">{m.name}</span>
                          <span className="text-xs text-slate-400">{m.description}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[11px] font-bold">
                            {warehouse ? warehouse.name : "غير محدد"}
                          </span>
                        </td>
                        <td className="px-6 py-4">{m.unit}</td>
                        <td className={`px-6 py-4 font-bold ${isLow ? "text-red-600" : "text-slate-900"}`}>
                          {m.balance}
                          {isLow && <span className="text-[10px] text-red-500 block">مخزون منخفض</span>}
                        </td>
                        {user?.level <= 2 && (
                          <td className="px-6 py-4 text-center">
                            <button
                              type="button"
                              onClick={async () => {
                                if (!window.confirm(`هل أنت متأكد من حذف المادة "${m.name}"؟`)) return;
                                const res = await fetch(`/api/materials/${m.id}`, {
                                  method: "DELETE",
                                  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                                });
                                if (res.ok) {
                                  setMaterials((prev) => prev.filter((x) => x.id !== m.id));
                                } else {
                                  const err = await res.json().catch(() => ({ error: "خطأ" }));
                                  alert("فشل الحذف: " + err.error);
                                }
                              }}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                              title="حذف المادة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FP Forms Section */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">
          سجلات وإدارة المنتجات (Finished Products)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hasPerm("F-FP-001") && (
            <Link
              to="/inv/fp-001"
              className="bg-white border text-center border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-sky-300 transition-all flex flex-col items-center group"
            >
              <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <CheckCircle className="text-sky-500 w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800">F-FP-001</h4>
              <p className="text-sm text-slate-500 mt-1">
                الإفراج عن دفعة (Batch Release)
              </p>
            </Link>
          )}
          {hasPerm("F-FP-002") && (
            <Link
              to="/inv/fp-002"
              className="bg-white border text-center border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-sky-300 transition-all flex flex-col items-center group"
            >
              <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Package className="text-sky-500 w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800">F-FP-002</h4>
              <p className="text-sm text-slate-500 mt-1">تخزين المنتجات</p>
            </Link>
          )}
          {hasPerm("F-FP-003") && (
            <Link
              to="/inv/fp-003"
              className="bg-white border text-center border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-sky-300 transition-all flex flex-col items-center group"
            >
              <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Truck className="text-sky-500 w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800">F-FP-003</h4>
              <p className="text-sm text-slate-500 mt-1">شحن المنتجات</p>
            </Link>
          )}
          {hasPerm("F-FP-004") && (
            <Link
              to="/inv/fp-004"
              className="bg-white border text-center border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-sky-300 transition-all flex flex-col items-center group"
            >
              <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <RefreshCcw className="text-sky-500 w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800">F-FP-004</h4>
              <p className="text-sm text-slate-500 mt-1">إرجاع المنتجات</p>
            </Link>
          )}
          {hasPerm("F-FP-005") && (
            <Link
              to="/inv/fp-005"
              className="bg-white border text-center border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-sky-300 transition-all flex flex-col items-center group"
            >
              <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Trash2 className="text-sky-500 w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800">F-FP-005</h4>
              <p className="text-sm text-slate-500 mt-1">إتلاف المنتجات</p>
            </Link>
          )}
          {hasPerm("F-FP-006") && (
            <Link
              to="/inv/fp-006"
              className="bg-white border text-center border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-sky-300 transition-all flex flex-col items-center group"
            >
              <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Archive className="text-sky-500 w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800">F-FP-006</h4>
              <p className="text-sm text-slate-500 mt-1">العينات الاحتياطية</p>
            </Link>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="mt-8 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-200 flex flex-col pt-2">
        <div className="px-6 py-4 flex justify-between items-center mb-2">
          <span className="text-[16px] font-bold text-slate-900">
            أحدث النماذج والسجلات المتصلة (المخزون)
          </span>
          <div className="relative">
            <input
              type="text"
              placeholder="بحث برقم السجل..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-[14px] w-64 focus:ring-sky-400 focus:border-sky-400 text-slate-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-white text-slate-500 text-[13px] font-semibold">
              <tr>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">
                  رقم السجل
                </th>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">
                  رقم النموذج
                </th>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">
                  تاريخ الإنشاء
                </th>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">
                  المنشئ
                </th>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">
                  الحالة
                </th>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">
                  إجراء
                </th>
              </tr>
            </thead>
            <tbody className="text-[14px] text-slate-600">
              {forms.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    لا توجد سجلات حتى الآن
                  </td>
                </tr>
              ) : (
                forms.map((f, i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {f.record_id}
                    </td>
                    <td className="px-6 py-4">{f.form_id}</td>
                    <td className="px-6 py-4">
                      {new Date(f.created_at).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="px-6 py-4">{f.creator_id}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={f.status} />
                    </td>
                    <td className="px-6 py-4 text-sky-400 font-semibold hover:underline cursor-pointer">
                      <Link
                        to={`/inv/view/${f.record_id}`}
                        className="flex items-center gap-1"
                      >
                        <Archive className="w-4 h-4" />
                        عرض التفاصيل
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
