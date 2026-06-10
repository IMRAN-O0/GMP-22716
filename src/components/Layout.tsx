import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Building2, Users, FileText, Settings, LogOut,
  LayoutDashboard, Archive, BarChart3, Package, Beaker, Boxes
} from 'lucide-react';
import { getAccessibleDepartments } from '../constants/departments';
import NaxeLogo from './NaxeLogo';
import ChangePassword from '../pages/ChangePassword';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Force the default/flagged account to set a new password before using the app.
  if (user.mustChangePassword) {
    return <ChangePassword forced />;
  }

  const accessibleDepts = getAccessibleDepartments(user);

  const isAuthorizedURL = (path: string) => {
      if (user.level === 1 || user.department === 'ALL') return true;
      if (path === '/' || path === '/reports' || path === '/archive') return true;

      const raw = path.split('/')[1]?.toUpperCase();
      if (!raw || raw === '') return true;
      // HR & Training were merged into a single "HRT" department.
      const deptCode = raw === 'HR' || raw === 'TRN' ? 'HRT' : raw;

      // Department sections — accessible if it's the user's department OR they
      // hold any permission within it (supports working across departments).
      if (['HRT', 'PRD', 'LAB', 'INV', 'QM', 'PKG'].includes(deptCode)) {
          return accessibleDepts.has(deptCode);
      }
      return true;
  };

  if (!isAuthorizedURL(location.pathname)) {
      return (
          <div className="flex bg-slate-100 min-h-screen items-center justify-center font-['Segoe_UI']" dir="rtl">
             <div className="text-center p-10 bg-white rounded-2xl shadow-sm border border-slate-200">
                 <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Settings className="w-10 h-10" />
                 </div>
                 <h1 className="text-3xl font-bold text-slate-800 mb-4">403 غير مصرح</h1>
                 <p className="text-slate-600 mb-8 max-w-sm mx-auto">عذراً، لا تملك الصلاحيات الكافية للوصول إلى هذا القسم. برجاء التواصل مع مدير النظام.</p>
                 <Link to="/" className="px-6 py-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-700 font-semibold transition-colors">العودة للرئيسية</Link>
             </div>
          </div>
      );
  }

  const navItems = [
    { title: 'الرئيسية', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { title: 'الموارد البشرية والتدريب (HRT)', path: '/hr', icon: <Users className="w-5 h-5" /> },
    { title: 'الإنتاج (PRD)', path: '/prd', icon: <Building2 className="w-5 h-5" /> },
    { title: 'المختبر (LAB)', path: '/lab', icon: <Beaker className="w-5 h-5" /> },
    { title: 'المخزون (INV)', path: '/inv', icon: <Package className="w-5 h-5" /> },
    { title: 'التعبئة والتغليف (PKG)', path: '/pkg', icon: <Boxes className="w-5 h-5" /> },
    { title: 'إدارة الجودة (QM)', path: '/qm', icon: <FileText className="w-5 h-5" /> },
    { title: 'الأرشيف', path: '/archive', icon: <Archive className="w-5 h-5" /> },
    { title: 'التقارير', path: '/reports', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  if (user?.level === 1) {
      navItems.push({ title: 'إدارة المستخدمين', path: '/users', icon: <Settings className="w-5 h-5" /> });
      navItems.push({ title: 'سجل التدقيق', path: '/audit', icon: <FileText className="w-5 h-5" /> });
      navItems.push({ title: 'إعدادات الشركة', path: '/settings', icon: <Building2 className="w-5 h-5" /> });
  }

  const filteredNavItems = navItems.filter(item => {
      const raw = item.path.split('/')[1]?.toUpperCase();
      if (!raw) return true;
      if (user.level === 1 || user.department === 'ALL') return true;
      const code = raw === 'HR' || raw === 'TRN' ? 'HRT' : raw;
      if (['HRT', 'PRD', 'LAB', 'INV', 'QM', 'PKG'].includes(code)) {
          return accessibleDepts.has(code);
      }
      return true;
  });

  return (
    <div className="flex bg-slate-100 min-h-screen font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif]" dir="rtl">
      {/* Sidebar - Right */}
      <div className="w-[260px] bg-slate-800 text-white min-h-screen flex flex-col flex-shrink-0 p-8 print:hidden">
        <div className="flex items-center mb-12">
          <NaxeLogo size={34} withWordmark />
        </div>

        <nav className="flex-1 space-y-2">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-slate-700 border-r-4 border-sky-400 text-white'
                    : 'text-white hover:bg-slate-700/50'
                }`}
              >
                <span className="ml-3 w-5 h-5 bg-white/20 rounded flex items-center justify-center [&>svg]:w-3 [&>svg]:h-3">{item.icon}</span>
                <span className="text-sm">{item.title}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-5 border-t border-slate-700 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-slate-500 rounded-full ml-3"></div>
            <div>
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-[11px] text-slate-400">{user.department} - Level {user.level}</div>
            </div>
          </div>
          <button onClick={logout} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="تسجيل الخروج">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 p-10 print:p-4 gap-6 overflow-auto print:overflow-visible bg-slate-100 print:bg-white text-black">
        <Outlet />
      </div>
    </div>
  );
}
