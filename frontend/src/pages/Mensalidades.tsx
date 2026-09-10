import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { financialAPI } from '../services/api';
import { useSettings } from '../hooks/useSettings';
import type { Installment } from '../types';
import { CheckCircle, Clock, AlertTriangle, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Mensalidades() {
  const navigate = useNavigate();
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState('');
  const [dashboard, setDashboard] = useState<any>(null);
  const [paying, setPaying] = useState<Installment | null>(null);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      await financialAPI.generateMonth({ month });
      const [{ data }, dash] = await Promise.all([
        financialAPI.getInstallments({ status: statusFilter, month, limit: 200 }),
        financialAPI.dashboard({ month }),
      ]);
      setInstallments(data.installments);
      setTotal(data.total);
      setDashboard(dash.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await financialAPI.generateMonth({ month });
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => { load(); }, [month, statusFilter]);

  const handlePayment = async (installmentId: number, method: string) => {
    try {
      const { data } = await financialAPI.registerPayment({
        installment_id: installmentId,
        amount: installments.find(i => i.id === installmentId)?.amount || 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: method,
      });
      setPaying(null);
      load();
      if (data?.payment_id) {
        const resp = await financialAPI.receipt(data.payment_id);
        const url = URL.createObjectURL(new Blob([resp.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `recibo-${data.receipt_number || installmentId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      alert('Erro ao registrar pagamento');
    }
  };

  const downloadReceipt = async (paymentId: number, receiptNumber?: string) => {
    try {
      const resp = await financialAPI.receipt(paymentId);
      const url = URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibo-${receiptNumber || paymentId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erro ao baixar recibo');
    }
  };

  const statusLabels: Record<string, string> = { paid: 'Pago', pending: 'Pendente', overdue: 'Vencido' };
  const statusColors: Record<string, string> = { paid: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', overdue: 'bg-red-100 text-red-700' };

  const overdueCount = installments.filter(i => i.status === 'overdue').length;
  const pendingCount = installments.filter(i => i.status === 'pending').length;
  const paidCount = installments.filter(i => i.status === 'paid').length;

  const uniqueStudents = [...new Set(installments.map(i => i.student_id))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mensalidades</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{total} mensalidade(s) encontrada(s)</p>
      </div>

      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-900">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-green-600">Pagas</p><p className="text-xl font-bold text-green-700">{paidCount}</p></div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-100 dark:border-yellow-900">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-yellow-600">Pendentes</p><p className="text-xl font-bold text-yellow-700">{pendingCount}</p></div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-900">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-red-600">Em Atraso</p><p className="text-xl font-bold text-red-700">{overdueCount}</p></div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <input type="month" value={month} onChange={e => e.target.value && setMonth(e.target.value)}
            className="px-3 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Todos os Status</option>
            <option value="pending">Pendentes</option>
            <option value="overdue">Em Atraso</option>
            <option value="paid">Pagos</option>
          </select>
          <button onClick={handleGenerate} disabled={generating}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            {generating ? 'Gerando...' : 'Gerar Mensalidades'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-[3px] border-primary-600/20 border-t-primary-600 dark:border-primary-400/20 dark:border-t-primary-400" /></div>
      ) : (
        <div className="card-surface overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-white/5">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Aluno</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Descrição</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Valor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Vencimento</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {installments.map(i => (
                <tr key={i.id} className={`hover:bg-slate-50 dark:hover:bg-white/5 ${i.status === 'overdue' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/students/${i.student_id}`)}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline">
                      {i.student_name || `Aluno #${i.student_id}`}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{i.description}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                    R$ {i.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                    {new Date(i.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[i.status] || ''}`}>
                      {statusLabels[i.status] || i.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {i.status === 'overdue' || i.status === 'pending' ? (
                        <button onClick={() => setPaying(i)}
                          className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Pagar
                        </button>
                      ) : null}
                      {i.payment_id ? (
                        <button onClick={() => downloadReceipt(i.payment_id!, i.receipt_number)}
                          className="px-2 py-1 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 rounded text-xs font-medium">
                          Recibo
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {installments.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">Nenhuma mensalidade encontrada</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {paying && (
        <PaymentModal installment={paying} onClose={() => setPaying(null)} onConfirm={(method) => handlePayment(paying.id, method)} />
      )}
    </div>
  );
}

function PaymentModal({ installment, onClose, onConfirm }: { installment: Installment; onClose: () => void; onConfirm: (method: string) => Promise<void> }) {
  const [method, setMethod] = useState('');
  const [saving, setSaving] = useState(false);
  const { paymentMethods } = useSettings();

  const options = paymentMethods.map(m => ({ value: m, label: m }));

  const confirm = async () => {
    if (!method || saving) return;
    setSaving(true);
    try {
      await onConfirm(method);
    } catch {
      alert('Erro ao registrar pagamento');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111a2e] rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Forma de Pagamento</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
          {installment.student_name} · {installment.description} · R$ {installment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {options.map(o => (
            <button key={o.value} onClick={() => setMethod(o.value)}
              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${method === o.value ? 'border-primary-600 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
              {o.label}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-sm">Cancelar</button>
          <button onClick={confirm} disabled={!method || saving} className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Processando...' : 'Confirmar Pagamento'}
          </button>
        </div>
      </div>
    </div>
  );
}
