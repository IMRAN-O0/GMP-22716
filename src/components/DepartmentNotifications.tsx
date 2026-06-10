import React, { useState, useEffect } from "react";
import { AlertCircle, Bell, CheckCircle2, ChevronRight, Clock, Info, X } from "lucide-react";
import { Link } from "react-router-dom";
import { getAuthHeaders } from "../lib/utils";

export default function DepartmentNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const dismissNotification = (e: React.MouseEvent, id: string) => {
    // The card is a Link; don't navigate when clicking the dismiss button.
    e.preventDefault();
    e.stopPropagation();
    // Optimistically remove from the list, then persist on the server.
    setNotifications((prev) => prev.filter((n) => (n.id || "") !== id));
    fetch(`/api/notifications/dashboard/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    }).catch((err) => console.error("Failed to dismiss notification", err));
  };

  useEffect(() => {
    fetch("/api/notifications/dashboard", {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setNotifications(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load notifications", err);
        setLoading(false);
      });
  }, []);

  if (loading) return null; // Or a subtle skeleton
  if (notifications.length === 0) return null; // Hide if no notifications

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 mt-2 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-sky-50 rounded-full blur-3xl opacity-50 z-0"></div>
      
      <div className="relative z-10">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <Bell className="w-5 h-5 ml-2 text-sky-600" />
          تنبيهات ومهام قيد الانتظار ({notifications.length})
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notifications.map((notif, index) => (
            <Link 
              key={notif.id || index}
              to={notif.link || "#"}
              className="group"
            >
              <div className={`p-4 rounded-xl border flex items-start transition-all duration-200
                ${
                  notif.type === 'warning' 
                    ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300' 
                    : notif.type === 'error'
                    ? 'bg-rose-50 border-rose-200 hover:bg-rose-100 hover:border-rose-300'
                    : notif.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                    : 'bg-sky-50 border-sky-200 hover:bg-sky-100 hover:border-sky-300'
                }
              `}>
                <div className="mt-0.5">
                  {notif.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-600 ml-3" />}
                  {notif.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 ml-3" />}
                  {notif.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 ml-3" />}
                  {notif.type === 'info' && <Info className="w-5 h-5 text-sky-600 ml-3" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800 mb-1">{notif.message}</p>
                  <p className="text-xs text-slate-500 font-mono flex items-center">
                    <Clock className="w-3 h-3 ml-1" />
                    {new Date(notif.date).toLocaleDateString('ar-SA') || "مؤخراً"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => dismissNotification(e, notif.id || String(index))}
                    title="حذف الإشعار"
                    aria-label="حذف الإشعار"
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
