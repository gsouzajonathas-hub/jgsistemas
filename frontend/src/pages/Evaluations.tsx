import { useState, useEffect, useRef } from 'react';
import { evaluationsAPI, enrollmentsAPI, classesAPI, weightConfigAPI } from '../services/api';
import type { Evaluation } from '../types';
import { Plus, Trash2, Award, CheckCircle2, Users, ChevronRight, X } from 'lucide-react';
import { formatDate } from '../utils/format';

const typeLabels: Record<string, string> = { prova: 'Prova', trabalho: 'Trabalho', speaking: 'Speaking', listening: 'Listening', reading: 'Reading', writing: 'Writing' };
const typeColors: Record<string, string> = { prova: 'bg-red-100 text-red-700', trabalho: 'bg-blue-100 text-blue-700', speaking: 'bg-green-100 text-green-700', listening: 'bg-yellow-100 text-yellow-700', reading: 'bg-purple-100 text-purple-700', writing: 'bg-indigo-100 text-indigo-700' };

interface ClassEvalGroup {
  id: number;
  name: string;
  items: Evaluation[];
}

export default function Evaluations() {
  const [evals, setEvals] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassEvalGroup | null>(null);

  const load = () => {
    setLoading(true);
    evaluationsAPI.list().then(({ data }) => setEvals(data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta avaliação?')) return;
    await evaluationsAPI.delete(id);
    load();
  };

  const groups = evals.reduce<Record<number, ClassEvalGroup>>((acc, e) => {
    const gid = e.class_group_id;
    if (!acc[gid]) acc[gid] = { id: gid, name: e.class_group_name || `Turma #${gid}`, items: [] };
    acc[gid].items.push(e);
    return acc;
  }, {});
  const classGroups = Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Avaliações</h1>
          <p className="text-slate-500 text-sm">{classGroups.length} turma(s) com avaliações</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova Avaliação
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-[3px] border-primary-600/20 border-t-primary-600 dark:border-primary-400/20 dark:border-t-primary-400" /></div>
      ) : classGroups.length === 0 ? (
        <div className="card-surface flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
            <Award className="w-7 h-7 text-primary-600 dark:text-primary-300" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Nenhuma avaliação cadastrada</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-5">Crie uma avaliação para começar a lançar as notas</p>
          <button onClick={() => setShowModal(true)} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nova Avaliação
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classGroups.map(g => {
            const tw = g.items.reduce((s, e) => s + e.weight, 0);
            const avg = tw ? Math.round(g.items.reduce((s, e) => s + ((e.score / e.max_score) * 100 * e.weight), 0) / tw) : 0;
            const studentCount = new Set(g.items.map(e => e.student_id)).size;
            const avgColor = avg >= 70 ? 'bg-green-500' : avg >= 50 ? 'bg-yellow-500' : 'bg-red-500';
            const avgText = avg >= 70 ? 'text-green-600' : avg >= 50 ? 'text-yellow-600' : 'text-red-600';
            return (
              <button key={g.id} onClick={() => setSelectedClass(g)}
                className="card-surface p-5 text-left hover:shadow-cardHover hover:border-primary-300 dark:hover:border-primary-700 transition-all group">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-600 to-violet-500 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300">{g.items.length} nota(s)</span>
                </div>
                <h3 className="mt-4 font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">{g.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{studentCount} aluno(s) avaliado(s)</p>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Média</span>
                    <span className={`text-sm font-semibold ${avgText}`}>{avg}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2">
                    <div className={`h-2 rounded-full ${avgColor}`} style={{ width: `${avg}%` }} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-300">
                  Ver notas <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showModal && <EvalModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
      {selectedClass && (
        <EvalClassModal title={selectedClass.name} items={selectedClass.items} onClose={() => setSelectedClass(null)} onDelete={handleDelete} />
      )}
    </div>
  );
}

function EvalTable({ items, onDelete, labels, colors }: { items: Evaluation[]; onDelete: (id: number) => void; labels?: Record<string, string>; colors?: Record<string, string> }) {
  return (
    <table className="w-full">
      <thead className="bg-slate-50 dark:bg-white/5">
        <tr>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tipo</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Título</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Aluno</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Data</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Nota</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Situação</th>
          <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ações</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
        {items.map(e => {
          const pct = (e.score / e.max_score) * 100;
          const status = pct >= 70 ? 'Aprovado' : pct >= 50 ? 'Recuperação' : 'Reprovado';
          const stColor = pct >= 70 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600';
          return (
            <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
              <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${(colors && colors[e.eval_type]) || typeColors[e.eval_type] || 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>{(labels && labels[e.eval_type]) || typeLabels[e.eval_type] || e.eval_type}</span></td>
              <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{e.title}</td>
              <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{e.student_name || `Aluno #${e.student_id}`}</td>
              <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{formatDate(e.date)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-slate-200 dark:bg-white/10 rounded-full h-2">
                    <div className={`h-2 rounded-full ${pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{e.score.toFixed(1)}</span>
                </div>
              </td>
              <td className="px-4 py-3"><span className={`text-sm font-medium ${stColor}`}>{status}</span></td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => onDelete(e.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
              </td>
            </tr>
          );
        })}
        {items.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-slate-400">Nenhuma avaliação nesta turma</td></tr>}
      </tbody>
    </table>
  );
}

function EvalClassModal({ title, items, onClose, onDelete }: { title: string; items: Evaluation[]; onClose: () => void; onDelete: (id: number) => void }) {
  const classId = items[0]?.class_group_id;
  const [configMap, setConfigMap] = useState<Record<string, { label: string; weight: number; max_score: number }>>({});

  useEffect(() => {
    if (!classId) return;
    weightConfigAPI.list(classId).then(({ data }) => {
      const map: Record<string, { label: string; weight: number; max_score: number }> = {};
      (data || []).forEach((c: any) => { map[c.eval_type] = { label: c.label, weight: c.weight, max_score: c.max_score }; });
      setConfigMap(map);
    });
  }, [classId]);

  const labels: Record<string, string> = { ...typeLabels };
  const palette = ['bg-red-100 text-red-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-yellow-100 text-yellow-700', 'bg-purple-100 text-purple-700', 'bg-indigo-100 text-indigo-700'];
  const colors: Record<string, string> = { ...typeColors };
  Object.entries(configMap).forEach(([evalType, c], i) => {
    labels[evalType] = c.label;
    colors[evalType] = palette[i % palette.length];
  });

  const studentMap: Record<number, { name: string; num: number; den: number }> = {};
  items.forEach(e => {
    if (!studentMap[e.student_id]) studentMap[e.student_id] = { name: e.student_name || `Aluno #${e.student_id}`, num: 0, den: 0 };
    studentMap[e.student_id].num += (e.max_score ? e.score / e.max_score : 0) * e.weight;
    studentMap[e.student_id].den += e.weight;
  });
  const studentList = Object.values(studentMap).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#111a2e] rounded-2xl w-full max-w-4xl overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-600 to-violet-500 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">{title}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{items.length} avaliação(ões)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-slate-500 dark:text-slate-400" /></button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          {studentList.length > 0 && (
            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">Média ponderada por aluno</h3>
              <div className="flex flex-wrap gap-2">
                {studentList.map((s, i) => {
                  const pct = s.den ? Math.round((s.num / s.den) * 100) : 0;
                  const color = pct >= 70 ? 'bg-green-100 text-green-700' : pct >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
                  return (
                    <div key={`${i}-${s.name}`} className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-white/5 rounded-lg">
                      <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-300 text-[10px] font-bold">{s.name.charAt(0)}</span>
                      <span className="text-sm text-slate-700 dark:text-slate-300">{s.name}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <EvalTable items={items} onDelete={onDelete} labels={labels} colors={colors} />
        </div>
      </div>
    </div>
  );
}

function EvalModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<number, string>>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [configMap, setConfigMap] = useState<Record<string, { label: string; weight: number; max_score: number }>>({});
  const [form, setForm] = useState({
    class_group_id: 0, eval_type: 'prova', title: '',
    date: new Date().toISOString().split('T')[0], max_score: 10, weight: 1, notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ count: number } | null>(null);
  const scoreRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    classesAPI.list().then(({ data }) => setClasses(data || []));
  }, []);

  useEffect(() => {
    if (!form.class_group_id) { setClassStudents([]); setScores({}); setConfigMap({}); return; }
    setLoadingStudents(true);
    enrollmentsAPI.list({ class_group_id: form.class_group_id, limit: 500 })
      .then(({ data }) => {
        const seen = new Set<number>();
        const students = (data.enrollments || [])
          .filter((e: any) => { if (seen.has(e.student_id)) return false; seen.add(e.student_id); return true; })
          .map((e: any) => ({
            id: e.student_id,
            name: e.student_name || `Aluno #${e.student_id}`
          }));
        setClassStudents(students);
        setScores({});
      })
      .finally(() => setLoadingStudents(false));
  }, [form.class_group_id]);

  useEffect(() => {
    if (!form.class_group_id) { setConfigMap({}); return; }
    weightConfigAPI.list(form.class_group_id).then(({ data }) => {
      const map: Record<string, { label: string; weight: number; max_score: number }> = {};
      (data || []).forEach((c: any) => { map[c.eval_type] = { label: c.label, weight: c.weight, max_score: c.max_score }; });
      setConfigMap(map);
      const keys = Object.keys(map);
      if (keys.length) {
        const first = keys[0];
        setForm(f => ({ ...f, eval_type: first, weight: map[first].weight, max_score: map[first].max_score }));
      }
    });
  }, [form.class_group_id]);

  const tipoOptions = Object.keys(configMap).length
    ? Object.entries(configMap).map(([k, v]) => ({ value: k, label: v.label }))
    : ['prova', 'trabalho', 'speaking', 'listening', 'reading', 'writing'].map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }));

  useEffect(() => {
    if (classStudents.length > 0) {
      scoreRefs.current[classStudents[0].id]?.focus();
    }
  }, [classStudents]);

  const focusNext = (id: number) => {
    const idx = classStudents.findIndex(s => s.id === id);
    const next = classStudents[idx + 1];
    if (next) scoreRefs.current[next.id]?.focus();
  };

  const filledCount = classStudents.filter(s => (scores[s.id] || '').trim() !== '').length;

  const handleSave = async () => {
    if (!form.class_group_id || !form.title) { alert('Preencha todos os campos obrigatórios'); return; }
    const items = classStudents
      .filter(s => (scores[s.id] || '').trim() !== '')
      .map(s => ({ student_id: s.id, score: parseFloat(scores[s.id]) || 0 }));
    if (items.length === 0) { alert('Preencha pelo menos uma nota'); return; }
    setSaving(true);
    try {
      await evaluationsAPI.bulk({ ...form, scores: items });
      setSaved({ count: items.length });
    } catch { alert('Erro ao salvar'); } finally { setSaving(false); }
  };

  const handleNew = () => {
    setForm(f => ({ ...f, title: '', notes: '', eval_type: 'prova' }));
    setScores({});
    setSaved(null);
  };

  const savedClassName = classes.find(c => c.id === form.class_group_id)?.name || '';

  if (saved) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#111a2e] rounded-2xl w-full max-w-sm p-6 text-center animate-scale-in">
          <div className="w-14 h-14 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Avaliação registrada!</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{saved.count} nota(s) lançada(s)</p>
          <div className="mt-4 p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
            <p className="text-xs uppercase text-slate-400 dark:text-slate-500 font-semibold mb-1">Turma</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{savedClassName}</p>
          </div>
          <div className="flex justify-center gap-3 mt-6">
            <button onClick={handleNew} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-sm font-medium">Lançar outra avaliação</button>
            <button onClick={onSaved} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium">OK</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111a2e] rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Nova Avaliação</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Turma *</label>
            <select value={form.class_group_id} onChange={e => setForm(f => ({ ...f, class_group_id: parseInt(e.target.value) }))}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm">
              <option value={0}>Selecione a turma</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo *</label>
              <select value={form.eval_type} onChange={e => {
                const t = e.target.value;
                const cfg = configMap[t];
                setForm(f => cfg ? { ...f, eval_type: t, weight: cfg.weight, max_score: cfg.max_score } : { ...f, eval_type: t });
              }}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm">
                {tipoOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Máximo</label>
              <input type="number" step="0.1" value={form.max_score} onChange={e => setForm(f => ({ ...f, max_score: parseFloat(e.target.value) || 10 }))}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Peso</label>
              <input type="number" step="0.1" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: parseFloat(e.target.value) || 1 }))}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Alunos da turma</h3>
              {classStudents.length > 0 && (
                <span className="text-xs text-slate-500 dark:text-slate-400">{filledCount} de {classStudents.length} nota(s) preenchida(s)</span>
              )}
            </div>
            {!form.class_group_id ? (
              <div className="text-center py-8 text-sm text-slate-400 bg-slate-50 dark:bg-white/5 rounded-lg">Selecione uma turma para lançar as notas</div>
            ) : loadingStudents ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-[3px] border-primary-600/20 border-t-primary-600" /></div>
            ) : classStudents.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400 bg-slate-50 dark:bg-white/5 rounded-lg">Nenhum aluno matriculado nesta turma</div>
            ) : (
              <div className="border border-slate-200 dark:border-white/10 rounded-xl max-h-64 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-white/5 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Aluno</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Nota / {form.max_score}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {classStudents.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-primary-600 dark:text-primary-300 text-xs font-bold">{s.name.charAt(0)}</span>
                            </div>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input type="number" step="0.1" min={0} max={form.max_score} placeholder="—"
                            ref={el => { scoreRefs.current[s.id] = el; }}
                            value={scores[s.id] ?? ''}
                            onChange={e => setScores(sc => ({ ...sc, [s.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); focusNext(s.id); } }}
                            className="no-spinner w-24 px-3 py-1.5 text-right border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar Notas'}
          </button>
        </div>
      </div>
    </div>
  );
}
