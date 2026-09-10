import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { settingsAPI } from '../services/api';
import {
  LayoutDashboard, Users, GraduationCap, UserPlus, BookOpen, Presentation,
  DollarSign, Calendar, BarChart3, CreditCard, FileText, History,
  Settings, LogOut, ChevronLeft, ChevronRight, X, Package, FileSignature,
  CalendarCheck, ClipboardList, FileSpreadsheet, Award,
} from 'lucide-react';

const navGroups: { label: string; items: { icon: any; label: string; path: string; permission?: string }[] }[] = [
  {
    label: 'Principal',
    items: [{ icon: LayoutDashboard, label: 'Dashboard', path: '/', permission: 'dashboard' }],
  },
  {
    label: 'Gestão',
    items: [
      { icon: Users, label: 'Alunos', path: '/students', permission: 'students' },
      { icon: UserPlus, label: 'Matrículas', path: '/enrollments', permission: 'enrollments' },
      { icon: BookOpen, label: 'Cursos', path: '/courses', permission: 'courses' },
      { icon: Presentation, label: 'Professores', path: '/teachers', permission: 'teachers' },
      { icon: GraduationCap, label: 'Turmas', path: '/classes', permission: 'classes' },
      { icon: CalendarCheck, label: 'Frequência', path: '/attendance', permission: 'attendance' },
      { icon: ClipboardList, label: 'Avaliações', path: '/evaluations', permission: 'evaluations' },
      { icon: FileSpreadsheet, label: 'Boletins', path: '/boletins', permission: 'boletins' },
      { icon: Award, label: 'Certificados', path: '/certificates', permission: 'certificates' },
      { icon: DollarSign, label: 'Financeiro', path: '/financial', permission: 'financial' },
      { icon: Package, label: 'Planos', path: '/planos', permission: 'financial' },
      { icon: FileSignature, label: 'Contratos', path: '/contratos', permission: 'financial' },
      { icon: CreditCard, label: 'Mensalidades', path: '/mensalidades', permission: 'financial' },
      { icon: FileText, label: 'Carnês', path: '/carnes', permission: 'financial' },
      { icon: Calendar, label: 'Agenda', path: '/schedule', permission: 'schedule' },
    ],
  },
  {
    label: 'Análises',
    items: [{ icon: BarChart3, label: 'Relatórios', path: '/reports', permission: 'reports' }],
  },
  {
    label: 'Sistema',
    items: [
      { icon: Settings, label: 'Configurações', path: '/settings', permission: 'settings' },
      { icon: History, label: 'Auditoria', path: '/audit', permission: 'audit' },
    ],
  },
];

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  super_admin: 'Super Admin',
  secretary: 'Secretaria',
  teacher: 'Professor',
  financial: 'Financeiro',
  coordinator: 'Coordenador',
};

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const [logoUrl, setLogoUrl] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();

  useEffect(() => {
    settingsAPI.get().then(({ data }) => { if (data.logo_url) setLogoUrl(data.logo_url); }).catch(() => console.warn('Falha ao carregar logo'));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const content = (
    <>
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200/70 dark:border-white/10 flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-3 min-w-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-contain flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-glow">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <span className="block font-bold text-slate-900 dark:text-white text-sm leading-tight truncate">Gestão Escolar</span>
              <span className="block text-[11px] text-slate-400 font-medium">JG Sistemas</span>
            </div>
          </div>
        )}
        {!collapsed && (
          <button onClick={onToggleCollapse} className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {collapsed && (
          <button onClick={onToggleCollapse} className="hidden lg:flex mx-auto p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        <button onClick={onCloseMobile} className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-5 no-scrollbar">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(item => !item.permission || hasPermission(item.permission));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-4 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={`relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-gradient-to-b from-primary-500 to-violet-500" />
                    )}
                    <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-primary-600 dark:text-primary-300' : ''}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-200/70 dark:border-white/10">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-semibold">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{roleLabels[user.role] || user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={`hidden lg:flex flex-col h-screen bg-white dark:bg-[#0d1626] border-r border-slate-200/70 dark:border-white/10 fixed left-0 top-0 z-40 transition-all duration-300 ${collapsed ? 'w-[76px]' : 'w-64'}`}
      >
        {content}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onCloseMobile} />
          <aside className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-[#0d1626] shadow-modal flex flex-col animate-slide-in-right">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
