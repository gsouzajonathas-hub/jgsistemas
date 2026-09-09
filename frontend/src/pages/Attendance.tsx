import { useState, useEffect } from 'react';
import { attendanceAPI, classesAPI, studentsAPI, enrollmentsAPI } from '../services/api';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

export default function Attendance() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<number>(0);
  const [students, setStudents] = useState<any[]>([]);
  const [records, setRecords] = useState<Record<number, string>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saved, setSaved] = useState(false);

  useEffect(() => { classesAPI.list().then(({ data }) => setClasses(data)).catch(() => setClasses([])); }, []);

  useEffect(() => {
    if (selectedClass) {
      enrollmentsAPI.list({ class_group_id: selectedClass, status: 'active', limit: 500 })
        .then(({ data }) => {
          const seen = new Set<number>();
          const filtered = (data.enrollments || [])
            .filter((e: any) => { if (seen.has(e.student_id)) return false; seen.add(e.student_id); return true; })
            .map((e: any) => ({ id: e.student_id, full_name: e.student_name || `Aluno #${e.student_id}` }));
          setStudents(filtered);
          const initial: Record<number, string> = {};
          filtered.forEach((s: any) => { initial[s.id] = 'present'; });
          setRecords(initial);
        })
        .catch(() => setStudents([]));
      return;
    }
    studentsAPI.list({ limit: 100 }).then(({ data }) => {
      const filtered = data.students || [];
      setStudents(filtered);
      const initial: Record<number, string> = {};
      filtered.forEach((s: any) => { initial[s.id] = 'present'; });
      setRecords(initial);
    }).catch(() => setStudents([]));
  }, [selectedClass]);

  const setStatus = (studentId: number, status: string) => {
    setRecords(r => ({ ...r, [studentId]: status }));
  };

  const handleSave = async () => {
    if (!selectedClass) return;
    const recs = Object.entries(records).map(([sid, status]) => ({ student_id: parseInt(sid), status, notes: '' }));
    await attendanceAPI.bulk({ class_group_id: selectedClass, date, records: recs });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const statusButtons = [
    { key: 'present', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', label: 'Presente' },
    { key: 'absent', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Falta' },
    { key: 'justified', icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', label: 'Justificada' },
    { key: 'late', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', label: 'Atraso' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Controle de Frequência</h1>
        <p className="text-slate-500 text-sm">Registre a presença dos alunos</p>
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Turma</label>
          <select value={selectedClass} onChange={e => setSelectedClass(parseInt(e.target.value))}
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none">
            <option value={0}>Selecione a turma</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none" />
        </div>
        <button onClick={handleSave} disabled={!selectedClass}
          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50">
          Salvar
        </button>
      </div>

      {saved && <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 rounded-lg text-sm">Frequência salva com sucesso!</div>}

      {selectedClass > 0 && students.length > 0 && (
        <div className="card-surface overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-white/5">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Aluno</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {students.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 text-xs font-bold">{s.full_name.charAt(0)}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{s.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {statusButtons.map(sb => (
                        <button key={sb.key} onClick={() => setStatus(s.id, sb.key)}
                          className={`p-2 rounded-lg transition-all ${records[s.id] === sb.key ? `${sb.bg} ring-2 ring-offset-1 ${sb.color.replace('text-', 'ring-')}` : 'hover:bg-slate-100 dark:hover:bg-white/10'}`}
                          title={sb.label}>
                          <sb.icon className={`w-5 h-5 ${records[s.id] === sb.key ? sb.color : 'text-slate-400'}`} />
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedClass > 0 && students.length === 0 && (
        <div className="text-center py-12 text-slate-400">Nenhum aluno matriculado nesta turma</div>
      )}
    </div>
  );
}
