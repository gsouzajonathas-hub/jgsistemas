import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { carnesAPI, studentsAPI, enrollmentsAPI, financialAPI } from '../services/api';
import { useSettings, parsePaymentMethods } from '../hooks/useSettings';
import { Plus, Search, Eye, MoreVertical, FileText, Printer, XCircle, ChevronLeft, ChevronRight, DollarSign, CheckCircle, Clock, AlertTriangle, FileWarning, Printer as PrinterIcon } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Carnes() {
  const navigate = useNavigate();
  const [carnes, setCarnes] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [detailCarne, setDetailCarne] = useState<any>(null);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [stats, setStats] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [cancelCarneId, setCancelCarneId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data }, statsResp] = await Promise.all([
        carnesAPI.list({ skip: page * 20, limit: 20, search, month, status: statusFilter }),
        carnesAPI.stats({ month }),
      ]);
      setCarnes(data.carnets || []);
      setTotal(data.total || 0);
      setStats(statsResp.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, search, month, statusFilter]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
        setMenuPos(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const summaryCards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Carnês Emitidos', status: '', value: stats.total_carnets || 0, icon: FileText, color: 'blue' },
      { label: 'Total a Receber', status: 'pending', value: stats.total_to_receive || 0, icon: DollarSign, color: 'primary', format: 'currency' },
      { label: 'Recebido', status: 'paid', value: stats.total_received || 0, icon: CheckCircle, color: 'green', format: 'currency' },
      { label: 'Em Aberto', status: 'pending', value: stats.total_open || 0, icon: Clock, color: 'yellow', format: 'currency' },
      { label: 'Em Atraso', status: 'overdue', value: stats.total_overdue || 0, icon: AlertTriangle, color: 'red', format: 'currency' },
    ];
  }, [stats]);

  const handleCardClick = (cardLabel: string) => {
    const map: Record<string, string> = {
      'Carnês Emitidos': '',
      'Total a Receber': 'pending',
      'Recebido': 'paid',
      'Em Aberto': 'pending',
      'Em Atraso': 'overdue',
    };
    setStatusFilter(map[cardLabel] || '');
    setPage(0);
  };

  const formatCurrency = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const handleCancel = async (id: number) => {
    try {
      await carnesAPI.cancel(id);
      load();
    } catch {
      alert('Erro ao cancelar carnê');
    }
    setActiveMenu(null);
    setMenuPos(null);
  };

  const handleView = (carne: any) => {
    setDetailCarne(carne);
    setActiveMenu(null);
    setMenuPos(null);
  };

  const handlePrint = async (carne: any) => {
    try {
      const resp = await carnesAPI.carnePDF(carne.id);
      const url = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch {
      alert('Erro ao gerar PDF do carnê');
    }
    setActiveMenu(null);
    setMenuPos(null);
  };

  const statusLabels: Record<string, string> = { active: 'Ativo', paid: 'Pago', pending: 'Em Aberto', overdue: 'Em Atraso', cancelled: 'Cancelado' };
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">
            <button onClick={() => navigate('/financial')} className="hover:text-primary-600 cursor-pointer">Financeiro</button>
            {' / Carnês'}
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Carnês</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{total} carnê(s) encontrado(s)</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Novo Carnê
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {summaryCards.map((card) => {
            const colorMap: Record<string, string> = {
              blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900',
              primary: 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-900',
              green: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900',
              yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-900',
              red: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900',
            };
            const iconColorMap: Record<string, string> = {
              blue: 'text-blue-500',
              primary: 'text-primary-500',
              green: 'text-green-500',
              yellow: 'text-yellow-500',
              red: 'text-red-500',
            };
            const labelColorMap: Record<string, string> = {
              blue: 'text-blue-600',
              primary: 'text-primary-600',
              green: 'text-green-600',
              yellow: 'text-yellow-600',
              red: 'text-red-600',
            };
            const valueColorMap: Record<string, string> = {
              blue: 'text-blue-700',
              primary: 'text-primary-700',
              green: 'text-green-700',
              yellow: 'text-yellow-700',
              red: 'text-red-700',
            };
            return (
              <button
                key={card.label}
                onClick={() => handleCardClick(card.label)}
                className={`${colorMap[card.color]} rounded-xl p-4 border text-left transition-all hover:scale-[1.02] ${statusFilter === card.status ? 'ring-2 ring-primary-500' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${labelColorMap[card.color]}`}>{card.label}</p>
                    <p className={`text-xl font-bold ${valueColorMap[card.color]}`}>
                      {card.format === 'currency' ? formatCurrency(card.value) : card.value}
                    </p>
                  </div>
                  <card.icon className={`w-8 h-8 ${iconColorMap[card.color]}`} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Buscar carnê, aluno..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => { if (e.target.value) setMonth(e.target.value); }}
          className="px-3 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="px-3 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todos os Status</option>
          <option value="active">Ativo</option>
          <option value="pending">Em Aberto</option>
          <option value="paid">Pago</option>
          <option value="overdue">Em Atraso</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-primary-600/20 border-t-primary-600 dark:border-primary-400/20 dark:border-t-primary-400" />
        </div>
      ) : (
        <div className="card-surface">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-white/5">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Carnê</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Aluno</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Parcela</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Vencimento</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Valor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {carnes.map((c) => {
                const paidCount = c.paid_count || 0;
                const overdueCount = c.overdue_count || 0;
                const pendingCount = c.pending_count || 0;
                const totalCount = c.total_installments || 0;
                const carneStatus = c.status || (paidCount === totalCount ? 'paid' : overdueCount > 0 ? 'overdue' : 'active');
                const nextDue = c.first_due_date || '';
                return (
                  <tr key={c.id} className={`hover:bg-slate-50 dark:hover:bg-white/5 ${carneStatus === 'overdue' || overdueCount > 0 ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        #{String(c.id).padStart(4, '0')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/students/${c.student_id}`)}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline"
                      >
                        {c.student_name || `Aluno #${c.student_id}`}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                      {paidCount}/{totalCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                      {nextDue ? new Date(nextDue + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                      {formatCurrency(c.total_amount || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[carneStatus] || 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>
                        {statusLabels[carneStatus] || carneStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleView(c)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              if (activeMenu === c.id) {
                                setActiveMenu(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setMenuPos({ top: rect.bottom + 4, left: rect.right - 180 });
                                setActiveMenu(c.id);
                              }
                            }}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg"
                            title="Mais opções"
                          >
                            <MoreVertical className="w-4 h-4 text-slate-500" />
                          </button>
                          {activeMenu === c.id && menuPos && createPortal(
                            <div
                              ref={menuRef}
                              style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
                              className="bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl min-w-[180px] py-1"
                            >
                              <button
                                onClick={() => handleView(c)}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" /> Visualizar
                              </button>
                              <button
                                onClick={() => handlePrint(c)}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                              >
                                <Printer className="w-4 h-4" /> Imprimir
                              </button>
                              {carneStatus !== 'cancelled' && (
                                <button
                                  onClick={() => { setCancelCarneId(c.id); setActiveMenu(null); setMenuPos(null); }}
                                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                  <XCircle className="w-4 h-4" /> Cancelar
                                </button>
                              )}
                            </div>,
                            document.body
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {carnes.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Nenhum carnê encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Mostrando {page * 20 + 1}-{Math.min((page + 1) * 20, total)} de {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * 20 >= total}
              className="p-2 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>
      )}

      {showNewModal && (
        <NewCarneModal onClose={() => setShowNewModal(false)} onSaved={() => { setShowNewModal(false); load(); }} />
      )}

      {detailCarne && (
        <CarneDetailModal carne={detailCarne} onClose={() => setDetailCarne(null)} onUpdated={() => { setDetailCarne(null); load(); }} />
      )}

      {cancelCarneId !== null && (
        <ConfirmDialog
          open
          color="amber"
          title="Cancelar carnê"
          message="Tem certeza que deseja cancelar este carnê? Esta ação não pode ser desfeita."
          confirmLabel="Sim, cancelar"
          onConfirm={() => { handleCancel(cancelCarneId); setCancelCarneId(null); }}
          onCancel={() => setCancelCarneId(null)}
        />
      )}
    </div>
  );
}

function NewCarneModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedEnrollment, setSelectedEnrollment] = useState<number>(0);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [saving, setSaving] = useState(false);
  const { paymentMethods } = useSettings();

  const [form, setForm] = useState({
    charge_type: 'monthly',
    description: '',
    total_installments: 12,
    installment_value: 0,
    discount: 0,
    first_due_date: new Date().toISOString().split('T')[0],
    late_fee_pct: 2.0,
    interest_daily_pct: 0.033,
    payment_methods: 'PIX,Dinheiro,Débito,Crédito',
  });

  useEffect(() => {
    if (paymentMethods.length && !form.payment_methods) {
      setForm(f => ({ ...f, payment_methods: paymentMethods.join(',') }));
    }
  }, [paymentMethods]);

  const currentMethods = parsePaymentMethods(form.payment_methods);
  const togglePaymentMethod = (m: string) => {
    setForm(f => {
      const list = parsePaymentMethods(f.payment_methods);
      const next = list.includes(m) ? list.filter(x => x !== m) : [...list, m];
      return { ...f, payment_methods: next.join(',') };
    });
  };

  useEffect(() => {
    if (studentSearch.length < 2) {
      setStudentResults([]);
      return;
    }
    if (searchTimeout) clearTimeout(searchTimeout);
    const t = setTimeout(() => {
      studentsAPI.list({ search: studentSearch, limit: 10 })
        .then(({ data }) => setStudentResults(data.students || []))
        .catch(() => setStudentResults([]));
    }, 300);
    setSearchTimeout(t);
    return () => clearTimeout(t);
  }, [studentSearch]);

  const handleSelectStudent = async (student: any) => {
    setSelectedStudent(student);
    setStudentSearch(student.full_name);
    setStudentResults([]);
    if (student.monthly_fee) {
      setForm(f => ({ ...f, installment_value: student.monthly_fee }));
    }
    try {
      const { data } = await enrollmentsAPI.list({ student_id: student.id, status: 'active' });
      setEnrollments(data.enrollments || []);
      if (data.enrollments?.length === 1) {
        setSelectedEnrollment(data.enrollments[0].id);
      }
    } catch {
      setEnrollments([]);
    }
  };

  const preview = useMemo(() => {
    const items = [];
    const baseDate = new Date(form.first_due_date + 'T12:00:00');
    for (let i = 0; i < form.total_installments; i++) {
      const due = new Date(baseDate);
      due.setMonth(due.getMonth() + i);
      const amount = form.installment_value;
      const discount = i === 0 ? form.discount : 0;
      const total = amount - discount;
      items.push({
        num: i + 1,
        due_date: due.toISOString().split('T')[0],
        amount,
        discount,
        total,
      });
    }
    return items;
  }, [form.total_installments, form.installment_value, form.first_due_date, form.discount]);

  const previewTotal = useMemo(() => preview.reduce((s, p) => s + p.total, 0), [preview]);

  const handleSave = async () => {
    if (!selectedStudent) { alert('Selecione o aluno'); return; }
    if (!form.description) { alert('Preencha a descrição'); return; }
    if (form.total_installments < 1) { alert('Número de parcelas inválido'); return; }
    if (form.installment_value <= 0) { alert('Valor da parcela deve ser maior que zero'); return; }
    setSaving(true);
    try {
      await carnesAPI.create({
        student_id: selectedStudent.id,
        enrollment_id: selectedEnrollment || undefined,
        charge_type: form.charge_type,
        description: form.description,
        total_installments: form.total_installments,
        installment_value: form.installment_value,
        discount: form.discount,
        first_due_date: form.first_due_date,
        late_fee_pct: form.late_fee_pct,
        interest_daily_pct: form.interest_daily_pct,
        payment_methods: form.payment_methods,
      });
      onSaved();
    } catch (e: any) {
      alert('Erro ao criar carnê: ' + (e?.response?.data?.detail || e?.message || 'Desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111a2e] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Novo Carnê</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Aluno *</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => { setStudentSearch(e.target.value); setSelectedStudent(null); }}
                placeholder="Buscar aluno por nome..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
              {studentResults.length > 0 && !selectedStudent && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
                  {studentResults.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectStudent(s)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 text-sm"
                    >
                      <span className="font-medium text-slate-900 dark:text-white">{s.full_name}</span>
                      {s.cpf && <span className="text-slate-500 ml-2">{s.cpf}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedStudent && (
            <>
              <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedStudent.full_name}</p>
                  {selectedStudent.cpf && <p className="text-xs text-slate-500">CPF: {selectedStudent.cpf}</p>}
                </div>
                <button onClick={() => { setSelectedStudent(null); setStudentSearch(''); }} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              {enrollments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Matrícula</label>
                  <select
                    value={selectedEnrollment}
                    onChange={(e) => setSelectedEnrollment(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm"
                  >
                    <option value={0}>Selecione a matrícula</option>
                    {enrollments.map((en) => (
                      <option key={en.id} value={en.id}>
                        Matrícula #{en.id} - {en.class_name || `Turma #${en.class_group_id}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Cobrança *</label>
                  <select
                    value={form.charge_type}
                    onChange={(e) => setForm(f => ({ ...f, charge_type: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm"
                  >
                    <option value="monthly">Mensalidade</option>
                    <option value="material">Material Didático</option>
                    <option value="inscription">Inscrição</option>
                    <option value="other">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição *</label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Ex: Carnê 2024 - Mensalidade"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nº Parcelas *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.total_installments || ''}
                    onChange={(e) => { if (/^\d*$/.test(e.target.value)) setForm(f => ({ ...f, total_installments: parseInt(e.target.value) || 1 })); }}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor Parcela (R$) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.installment_value > 0 ? form.installment_value.toFixed(2).replace('.', ',') : ''}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
                      const num = parseFloat(cleaned);
                      setForm(f => ({ ...f, installment_value: isNaN(num) ? 0 : num }));
                    }}
                    placeholder="0,00"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Desconto (R$)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.discount > 0 ? form.discount.toFixed(2).replace('.', ',') : ''}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
                      const num = parseFloat(cleaned);
                      setForm(f => ({ ...f, discount: isNaN(num) ? 0 : num }));
                    }}
                    placeholder="0,00"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">1º Vencimento *</label>
                  <input
                    type="date"
                    value={form.first_due_date}
                    onChange={(e) => setForm(f => ({ ...f, first_due_date: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Multa Atraso (%)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.late_fee_pct || ''}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^\d.]/g, '');
                      const num = parseFloat(cleaned);
                      setForm(f => ({ ...f, late_fee_pct: e.target.value === '' ? 0 : (isNaN(num) ? 0 : num) }));
                    }}
                    placeholder="2,00"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Juros (% a.d.)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.interest_daily_pct || ''}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^\d.]/g, '');
                      const num = parseFloat(cleaned);
                      setForm(f => ({ ...f, interest_daily_pct: e.target.value === '' ? 0 : (isNaN(num) ? 0 : num) }));
                    }}
                    placeholder="0,033"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Formas de Pagamento</label>
                  <div className="flex flex-wrap gap-2">
                    {paymentMethods.map(m => (
                      <button key={m} type="button" onClick={() => togglePaymentMethod(m)}
                        className={`px-3 py-2 rounded-lg border text-sm transition-colors ${currentMethods.includes(m)
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 font-medium'
                          : 'border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-white/5 px-4 py-2">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Preview das Parcelas</h3>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-white/5 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase">#</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Vencimento</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Valor</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Desconto</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {preview.map((p) => (
                        <tr key={p.num} className="hover:bg-slate-50 dark:hover:bg-white/5">
                          <td className="px-4 py-2 text-sm text-slate-900 dark:text-white">{String(p.num).padStart(2, '0')}</td>
                          <td className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">
                            {new Date(p.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-slate-900 dark:text-white">
                            R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-slate-500 dark:text-slate-400">
                            {p.discount > 0 ? `- R$ ${p.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="px-4 py-2 text-sm text-right font-medium text-slate-900 dark:text-white">
                            R$ {p.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 px-4 py-3 flex items-center justify-between border-t border-slate-200 dark:border-white/10">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total do Carnê</span>
                  <span className="text-lg font-bold text-primary-600">
                    R$ {previewTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-sm">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedStudent}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Criar Carnê'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CarneDetailModal({ carne, onClose, onUpdated }: { carne: any; onClose: () => void; onUpdated: () => void }) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payingInstallment, setPayingInstallment] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    carnesAPI.get(carne.id)
      .then(({ data }) => setDetail(data))
      .catch(() => alert('Erro ao carregar detalhes'))
      .finally(() => setLoading(false));
  }, [carne.id]);

  const handlePayment = async (installmentId: number, data: any) => {
    try {
      const resp = await carnesAPI.registerPayment(carne.id, installmentId, data);
      if (resp.data?.payment_id) {
        try {
          const receiptResp = await financialAPI.receipt(resp.data.payment_id);
          const url = URL.createObjectURL(new Blob([receiptResp.data]));
          const a = document.createElement('a');
          a.href = url;
          a.download = `recibo-${resp.data.receipt_number || installmentId}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        } catch {
          console.warn('Falha ao baixar recibo do pagamento');
        }
      }
      const { data: updated } = await carnesAPI.get(carne.id);
      setDetail(updated);
      setPayingInstallment(null);
      onUpdated();
    } catch (e: any) {
      alert('Erro ao registrar pagamento: ' + (e?.response?.data?.detail || e?.message || 'Desconhecido'));
    }
  };

  const summary = useMemo(() => {
    if (!detail?.installments) return { total: 0, paid: 0, open: 0 };
    const installments = detail.installments;
    const total = installments.reduce((s: number, i: any) => s + (i.total || i.amount || 0), 0);
    const paid = installments.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + (i.total || i.amount || 0), 0);
    const open = total - paid;
    return { total, paid, open };
  }, [detail]);

  const statusLabels: Record<string, string> = { paid: 'Pago', pending: 'Pendente', overdue: 'Em Atraso', cancelled: 'Cancelado' };
  const statusColors: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
  };

  const formatCurrency = (v: number) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111a2e] rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Carnê #{String(carne.id).padStart(4, '0')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {detail?.student_name || `Aluno #${carne.student_id}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  const resp = await carnesAPI.carnePDF(carne.id);
                  const url = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
                  window.open(url, '_blank');
                } catch { alert('Erro ao gerar PDF do carnê'); }
              }}
              className="px-3 py-1.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Imprimir Carnê
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg">
              <XCircle className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-primary-600/20 border-t-primary-600 dark:border-primary-400/20 dark:border-t-primary-400" />
          </div>
        ) : detail && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-100 dark:border-primary-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-primary-600">Total</p>
                    <p className="text-xl font-bold text-primary-700">{formatCurrency(summary.total)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-primary-500" />
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">Pago</p>
                    <p className="text-xl font-bold text-green-700">{formatCurrency(summary.paid)}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-100 dark:border-yellow-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600">Em Aberto</p>
                    <p className="text-xl font-bold text-yellow-700">{formatCurrency(summary.open)}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
            </div>

            <div className="card-surface overflow-hidden mb-6">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-slate-50 dark:bg-white/5">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Parcela</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Vencimento</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Valor</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Desconto</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Multa</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Juros</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Pgto</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {detail.installments?.map((inst: any) => {
                    const isPaid = inst.status === 'paid';
                    const isOverdue = inst.status === 'overdue';
                    const lateFee = isOverdue && !isPaid ? (inst.amount * (detail.late_fee_pct || 2.0)) / 100 : 0;
                    const interest = isOverdue && !isPaid ? (inst.amount * (detail.interest_daily_pct || 0.033)) / 100 * Math.max(0, Math.ceil((Date.now() - new Date(inst.due_date + 'T12:00:00').getTime()) / 86400000)) : 0;
                    const displayTotal = inst.total || (inst.amount - (inst.discount || 0) + lateFee + interest);
                    return (
                      <tr key={inst.id} className={`hover:bg-slate-50 dark:hover:bg-white/5 ${isOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                          {String(inst.installment_num || inst.num || 0).padStart(2, '0')}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                          {new Date(inst.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white">
                          {formatCurrency(inst.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-slate-500 dark:text-slate-400">
                          {inst.discount > 0 ? formatCurrency(inst.discount) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-600">
                          {lateFee > 0 ? formatCurrency(lateFee) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-600">
                          {interest > 0 ? formatCurrency(interest) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-slate-900 dark:text-white">
                          {formatCurrency(displayTotal)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[inst.status] || 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>
                            {statusLabels[inst.status] || inst.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                          {inst.payment_method || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isPaid && inst.payment_id && (
                              <button
                                onClick={async () => {
                                  try {
                                    const resp = await financialAPI.receipt(inst.payment_id);
                                    const url = URL.createObjectURL(new Blob([resp.data]));
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `recibo-${inst.receipt_number || inst.payment_id}.pdf`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  } catch {
                                    alert('Erro ao baixar recibo');
                                  }
                                }}
                                className="px-2 py-1 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 rounded text-xs font-medium flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" /> Recibo
                              </button>
                            )}
                            {!isPaid && inst.status !== 'cancelled' && (
                              <button
                                onClick={() => setPayingInstallment(inst)}
                                className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium flex items-center gap-1 ml-auto"
                              >
                                <DollarSign className="w-3 h-3" /> Pagar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {(!detail.installments || detail.installments.length === 0) && (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-slate-400">
                        Nenhuma parcela encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-sm"
              >
                Fechar
              </button>
            </div>
          </>
        )}

        {payingInstallment && (
          <PaymentModal
            installment={payingInstallment}
            lateFeePct={detail?.late_fee_pct || 2.0}
            interestDailyPct={detail?.interest_daily_pct || 0.033}
            paymentMethods={detail?.payment_methods}
            onClose={() => setPayingInstallment(null)}
            onConfirm={(data) => handlePayment(payingInstallment.id, data)}
          />
        )}
      </div>
    </div>
  );
}

function PaymentModal({
  installment,
  lateFeePct,
  interestDailyPct,
  paymentMethods,
  onClose,
  onConfirm,
}: {
  installment: any;
  lateFeePct: number;
  interestDailyPct: number;
  paymentMethods?: string;
  onClose: () => void;
  onConfirm: (data: any) => Promise<void>;
}) {
  const [method, setMethod] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { paymentMethods: globalMethods } = useSettings();

  const isOverdue = installment.status === 'overdue';
  const daysOverdue = isOverdue ? Math.max(0, Math.ceil((Date.now() - new Date(installment.due_date + 'T12:00:00').getTime()) / 86400000)) : 0;
  const lateFee = isOverdue ? (installment.amount * lateFeePct) / 100 : 0;
  const interest = isOverdue ? (installment.amount * interestDailyPct) / 100 * daysOverdue : 0;
  const baseAmount = installment.amount - (installment.discount || 0);
  const totalAmount = baseAmount + lateFee + interest;

  const methods = paymentMethods
    ? paymentMethods.split(',').map(m => m.trim()).filter(m => m && m.toLowerCase() !== 'boleto')
    : globalMethods;

  const handleConfirm = async () => {
    if (!method) { alert('Selecione a forma de pagamento'); return; }
    setSaving(true);
    try {
      await onConfirm({
        amount: totalAmount,
        base_amount: baseAmount,
        late_fee: lateFee,
        interest,
        payment_method: method,
        payment_date: paymentDate,
        notes,
      });
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{ zIndex: 60 }}>
      <div className="bg-white dark:bg-[#111a2e] rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Registrar Pagamento</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
          Parcela {String(installment.installment_num || installment.num || 0).padStart(2, '0')} · Vencimento: {new Date(installment.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
        </p>

        <div className="space-y-3 mb-4">
          <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Valor Base</span>
              <span className="text-slate-900 dark:text-white">R$ {baseAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            {lateFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Multa ({lateFeePct}%)</span>
                <span className="text-red-600">R$ {lateFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {interest > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Juros ({daysOverdue} dia(s) × {interestDailyPct}%)</span>
                <span className="text-red-600">R$ {interest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold border-t border-slate-200 dark:border-white/10 pt-2">
              <span className="text-slate-900 dark:text-white">Total a Pagar</span>
              <span className="text-primary-600">R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Forma de Pagamento *</label>
            <div className="grid grid-cols-2 gap-2">
              {methods.map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                    method === m
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data do Pagamento</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre o pagamento..."
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!method || saving}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Processando...' : 'Confirmar Pagamento'}
          </button>
        </div>
      </div>
    </div>
  );
}
