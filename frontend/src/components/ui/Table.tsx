import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

export function Table({ className = '', ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-sm ${className}`} {...rest} />
    </div>
  );
}

export function THead({ children, className = '' }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={`bg-slate-50 dark:bg-white/5 ${className}`}>
      <tr>{children}</tr>
    </thead>
  );
}

export function TH({ className = '', ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${className}`}
      {...rest}
    />
  );
}

export function TRow({ className = '', ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${className}`}
      {...rest}
    />
  );
}

export function TD({ className = '', ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-4 py-3 text-slate-600 dark:text-slate-300 ${className}`} {...rest} />;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-slate-100 dark:divide-white/5">{children}</tbody>;
}
