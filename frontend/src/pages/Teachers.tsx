import { useState, useEffect } from 'react';
import { teachersAPI } from '../services/api';
import { Plus, Edit, Trash2, Mail, Phone, GraduationCap } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

interface Teacher {
  id: number;
  full_name: string;
  cpf?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  specialization?: string | null;
  hourly_rate?: number | null;
  is_active?: boolean | number | null;
  notes?: string | null;
}

function formatRate(value?: number | null) {
  if (value === null || value === undefined || value === 0) return '—';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function isActive(t: Teacher) {
  return t.is_active === undefined || t.is_active === null ? true : Boolean(Number(t.is_active));
}

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    teachersAPI.listAll().then(({ data }) => setTeachers(data || [])).catch(() => setTeachers([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await teachersAPI.delete(id);
      setDeleteConfirm(null);
      load();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erro ao excluir o professor.');
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Professores</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{teachers.length} professor(es) cadastrado(s)</p>
        </div>
        <button onClick={() => { setEditTeacher(null); setShowModal(true); }} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Professor
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-[3px] border-primary-600/20 border-t-primary-600 dark:border-primary-400/20 dark:border-t-primary-400" /></div>
      ) : teachers.length === 0 ? (
        <div className="text-center py-16 card-surface">
          <p className="text-slate-400 mb-4">Nenhum professor cadastrado</p>
          <button onClick={() => { setEditTeacher(null); setShowModal(true); }} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Cadastrar primeiro professor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map(t => (
            <div key={t.id} className="card-surface p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{t.full_name}</h3>
                  {t.specialization && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-400/10 dark:text-primary-300 mt-1 inline-flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />{t.specialization}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button aria-label="Editar professor" onClick={() => { setEditTeacher(t); setShowModal(true); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg"><Edit className="w-4 h-4 text-slate-500" /></button>
                  <button aria-label="Excluir professor" onClick={() => setDeleteConfirm(t.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
                {t.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4" /><span>{t.email}</span></div>}
                {t.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><span>{t.phone}</span></div>}
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">Hora aula: {formatRate(t.hourly_rate)}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isActive(t) ? 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300'}`}>
                  {isActive(t) ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <TeacherModal teacher={editTeacher} onClose={() => { setShowModal(false); setEditTeacher(null); }} onSaved={() => { setShowModal(false); setEditTeacher(null); load(); }} />}
      {deleteConfirm !== null && (
        <ConfirmDialog
          open
          title="Excluir professor"
          message="Tem certeza que deseja excluir este professor? Esta ação não pode ser desfeita."
          confirmLabel="Sim, excluir"
          onConfirm={() => { handleDelete(deleteConfirm); setDeleteConfirm(null); }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

function TeacherModal({ teacher, onClose, onSaved }: { teacher: Teacher | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    full_name: teacher?.full_name || '',
    cpf: teacher?.cpf || '',
    phone: teacher?.phone || '',
    whatsapp: teacher?.whatsapp || '',
    email: teacher?.email || '',
    specialization: teacher?.specialization || '',
    hourly_rate: teacher?.hourly_rate ?? 0,
    is_active: isActive(teacher || {} as Teacher),
    notes: teacher?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.full_name.trim()) { alert('Preencha o nome do professor.'); return; }
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        cpf: form.cpf.trim() || undefined,
        phone: form.phone.trim() || undefined,
        whatsapp: form.whatsapp.trim() || undefined,
        email: form.email.trim() || undefined,
        specialization: form.specialization.trim() || undefined,
        hourly_rate: form.hourly_rate || undefined,
        is_active: form.is_active,
        notes: form.notes.trim() || undefined,
      };
      if (teacher) {
        await teachersAPI.update(teacher.id, payload);
      } else {
        await teachersAPI.create(payload);
      }
      onSaved();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erro ao salvar o professor.');
    } finally { setSaving(false); }
  };

  const inputCls = "w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm";

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111a2e] rounded-2xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{teacher ? 'Editar Professor' : 'Novo Professor'}</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="teacher-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo *</label>
            <input id="teacher-name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="teacher-cpf" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CPF</label>
              <input id="teacher-cpf" placeholder="000.000.000-00" value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label htmlFor="teacher-specialization" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Especialização</label>
              <input id="teacher-specialization" value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="teacher-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
              <input id="teacher-phone" placeholder="(00) 00000-0000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label htmlFor="teacher-whatsapp" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp</label>
              <input id="teacher-whatsapp" placeholder="(00) 00000-0000" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label htmlFor="teacher-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
            <input id="teacher-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label htmlFor="teacher-rate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor da hora aula (R$)</label>
              <input id="teacher-rate" type="number" step="0.01" value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: parseFloat(e.target.value) || 0 }))} className={inputCls} />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 pb-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-primary-600" />
              Professor ativo
            </label>
          </div>
          <div>
            <label htmlFor="teacher-notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
            <textarea id="teacher-notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={inputCls} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.full_name.trim()} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}