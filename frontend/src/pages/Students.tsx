import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { studentsAPI } from '../services/api';
import type { Student } from '../types';
import { Plus, Search, Filter, Trash2, Eye, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const navigate = useNavigate();

  const loadStudents = () => {
    setLoading(true);
    studentsAPI.list({ skip: page * 20, limit: 20, search, status: statusFilter })
      .then(({ data }) => { setStudents(data.students); setTotal(data.total); })
      .catch(() => alert('Erro ao carregar alunos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStudents(); }, [page, search, statusFilter]);

  const handleDelete = async (id: number) => {
    try { await studentsAPI.delete(id); loadStudents(); }
    catch (e: any) { alert(e.response?.data?.detail || 'Erro ao excluir aluno'); }
  };

  const statusLabels: Record<string, string> = { active: 'Ativo', inactive: 'Inativo', transferred: 'Transferido', suspended: 'Suspenso', graduated: 'Formado' };
  const statusColors: Record<string, string> = { active: 'bg-green-100 text-green-700', inactive: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300', transferred: 'bg-blue-100 text-blue-700', suspended: 'bg-yellow-100 text-yellow-700', graduated: 'bg-purple-100 text-purple-700' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Alunos</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{total} aluno(s) cadastrado(s)</p>
        </div>
        <button onClick={() => { setEditStudent(null); setShowModal(true); }} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Novo Aluno
        </button>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Buscar por nome, CPF, email..." className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none">
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
          <option value="suspended">Suspenso</option>
          <option value="transferred">Transferido</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-[3px] border-primary-600/20 border-t-primary-600 dark:border-primary-400/20 dark:border-t-primary-400" /></div>
      ) : (
        <div className="card-surface overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-white/5">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Aluno</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase hidden md:table-cell">CPF</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase hidden lg:table-cell">Telefone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase hidden lg:table-cell">Nível</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        {s.photo_url ? <img src={s.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" /> : <span className="text-primary-600 text-xs font-bold">{s.full_name.charAt(0)}</span>}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">{s.full_name}</p>
                        <p className="text-xs text-slate-500">{s.email || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 hidden md:table-cell">{s.cpf || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 hidden lg:table-cell">{s.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[s.status] || 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>
                      {statusLabels[s.status] || s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 hidden lg:table-cell">{s.english_level || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => navigate(`/students/${s.id}`)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg" title="Ver perfil"><Eye className="w-4 h-4 text-slate-500" /></button>
                      <button onClick={() => { setEditStudent(s); setShowModal(true); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg" title="Editar"><Edit className="w-4 h-4 text-slate-500" /></button>
                      <button onClick={() => setDeleteConfirm(s.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Excluir"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">Nenhum aluno encontrado</td></tr>
              )}
            </tbody>
          </table>
          {total > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-white/10">
              <span className="text-sm text-slate-500">{page * 20 + 1}-{Math.min((page + 1) * 20, total)} de {total}</span>
              <div className="flex gap-2">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-1.5 border rounded-lg disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <button disabled={(page + 1) * 20 >= total} onClick={() => setPage(p => p + 1)} className="p-1.5 border rounded-lg disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && <StudentModal student={editStudent} onClose={() => { setShowModal(false); setEditStudent(null); }} onSaved={() => { setShowModal(false); setEditStudent(null); loadStudents(); }} />}
      {deleteConfirm !== null && (
        <ConfirmDialog
          open
          title="Excluir aluno"
          message="Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita."
          confirmLabel="Sim, excluir"
          onConfirm={() => { handleDelete(deleteConfirm); setDeleteConfirm(null); }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

function StudentModal({ student, onClose, onSaved }: { student: Student | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    full_name: student?.full_name || '', cpf: student?.cpf || '', rg: student?.rg || '',
    birth_date: student?.birth_date || '', gender: student?.gender || '', marital_status: student?.marital_status || '',
    phone: student?.phone || '', whatsapp: student?.whatsapp || '', email: student?.email || '',
    zip_code: student?.zip_code || '', street: student?.street || '', number: student?.number || '',
    neighborhood: student?.neighborhood || '', city: student?.city || '', state: student?.state || '',
    english_level: student?.english_level || '', status: student?.status || 'active', notes: student?.notes || '', unit: student?.unit || 'Matriz',
    monthly_fee: student?.monthly_fee != null ? String(student.monthly_fee) : '', due_day: student?.due_day != null ? String(student.due_day) : '',
    first_installment_month: 'next',
    responsible_name: student?.responsible?.full_name || '', responsible_cpf: student?.responsible?.cpf || '',
    responsible_phone: student?.responsible?.phone || '', responsible_email: student?.responsible?.email || '',
    responsible_relationship: student?.responsible?.relationship || '',
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'personal' | 'address' | 'responsible' | 'academic' | 'financial'>('personal');

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: any = { ...form, responsible: null };
      if (form.monthly_fee) data.monthly_fee = parseFloat(form.monthly_fee); else data.monthly_fee = null;
      if (form.due_day) data.due_day = parseInt(form.due_day, 10); else data.due_day = null;
      data.first_installment_month = form.first_installment_month;
      if (form.responsible_name) {
        data.responsible = {
          full_name: form.responsible_name, cpf: form.responsible_cpf,
          phone: form.responsible_phone, email: form.responsible_email, relationship: form.responsible_relationship
        };
      }
      if (student) {
        await studentsAPI.update(student.id, data);
        onSaved();
      } else {
        await studentsAPI.create(data);
        onSaved();
      }
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'personal', label: 'Dados Pessoais' },
    { key: 'address', label: 'Endereço' },
    { key: 'responsible', label: 'Responsável' },
    { key: 'academic', label: 'Acadêmico' },
    { key: 'financial', label: 'Financeiro' },
  ] as const;

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111a2e] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{student ? 'Editar Aluno' : 'Novo Aluno'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
        </div>
        <div className="flex gap-1 px-6 pt-3 border-b border-slate-200 dark:border-white/10">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === t.key ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {tab === 'personal' && (
            <>
              <Input label="Nome completo *" value={form.full_name} onChange={v => update('full_name', v)} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="CPF" value={form.cpf} onChange={v => update('cpf', v)} numericOnly maxLength={14} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Data de Nascimento" type="date" value={form.birth_date} onChange={v => update('birth_date', v)} />
                <Select label="Sexo" value={form.gender} onChange={v => update('gender', v)} options={[{ value: '', label: 'Selecione' }, { value: 'M', label: 'Masculino' }, { value: 'F', label: 'Feminino' }, { value: 'O', label: 'Outro' }]} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Celular" value={form.phone} onChange={v => update('phone', v)} numericOnly maxLength={11} />
                <Input label="WhatsApp" value={form.whatsapp} onChange={v => update('whatsapp', v)} numericOnly maxLength={11} />
                <Input label="Email" type="email" value={form.email} onChange={v => update('email', v)} />
              </div>
            </>
          )}
          {tab === 'address' && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Input label="CEP" value={form.zip_code} onChange={v => update('zip_code', v)} numericOnly maxLength={8} />
                <Input label="Cidade" value={form.city} onChange={v => update('city', v)} />
                <Select label="Estado" value={form.state} onChange={v => update('state', v)} options={[{ value: '', label: 'UF' }, ...['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(s => ({ value: s, label: s }))]} />
              </div>
              <Input label="Rua" value={form.street} onChange={v => update('street', v)} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Número" value={form.number} onChange={v => update('number', v)} numericOnly />
                <Input label="Bairro" value={form.neighborhood} onChange={v => update('neighborhood', v)} />
              </div>
            </>
          )}
          {tab === 'responsible' && (
            <>
              <Input label="Nome do Responsável" value={form.responsible_name} onChange={v => update('responsible_name', v)} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="CPF" value={form.responsible_cpf} onChange={v => update('responsible_cpf', v)} numericOnly maxLength={14} />
                <Select label="Parentesco" value={form.responsible_relationship} onChange={v => update('responsible_relationship', v)} options={[{ value: '', label: 'Selecione' }, { value: 'Pai', label: 'Pai' }, { value: 'Mãe', label: 'Mãe' }, { value: 'Avô', label: 'Avô' }, { value: 'Avó', label: 'Avó' }, { value: 'Outro', label: 'Outro' }]} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Telefone" value={form.responsible_phone} onChange={v => update('responsible_phone', v)} numericOnly maxLength={11} />
                <Input label="Email" type="email" value={form.responsible_email} onChange={v => update('responsible_email', v)} />
              </div>
            </>
          )}
          {tab === 'academic' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Nível de Inglês" value={form.english_level} onChange={v => update('english_level', v)} options={[{ value: '', label: 'Selecione' }, { value: 'Básico', label: 'Básico' }, { value: 'Intermediário', label: 'Intermediário' }, { value: 'Avançado', label: 'Avançado' }, { value: 'Fluente', label: 'Fluente' }]} />
                <Select label="Status" value={form.status} onChange={v => update('status', v)} options={[{ value: 'active', label: 'Ativo' }, { value: 'inactive', label: 'Inativo' }, { value: 'suspended', label: 'Suspenso' }, { value: 'transferred', label: 'Transferido' }]} />
              </div>
              <Input label="Unidade" value={form.unit} onChange={v => update('unit', v)} />
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
                <textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </>
          )}
          {tab === 'financial' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Valor da Mensalidade (R$)" type="number" value={form.monthly_fee} onChange={v => update('monthly_fee', v)} />
                <Input label="Dia de Vencimento" value={form.due_day} onChange={v => update('due_day', v)} numericOnly maxLength={2} />
              </div>
              {!student && (
                <Select label="Primeira mensalidade" value={form.first_installment_month} onChange={v => update('first_installment_month', v)} options={[{ value: 'current', label: 'Mês atual' }, { value: 'next', label: 'Mês seguinte' }]} />
              )}
              {student && <p className="text-xs text-slate-400">Alterações valem para os próximos meses gerados automaticamente.</p>}
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.full_name} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Salvando...' : student ? 'Salvar Alterações' : 'Cadastrar Aluno'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', numericOnly = false, maxLength }: { label: string; value: string; onChange: (v: string) => void; type?: string; numericOnly?: boolean; maxLength?: number }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      <input type={type} value={value} maxLength={maxLength}
        onChange={e => {
          if (numericOnly) { if (/^\d*$/.test(e.target.value)) onChange(e.target.value); }
          else onChange(e.target.value);
        }}
        className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
