import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import LoginForm from '../components/LoginForm';
import { Modal } from '../components/ui';
import {
  IconGraduation, IconMoon, IconSun, IconShield, IconGlobe, IconChart,
  IconSparkles, IconDashboard, IconUsers, IconUserPlus,
  IconDollar, IconCalendar, IconSettings, IconCreditCard, IconFileText,
  IconCheckCircle, IconZap, IconNotebook, IconAward, IconArrowRight,
} from '../components/brand-icons';

/* =========================================================================
   Hooks de animação (nativos, sem dependências npm)
   ========================================================================= */

/** Scroll-reveal: adiciona .is-revealed quando o elemento entra na viewport. */
function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-revealed');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('is-revealed');
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -6% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/** Spotlight: controla --mx/--my para o brilho radial que segue o cursor no card. */
function useSpotlight() {
  const ref = useRef<HTMLDivElement | null>(null);
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }, []);
  return { ref, onMove };
}

/** Typewriter: digita/apaga um ciclo de frases dentro do H1. */
function useTypewriter(words: string[], { type = 45, hold = 2000, erase = 26 }: { type?: number; hold?: number; erase?: number } = {}) {
  const [text, setText] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setText(words[0]);
      return;
    }
    const word = words[wordIdx % words.length];
    let delay = deleting ? erase : type;
    if (!deleting && text === word) delay = hold;

    const t = setTimeout(() => {
      if (!deleting) {
        if (text.length < word.length) {
          setText(word.slice(0, text.length + 1));
        } else {
          setDeleting(true);
        }
      } else {
        if (text.length > 0) {
          setText(word.slice(0, text.length - 1));
        } else {
          setDeleting(false);
          setWordIdx((i) => (i + 1) % words.length);
        }
      }
    }, delay);
    return () => clearTimeout(t);
  }, [text, deleting, wordIdx, words, type, hold, erase]);

  return { text, isTyping: text.length > 0 };
}

/** Count-up: anima o número quando o elemento entra na viewport (IntersectionObserver). */
function useCountUp(target: number, suffix = '', duration = 1400) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = `${target}${suffix}`;
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, suffix]);

  useEffect(() => {
    if (!started) return;
    const el = ref.current;
    if (!el) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(eased * target);
      el.textContent = `${val}${suffix}`;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, target, suffix, duration]);

  return ref;
}

/** Botão magnético style Typebot: puxa levemente o elemento em direção ao cursor. */
function useMagnetic<T extends HTMLElement = HTMLButtonElement>(strength = 0.3) {
  const ref = useRef<T | null>(null);
  const onMove = useCallback((e: React.MouseEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    el.style.transform = `translate(${(relX * strength).toFixed(1)}px, ${(relY * strength).toFixed(1)}px)`;
  }, [strength]);
  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'translate(0, 0)';
  }, []);
  return { ref, onMove, onLeave };
}

/* =========================================================================
   Componentes de card com reveal próprio
   ========================================================================= */

