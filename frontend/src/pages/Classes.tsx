import { useState, useEffect } from 'react';
import { classesAPI, coursesAPI, teachersAPI } from '../services/api';
import type { ClassGroup } from '../types';
import { Plus, Edit, Trash2, Users, Clock, MapPin } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Classes() {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editClass, setEditClass] = useState<ClassGroup | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    classesAPI.list().then(({ data }) => setClasses(data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await classesAPI.delete(id);
      setDeleteConfirm(null);
      load();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erro ao excluir a turma.');
      setDeleteConfirm(null);
    }
  };

  const weekdayColors: Record<string, string> = {
    'Segunda': 'bg-blue-100 text-blue-700', 'Terça': 'bg-green-100 text-green-700',
    'Quarta': 'bg-yellow-100 text-yellow-700', 'Quinta': 'bg-purple-100 text-purple-700',
    'Sexta': 'bg-pink-100 text-pink-700', 'Sábado': 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Turmas</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{classes.length} turma(s) ativa(s)</p>
        </div>
        <button onClick={() => { setEditClass(null); setShowModal(true); }} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova Turma
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-[3px] border-primary-600/20 border-t-primary-600 dark:border-primary-400/20 dark:border-t-primary-400" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(c => (
            <div key={c.id} className="card-surface p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{c.name}</h3>
                  <p className="text-sm text-slate-500">{c.course_name || `Curso #${c.course_id}`}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditClass(c); setShowModal(true); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg"><Edit className="w-4 h-4 text-slate-500" /></button>
                  <button onClick={() => setDeleteConfirm(c.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Users className="w-4 h-4" />
                  <span>Prof: {c.teacher_name || `#${c.teacher_id}`}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <MapPin className="w-4 h-4" />
                  <span>{c.room || 'Sem sala'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>{c.start_time} - {c.end_time}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-3">
                {(c.weekdays || '').split(',').map((d, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-medium ${weekdayColors[d.trim()] || 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>{d.trim()}</span>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${Math.min((c.current_count / c.max_capacity) * 100, 100)}%` }} />
                </div>
                <span className="text-xs text-slate-500 ml-2 whitespace-nowrap">{c.current_count}/{c.max_capacity}</span>
              </div>
            </div>
          ))}
          {classes.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400">Nenhuma turma cadastrada</div>
          )}
        </div>
      )}

      {showModal && <ClassModal classGroup={editClass} onClose={() => { setShowModal(false); setEditClass(null); }} onSaved={() => { setShowModal(false); setEditClass(null); load(); }} />}
      {deleteConfirm !== null && (
        <ConfirmDialog
          open
          title="Excluir turma"
          message="Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita."
          confirmLabel="Sim, excluir"
          onConfirm={() => { handleDelete(deleteConfirm); setDeleteConfirm(null); }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

function ClassModal({ classGroup, onClose, onSaved }: { classGroup: ClassGroup | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: classGroup?.name || '', course_id: classGroup?.course_id || 0, teacher_id: classGroup?.teacher_id || 0,
    room: classGroup?.room || '', weekdays: classGroup?.weekdays || '',
    start_time: classGroup?.start_time || '08:00', end_time: classGroup?.end_time || '09:00',
    max_capacity: classGroup?.max_capacity || 20, level: classGroup?.level || '', unit: classGroup?.unit || 'Matriz'
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>((classGroup?.weekdays || '').split(',').map(d => d.trim()).filter(Boolean));

  useEffect(() => {
    coursesAPI.list().then(({ data }) => setCourses(data || []));
    teachersAPI.list().then(({ data }) => setTeachers(data || []));
  }, []);

  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const toggleDay = (day: string) => {
    const newDays = selectedDays.includes(day) ? selectedDays.filter(d => d !== day) : [...selectedDays, day];
    setSelectedDays(newDays);
    setForm(f => ({ ...f, weekdays: newDays.join(', ') }));
  };

  const handleSave = async () => {
    if (!form.name || !form.course_id || !form.teacher_id) { alert('Preencha nome, curso e professor.'); return; }
    setSaving(true);
    try {
      if (classGroup) {
        await classesAPI.update(classGroup.id, form);
      } else {
        await classesAPI.create(form);
      }
      onSaved();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erro ao salvar a turma.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111a2e] rounded-2xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{classGroup ? 'Editar Turma' : 'Nova Turma'}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Turma *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Curso *</label>
              <select value={form.course_id} onChange={e => {
                const cid = parseInt(e.target.value) || 0;
                const course = courses.find(c => c.id === cid);
                setForm(f => ({ ...f, course_id: cid, level: course?.level || f.level }));
              }}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm">
                <option value={0}>Selecione o curso</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Professor *</label>
              <select value={form.teacher_id} onChange={e => setForm(f => ({ ...f, teacher_id: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm">
                <option value={0}>Selecione o professor</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nível *</label>
              <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm">
                <option value="">Selecione o nível</option>
                {['Básico', 'Intermediário', 'Avançado'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sala</label>
              <input value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dias da Semana</label>
            <div className="flex flex-wrap gap-2">
              {days.map(d => (
                <button key={d} type="button" onClick={() => toggleDay(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedDays.includes(d) ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Início</label>
              <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fim</label>
              <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Capacidade</label>
              <input type="number" value={form.max_capacity} onChange={e => setForm(f => ({ ...f, max_capacity: parseInt(e.target.value) || 20 }))} className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.name || !form.course_id || !form.teacher_id || !form.level} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
