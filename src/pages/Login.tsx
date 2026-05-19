import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, User } from "lucide-react";

export default function Login() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to login");

      login(data.token, data.user);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif]"
      dir="rtl"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-[28px] font-bold text-slate-900">
          QForm Manager
        </h2>
        <p className="mt-2 text-center text-[14px] text-slate-500">
          المنصة الذكية لإدارة النماذج المؤسسية
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] sm:rounded-2xl border border-slate-200 sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border-r-4 border-red-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-[13px] font-semibold text-red-700">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-slate-500 mb-2">
                رقم المستخدم
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="focus:ring-sky-400 focus:border-sky-400 block w-full pr-10 text-[14px] border-slate-200 rounded-lg py-2.5 border pl-3 text-slate-900"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-500 mb-2">
                كلمة المرور
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-sky-400 focus:border-sky-400 block w-full pr-10 text-[14px] border-slate-200 rounded-lg py-2.5 border pl-3 text-slate-900"
                  placeholder="admin123"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 rounded-lg shadow-sm font-semibold text-[14px] text-white bg-sky-400 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 transition-colors"
              >
                تسجيل الدخول
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