/** Card de módulo com reveal + spotlight + tilt 3D no hover. */
function ModuleCard({ icon: Icon, title, desc, delay, featured }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; delay: number; featured?: boolean }) {
  const ref = useReveal<HTMLDivElement>();
  const { ref: spotRef, onMove } = useSpotlight();

  const onTilt = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = spotRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rx = ((e.clientY - rect.top) / rect.height - 0.5) * -7;
    const ry = ((e.clientX - rect.left) / rect.width - 0.5) * 9;
    el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
    el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
  }, [spotRef]);

  const onTiltReset = useCallback(() => {
    const el = spotRef.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  }, [spotRef]);

  // No touch (sem hover), tocar no card alterna o flip via classe .flipped.
  const [flipped, setFlipped] = useState(false);
  const canHover =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
      : true;
  const handleTap = () => {
    if (!canHover) setFlipped((f) => !f);
  };

  return (
    <div
      ref={(node) => { ref.current = node; spotRef.current = node; }}
      onMouseMove={(e) => { onMove(e); onTilt(e); }}
      onMouseLeave={onTiltReset}
      onClick={handleTap}
      className={`reveal tilt-card spotlight-card group p-6 rounded-2xl border backdrop-blur-sm ${
        flipped ? 'flipped' : ''
      } ${
        featured
          ? 'bg-gradient-to-br from-primary-600/10 to-fuchsia-600/10 border-primary-400/30'
          : 'bg-white/70 dark:bg-white/[0.04] border-slate-200/80 dark:border-white/10'
      } hover:border-primary-400/40`}
      style={{ '--d': `${delay}ms` } as React.CSSProperties}
    >
      <div className="spotlight-beam" aria-hidden />
      <div className="flip-card">
        <div className="flip-inner">
          {/* Frente: ícone + título */}
          <div className="flip-face flip-front">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-primary-600/25 ring-1 ring-white/20 group-hover:scale-110 group-hover:shadow-primary-500/40 transition-all duration-200">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{title}</h3>
          </div>
          {/* Verso: descrição */}
          <div className="flip-face flip-back">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{desc}</p>
            <IconArrowRight className="mt-4 w-4 h-4 text-primary-500 dark:text-primary-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Item de estatística com count-up ao entrar na viewport. */
function StatItem({ value, suffix, label, delay }: { value: number; suffix: string; label: string; delay: number }) {
  const ref = useReveal<HTMLDivElement>();
  const valRef = useCountUp(value, suffix);
  return (
    <div
      ref={ref}
      className="reveal flex flex-col items-center sm:items-start text-center sm:text-left gap-1 px-2"
      style={{ '--d': `${delay}ms` } as React.CSSProperties}
    >
      <p className="text-3xl sm:text-4xl font-extrabold gradient-text tabular-nums">
        <span ref={valRef}>0{suffix}</span>
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

/** Passo numerado com reveal próprio. */
function StepItem({ number, title, desc, delay }: { number: number; title: string; desc: string; delay: number }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className="reveal relative text-center" style={{ '--d': `${delay}ms` } as React.CSSProperties}>
      <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-600/25">
        {number}
      </div>
      <h3 className="mt-5 font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">{desc}</p>
    </div>
  );
}

/* =========================================================================
   Cards de "prévia do produto" para o hero (mock UI, só visual)
   ========================================================================= */

/** Mini dashboard com gráfico (SVG) — parece um screenshot do produto. */
function DashboardPreview() {
  return (
    <div className="w-full h-full rounded-2xl bg-white dark:bg-[#131c31] border border-slate-200 dark:border-white/10 shadow-2xl shadow-indigo-900/20 p-4 flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-fuchsia-500 flex items-center justify-center">
            <IconDashboard className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Dashboard</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="w-2 h-2 rounded-full bg-fuchsia-400" />
        </div>
      </div>
      <div className="mt-3 flex items-end gap-2 flex-1">
        <div className="flex flex-col gap-1.5 flex-1">
          {['M', 'T', 'W', 'T', 'F'].map((d, i) => (
            <div key={d + i} className="flex items-center gap-2">
              <span className="text-[9px] text-slate-400 w-4">{d}</span>
              <div
                className="h-2 rounded-full bg-gradient-to-r from-primary-500/70 to-fuchsia-500/70"
                style={{ width: `${[40, 65, 50, 85, 70][i]}%` }}
              />
            </div>
          ))}
        </div>
        <svg viewBox="0 0 120 60" className="w-32 h-20 flex-none" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="chartg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#6366f1" />
              <stop offset="1" stopColor="#d946ef" />
            </linearGradient>
            <linearGradient id="chartfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#a855f7" stopOpacity="0.35" />
              <stop offset="1" stopColor="#a855f7" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,48 C20,44 30,30 45,32 C60,34 70,18 85,20 C98,22 108,10 120,8 L120,60 L0,60 Z" fill="url(#chartfill)" />
          <path d="M0,48 C20,44 30,30 45,32 C60,34 70,18 85,20 C98,22 108,10 120,8" fill="none" stroke="url(#chartg)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-slate-50 dark:bg-white/5 p-2">
          <p className="text-[9px] text-slate-400">Matrículas</p>
          <p className="text-xs font-bold text-slate-800 dark:text-white">+28%</p>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-white/5 p-2">
          <p className="text-[9px] text-slate-400">Inadimplência</p>
          <p className="text-xs font-bold text-emerald-500">3,1%</p>
        </div>
      </div>
    </div>
  );
}

/** Mini card financeiro — mensalidades/pagamentos. */
function FinancePreview() {
  return (
    <div className="w-full h-full rounded-2xl bg-white dark:bg-[#131c31] border border-slate-200 dark:border-white/10 shadow-xl shadow-indigo-900/20 p-4 flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <IconDollar className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Financeiro</span>
        </div>
        <IconSparkles className="w-3.5 h-3.5 text-amber-400" />
      </div>
      <div className="mt-3 space-y-2 flex-1">
        {[
          { n: 'Maria Souza', v: 'Pago', ok: true },
          { n: 'João Lima', v: 'Pendente', ok: false },
          { n: 'Ana Costa', v: 'Pago', ok: true },
        ].map((r, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-white/5 px-2.5 py-2">
            <span className="text-[10px] text-slate-600 dark:text-slate-300">{r.n}</span>
            <span className={`text-[9px] font-bold ${r.ok ? 'text-emerald-500' : 'text-amber-500'}`}>
              {r.ok ? '✓ ' : '• '}{r.v}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mini painel de módulos em grade. */
function ModulesPreview() {
  const mini = [
    { Icon: IconUsers, c: 'text-sky-500' },
    { Icon: IconCalendar, c: 'text-violet-500' },
    { Icon: IconFileText, c: 'text-fuchsia-500' },
    { Icon: IconChart, c: 'text-emerald-500' },
  ];
  return (
    <div className="w-full h-full rounded-2xl bg-white dark:bg-[#131c31] border border-slate-200 dark:border-white/10 shadow-xl shadow-indigo-900/20 p-4 flex flex-col">
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Módulos integrados</span>
      <div className="mt-3 grid grid-cols-2 gap-2 flex-1">
        {mini.map(({ Icon, c }, i) => (
          <div key={i} className="rounded-lg bg-slate-50 dark:bg-white/5 flex flex-col items-center justify-center gap-1 p-2">
            <Icon className={`w-4 h-4 ${c}`} />
            <span className="text-[8px] text-slate-400">módulo</span>
          </div>
        ))}
      </div>
      <div className="mt-2 rounded-lg bg-gradient-to-r from-primary-500/10 to-fuchsia-500/10 border border-primary-400/20 px-2 py-1.5 text-center text-[9px] font-semibold text-primary-600 dark:text-primary-400">
        9 módulos · tudo em um só lugar
      </div>
    </div>
  );
}

/* =========================================================================
   Conteúdo — COPY ORIGINAL PRESERVADO (não alterar texto)
   ========================================================================= */

const modules = [
  { icon: IconDashboard, title: 'Dashboard', desc: 'Visão geral com indicadores, gráficos e alertas do dia.' },
  { icon: IconUsers, title: 'Alunos', desc: 'Cadastro completo com documentos, fotos e histórico.' },
  { icon: IconUserPlus, title: 'Matrículas', desc: 'Matrículas com renovação, trancamento e cancelamento.' },
  { icon: IconDollar, title: 'Financeiro', desc: 'Controle de mensalidades, pagamentos e inadimplência.' },
  { icon: IconCreditCard, title: 'Mensalidades', desc: 'Gestão de mensalidades por aluno com vencimento e status.' },
  { icon: IconFileText, title: 'Carnês', desc: 'Geração de carnês de pagamento com impressão.' },
  { icon: IconCalendar, title: 'Agenda', desc: 'Calendário de eventos e aulas da escola.' },
  { icon: IconChart, title: 'Relatórios', desc: 'Exportação de relatórios em PDF e Excel.' },
  { icon: IconSettings, title: 'Configurações', desc: 'Logo, cores, usuários e permissões.' },
];

const steps = [
  { title: 'Cadastre', desc: 'Crie alunos e matrículas em poucos minutos, com upload de documentos.' },
  { title: 'Organize suas finanças', desc: 'Cadastre mensalidades, gere carnês e acompanhe pagamentos e inadimplência.' },
  { title: 'Decida', desc: 'Tome decisões com relatórios, dashboards e exportações precisas.' },
];

const benefits = [
  { icon: IconShield, title: 'Segurança de verdade', desc: 'Autenticação JWT, trilha de auditoria e uploads validados por conteúdo.' },
  { icon: IconGlobe, title: 'Acesso de qualquer lugar', desc: 'Nuvem e acesso pela internet, do escritório ou de casa.' },
  { icon: IconChart, title: 'Relatórios inteligentes', desc: 'Dashboards e exportação PDF/Excel para decisões rápidas.' },
  { icon: IconDollar, title: 'Gestão financeira completa', desc: 'Mensalidades, carnês, pagamentos e controle de inadimplência em um só lugar.' },
];

const stats = [
  { value: 9, suffix: '', label: 'Módulos integrados' },
  { value: 100, suffix: '%', label: 'Na nuvem' },
  { value: 24, suffix: '/7', label: 'Disponibilidade' },
];

const typePhrases = ['sua escola de inglês.', 'matrículas e financeiro.', 'relatórios e decisões.', 'toda a sua gestão.'];

const navLinks = [
  { label: 'Módulos', href: '#modulos' },
  { label: 'Benefícios', href: '#beneficios' },
  { label: 'Como funciona', href: '#como-funciona' },
];

const passosAbas = [
  {
    id: 'matriculas',
    tab: 'Matrículas',
    icon: IconNotebook,
    title: 'Matrículas sem papelada',
    desc: 'Crie alunos e matrículas em poucos minutos, com upload de documentos e histórico completo de cada estudante.',
  },
  {
    id: 'financeiro',
    tab: 'Financeiro',
    icon: IconDollar,
    title: 'Financeiro no piloto automático',
    desc: 'Cadastre mensalidades, gere carnês e acompanhe pagamentos e inadimplência em tempo real.',
  },
  {
    id: 'relatorios',
    tab: 'Relatórios',
    icon: IconAward,
    title: 'Decida com dados',
    desc: 'Dashboards, gráficos e exportações PDF/Excel que transformam informação em decisão.',
  },
];

export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [activeTab, setActiveTab] = useState('matriculas');

  const heroRef = useReveal<HTMLDivElement>();
  const heroVisualRef = useReveal<HTMLDivElement>();
  const modulosRef = useReveal<HTMLDivElement>();
  const benefHeaderRef = useReveal<HTMLDivElement>();
  const benefLeftRef = useReveal<HTMLDivElement>();
  const benefRightRef = useReveal<HTMLDivElement>();
  const comoHeaderRef = useReveal<HTMLDivElement>();
  const tabsRef = useReveal<HTMLDivElement>();
  const tabPanelRef = useReveal<HTMLDivElement>();

  const navCta = useMagnetic<HTMLButtonElement>();
  const heroCta = useMagnetic<HTMLButtonElement>();

  const { text: typed, isTyping } = useTypewriter(typePhrases);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
      setShowCta(window.scrollY > window.innerHeight * 0.75);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#0b1220] overflow-x-clip">
      {/* Camada de fundo decorativa */}
      <div className="fixed inset-0 bg-slate-100 dark:bg-[#0b1220]" />
      <div className="fixed inset-0 bg-gradient-to-b from-primary-500/[0.05] via-transparent to-fuchsia-500/[0.05]" />
      <div className="bg-dot-grid fixed inset-0 opacity-40 pointer-events-none" aria-hidden />

      <div className="relative z-10">
      {/* Navbar */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 dark:bg-[#0b1220]/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/5'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-14' : 'h-16'}`}>
            <a href="#" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md shadow-primary-600/25">
                <IconGraduation className="w-5 h-5 text-white" />
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
                {theme === 'dark' ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => navigate('/login')}
                className="hidden sm:inline-flex text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-4 py-2 transition-colors"
              >
                Entrar
              </button>
              <button
                ref={navCta.ref}
                onMouseMove={navCta.onMove}
                onMouseLeave={navCta.onLeave}
                onClick={() => scrollTo('#modulos')}
                className="btn-base bg-gradient-to-r from-primary-600 via-violet-600 to-fuchsia-600 hover:from-primary-700 hover:via-violet-700 hover:to-fuchsia-700 text-white font-semibold px-4 py-2 text-sm shadow-glow transition-transform duration-300 ease-out will-change-transform"
              >
                Conhecer módulos
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero — layout split (texto à esquerda, prévia do produto à direita) */}
      <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 lg:pb-24">
        {/* fundo gradiente suave + orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/80 to-slate-50 dark:from-[#0b1220]/70 dark:via-[#0b1220]/80 dark:to-[#0b1220]" />
        </div>
        <div className="orb hero-orb-a" aria-hidden />
        <div className="orb hero-orb-b" aria-hidden />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-10 items-center">
            {/* Coluna de texto */}
            <div ref={heroRef} className="reveal">
              <div className="stagger">
                <div className="reveal-item">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-700 dark:text-primary-300 text-xs font-semibold">
                    <IconSparkles className="w-3.5 h-3.5" />
                    Sistema de Gestão Escolar
                  </div>
                </div>

                <h1 className="reveal-item mt-6 text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.08] text-slate-900 dark:text-white">
                  Tudo para <span className="gradient-text">{typed}</span>
                  <span className={`type-caret ${isTyping ? 'blinking' : ''}`} aria-hidden />
                </h1>

                <p className="reveal-item mt-5 text-lg text-slate-600 dark:text-slate-400 max-w-xl">
                  Gerencie alunos, matrículas, financeiro, agenda e relatórios com uma experiência moderna, segura e eficiente.
                </p>

                <div className="reveal-item mt-8 flex flex-wrap items-center gap-3">
                  <button
                    ref={heroCta.ref}
                    onMouseMove={heroCta.onMove}
                    onMouseLeave={heroCta.onLeave}
                    onClick={() => scrollTo('#modulos')}
                    className="btn-base group bg-gradient-to-r from-primary-600 via-violet-600 to-fuchsia-600 hover:from-primary-700 hover:via-violet-700 hover:to-fuchsia-700 text-white font-semibold px-7 py-3.5 text-sm rounded-xl shadow-glow-grad inline-flex items-center gap-2 transition-transform duration-300 ease-out will-change-transform"
                  >
                    Conhecer módulos
                    <IconArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                  <button
                    onClick={() => setLoginOpen(true)}
                    className="btn-base text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/15 hover:border-primary-500/50 px-6 py-3.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md transition-colors"
                  >
                    Acessar painel
                  </button>
                </div>

                <div className="reveal-item mt-8 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {['from-primary-400 to-violet-400', 'from-violet-400 to-fuchsia-400', 'from-fuchsia-400 to-pink-400'].map((g, i) => (
                      <div key={i} className={`w-8 h-8 rounded-full bg-gradient-to-br ${g} ring-2 ring-white dark:ring-[#0b1220] flex items-center justify-center text-[10px] font-bold text-white`}>
                        {['M', 'J', 'A'][i]}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Confiado pela sua gestão, todos os dias.
                  </p>
                </div>
              </div>
            </div>

            {/* Coluna de prévia do produto (cards sobrepostos com parallax) */}
            <div ref={heroVisualRef} className="reveal hidden sm:block">
              <div className="relative h-[460px] lg:h-[500px]">
                <div className="parallax-float preview-float-1 absolute top-2 left-4 right-24 h-[300px]">
                  <DashboardPreview />
                </div>
                <div className="parallax-float preview-float-2 absolute bottom-0 right-4 w-64 h-56">
                  <FinancePreview />
                </div>
                <div className="parallax-float preview-float-3 absolute top-24 -right-2 w-44 h-44">
                  <ModulesPreview />
                </div>
                {/* brilho de fundo da composição */}
                <div className="absolute -inset-6 -z-10 bg-gradient-to-br from-primary-500/20 via-violet-500/10 to-fuchsia-500/20 blur-2xl rounded-full" aria-hidden />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar — números animados (Lumni: "Mais de 300 escolas confiam") */}
      <section className="py-6 border-y border-slate-200/80 dark:border-white/5 bg-white/60 dark:bg-[#111a2e]/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-white/10">
            {stats.map((s, i) => (
              <StatItem key={s.label} value={s.value} suffix={s.suffix} label={s.label} delay={i * 120} />
            ))}
          </div>
        </div>
      </section>

      {/* Módulos — grid bento com spotlight/tilt */}
      <section id="modulos" className="scroll-mt-20 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={modulosRef} className="reveal text-center max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">Módulos</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Um sistema, <span className="gradient-text">toda a gestão.</span>
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              Da matrícula ao relatório: 9 módulos integrados cobrem todas as áreas da sua escola.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((m, i) => (
              <ModuleCard key={m.title} icon={m.icon} title={m.title} desc={m.desc} delay={i * 60} featured={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios — seções alternadas estilo Lumni */}
      <section id="beneficios" className="scroll-mt-20 py-20 sm:py-28 bg-white/60 dark:bg-[#111a2e]/50 backdrop-blur-md border-y border-slate-200/80 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={benefHeaderRef} className="reveal text-center max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">Benefícios</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Por que escolher a <span className="gradient-text">English School?</span>
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div ref={benefLeftRef} className="reveal">
              <div className="relative">
                <div className="rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#131c31] shadow-2xl shadow-indigo-900/15 p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <IconShield className="w-4 h-4 text-primary-500" /> Segurança de verdade
                    </span>
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Protegido</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Autenticação JWT, trilha de auditoria e uploads validados por conteúdo.</p>
                  <div className="mt-4 space-y-2">
                    {['Autenticação JWT', 'Trilha de auditoria', 'Uploads validados por conteúdo'].map((li) => (
                      <div key={li} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <IconCheckCircle className="w-4 h-4 text-emerald-500 flex-none" /> {li}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -bottom-5 -right-5 w-36 h-36 bg-gradient-to-br from-primary-500/15 to-fuchsia-500/15 blur-xl rounded-full -z-10" aria-hidden />
              </div>
            </div>

            <div ref={benefRightRef} className="reveal space-y-3">
              {[benefits[1], benefits[2], benefits[3]].map((b, i) => {
                const Icon = b.icon;
                return (
                  <div key={b.title} className="flex gap-4 p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#131c31] hover:border-primary-400/40 hover:shadow-cardHover transition-all duration-200" style={{ '--d': `${i * 80}ms` } as React.CSSProperties}>
                    <div className="w-11 h-11 flex-none rounded-xl bg-gradient-to-br from-primary-500/15 to-fuchsia-500/15 border border-primary-400/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{b.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona — abas animadas + passos */}
      <section id="como-funciona" className="scroll-mt-20 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={comoHeaderRef} className="reveal text-center max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">Como funciona</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Comece em <span className="gradient-text">três passos simples.</span>
            </h2>
          </div>

          {/* Abas */}
          <div ref={tabsRef} className="reveal mt-10 flex justify-center">
            <div className="inline-flex flex-wrap justify-center gap-1 p-1.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
              {passosAbas.map((p) => {
                const Icon = p.icon;
                const active = activeTab === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActiveTab(p.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-primary-600 to-fuchsia-600 text-white shadow-glow'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {p.tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Painel da aba ativa */}
          <div ref={tabPanelRef} className="reveal mt-8 min-h-[150px]">
            {passosAbas.map((p) => {
              const Icon = p.icon;
              const active = activeTab === p.id;
              return (
                <div
                  key={p.id}
                  className={`tab-panel ${active ? 'tab-panel-active' : ''}`}
                  aria-hidden={!active}
                >
                  <div className="max-w-3xl mx-auto text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-primary-600/25">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="mt-6 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{p.title}</h3>
                    <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Passos numerados */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <StepItem key={step.title} number={i + 1} title={step.title} desc={step.desc} delay={i * 120} />
            ))}
          </div>

          <div className="mt-14 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-8 gap-y-4 text-center">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <IconShield className="w-4 h-4 text-emerald-500" />
              <span>Trilha de auditoria completa e dados protegidos.</span>
            </div>
            <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <IconZap className="w-4 h-4 text-amber-500" />
              <span>Atualizações automáticas, sem interromper seu trabalho.</span>
            </div>
            <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <IconCheckCircle className="w-4 h-4 text-primary-500" />
              <span>Suporte dedicado para sua escola.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer — colunas estilo Lumni */}
      <footer className="py-16 border-t border-slate-200/80 dark:border-white/5 bg-white/60 dark:bg-[#0d1526]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 via-violet-500 to-fuchsia-500 flex items-center justify-center">
                <IconGraduation className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">English School</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              Sistema de gestão escolar moderno, seguro e eficiente para a sua escola de inglês.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Plataforma</h4>
              <ul className="mt-3 space-y-2">
                {navLinks.map((l) => (
                  <li key={l.href}>
                    <button onClick={() => scrollTo(l.href)} className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Módulos</h4>
              <ul className="mt-3 space-y-2">
                {['Dashboard', 'Alunos', 'Financeiro', 'Relatórios'].map((m) => (
                  <li key={m}>
                    <button onClick={() => scrollTo('#modulos')} className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      {m}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Conta</h4>
              <ul className="mt-3 space-y-2">
                <li><button onClick={() => setLoginOpen(true)} className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Entrar</button></li>
                <li><button onClick={() => navigate('/login')} className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Login</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Legal</h4>
              <ul className="mt-3 space-y-2">
                {['Privacidade', 'Segurança', 'Termos'].map((m) => (
                  <li key={m}>
                    <span className="text-sm text-slate-400 dark:text-slate-500 cursor-default">{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-200/80 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400 dark:text-slate-500">© 2026 English School. Todos os direitos reservados.</p>
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <IconSparkles className="w-3.5 h-3.5 text-primary-500" />
              Feito para gestão escolar
            </div>
          </div>
        </div>
      </footer>

      {/* CTA flutuante */}
      <button
        onClick={() => setLoginOpen(true)}
        className={`floating-cta ${showCta ? 'floating-cta-show' : ''}`}
        aria-label="Falar com atendimento"
      >
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-glow-grad">
            <IconSparkles className="w-6 h-6 text-white" />
          </div>
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-[#0b1220]" aria-hidden />
        </div>
        <span className="floating-cta-label">Falar com um especialista</span>
      </button>

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
