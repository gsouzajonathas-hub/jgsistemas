import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon, Bell, ChevronDown, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import GlobalSearch from './GlobalSearch';

const titles: [string, string][] = [
  ['/', 'Dashboard'],
  ['/students', 'Alunos'],
  ['/classes', 'Turmas'],
  ['/enrollments', 'Matrículas'],
  ['/financial', 'Financeiro'],
  ['/schedule', 'Agenda'],
  ['/reports', 'Relatórios'],
  ['/settings', 'Configurações'],
];

function usePageTitle() {
  const { pathname } = useLocation();
  const match = titles.find(([path]) => pathname === path || (path !== '/' && pathname.startsWith(path)));
  return match ? match[1] : 'Dashboard';
}

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const title = usePageTitle();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-3 px-4 sm:px-6 glass border-b border-slate-200/70 dark:border-white/10">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
        <Menu className="w-5 h-5" />
      </button>

      <div className="hidden sm:flex items-baseline gap-2">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
        <span className="text-slate-400 text-xs">/</span>
        <span className="text-xs text-slate-400">{user?.name}</span>
      </div>

      <div className="flex-1" />

      <div className="hidden sm:block">
        <GlobalSearch />
      </div>

      <button
        onClick={toggleTheme}
        className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      >
        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>

      <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
        <Bell className="w-5 h-5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-500 ring-2 ring-white dark:ring-[#0d1626]" />
      </button>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">{user?.name.charAt(0).toUpperCase()}</span>
          </div>
          <span className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-200">{user?.name.split(' ')[0]}</span>
          <ChevronDown className="hidden md:block w-4 h-4 text-slate-400" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0f1a2e] rounded-2xl shadow-modal border border-slate-200/80 dark:border-white/10 overflow-hidden animate-scale-in">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            <div className="p-1.5">
              <button onClick={() => { setMenuOpen(false); navigate('/settings'); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                <UserCircle className="w-4 h-4" /> Meu perfil
              </button>
              <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
