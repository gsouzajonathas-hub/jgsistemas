import { useState, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Mail, ArrowLeft, ShieldCheck, BarChart3, Globe } from 'lucide-react';
import LoginForm from '../components/LoginForm';

export default function Login() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const emailFromUrl = searchParams.get('email') || '';
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>(() => tokenFromUrl ? 'reset' : 'login');
  const [resetEmail, setResetEmail] = useState(emailFromUrl);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const { authAPI } = await import('../services/api');
      await authAPI.forgotPassword({ email: resetEmail });
      setResetMsg('Se o email existir, você receberá as instruções.');
    } catch {
      setResetMsg('Se o email existir, você receberá as instruções.');
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (resetPassword !== resetConfirm) {
      setError('As senhas não conferem');
      return;
    }
    if (!tokenFromUrl) {
      setError('Link de redefinição inválido ou ausente. Solicite um novo.');
      return;
    }
    try {
      const { authAPI } = await import('../services/api');
      await authAPI.resetPassword({ email: resetEmail, token: tokenFromUrl, new_password: resetPassword });
      setResetMsg('Senha redefinida! Faça login.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao redefinir senha');
    }
  };

  const inputClass = "w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all duration-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10";

  const features = [
    { icon: ShieldCheck, title: 'Gestão completa', desc: 'Alunos, matrículas e frequência em um só lugar.' },
    { icon: BarChart3, title: 'Relatórios inteligentes', desc: 'Dashboards e exportações para decisões rápidas.' },
    { icon: Globe, title: 'Acessível em qualquer lugar', desc: 'Nuvem e acesso pela internet, do escritório ou de casa.' },
  ];

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 dark:bg-[#0b1220]">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden p-12 bg-gradient-to-br from-primary-700 via-primary-600 to-violet-600">
        <div className="absolute inset-0 bg-dot-grid opacity-40" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 w-[30rem] h-[30rem] rounded-full bg-violet-400/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="block text-lg font-bold text-white">Gestão Escolar</span>
            <span className="block text-xs text-white/70 font-medium">JG Sistemas</span>
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-white">
              Tudo para a sua escola<br />
              de inglês em um só lugar.
            </h1>
            <p className="mt-3 text-white/70 max-w-md">
              Gerencie alunos, mensalidades, frequência e avaliações com uma experiência moderna e eficiente.
            </p>
          </div>

          <div className="space-y-5">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">{f.title}</p>
                  <p className="text-sm text-white/70">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/50">© 2026 Gestão Escolar. Todos os direitos reservados.</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="block font-bold text-slate-900 dark:text-white">Gestão Escolar</span>
              <span className="block text-xs text-slate-400">JG Sistemas</span>
            </div>
          </div>

          <div className="card-surface p-8">
            {view === 'login' && (
              <LoginForm
                title="Bem-vindo de volta"
                subtitle="Entre com suas credenciais para acessar o sistema."
                onSuccess={() => navigate('/')}
                onForgot={() => { setView('forgot'); setError(''); setResetMsg(''); }}
              />
            )}

            {view === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-4">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recuperar senha</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Informe seu email para receber as instruções.</p>
                </div>
                {resetMsg && <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm px-4 py-3 rounded-xl border border-emerald-100 dark:border-emerald-500/20">{resetMsg}</div>}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className={inputClass} placeholder="seu@email.com" required />
                  </div>
                </div>
                <button type="submit" className="btn-base w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 text-sm shadow-sm shadow-primary-600/25">Enviar instruções</button>
                <button type="button" onClick={() => setView('login')} className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-1">
                  <ArrowLeft className="w-4 h-4" /> Voltar ao login
                </button>
              </form>
            )}

            {view === 'reset' && (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Redefinir senha</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Crie uma nova senha para sua conta.</p>
                </div>
                {error && <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl border border-red-100 dark:border-red-500/20">{error}</div>}
                {resetMsg && <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm px-4 py-3 rounded-xl border border-emerald-100 dark:border-emerald-500/20">{resetMsg}</div>}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                  <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className={inputClass} required disabled={!!emailFromUrl} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nova senha</label>
                  <input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} className={inputClass} required />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirmar senha</label>
                  <input type="password" value={resetConfirm} onChange={(e) => setResetConfirm(e.target.value)} className={inputClass} required />
                </div>
                <button type="submit" className="btn-base w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 text-sm shadow-sm shadow-primary-600/25">Redefinir senha</button>
                <button type="button" onClick={() => setView('login')} className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-1">
                  <ArrowLeft className="w-4 h-4" /> Voltar ao login
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
