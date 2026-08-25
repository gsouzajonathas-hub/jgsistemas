import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import LoginForm from '../components/LoginForm';
import { Modal } from '../components/ui';
import frenteEscola from '../assets/logo_escola.jpeg';
import {
  GraduationCap, Moon, Sun, ShieldCheck, Globe, BarChart3,
  Sparkles, LayoutDashboard, Users, UserPlus,
  DollarSign, Calendar, Settings, CreditCard, FileText,
  CheckCircle2, Zap,
} from 'lucide-react';

const modules = [
  { icon: LayoutDashboard, title: 'Dashboard', desc: 'Visão geral com indicadores, gráficos e alertas do dia.' },
  { icon: Users, title: 'Alunos', desc: 'Cadastro completo com documentos, fotos e histórico.' },
  { icon: UserPlus, title: 'Matrículas', desc: 'Matrículas com renovação, trancamento e cancelamento.' },
  { icon: DollarSign, title: 'Financeiro', desc: 'Controle de mensalidades, pagamentos e inadimplência.' },
  { icon: CreditCard, title: 'Mensalidades', desc: 'Gestão de mensalidades por aluno com vencimento e status.' },
  { icon: FileText, title: 'Carnês', desc: 'Geração de carnês de pagamento com impressão.' },
  { icon: Calendar, title: 'Agenda', desc: 'Calendário de eventos e aulas da escola.' },
  { icon: BarChart3, title: 'Relatórios', desc: 'Exportação de relatórios em PDF e Excel.' },
  { icon: Settings, title: 'Configurações', desc: 'Logo, cores, usuários e permissões.' },
];

const steps = [
  { title: 'Cadastre', desc: 'Crie alunos e matrículas em poucos minutos, com upload de documentos.' },
  { title: 'Organize suas finanças', desc: 'Cadastre mensalidades, gere carnês e acompanhe pagamentos e inadimplência.' },
  { title: 'Decida', desc: 'Tome decisões com relatórios, dashboards e exportações precisas.' },
];

const benefits = [
  { icon: ShieldCheck, title: 'Segurança de verdade', desc: 'Autenticação JWT, trilha de auditoria e uploads validados por conteúdo.' },
  { icon: Globe, title: 'Acesso de qualquer lugar', desc: 'Nuvem e acesso pela internet, do escritório ou de casa.' },
  { icon: BarChart3, title: 'Relatórios inteligentes', desc: 'Dashboards e exportação PDF/Excel para decisões rápidas.' },
  { icon: DollarSign, title: 'Gestão financeira completa', desc: 'Mensalidades, carnês, pagamentos e controle de inadimplência em um só lugar.' },
];

const stats = [
  { value: '9', label: 'Módulos integrados' },
  { value: '100%', label: 'Na nuvem' },
  { value: '24/7', label: 'Disponibilidade' },
];

const navLinks = [
  { label: 'Módulos', href: '#modulos' },
  { label: 'Benefícios', href: '#beneficios' },
  { label: 'Como funciona', href: '#como-funciona' },
];

export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);

  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#0b1220]">
      {/* Fundo com a foto da escola */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${frenteEscola})` }}
      />
      <div className="fixed inset-0 bg-slate-50/70 dark:bg-[#0b1220]/80" />

      <div className="relative z-10">
      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="#" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">English School</span>
            </a>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                aria-label="Alternar tema"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setLoginOpen(true)}
                className="btn-base bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 text-sm shadow-sm shadow-primary-600/25"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 lg:pb-24">
        <div className="absolute inset-0 bg-dot-grid opacity-40" />
        <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-primary-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 w-[30rem] h-[30rem] rounded-full bg-violet-500/15 blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-700 dark:text-primary-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Sistema de Gestão Escolar
            </div>
            <h1 className="mt-5 text-4xl sm:text-5xl font-bold leading-tight text-slate-900 dark:text-white">
              Tudo para a sua escola de{' '}
              <span className="gradient-text">inglês em um só lugar.</span>
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Gerencie alunos, matrículas, financeiro, agenda e relatórios com uma experiência moderna, segura e eficiente.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => scrollTo('#modulos')}
                className="btn-base bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 text-sm shadow-sm shadow-primary-600/25"
              >
                Conhecer módulos
              </button>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md mx-auto">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold gradient-text">{s.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section id="modulos" className="scroll-mt-20 py-16 sm:py-20 bg-white/60 dark:bg-[#111a2e]/60 backdrop-blur-md border-y border-slate-200/80 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">Módulos</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Um sistema, <span className="gradient-text">toda a gestão.</span>
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              Da matrícula ao relatório: 9 módulos integrados cobrem todas as áreas da sua escola.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((m) => (
              <div
                key={m.title}
                className="group p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:shadow-cardHover transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-sm shadow-primary-600/20">
                  <m.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{m.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="scroll-mt-20 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">Benefícios</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Por que escolher a <span className="gradient-text">English School?</span>
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map((b) => (
              <div key={b.title} className="card-surface p-6">
                <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
                  <b.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{b.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="scroll-mt-20 py-16 sm:py-20 bg-white/60 dark:bg-[#111a2e]/60 backdrop-blur-md border-y border-slate-200/80 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">Como funciona</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Comece em <span className="gradient-text">três passos simples.</span>
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="relative text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-sm shadow-primary-600/25">
                  {i + 1}
                </div>
                <h3 className="mt-5 font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-col items-center gap-4 text-center">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Trilha de auditoria completa e dados protegidos.</span>
            </div>
            <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Atualizações automáticas, sem interromper seu trabalho.</span>
            </div>
            <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-primary-500" />
              <span>Suporte dedicado para sua escola.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">English School</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-6">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={() => navigate('/login')}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Login
              </button>
            </nav>
            <p className="text-xs text-slate-400 dark:text-slate-500">© 2026 English School. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Modal de login */}
      <Modal open={loginOpen} onClose={() => setLoginOpen(false)} size="md">
        <LoginForm
          title="Acesse sua conta"
          subtitle="Entre para gerenciar toda a sua escola."
          onSuccess={() => { setLoginOpen(false); navigate('/'); }}
          onForgot={() => navigate('/login')}
        />
        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          Precisando recuperar a senha?{' '}
          <button onClick={() => navigate('/login')} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
            Clique aqui
          </button>
        </p>
      </Modal>
      </div>
    </div>
  );
}
