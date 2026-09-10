import { useState, useEffect } from 'react';
import { enrollmentsAPI, studentsAPI, classesAPI } from '../services/api';
import type { Enrollment } from '../types';
import { Plus, RefreshCw, XCircle, Pause, ArrowRightLeft } from 'lucide-react';
import { formatDate } from '../utils/format';

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const load = () => {
    setLoading(true);
    enrollmentsAPI.list({ status: statusFilter }).then(({ data }) => { setEnrollments(data.enrollments); setTotal(data.total); }).catch(() => { setEnrollments([]); setTotal(0); }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleAction = async (id: number, action: string) => {
    try {
      if (action === 'cancel') await enrollmentsAPI.cancel(id);
      else if (action === 'suspend') await enrollmentsAPI.suspend(id);
      else if (action === 'renew') await enrollmentsAPI.renew(id);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Erro ao executar ação');
    }
  };

  const statusLabels: Record<string, string> = { active: 'Ativa', cancelled: 'Cancelada', suspended: 'Trancada', transferred: 'Transferida', renewed: 'Renovada' };
  const statusColors: Record<string, string> = { active: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700', suspended: 'bg-yellow-100 text-yellow-700', transferred: 'bg-blue-100 text-blue-700', renewed: 'bg-purple-100 text-purple-700' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Matrículas</h1>
          <p className="text-slate-500 text-sm">{total} matrícula(s)</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova Matrícula
        </button>
      </div>

      <div className="flex gap-2">
        {['', 'active', 'cancelled', 'suspended'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'}`}>
            {s ? statusLabels[s] || s : 'Todas'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-[3px] border-primary-600/20 border-t-primary-600 dark:border-primary-400/20 dark:border-t-primary-400" /></div>
      ) : (
        <div className="card-surface overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-white/5">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Aluno</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Data</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {enrollments.map(e => (
                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="px-4 py-3 text-sm text-slate-600">#{e.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{e.student_name || `Aluno #${e.student_id}`}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{formatDate(e.enrollment_date)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[e.status] || 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>
                      {statusLabels[e.status] || e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleAction(e.id, 'renew')} className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" title="Renovar"><RefreshCw className="w-4 h-4 text-green-500" /></button>
                      <button onClick={() => handleAction(e.id, 'suspend')} className="p-1.5 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg" title="Trancar"><Pause className="w-4 h-4 text-yellow-500" /></button>
                      <button onClick={() => handleAction(e.id, 'cancel')} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Cancelar"><XCircle className="w-4 h-4 text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {enrollments.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-slate-400">Nenhuma matrícula encontrada</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <EnrollmentModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}

function EnrollmentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [form, setForm] = useState({ student_id: 0, class_group_id: 0, enrollment_date: new Date().toISOString().split('T')[0], notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    studentsAPI.list({ limit: 100 }).then(({ data }) => setStudents(data.students || []));
    classesAPI.list({ limit: 200 }).then(({ data }) => setClasses(data || [])).catch(() => setClasses([]));
  }, []);

  const handleSave = async () => {
    if (!form.student_id) { setError('Selecione o aluno'); return; }
    if (!form.class_group_id) { setError('Selecione a turma'); return; }
    setSaving(true);
    setError('');
    try {
      await enrollmentsAPI.create({ ...form, class_group_id: Number(form.class_group_id) });
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao matricular. Verifique os dados e tente novamente.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111a2e] rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Nova Matrícula</h2>
        {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm mb-4">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Aluno *</label>
            <select value={form.student_id} onChange={e => setForm(f => ({ ...f, student_id: parseInt(e.target.value) }))}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm">
              <option value={0}>Selecione o aluno</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Turma *</label>
            <select value={form.class_group_id} onChange={e => setForm(f => ({ ...f, class_group_id: parseInt(e.target.value) }))}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm">
              <option value={0}>Selecione a turma</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.current_count || 0}/{c.max_capacity || 0})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data da Matrícula</label>
            <input type="date" value={form.enrollment_date} onChange={e => setForm(f => ({ ...f, enrollment_date: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Matriculando...' : 'Matricular'}
          </button>
        </div>
      </div>
    </div>
  );
}
