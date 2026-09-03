import type { SVGProps } from 'react';

/**
 * Conjunto de ícones profissionais no estilo "sistemas/SaaS" (referência Icons8):
 * traço fino consistente, cantos arredondados, 24px. Herdam cor via `currentColor`
 * (uso com classes Tailwind como `text-white`, `text-primary-600` etc.).
 */
type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/* Logo / educação -------------------------------------------------- */
export function IconGraduation(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M22 9.5 12 5 2 9.5 12 14l10-4.5Z" />
      <path d="M6 11.5V16c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-4.5" />
      <path d="M22 9.5V14" />
    </Base>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.6-3 2.9-4.8 5.5-4.8s4.9 1.8 5.5 4.8" />
      <circle cx="16.6" cy="8.6" r="2.4" />
      <path d="M16 14.4c2.4.2 4.2 1.7 4.8 4.1" />
    </Base>
  );
}

export function IconUserPlus(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="10" cy="7.8" r="3.2" />
      <path d="M4.5 20c.6-3.3 2.9-5.2 5.5-5.2s4.9 1.9 5.5 5.2" />
      <path d="M19 9v6M16 12h6" />
    </Base>
  );
}

export function IconDashboard(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.6" />
      <rect x="13.5" y="11" width="7" height="9.5" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    </Base>
  );
}

/* Financeiro ------------------------------------------------------- */
export function IconDollar(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="4" y="4.5" width="16" height="15" rx="2.4" />
      <path d="M12 7.5v9" />
      <path d="M14.6 9.2c0-1.3-1.2-2-2.6-2s-2.6.7-2.6 1.8c0 2.4 5.2 1.2 5.2 3.8 0 1.1-1.2 1.9-2.6 1.9s-2.6-.7-2.6-1.9" />
    </Base>
  );
}

export function IconCreditCard(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="2.8" y="5" width="18.4" height="14" rx="2.4" />
      <path d="M2.8 9.5h18.4" />
      <rect x="6" y="12.5" width="6" height="2.6" rx="0.8" />
      <path d="M15.5 13h3M15.5 15.5h2" />
    </Base>
  );
}

export function IconFileText(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5v4h4" />
      <path d="M9 12h6M9 15.5h6M9 8.5h2" />
    </Base>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v3M16 3v3" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" />
    </Base>
  );
}

export function IconChart(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 20h16" />
      <rect x="5.5" y="12" width="3.4" height="8" rx="1" />
      <rect x="10.5" y="7.5" width="3.4" height="12.5" rx="1" />
      <rect x="15.5" y="3.5" width="3.4" height="16.5" rx="1" />
    </Base>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 5.5h5M4 18.5h9.5" />
      <circle cx="12" cy="5.5" r="2.2" />
      <circle cx="16.5" cy="18.5" r="2.2" />
      <path d="M15 5.5h5M4 12h8.5" />
      <circle cx="15.5" cy="12" r="2.2" />
      <path d="M20 12h0" />
    </Base>
  );
}

/* Segurança / acesso ------------------------------------------------ */
export function IconShield(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3 5 5.5v5.2c0 4.1 2.8 7.6 7 9.3 4.2-1.7 7-5.2 7-9.3V5.5L12 3Z" />
      <path d="m9 11.8 2.1 2.1 4-4" />
    </Base>
  );
}

export function IconGlobe(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.5 2.4 3.7 5.3 3.7 8.5s-1.2 6.1-3.7 8.5c-2.5-2.4-3.7-5.3-3.7-8.5s1.2-6.1 3.7-8.5Z" />
    </Base>
  );
}

export function IconCheckCircle(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.3 2.3 4.7-4.8" />
    </Base>
  );
}

export function IconZap(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12l1-8Z" />
    </Base>
  );
}

/* Módulos diversos --------------------------------------------------- */
export function IconNotebook(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H20v16H5.5A1.5 1.5 0 0 0 4 18.5Z" />
      <path d="M4 6v12.5" />
      <path d="M8 9h8M8 12.5h8M8 16h5" />
    </Base>
  );
}

export function IconAward(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="9" r="5.2" />
      <path d="m8.8 13.2-1.6 7 4.8-2.6 4.8 2.6-1.6-7" />
      <path d="m9.4 9 1.7 1.7 3.3-3.4" />
    </Base>
  );
}

/* Interface ----------------------------------------------------------- */
export function IconSparkles(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 4.5 13.6 9 18 10.6 13.6 12.2 12 16.6 10.4 12.2 6 10.6 10.4 9 12 4.5Z" />
      <path d="M18.5 15.5l.9 2.2 2.1.9-2.1.9-.9 2.2-.9-2.2-2.1-.9 2.1-.9.9-2.2Z" />
      <path d="M5.5 2.5l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7.7-1.9Z" />
    </Base>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 12h15" />
      <path d="m13.5 6 6 6-6 6" />
    </Base>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" />
    </Base>
  );
}

export function IconSun(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4 12H2M22 12h-2M5.2 5.2 3.8 3.8M20.2 20.2l-1.4-1.4M5.2 18.8l-1.4 1.4M20.2 3.8l-1.4 1.4" />
    </Base>
  );
}
