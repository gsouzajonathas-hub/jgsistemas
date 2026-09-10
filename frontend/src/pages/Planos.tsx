import { useState, useEffect } from 'react';
import { plansAPI, coursesAPI, studentsAPI, contractsAPI } from '../services/api';
import type { CoursePlan, ContractResult, PlanCalc, Student } from '../types';
import { Plus, Pencil, Trash2, Package, UserPlus, Power, FileText } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

const fmtBRL = (v: number) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function addMonths(d: Date, k: number): Date {
  const m = d.getMonth() + k;
  const last = new Date(d.getFullYear(), m + 1, 0).getDate();
  return new Date(d.getFullYear(), m, Math.min(d.getDate(), last));
}

const iso = (d: Date) => d.toISOString().split('T')[0];

function calcPlan(p: { value: number; duration_months: number; discount_type: 'percent' | 'fixed'; discount_value: number; upfront_discount_pct: number; installments_default?: number }): PlanCalc {
  const months = Math.max(1, Number(p.duration_months) || 1);
  const monthly = Number(p.value) || 0;
  const gross = Math.round(monthly * months * 100) / 100;
  const dv = Number(p.discount_value) || 0;
  const discount = p.discount_type === 'percent'
    ? Math.round(gross * Math.min(Math.max(dv, 0), 100) / 100 * 100) / 100
    : Math.round(Math.min(Math.max(dv, 0), gross) * 100) / 100;
  const final = Math.round((gross - discount) * 100) / 100;
  const up = Number(p.upfront_discount_pct) || 0;
  const upfrontDisc = Math.round(final * Math.min(Math.max(up, 0), 100) / 100 * 100) / 100;
  return {
    gross_total: gross,
    discount_amount: discount,
    final_value: final,
    upfront_value: Math.round((final - upfrontDisc) * 100) / 100,
    default_installments: Math.max(1, Math.min(Number(p.installments_default) || months, months)),
  };
}

function previewParcels(finalValue: number, n: number, firstDue: string): { number: number; due_date: string; amount: number }[] {
  if (!firstDue) return [];
  const base = Math.round(finalValue / n * 100) / 100;
  const amounts = Array(n).fill(base);
  amounts[n - 1] = Math.round((finalValue - base * (n - 1)) * 100) / 100;
  const d = new Date(firstDue + 'T12:00:00');
  return amounts.map((amount, i) => ({
    number: i + 1,
    due_date: iso(addMonths(d, i)),
    amount,
  }));
}

const inputCls = "w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm";
const labelCls = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

