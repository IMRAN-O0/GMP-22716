import React, { useState } from "react";
import { Lock, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getJsonHeaders } from "../lib/utils";
import NaxeLogo from "../components/NaxeLogo";

/**
 * Forced password-change screen. Shown by Layout whenever the logged-in user
 * still has `mustChangePassword` set (e.g. the seeded default admin account).
 * Blocks the rest of the app until a new password is set.
 */
export default function ChangePassword({ forced = false }: { forced?: boolean }) {
  const { user, token, login } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) return setError("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل");
    if (newPassword !== confirm) return setError("كلمتا المرور غير متطابقتين");
    setLoading(true);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: getJsonHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "تعذّر تغيير كلمة المرور");
      } else {
        // Clear the flag locally so the app unlocks immediately.
        if (user && token) login(token, { ...user, mustChangePassword: false });
        alert("تم تغيير كلمة المرور بنجاح");
      }
    } catch {
      setError("تعذّر الاتصال بالخادم");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4" dir="rtl">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center"><NaxeLogo size={56} /></div>
        <h2 className="mt-4 text-2xl font-bold text-slate-900">تغيير كلمة المرور</h2>
        {forced && (
          <div className="mt-3 flex items-center justify-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm font-semibold">
            <ShieldAlert className="w-4 h-4" />
            يجب تغيير كلمة المرور الافتراضية قبل المتابعة
          </div>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <form onSubmit={submit} className="bg-white py-8 px-6 shadow-sm sm:rounded-2xl border border-slate-200 space-y-5">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">{error}</div>}
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">كلمة المرور الحالية</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2 pr-9" />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">كلمة المرور الجديدة (8 أحرف على الأقل)</label>
            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">تأكيد كلمة المرور الجديدة</label>
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-sky-400 focus:ring-sky-400 text-sm py-2" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-sky-600 text-white rounded-lg py-2.5 font-semibold hover:bg-sky-700 disabled:opacity-50 text-sm">
            {loading ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
          </button>
        </form>
      </div>
    </div>
  );
}
