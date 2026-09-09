import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentProfile from './pages/StudentProfile';
import Enrollments from './pages/Enrollments';
import Classes from './pages/Classes';
import Courses from './pages/Courses';
import Teachers from './pages/Teachers';
import Attendance from './pages/Attendance';
import Evaluations from './pages/Evaluations';
import Boletim from './pages/Boletim';
import Certificates from './pages/Certificates';
import Financial from './pages/Financial';
import Mensalidades from './pages/Mensalidades';
import Carnes from './pages/Carnes';
import Schedule from './pages/Schedule';
import Reports from './pages/Reports';
import Audit from './pages/Audit';
import Planos from './pages/Planos';
import Contratos from './pages/Contratos';
import Settings from './pages/Settings';

const MODULE_ROUTES: { permission: string; path: string }[] = [
  { permission: 'dashboard', path: '/' },
  { permission: 'students', path: '/students' },
  { permission: 'enrollments', path: '/enrollments' },
  { permission: 'courses', path: '/courses' },
  { permission: 'teachers', path: '/teachers' },
  { permission: 'classes', path: '/classes' },
  { permission: 'attendance', path: '/attendance' },
  { permission: 'evaluations', path: '/evaluations' },
  { permission: 'boletins', path: '/boletins' },
  { permission: 'certificates', path: '/certificates' },
  { permission: 'financial', path: '/financial' },
  { permission: 'schedule', path: '/schedule' },
  { permission: 'reports', path: '/reports' },
  { permission: 'audit', path: '/audit' },
  { permission: 'settings', path: '/settings' },
];

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b1220]">
      <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-primary-600/20 border-t-primary-600 dark:border-primary-400/20 dark:border-t-primary-400" />
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
}

function PermissionRoute({ permission, children }: { permission: string; children: React.ReactNode }) {
  const { user, loading, hasPermission } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b1220]">
      <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-primary-600/20 border-t-primary-600 dark:border-primary-400/20 dark:border-t-primary-400" />
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (!hasPermission(permission)) return <Navigate to="/" />;
  return <Layout>{children}</Layout>;
}

function HomeRoute() {
  const { user, loading, hasPermission } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b1220]">
      <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-primary-600/20 border-t-primary-600 dark:border-primary-400/20 dark:border-t-primary-400" />
    </div>
  );
  if (user) {
    if (hasPermission('dashboard')) return <Layout><Dashboard /></Layout>;
    const fallback = MODULE_ROUTES.find((m) => m.permission !== 'dashboard' && hasPermission(m.permission));
    if (fallback) return <Navigate to={fallback.path} replace />;
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-5xl mb-4">🚫</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sem permissão de acesso</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Seu usuário ainda não possui módulos liberados. Fale com o administrador.</p>
        </div>
      </Layout>
    );
  }
  return <Landing />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<HomeRoute />} />
          <Route path="/students" element={<PermissionRoute permission="students"><Students /></PermissionRoute>} />
          <Route path="/students/:id" element={<PermissionRoute permission="students"><StudentProfile /></PermissionRoute>} />
          <Route path="/enrollments" element={<PermissionRoute permission="enrollments"><Enrollments /></PermissionRoute>} />
          <Route path="/courses" element={<PermissionRoute permission="courses"><Courses /></PermissionRoute>} />
          <Route path="/teachers" element={<PermissionRoute permission="teachers"><Teachers /></PermissionRoute>} />
          <Route path="/classes" element={<PermissionRoute permission="classes"><Classes /></PermissionRoute>} />
          <Route path="/attendance" element={<PermissionRoute permission="attendance"><Attendance /></PermissionRoute>} />
          <Route path="/evaluations" element={<PermissionRoute permission="evaluations"><Evaluations /></PermissionRoute>} />
          <Route path="/boletins" element={<PermissionRoute permission="boletins"><Boletim /></PermissionRoute>} />
          <Route path="/certificates" element={<PermissionRoute permission="certificates"><Certificates /></PermissionRoute>} />
          <Route path="/financial" element={<PermissionRoute permission="financial"><Financial /></PermissionRoute>} />
          <Route path="/planos" element={<PermissionRoute permission="financial"><Planos /></PermissionRoute>} />
          <Route path="/contratos" element={<PermissionRoute permission="financial"><Contratos /></PermissionRoute>} />
          <Route path="/mensalidades" element={<PermissionRoute permission="financial"><Mensalidades /></PermissionRoute>} />
          <Route path="/carnes" element={<PermissionRoute permission="financial"><Carnes /></PermissionRoute>} />
          <Route path="/schedule" element={<PermissionRoute permission="schedule"><Schedule /></PermissionRoute>} />
          <Route path="/reports" element={<PermissionRoute permission="reports"><Reports /></PermissionRoute>} />
          <Route path="/audit" element={<PermissionRoute permission="audit"><Audit /></PermissionRoute>} />
          <Route path="/settings" element={<PermissionRoute permission="settings"><Settings /></PermissionRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
