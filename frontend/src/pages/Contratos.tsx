import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contractsAPI } from '../services/api';
import type { FinancialContract } from '../types';
import { Eye, Download, FileSignature, Ban, Plus, CheckCircle2 } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

const fmtBRL = (v: number) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (s?: string | null) => (s ? s.split('T')[0].split('-').reverse().join('/') : '—');

const statusInfo: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Aguardando assinatura', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400' },
  signed: { label: 'Assinado', cls: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' },
  cancelled: { label: 'Cancelado', cls: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' },
};

async function openPdf(id: number, download: boolean) {
  const { data } = await contractsAPI.pdf(id);
  const url = URL.createObjectURL(data as Blob);
  if (download) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `Contrato_${id}.pdf`;
    a.click();
  } else {
    window.open(url, '_blank');
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export default function Contratos() {
  const nav = useNavigate();
  const [contracts, setContracts] = useState<FinancialContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ type: 'sign' | 'cancel'; contract: FinancialContract } | null>(null);

  const load = () => {
    setLoading(true);
    contractsAPI.list()
      .then(({ data }) => setContracts(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = contracts.filter(c => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.student_name.toLowerCase().includes(q)
        || c.plan_name.toLowerCase().includes(q)
        || (c.course_name || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleSign = async (c: FinancialContract) => {
    try { await contractsAPI.sign(c.id); load(); }
    catch (e: any) { alert(e.response?.data?.detail || 'Erro'); }
  };

  const handleCancel = async (c: FinancialContract) => {
    try { await contractsAPI.cancel(c.id); load(); }
    catch (e: any) { alert(e.response?.data?.detail || 'Erro'); }
  };

  const inputCls = "w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Contratos</h1>
          <p className="text-slate-500 text-sm">Contratos de prestação de serviços educacionais</p>
        </div>
        <button onClick={() => nav('/planos')} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Contrato
        </button>
      </div>

      <div className="card-surface p-4 flex flex-wrap gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar aluno, plano ou curso..."
          className={`${inputCls} flex-1 min-w-[220px]`} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`${inputCls} w-auto`}>
          <option value="">Todos os status</option>
          <option value="pending">Aguardando assinatura</option>
          <option value="signed">Assinados</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>

      <div className="card-surface overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-primary-600/20 border-t-primary-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <FileSignature className="w-10 h-10 mb-3" />
            <p className="text-sm">Nenhum contrato encontrado</p>
            <p className="text-xs mt-1">Gere um contrato ao matricular um aluno em um Plano</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-white/10">
                <th className="px-6 py-4 font-semibold">#</th>
                <th className="px-6 py-4 font-semibold">Aluno</th>
                <th className="px-6 py-4 font-semibold">Curso / Plano</th>
                <th className="px-6 py-4 font-semibold">Vigência</th>
                <th className="px-6 py-4 font-semibold">Pagamento</th>
                <th className="px-6 py-4 font-semibold">Valor</th>
                <th className="px-6 py-4 font-semibold">Situação</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const si = statusInfo[c.status] || statusInfo.pending;
                return (
                  <tr key={c.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="px-6 py-4 text-slate-400">{c.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{c.student_name}</td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900 dark:text-white">{c.plan_name}</p>
                      <p className="text-xs text-slate-500">{c.course_name || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {fmtDate(c.start_date)} → {fmtDate(c.end_date)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {c.mode === 'upfront' ? 'À vista' : `${c.installments_count}×`}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{fmtBRL(c.total_due)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${si.cls}`}>{si.label}</span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button onClick={() => openPdf(c.id, false)} title="Visualizar" className="p-2 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg text-slate-400 hover:text-primary-600 mr-1">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openPdf(c.id, true)} title="Baixar PDF" className="p-2 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg text-slate-400 hover:text-primary-600 mr-1">
                        <Download className="w-4 h-4" />
                      </button>
                      {c.status === 'pending' && (
                        <>
                          <button onClick={() => setConfirmAction({ type: 'sign', contract: c })} title="Marcar como assinado" className="p-2 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg text-slate-400 hover:text-green-600 mr-1">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setConfirmAction({ type: 'cancel', contract: c })} title="Cancelar contrato" className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-600">
                            <Ban className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {confirmAction && (
        <ConfirmDialog
          open
          color="amber"
          title={confirmAction.type === 'sign' ? 'Assinar contrato' : 'Cancelar contrato'}
          message={confirmAction.type === 'sign'
            ? `Marcar o contrato de ${confirmAction.contract.student_name} como ASSINADO?`
            : `Cancelar o contrato #${confirmAction.contract.id} de ${confirmAction.contract.student_name}? As parcelas geradas não serão excluídas.`}
          confirmLabel={confirmAction.type === 'sign' ? 'Sim, assinar' : 'Sim, cancelar'}
          onConfirm={() => {
            if (confirmAction.type === 'sign') handleSign(confirmAction.contract);
            else handleCancel(confirmAction.contract);
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
