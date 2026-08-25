import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentProfileAPI, studentsAPI, financialAPI, carnesAPI } from '../services/api';
import { useSettings } from '../hooks/useSettings';
import { ArrowLeft, User, DollarSign, FileText, Download, Eye, Printer, X } from 'lucide-react';
import { formatDate } from '../utils/format';

const fmtBRL = (v: number | string | null | undefined) =>
  `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'financial' | 'documents'>('overview');
  const [carneModal, setCarneModal] = useState(false);
  const [payFor, setPayFor] = useState<any>(null);

  const reload = () => {
    if (id) return studentProfileAPI.get(parseInt(id)).then(({ data }) => setData(data));
  };

  useEffect(() => {
    if (id) {
      studentProfileAPI.get(parseInt(id)).then(({ data }) => setData(data)).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-[3px] border-primary-600/20 border-t-primary-600 dark:border-primary-400/20 dark:border-t-primary-400" /></div>;
  if (!data || data.error) return <div className="text-center py-12 text-slate-400">{data?.error || 'Aluno não encontrado'}</div>;

  const { student, responsible, enrollments, installments, files } = data;

  const statusColors: Record<string, string> = { active: 'bg-green-100 text-green-700', inactive: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300', suspended: 'bg-yellow-100 text-yellow-700', transferred: 'bg-blue-100 text-blue-700' };
  const statusLabels: Record<string, string> = { active: 'Ativo', inactive: 'Inativo', suspended: 'Suspenso', transferred: 'Transferido' };

  const downloadFile = async (f: any) => {
    try {
      const resp = await studentsAPI.downloadFile(parseInt(id!), f.id);
      const url = URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = f.file_name || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erro ao baixar arquivo', e);
    }
  };

  const tabs = [
    { key: 'overview', label: 'Visão Geral', icon: User },
    { key: 'financial', label: 'Financeiro', icon: DollarSign },
    { key: 'documents', label: 'Documentos', icon: FileText },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={() => navigate('/students')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar para Alunos
        </button>
        <div className="flex items-center gap-2">
          <button onClick={async () => {
            try {
              const resp = await studentProfileAPI.pdf(parseInt(id!));
              const url = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
              window.open(url, '_blank');
              setTimeout(() => URL.revokeObjectURL(url), 60_000);
            } catch { alert('Erro ao gerar ficha'); }
          }} className="flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5">
            <Eye className="w-4 h-4" /> Visualizar Ficha
          </button>
          <button onClick={async () => {
            try {
              const resp = await studentProfileAPI.pdf(parseInt(id!));
              const url = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
              const a = document.createElement('a');
              a.href = url;
              a.download = `Ficha_${(data?.student?.full_name || 'aluno').replace(/\s+/g, '_')}.pdf`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 60_000);
            } catch { alert('Erro ao gerar ficha'); }
          }} className="flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium">
            <Download className="w-4 h-4" /> Ficha em PDF
          </button>
        </div>
      </div>

      <div className="card-surface p-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {student.photo_url ? (
              <img src={student.photo_url} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <span className="text-primary-600 text-2xl font-bold">{student.full_name?.charAt(0)}</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{student.full_name}</h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[student.status] || 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>
                {statusLabels[student.status] || student.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 mt-1 text-sm text-slate-500">
              {student.cpf && <span>CPF: {student.cpf}</span>}
              {student.phone && <span>Tel: {student.phone}</span>}
              {student.email && <span>{student.email}</span>}
              {student.english_level && <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 rounded">{student.english_level}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200 dark:border-white/10 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-surface p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Dados Pessoais</h3>
            <div className="space-y-3 text-sm">
              <Row label="Data de Nascimento" value={formatDate(student.birth_date)} />
              <Row label="Sexo" value={student.gender === 'M' ? 'Masculino' : student.gender === 'F' ? 'Feminino' : '-'} />
              <Row label="RG" value={student.rg || '-'} />
              <Row label="WhatsApp" value={student.whatsapp || '-'} />
              <Row label="Cidade" value={`${student.city || '-'} ${student.state || ''}`} />
              <Row label="Endereço" value={`${student.street || ''}, ${student.number || ''} - ${student.neighborhood || ''}`} />
            </div>
          </div>

          {responsible && responsible.full_name && (
            <div className="card-surface p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Responsável Financeiro</h3>
              <div className="space-y-3 text-sm">
                <Row label="Nome" value={responsible.full_name} />
                <Row label="CPF" value={responsible.cpf || '-'} />
                <Row label="Telefone" value={responsible.phone || '-'} />
                <Row label="Email" value={responsible.email || '-'} />
                <Row label="Parentesco" value={responsible.relationship || '-'} />
              </div>
            </div>
          )}

          {enrollments.length > 0 && (
            <div className="card-surface p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Matrículas</h3>
              <div className="space-y-2">
                {enrollments.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-white/5 rounded-lg">
                    <span className="text-sm text-slate-900 dark:text-white">Matrícula #{e.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[e.status] || 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>{e.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'financial' && (() => {
        const totals = {
          contratado: installments.reduce((s: number, i: any) => s + Number(i.amount || 0), 0),
          pago: installments.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + Number(i.amount || 0), 0),
          pendente: installments.filter((i: any) => i.status === 'pending').reduce((s: number, i: any) => s + Number(i.amount || 0), 0),
          atrasado: installments.filter((i: any) => i.status === 'overdue').reduce((s: number, i: any) => s + Number(i.amount || 0), 0),
        };
        const cards = [
          { label: 'Total Contratado', value: totals.contratado, color: 'text-slate-900 dark:text-white' },
          { label: 'Total Pago', value: totals.pago, color: 'text-green-600' },
          { label: 'Pendente', value: totals.pendente, color: 'text-yellow-600' },
          { label: 'Em Atraso', value: totals.atrasado, color: 'text-red-600' },
        ];
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {cards.map(c => (
                <div key={c.label} className="card-surface p-4">
                  <p className="text-xs text-slate-500">{c.label}</p>
                  <p className={`text-lg font-bold ${c.color}`}>{fmtBRL(c.value)}</p>
                </div>
              ))}
              <button onClick={() => setCarneModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium">
                <Printer className="w-4 h-4" /> Gerar Carnê
              </button>
            </div>

            <div className="card-surface overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-white/5">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Parcela</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Descrição</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Valor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Vencimento</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {[...installments].reverse().map((i: any) => (
                    <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">{String(i.installment_number || '-').padStart(2, '0')}</td>
                      <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{i.description}</td>
                      <td className="px-4 py-3 text-sm font-medium text-right">{fmtBRL(i.amount)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(i.due_date)}</td>
                      <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${i.status === 'paid' ? 'bg-green-100 text-green-700' : i.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{i.status === 'paid' ? 'Pago' : i.status === 'overdue' ? 'Vencido' : 'Pendente'}</span></td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        {i.status !== 'paid' ? (
                          <button onClick={() => setPayFor(i)}
                            className="px-2.5 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium">
                            Receber
                          </button>
                        ) : null}
                        {i.payment_id ? (
                          <button onClick={async () => {
                            try {
                              const resp = await financialAPI.receipt(i.payment_id);
                              const url = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${i.receipt_number || 'recibo'}.pdf`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              URL.revokeObjectURL(url);
                            } catch { alert('Erro ao gerar recibo'); }
                          }} className="px-2.5 py-1.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 rounded text-xs font-medium">
                            Recibo
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {installments.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">Nenhuma mensalidade</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {tab === 'documents' && (
        <div className="card-surface p-6">
          {files.length === 0 ? (
            <p className="text-center text-slate-400 py-8">Nenhum documento enviado</p>
          ) : (
            <div className="space-y-2">
              {files.map((f: any) => (
                <div key={f.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{f.file_name}</p>
                      <p className="text-xs text-slate-500">{f.category} | {f.created_at ? formatDate(f.created_at) : ''}</p>
                    </div>
                  </div>
                  <button onClick={() => downloadFile(f)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg" aria-label={`Baixar ${f.file_name}`}>
                    <Download className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {payFor && <PayModal installment={payFor} onClose={() => setPayFor(null)} onPaid={reload} />}
      {carneModal && <CarneModal studentId={parseInt(id!)} installments={installments} onClose={() => setCarneModal(false)} />}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

function PayModal({ installment, onClose, onPaid }: { installment: any; onClose: () => void; onPaid: () => void }) {
  const [form, setForm] = useState({
    amount: Number(installment.amount) - Number(installment.discount || 0),
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: 'PIX',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const { paymentMethods } = useSettings();

  useEffect(() => {
    if (paymentMethods.length && !paymentMethods.includes(form.payment_method)) {
      setForm(f => ({ ...f, payment_method: paymentMethods[0] }));
    }
  }, [paymentMethods]);

  const submit = async () => {
    setSaving(true);
    try {
      await financialAPI.registerPayment({ installment_id: installment.id, ...form });
      onPaid();
      onClose();
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erro ao registrar pagamento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Receber Parcela</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
          <p>{installment.description}</p>
          <p>Vencimento: {formatDate(installment.due_date)}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor (R$)</label>
          <input type="text" inputMode="decimal" placeholder="0,00"
            value={form.amount > 0 ? form.amount.toFixed(2).replace('.', ',') : ''}
            onChange={e => {
              const cleaned = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
              const num = parseFloat(cleaned);
              setForm(f => ({ ...f, amount: isNaN(num) ? 0 : num }));
            }}
            className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data do Pagamento</label>
          <input type="date" value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Forma de Pagamento</label>
          <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm">
            {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <button onClick={submit} disabled={saving}
          className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          {saving ? 'Registrando...' : 'Confirmar Recebimento'}
        </button>
      </div>
    </div>
  );
}

function CarneModal({ studentId, installments, onClose }: { studentId: number; installments: any[]; onClose: () => void }) {
  const unpaid = [...installments].filter((i: any) => i.status !== 'paid').map((i: any) => i.id);
  const [selected, setSelected] = useState<number[]>(unpaid);
  const [segundaVia, setSegundaVia] = useState(false);
  const [generating, setGenerating] = useState(false);

  const toggle = (iid: number) =>
    setSelected(s => s.includes(iid) ? s.filter(x => x !== iid) : [...s, iid]);

  const generate = async () => {
    if (selected.length === 0) return;
    setGenerating(true);
    try {
      const resp = await carnesAPI.customPdf({ student_id: studentId, installment_ids: selected, segunda_via: segundaVia });
      const url = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `carne_${String(studentId).padStart(5, '0')}${segundaVia ? '_2via' : ''}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      onClose();
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erro ao gerar carnê');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Gerar Carnê de Mensalidades</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded"><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="space-y-2">
          {[...installments].reverse().map((i: any) => (
            <label key={i.id} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer ${selected.includes(i.id) ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-white/10'} ${i.status === 'paid' ? 'opacity-60' : ''}`}>
              <input type="checkbox" checked={selected.includes(i.id)} onChange={() => toggle(i.id)} className="accent-primary-600" />
              <span className="flex-1 text-sm text-slate-900 dark:text-white">
                {String(i.installment_number || '-').padStart(2, '0')} · {formatDate(i.due_date)}
              </span>
              <span className="text-sm font-medium">{fmtBRL(Number(i.amount) - Number(i.discount || 0))}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${i.status === 'paid' ? 'bg-green-100 text-green-700' : i.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {i.status === 'paid' ? 'Pago' : i.status === 'overdue' ? 'Vencido' : 'Pendente'}
              </span>
            </label>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={segundaVia} onChange={e => setSegundaVia(e.target.checked)} className="accent-primary-600" />
          Emitir como 2ª via
        </label>

        <button onClick={generate} disabled={generating || selected.length === 0}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          <Printer className="w-4 h-4" /> {generating ? 'Gerando...' : `Gerar PDF (${selected.length} parcelas)`}
        </button>
      </div>
    </div>
  );
}
