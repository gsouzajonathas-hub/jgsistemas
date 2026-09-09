import { useState, useEffect } from 'react';
import { auditAPI } from '../services/api';
import type { AuditLog as AuditLogType } from '../types';
import { History, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';

const PAGE_SIZE = 50;

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  delete: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

function formatAction(action: string) {
  const [scope, verb] = action.split('.');
  return {
    scope: scope || action,
    verb: verb || '',
    color: actionColors[verb] || 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300',
  };
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  return new Date(dateStr.replace('Z', '')).toLocaleString('pt-BR');
}

export default function Audit() {
  const [logs, setLogs] = useState<AuditLogType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    auditAPI.list({ skip: page * PAGE_SIZE, limit: PAGE_SIZE })
      .then(({ data }) => { setLogs(data.logs || []); setTotal(data.total || 0); })
      .catch(() => { setLogs([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [page]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Auditoria</h1>
        <p className="text-slate-500 text-sm">Histórico de ações do sistema · {total} registros</p>
      </div>

      <div className="card-surface overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-primary-600/20 border-t-primary-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <ShieldCheck className="w-10 h-10 mb-3" />
            <p className="text-sm">Nenhum registro de auditoria</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-white/10">
                  <th className="px-6 py-4 font-semibold">Data/Hora</th>
                  <th className="px-6 py-4 font-semibold">Usuário</th>
                  <th className="px-6 py-4 font-semibold">Ação</th>
                  <th className="px-6 py-4 font-semibold">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => {
                  const a = formatAction(l.action);
                  return (
                    <tr key={l.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{formatDate(l.created_at)}</td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        <span className="flex items-center gap-1.5">
                          {l.user_name}
                          {l.actor_role === 'super_admin' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                              <ShieldCheck className="w-3 h-3" />
                              Super Admin
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${a.color}`}>
                          <History className="w-3 h-3" />
                          {l.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={[l.details, l.ip_address ? `IP: ${l.ip_address}` : ''].filter(Boolean).join(' • ')}>
                        {[l.details, l.entity && l.entity_id != null ? `${l.entity}#${l.entity_id}` : '', l.ip_address ? `IP: ${l.ip_address}` : ''].filter(Boolean).join(' • ') || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/10">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none">
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <span className="text-sm text-slate-500">Página {page + 1} de {pages}</span>
                <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none">
                  Próxima <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
