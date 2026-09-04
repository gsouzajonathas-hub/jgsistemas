import { useState, useEffect } from 'react';
import { coursesAPI } from '../services/api';
import { Plus, Edit, Trash2, Clock } from 'lucide-react';

interface Course {
  id: number;
  name: string;
  level?: string | null;
  description?: string | null;
  duration_hours?: number | null;
  price?: number | null;
}

const LEVELS = ['Básico', 'Intermediário', 'Avançado'];

function formatPrice(value?: number | null) {
  if (value === null || value === undefined || value === 0) return '—';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    coursesAPI.list().then(({ data }) => setCourses(data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await coursesAPI.delete(id);
      setDeleteConfirm(null);
      load();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erro ao excluir o curso.');
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cursos</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{courses.length} curso(s) cadastrado(s)</p>
        </div>
        <button onClick={() => { setEditCourse(null); setShowModal(true); }} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Curso
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-[3px] border-primary-600/20 border-t-primary-600 dark:border-primary-400/20 dark:border-t-primary-400" /></div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 card-surface">
          <p className="text-slate-400 mb-4">Nenhum curso cadastrado</p>
          <button onClick={() => { setEditCourse(null); setShowModal(true); }} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Cadastrar primeiro curso
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(c => (
            <div key={c.id} className="card-surface p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{c.name}</h3>
                  {c.level && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-400/10 dark:text-primary-300 mt-1 inline-block">{c.level}</span>}
                </div>
                <div className="flex gap-1">
                  <button aria-label="Editar curso" onClick={() => { setEditCourse(c); setShowModal(true); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg"><Edit className="w-4 h-4 text-slate-500" /></button>
                  {deleteConfirm === c.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(c.id)} className="px-2 py-1 bg-red-500 text-white rounded text-xs">Sim</button>
                      <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 rounded text-xs">Não</button>
                    </div>
                  ) : (
                    <button aria-label="Excluir curso" onClick={() => setDeleteConfirm(c.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2.5rem]">{c.description || 'Sem descrição'}</p>
              <div className="flex flex-wrap gap-1 mt-3 text-xs text-slate-500 dark:text-slate-400">
                {c.duration_hours ? <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10"><Clock className="w-3 h-3 inline mr-1" />{c.duration_hours}h</span> : null}
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10">R$ {formatPrice(c.price)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <CourseModal course={editCourse} onClose={() => { setShowModal(false); setEditCourse(null); }} onSaved={() => { setShowModal(false); setEditCourse(null); load(); }} />}
    </div>
  );
}

function CourseModal({ course, onClose, onSaved }: { course: Course | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: course?.name || '',
    level: course?.level || '',
    description: course?.description || '',
    duration_hours: course?.duration_hours ?? 60,
    price: course?.price ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) { alert('Preencha o nome do curso.'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        level: form.level || undefined,
        description: form.description.trim() || undefined,
        duration_hours: form.duration_hours || undefined,
        price: form.price || undefined,
      };
      if (course) {
        await coursesAPI.update(course.id, payload);
      } else {
        await coursesAPI.create(payload);
      }
      onSaved();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erro ao salvar o curso.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111a2e] rounded-2xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{course ? 'Editar Curso' : 'Novo Curso'}</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="course-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Curso *</label>
            <input id="course-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="course-level" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nível</label>
              <select id="course-level" value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm">
                <option value="">Selecione o nível</option>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="course-duration" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duração (horas)</label>
              <input id="course-duration" type="number" value={form.duration_hours} onChange={e => setForm(f => ({ ...f, duration_hours: parseInt(e.target.value) || 0 }))} className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>
          </div>
          <div>
            <label htmlFor="course-price" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mensalidade (R$)</label>
            <input id="course-price" type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
          </div>
          <div>
            <label htmlFor="course-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
            <textarea id="course-description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}