export default function Planos() {
  const [plans, setPlans] = useState<CoursePlan[]>([]);
  const [courses, setCourses] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CoursePlan | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [contracting, setContracting] = useState<CoursePlan | null>(null);
  const [deletePlan, setDeletePlan] = useState<CoursePlan | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([plansAPI.list(), coursesAPI.list()])
      .then(([p, c]) => { setPlans(p.data); setCourses(c.data); })
      .catch(() => { setPlans([]); setCourses([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (p: CoursePlan) => {
    try { await plansAPI.delete(p.id); load(); }
    catch (e: any) { alert(e.response?.data?.detail || 'Erro ao excluir plano'); }
  };

  const toggleActive = async (p: CoursePlan) => {
    try { await plansAPI.toggle(p.id); load(); }
    catch (e: any) { alert(e.response?.data?.detail || 'Erro ao atualizar plano'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Planos</h1>
          <p className="text-slate-500 text-sm">Pacotes de curso com desconto por duração</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Plano
        </button>
      </div>

      <div className="card-surface overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-primary-600/20 border-t-primary-600" />
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <Package className="w-10 h-10 mb-3" />
            <p className="text-sm">Nenhum plano cadastrado</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-white/10">
                <th className="px-6 py-4 font-semibold">Plano</th>
                <th className="px-6 py-4 font-semibold">Duração</th>
                <th className="px-6 py-4 font-semibold">Mensalidade</th>
                <th className="px-6 py-4 font-semibold">Desconto</th>
                <th className="px-6 py-4 font-semibold">Valor total</th>
                <th className="px-6 py-4 font-semibold">À vista</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(p => (
                <tr key={p.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900 dark:text-white">{p.name}</p>
                    <p className="text-xs text-slate-500">{[p.course_name, p.description].filter(Boolean).join(' • ')}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{p.duration_months} {p.duration_months === 1 ? 'mês' : 'meses'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{fmtBRL(p.monthly_value)}</td>
                  <td className="px-6 py-4">
                    {p.discount_amount > 0 ? (
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                        {p.discount_type === 'percent' ? `${p.discount_value}%` : fmtBRL(p.discount_value)} (−{fmtBRL(p.discount_amount)})
                      </span>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900 dark:text-white">{fmtBRL(p.final_value)}</p>
                    {p.gross_total > p.final_value && <p className="text-xs text-slate-400 line-through">{fmtBRL(p.gross_total)}</p>}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {p.upfront_discount_pct > 0 ? `${fmtBRL(p.upfront_value)} (${p.upfront_discount_pct}% off)` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${p.is_active ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-400'}`}>
                      {p.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    {p.is_active ? (
                      <button onClick={() => setContracting(p)} title="Matricular aluno no plano" className="p-2 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg text-slate-400 hover:text-primary-600 mr-1">
                        <UserPlus className="w-4 h-4" />
                      </button>
                    ) : null}
                    <button onClick={() => { setEditing(p); setShowModal(true); }} title="Editar" className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-primary-600 mr-1">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeletePlan(p)} title="Excluir" className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-600 mr-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleActive(p)} title={p.is_active ? 'Desativar' : 'Ativar'} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-amber-600">
                      <Power className={`w-4 h-4 ${!p.is_active ? 'text-green-500' : ''}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <PlanModal
          planData={editing}
          courses={courses}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}

      {contracting && (
        <ContractModal
          plan={contracting}
          onClose={() => setContracting(null)}
          onDone={() => { setContracting(null); }}
        />
      )}

      {deletePlan && (
        <ConfirmDialog
          open
          title="Excluir plano"
          message={`Excluir o plano "${deletePlan.name}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Sim, excluir"
          onConfirm={() => { handleDelete(deletePlan); setDeletePlan(null); }}
          onCancel={() => setDeletePlan(null)}
        />
      )}
    </div>
  );
}

function PlanModal({ planData, courses, onClose, onSaved }: {
  planData: CoursePlan | null;
  courses: { id: number; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<{
    name: string;
    course_id: string | number;
    duration_months: string | number;
    value: string | number;
    discount_type: 'percent' | 'fixed';
    discount_value: string | number;
    upfront_discount_pct: string | number;
    installments_default: string | number;
    description: string;
  }>(() => planData ? {
    name: planData.name,
    course_id: planData.course_id ?? '',
    duration_months: planData.duration_months,
    value: planData.value,
    discount_type: planData.discount_type as 'percent' | 'fixed',
    discount_value: planData.discount_value,
    upfront_discount_pct: planData.upfront_discount_pct,
    installments_default: planData.default_installments,
    description: planData.description || '',
  } : {
    name: '', course_id: '', duration_months: '', value: '',
    discount_type: 'percent' as 'percent' | 'fixed', discount_value: '',
    upfront_discount_pct: '', installments_default: '', description: '',
  });
  const [saving, setSaving] = useState(false);

  const calc = calcPlan({
    value: Number(form.value) || 0,
    duration_months: Number(form.duration_months) || 1,
    discount_type: form.discount_type,
    discount_value: Number(form.discount_value) || 0,
    upfront_discount_pct: Number(form.upfront_discount_pct) || 0,
    installments_default: Number(form.installments_default) || undefined,
  });
  const parcelaExemplo = calc.final_value / Math.min(calc.default_installments, Number(form.duration_months) || 1);

  const handleSave = async () => {
    if (!form.name) { alert('Nome é obrigatório'); return; }
    if (!form.value || Number(form.value) <= 0) { alert('Informe a mensalidade de referência'); return; }
    setSaving(true);
    const payload = {
      name: form.name,
      value: Number(form.value),
      description: form.description,
      installments: calc.default_installments,
      course_id: form.course_id ? Number(form.course_id) : null,
      duration_months: Number(form.duration_months) || 1,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value) || 0,
      upfront_discount_pct: Number(form.upfront_discount_pct) || 0,
    };
    try {
      if (planData) await plansAPI.update(planData.id, payload);
      else await plansAPI.create(payload);
      onSaved();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Erro ao salvar plano');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111a2e] rounded-2xl w-full max-w-xl p-6 max-h-[92vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{planData ? 'Editar Plano' : 'Novo Plano'}</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nome do plano *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Ex: Quadrimestral" />
            </div>
            <div>
              <label className={labelCls}>Curso</label>
              <select value={form.course_id || ''} onChange={e => setForm(f => ({ ...f, course_id: e.target.value === '' ? '' : Number(e.target.value) }))} className={inputCls}>
                <option value="">Nenhum</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Duração (meses) *</label>
              <input type="number" min={1} max={36} value={form.duration_months || ''}
                onChange={e => setForm(f => ({ ...f, duration_months: e.target.value === '' ? '' : Number(e.target.value) }))} className={inputCls} placeholder="4" />
            </div>
            <div>
              <label className={labelCls}>Mensalidade de referência *</label>
              <input type="number" min={0} step="0.01" value={form.value || ''}
                onChange={e => setForm(f => ({ ...f, value: e.target.value === '' ? '' : Number(e.target.value) }))} className={inputCls} placeholder="300.00" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Tipo de desconto</label>
            <div className="flex gap-2 mb-2">
              {[['percent', 'Percentual'], ['fixed', 'Valor fixo']].map(([v, l]) => (
                <button type="button" key={v} onClick={() => setForm(f => ({ ...f, discount_type: v as 'percent' | 'fixed' }))}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.discount_type === v ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200'}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{form.discount_type === 'percent' ? 'Desconto (%)' : 'Desconto (R$)'}</label>
                <input type="number" min={0} step="0.01" value={form.discount_value || ''}
                  onChange={e => setForm(f => ({ ...f, discount_value: e.target.value === '' ? '' : Number(e.target.value) }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Desconto extra à vista (%)</label>
                <input type="number" min={0} max={100} step="0.01" value={form.upfront_discount_pct || ''}
                  onChange={e => setForm(f => ({ ...f, upfront_discount_pct: e.target.value === '' ? '' : Number(e.target.value) }))} className={inputCls} />
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Parcelas padrão (máx. = duração)</label>
            <input type="number" min={1} max={Math.max(1, Number(form.duration_months) || 1)} value={calc.default_installments || ''}
              onChange={e => setForm(f => ({ ...f, installments_default: e.target.value === '' ? '' : Number(e.target.value) }))} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Descrição</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} />
          </div>

          {/* Cálculo ao vivo */}
          <div className="rounded-xl border border-primary-200 dark:border-primary-500/20 bg-primary-50/60 dark:bg-primary-500/5 p-4 space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-400 mb-2">Cálculo automático</p>
            <Row label={`${fmtBRL(Number(form.value) || 0)} × ${form.duration_months} meses`} value={fmtBRL(calc.gross_total)} />
            <Row label="Desconto do plano" value={`− ${fmtBRL(calc.discount_amount)}`} accent="text-green-600 dark:text-green-400" />
            <Row label="Valor do plano" value={fmtBRL(calc.final_value)} bold />
            {Number(form.upfront_discount_pct) > 0 && (
              <>
                <Row label={`À vista (−${form.upfront_discount_pct}%)`} value={fmtBRL(calc.upfront_value)} bold />
              </>
            )}
            <Row label={`Parcela exemplo (${calc.default_installments}×)`} value={fmtBRL(parcelaExemplo)} />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Salvando...' : planData ? 'Salvar Alterações' : 'Criar Plano'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`${bold ? 'font-bold' : ''} ${accent || 'text-slate-900 dark:text-white'}`}>{value}</span>
    </div>
  );
}

function ContractModal({ plan, onClose, onDone }: {
  plan: CoursePlan;
  onClose: () => void;
  onDone: () => void;
}) {
  const today = iso(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState(0);
  const [startDate, setStartDate] = useState(today);
  const [firstDue, setFirstDue] = useState(iso(addMonths(new Date(), 1)));
  const [mode, setMode] = useState<'installments' | 'upfront'>('installments');
  const [count, setCount] = useState(plan.default_installments);
  const [guardianName, setGuardianName] = useState('');
  const [guardianCpf, setGuardianCpf] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ContractResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    studentsAPI.list({ limit: 500 }).then(({ data }) => {
      const arr = Array.isArray(data) ? data : (data.students || []);
      setStudents(arr);
    }).catch(() => alert('Erro ao carregar alunos'));
  }, []);

  const total = mode === 'upfront' ? plan.upfront_value : plan.final_value;
  const parcels = mode === 'upfront'
    ? [{ number: 1, due_date: firstDue, amount: plan.upfront_value }]
    : previewParcels(plan.final_value, Math.max(1, count), firstDue);
  const upfrontExtra = Math.round((plan.final_value - plan.upfront_value) * 100) / 100;

  const handleConfirm = async () => {
    if (!studentId) { setError('Selecione o aluno'); return; }
    if (!startDate || !firstDue) { setError('Informe as datas'); return; }
    setError('');
    setSaving(true);
    try {
      const { data } = await plansAPI.contract(plan.id, {
        student_id: studentId,
        start_date: startDate,
        first_due_date: firstDue,
        mode,
        installments_count: mode === 'installments' ? Math.max(1, count) : null,
        guardian_name: guardianName || undefined,
        guardian_cpf: guardianCpf || undefined,
      });
      setResult(data);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Erro ao realizar contratação');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111a2e] rounded-2xl w-full max-w-lg p-6 max-h-[92vh] overflow-y-auto">
        {!result ? (
          <>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Matricular aluno no plano</h2>
            <p className="text-sm text-slate-500 mb-4">{plan.name}{plan.course_name ? ` • ${plan.course_name}` : ''} • {plan.duration_months} meses • {fmtBRL(plan.final_value)}</p>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Aluno *</label>
                <select value={studentId || ''} onChange={e => setStudentId(e.target.value === '' ? 0 : Number(e.target.value))} className={inputCls}>
                  <option value="">Selecione...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Início do curso</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>1º vencimento *</label>
                  <input type="date" value={firstDue} onChange={e => setFirstDue(e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Forma de pagamento</label>
                <div className="flex gap-2">
                    <button type="button" onClick={() => setMode('installments')}
                    className={`flex-1 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${mode === 'installments' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200'}`}>
                    Parcelado
                  </button>
                  {plan.upfront_discount_pct > 0 && (
                    <button type="button" onClick={() => setMode('upfront')}
                      className={`flex-1 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${mode === 'upfront' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200'}`}>
                      À vista (−{plan.upfront_discount_pct}%)
                    </button>
                  )}
                </div>
              </div>

              {mode === 'installments' && (
                <div>
                  <label className={labelCls}>Quantidade de parcelas (máx. 24)</label>
                  <input type="number" min={1} max={24} value={count}
                    onChange={e => setCount(Math.min(24, Math.max(1, Number(e.target.value))))} className={inputCls} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Responsável legal (opcional)</label>
                  <input value={guardianName} onChange={e => setGuardianName(e.target.value)} className={inputCls} placeholder="Para menores de idade" />
                </div>
                <div>
                  <label className={labelCls}>CPF do responsável</label>
                  <input value={guardianCpf} onChange={e => setGuardianCpf(e.target.value)} className={inputCls} placeholder="000.000.000-00" />
                </div>
              </div>

              {parcels.length > 0 && firstDue && (
                <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-white/5">
                        <th className="px-3 py-2 font-semibold">Parcela</th>
                        <th className="px-3 py-2 font-semibold">Vencimento</th>
                        <th className="px-3 py-2 font-semibold text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="max-h-40 overflow-y-auto">
                      {parcels.map(p => (
                        <tr key={p.number} className="border-t border-slate-100 dark:border-white/5">
                          <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300">{p.number}/{parcels.length}</td>
                          <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300">{p.due_date.split('-').reverse().join('/')}</td>
                          <td className="px-3 py-1.5 text-right font-medium text-slate-900 dark:text-white">{fmtBRL(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="rounded-xl border border-primary-200 dark:border-primary-500/20 bg-primary-50/60 dark:bg-primary-500/5 p-3 space-y-1 text-sm">
                <Row label="Valor sem desconto" value={fmtBRL(plan.gross_total)} />
                <Row label="Desconto do plano" value={`− ${fmtBRL(plan.discount_amount)}`} accent="text-green-600 dark:text-green-400" />
                {mode === 'upfront' && <Row label={`Desconto à vista (${plan.upfront_discount_pct}%)`} value={`− ${fmtBRL(upfrontExtra)}`} accent="text-green-600 dark:text-green-400" />}
                <Row label="Total a pagar" value={fmtBRL(total)} bold />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={onClose} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-sm">Cancelar</button>
              <button onClick={handleConfirm} disabled={saving} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? 'Gerando...' : 'Confirmar Matrícula'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-1">✓ Contrato realizado</h2>
            <p className="text-sm text-slate-500 mb-4">{result.message} · Curso: {result.start_date.split('-').reverse().join('/')} até {result.end_date.split('-').reverse().join('/')}</p>
            <div className="rounded-xl border border-slate-200 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/5 mb-4">
              {result.installments_created.map(i => (
                <div key={i.number} className="flex justify-between px-3 py-2 text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{i.number}/{result.installment_count} · venc. {i.due_date.split('-').reverse().join('/')}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{fmtBRL(i.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              {result.contract_id && (
                <button onClick={async () => {
                  const r = await contractsAPI.pdf(result.contract_id!);
                  const url = URL.createObjectURL(r.data as Blob);
                  window.open(url, '_blank');
                  setTimeout(() => URL.revokeObjectURL(url), 60_000);
                }} className="px-4 py-2 border border-primary-300 dark:border-primary-500/30 text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Contrato em PDF
                </button>
              )}
              <button onClick={onDone} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium">Concluir</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
