import { ReactNode } from 'react';

type Tone = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'gray' | 'indigo';

const tones: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20',
  purple: 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-400/20',
  gray: 'bg-slate-100 text-slate-600 ring-slate-600/20 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10',
  indigo: 'bg-primary-50 text-primary-700 ring-primary-600/20 dark:bg-primary-500/10 dark:text-primary-300 dark:ring-primary-400/20',
};

export default function Badge({ tone = 'gray', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, Tone> = {
    active: 'green',
    inactive: 'gray',
    transferred: 'blue',
    suspended: 'amber',
    graduated: 'purple',
    paid: 'green',
    pending: 'amber',
    overdue: 'red',
    canceled: 'gray',
    present: 'green',
    absent: 'red',
    justified: 'amber',
  };
  return <Badge tone={map[status] || 'gray'}>{status}</Badge>;
}
