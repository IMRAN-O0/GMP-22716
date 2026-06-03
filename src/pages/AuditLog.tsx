import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert } from "lucide-react";
import { Navigate } from "react-router-dom";

export default function AuditLog() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.level === 1;

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/audit")
      .then((r) => r.json())
      .then((data) => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [isAdmin]);

  // Hooks must run on every render, so the access check happens after them.
  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <ShieldAlert className="w-6 h-6 ml-2 text-indigo-500" />
            سجل التدقيق (Audit Log)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            تتبع كافة الإجراءات على النظام
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-600">
                  الوقت
                </th>
                <th className="p-4 text-sm font-semibold text-slate-600">
                  المستخدم
                </th>
                <th className="p-4 text-sm font-semibold text-slate-600">
                  الإجراء
                </th>
                <th className="p-4 text-sm font-semibold text-slate-600">
                  النموذج / السجل
                </th>
                <th className="p-4 text-sm font-semibold text-slate-600">
                  التفاصيل / الملاحظات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td
                    className="p-4 text-slate-500 whitespace-nowrap"
                    dir="ltr"
                  >
                    {new Date(log.timestamp).toLocaleString("en-GB")}
                  </td>
                  <td className="p-4 font-semibold text-slate-700">
                    {log.user_id}
                  </td>
                  <td className="p-4 text-indigo-600 font-bold">
                    {log.action}
                  </td>
                  <td className="p-4 font-mono text-slate-500">
                    {log.form_id} <br /> {log.record_id}
                  </td>
                  <td className="p-4 text-slate-800">{log.details}</td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    لا يوجد سجلات تدقيق
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
