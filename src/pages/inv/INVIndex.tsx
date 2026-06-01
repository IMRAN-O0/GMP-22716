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
  Pencil,
  X,
  Check,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { StatusBadge } from "../../components/StatusBadge";
import DepartmentNotifications from "../../components/DepartmentNotifications";

export default function INVIndex() {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [balanceSearch, setBalanceSearch] = useState("");
  const [editingBalance, setEditingBalance] = useState<{ id: number; val: string } | null>(null);
  const [editingWH, setEditingWH] = useState<{ id: number; name: string; type: string; code: string; parent_id: number | null; description: string } | null>(null);

  const hasPerm = (id: string) => {
    if (!user) return false;
    if (user.level === 1) return true;
    return !!(user.permissions && user.permissions[id]);
  };

  useEffect(() => {
    const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

    fetch("/api/warehouses", { headers })
      .then((r) => r.json())
      .then((data) => setWarehouses(Array.isArray(data) ? data : []))
      .catch(console.error);

    fetch("/api/materials", { headers })
      .then((r) => r.json())
      .then((data) => setMaterials(Array.isArray(data) ? data : []))
      .catch(console.error);

    fetch("/api/forms/dept/INV", { headers })
      .then((r) => r.json())
      .then((data) => setForms(Array.isArray(data) ? data : []))
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
              to="/inv/create-final-product"
              className="flex items-center px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-[13px] transition-colors border border-slate-200 shadow-sm"
            >
              <PlusCircle className="w-4 h-4 ml-2 text-sky-500" />
              إضافة / تعديل منتج نهائي (FD)
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
              {parseFloat(materials.reduce((acc, curr) => acc + curr.balance, 0).toFixed(4))} وحدة
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
                  {editingWH?.id === main.id ? (
                    <div className="bg-sky-50 border border-sky-200 rounded-lg p-2 mb-1 space-y-1">
                      <input className="w-full border border-slate-200 rounded px-2 py-1 text-[12px]" value={editingWH.name} onChange={e => setEditingWH({ ...editingWH, name: e.target.value })} placeholder="اسم المستودع" />
                      <select className="w-full border border-slate-200 rounded px-2 py-1 text-[12px]" value={editingWH.type} onChange={e => setEditingWH({ ...editingWH, type: e.target.value })}>
                        <option value="MAIN">رئيسي</option>
                        <option value="SUB">فرعي</option>
                      </select>
                      <div className="flex gap-1 justify-end">
                        <button onClick={async () => {
                          const h = { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` };
                          await fetch(`/api/warehouses/${editingWH.id}`, { method: "PUT", headers: h, body: JSON.stringify({ code: editingWH.code, name: editingWH.name, type: editingWH.type, parent_id: editingWH.parent_id, description: editingWH.description }) });
                          setWarehouses(prev => prev.map(w => w.id === editingWH.id ? { ...w, name: editingWH.name, type: editingWH.type } : w));
                          setEditingWH(null);
                        }} className="flex items-center gap-1 px-2 py-1 bg-sky-600 text-white rounded text-[11px] font-bold"><Check className="w-3 h-3" /> حفظ</button>
                        <button onClick={() => setEditingWH(null)} className="px-2 py-1 bg-slate-100 rounded text-[11px] text-slate-600"><X className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="font-bold flex items-center mb-1 group">
                      <Server className="w-4 h-4 ml-1 text-slate-400" />
                      {main.name}{" "}
                      <span className="text-[10px] text-slate-400 mr-2 bg-slate-100 px-1 rounded">{main.code}</span>
                      {user?.level <= 2 && (
                        <button onClick={() => setEditingWH({ id: main.id, name: main.name, type: main.type, code: main.code, parent_id: main.parent_id ?? null, description: main.description || "" })} className="opacity-0 group-hover:opacity-100 ml-2 p-0.5 text-slate-400 hover:text-sky-600 transition-all"><Pencil className="w-3 h-3" /></button>
                      )}
                    </div>
                  )}
                  <ul className="pr-4 border-r-2 border-slate-100 mt-1 space-y-1">
                    {warehouses
                      .filter((sub) => sub.parent_id === main.id)
                      .map((sub) => (
                        <li key={sub.id} className="text-slate-600">
                          {editingWH?.id === sub.id ? (
                            <div className="bg-sky-50 border border-sky-200 rounded-lg p-2 space-y-1">
                              <input className="w-full border border-slate-200 rounded px-2 py-1 text-[12px]" value={editingWH.name} onChange={e => setEditingWH({ ...editingWH, name: e.target.value })} placeholder="اسم المستودع" />
                              <div className="flex gap-1 justify-end">
                                <button onClick={async () => {
                                  const h = { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` };
                                  await fetch(`/api/warehouses/${editingWH.id}`, { method: "PUT", headers: h, body: JSON.stringify({ code: editingWH.code, name: editingWH.name, type: editingWH.type, parent_id: editingWH.parent_id, description: editingWH.description }) });
                                  setWarehouses(prev => prev.map(w => w.id === editingWH.id ? { ...w, name: editingWH.name } : w));
                                  setEditingWH(null);
                                }} className="flex items-center gap-1 px-2 py-1 bg-sky-600 text-white rounded text-[11px] font-bold"><Check className="w-3 h-3" /> حفظ</button>
                                <button onClick={() => setEditingWH(null)} className="px-2 py-1 bg-slate-100 rounded text-[11px] text-slate-600"><X className="w-3 h-3" /></button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center hover:text-sky-600 group">
                              <div className="w-2 h-[2px] bg-slate-200 ml-2"></div>
                              <Package className="w-3 h-3 ml-1" />
                              {sub.name}{" "}
                              <span className="text-[10px] text-slate-400 mr-2">({sub.code})</span>
                              {user?.level <= 2 && (
                                <button onClick={() => setEditingWH({ id: sub.id, name: sub.name, type: sub.type, code: sub.code, parent_id: sub.parent_id ?? null, description: sub.description || "" })} className="opacity-0 group-hover:opacity-100 ml-2 p-0.5 text-slate-400 hover:text-sky-600 transition-all"><Pencil className="w-3 h-3" /></button>
                              )}
                            </div>
                          )}
                        </li>
                      ))}
                  </ul>
                </li>
              ))}
          </ul>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-200 flex flex-col lg:col-span-3" style={{maxHeight: "420px"}}>
          <div className="px-4 py-3 flex justify-between items-center border-b border-slate-100 flex-shrink-0 gap-2 flex-wrap">
            <span className="text-[15px] font-bold text-slate-900">
              أرصدة الأصناف
              <span className="text-[12px] font-normal text-slate-400 mr-2">({materials.filter(m => !balanceSearch || m.name?.includes(balanceSearch) || m.code?.includes(balanceSearch)).length} صنف)</span>
            </span>
            <div className="flex gap-2 items-center">
              {user?.level === 1 && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm("سيتم مزامنة جميع الأرصدة من السجلات المعتمدة. هل تريد المتابعة؟")) return;
                    const res = await fetch("/api/materials/sync-from-transactions", {
                      method: "POST",
                      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                    });
                    const result = await res.json();
                    if (result.success) {
                      alert(`تمت المزامنة — تم تحديث ${result.updated} مادة.`);
                      fetch("/api/materials", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
                        .then(r => r.json()).then(d => setMaterials(Array.isArray(d) ? d : []));
                    } else {
                      alert("فشل: " + result.error);
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-sky-50 border border-sky-200 text-sky-700 rounded-lg text-[12px] font-semibold hover:bg-sky-100"
                >
                  <RefreshCcw className="w-3.5 h-3.5" /> مزامنة الأرصدة
                </button>
              )}
              <div className="relative">
                <input
                  type="text"
                  placeholder="بحث باسم أو كود..."
                  value={balanceSearch}
                  onChange={(e) => setBalanceSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-[13px] w-48 focus:ring-sky-400 focus:border-sky-400 text-slate-600"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              </div>
            </div>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-right border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-[12px] font-semibold sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2.5 font-semibold border-b border-slate-100">كود المادة</th>
                  <th className="px-3 py-2.5 font-semibold border-b border-slate-100">اسم المادة</th>
                  <th className="px-3 py-2.5 font-semibold border-b border-slate-100">المستودع</th>
                  <th className="px-3 py-2.5 font-semibold border-b border-slate-100">الوحدة</th>
                  <th className="px-3 py-2.5 font-semibold border-b border-slate-100">الرصيد</th>
                  {user?.level <= 2 && <th className="px-3 py-2.5 font-semibold border-b border-slate-100 text-center w-12">حذف</th>}
                </tr>
              </thead>
              <tbody className="text-[13px] text-slate-600">
                {materials.length === 0 ? (
                  <tr>
                    <td colSpan={user?.level <= 2 ? 6 : 5} className="px-4 py-6 text-center text-slate-400">
                      لا توجد مواد مسجلة حتى الآن
                    </td>
                  </tr>
                ) : (
                  materials
                    .filter(m => !balanceSearch || m.name?.includes(balanceSearch) || m.code?.includes(balanceSearch))
                    .map((m, i) => {
                    const warehouse = warehouses.find((w) => w.id === m.warehouse_id);
                    const isLow = !!m.minBalance && m.balance <= m.minBalance;
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2 font-mono font-bold text-sky-600 text-[12px]">{m.code}</td>
                        <td className="px-3 py-2">
                          <span className="font-semibold text-slate-800">{m.name}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-bold">
                            {warehouse ? warehouse.name : "غير محدد"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-500">{m.unit}</td>
                        <td className={`px-3 py-2 font-bold ${isLow ? "text-red-600" : "text-slate-900"}`}>
                          {user?.level === 1 && editingBalance?.id === m.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number" step="0.01" min="0"
                                value={editingBalance.val}
                                autoFocus
                                onChange={e => setEditingBalance({ id: m.id, val: e.target.value })}
                                onKeyDown={async e => {
                                  if (e.key === "Enter") {
                                    const newBal = parseFloat(editingBalance.val);
                                    if (isNaN(newBal) || newBal < 0) return;
                                    await fetch(`/api/materials/${m.id}/balance`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
                                      body: JSON.stringify({ balance: newBal }),
                                    });
                                    setMaterials(prev => prev.map(x => x.id === m.id ? { ...x, balance: newBal } : x));
                                    setEditingBalance(null);
                                  } else if (e.key === "Escape") {
                                    setEditingBalance(null);
                                  }
                                }}
                                className="w-20 border border-amber-400 rounded px-1 py-0.5 text-[12px] font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-400"
                              />
                              <span className="text-[10px] text-slate-400">Enter</span>
                            </div>
                          ) : (
                            <span className={m.balance < 0 ? "text-red-600 font-bold" : ""}>
                              {typeof m.balance === 'number' ? parseFloat(m.balance.toFixed(4)) : m.balance}
                            </span>
                          )}
                          {isLow && <span className="text-[10px] text-red-500 block">منخفض</span>}
                        </td>
                        {user?.level <= 2 && (
                          <td className="px-3 py-2 text-center">
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
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                              title="حذف المادة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
