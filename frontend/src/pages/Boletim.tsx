import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { boletinsAPI, certificatesAPI, classesAPI } from '../services/api';
import { PageHeader, Select, Button, Badge, Spinner, EmptyState } from '../components/ui';
import { Download, FileSpreadsheet, Award, GraduationCap, Clock, BookOpen, User, Users } from 'lucide-react';
import { formatDate } from '../utils/format';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function situationTone(situation: string): 'green' | 'amber' | 'red' | 'gray' | 'blue' {
  if (situation === 'Aprovado') return 'green';
  if (situation === 'Recuperação') return 'amber';
  if (situation === 'Reprovado por Frequência' || situation === 'Reprovado') return 'red';
  return 'gray';
}

export default function Boletim() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'student' | 'class'>('student');

  const [students, setStudents] = useState<any[]>([]);
  const [studentId, setStudentId] = useState<string>(searchParams.get('student_id') || '');
  const [boletim, setBoletim] = useState<any>(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loading, setLoading] = useState(false);

  const [classes, setClasses] = useState<any[]>([]);
  const [classId, setClassId] = useState<string>('');
  const [classBoletim, setClassBoletim] = useState<any>(null);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingClass, setLoadingClass] = useState(false);

  const [downloading, setDownloading] = useState('');
  const [issuing, setIssuing] = useState<number | null>(null);

  useEffect(() => {
    boletinsAPI.students().then(({ data }) => setStudents(data)).finally(() => setLoadingStudents(false));
    classesAPI.list().then(({ data }) => setClasses(data)).finally(() => setLoadingClasses(false));
  }, []);

  const loadBoletim = useCallback((id: string) => {
    if (!id) { setBoletim(null); return; }
    setLoading(true);
    boletinsAPI.get(parseInt(id))
      .then(({ data }) => setBoletim(data))
      .catch(() => setBoletim(null))
      .finally(() => setLoading(false));
  }, []);

  const loadClassBoletim = useCallback((id: string) => {
    if (!id) { setClassBoletim(null); return; }
    setLoadingClass(true);
    boletinsAPI.turma(parseInt(id))
      .then(({ data }) => setClassBoletim(data))
      .catch(() => setClassBoletim(null))
      .finally(() => setLoadingClass(false));
  }, []);

  useEffect(() => {
    loadBoletim(studentId);
  }, [studentId, loadBoletim]);

  useEffect(() => {
    loadClassBoletim(classId);
  }, [classId, loadClassBoletim]);

  const handleDownload = async (format: 'pdf' | 'excel') => {
    if (!studentId) return;
    setDownloading(format);
    try {
      const response = format === 'pdf'
        ? await boletinsAPI.pdf(parseInt(studentId))
        : await boletinsAPI.excel(parseInt(studentId));
      downloadBlob(response.data, format === 'pdf' ? 'boletim.pdf' : 'boletim.xlsx');
    } catch {
      alert('Erro ao baixar boletim');
    } finally {
      setDownloading('');
    }
  };

  const handleClassDownload = async (format: 'pdf' | 'excel') => {
    if (!classId) return;
    setDownloading(`class-${format}`);
    try {
      const response = format === 'pdf'
        ? await boletinsAPI.turmaPdf(parseInt(classId))
        : await boletinsAPI.turmaExcel(parseInt(classId));
      downloadBlob(response.data, format === 'pdf' ? 'mapa-de-notas.pdf' : 'mapa-de-notas.xlsx');
    } catch {
      alert('Erro ao baixar mapa de notas');
    } finally {
      setDownloading('');
    }
  };

  const handleIssue = async (classGroupId: number, level: string) => {
    if (!studentId) return;
    setIssuing(classGroupId);
    try {
      await certificatesAPI.issue({ student_id: parseInt(studentId), class_group_id: classGroupId, level });
      loadBoletim(studentId);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erro ao emitir certificado');
    } finally {
      setIssuing(null);
    }
  };

  const segBtn = (m: 'student' | 'class') =>
    `px-3 py-1.5 text-sm font-medium ${
      mode === m
        ? 'bg-primary-600 text-white'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
    }`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Boletim"
        subtitle="Notas e frequência vinculadas por nível para acompanhamento do aluno"
        actions={
          mode === 'student' ? (
            <>
              <Button
                variant="outline"
                icon={<FileSpreadsheet className="w-4 h-4" />}
                disabled={!boletim || downloading === 'excel'}
                onClick={() => handleDownload('excel')}
              >
                {downloading === 'excel' ? 'Gerando...' : 'Excel'}
              </Button>
              <Button
                variant="outline"
                icon={<Download className="w-4 h-4" />}
                disabled={!boletim || downloading === 'pdf'}
                onClick={() => handleDownload('pdf')}
              >
                {downloading === 'pdf' ? 'Gerando...' : 'PDF'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                icon={<FileSpreadsheet className="w-4 h-4" />}
                disabled={!classBoletim || downloading === 'class-excel'}
                onClick={() => handleClassDownload('excel')}
              >
                {downloading === 'class-excel' ? 'Gerando...' : 'Excel'}
              </Button>
              <Button
                variant="outline"
                icon={<Download className="w-4 h-4" />}
                disabled={!classBoletim || downloading === 'class-pdf'}
                onClick={() => handleClassDownload('pdf')}
              >
                {downloading === 'class-pdf' ? 'Gerando...' : 'Mapa PDF'}
              </Button>
            </>
          )
        }
      />

      <div className="card-surface p-4 flex items-center gap-4 flex-wrap">
        <div className="flex rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden">
          <button type="button" className={segBtn('student')} onClick={() => setMode('student')}>
            Por Aluno
          </button>
          <button type="button" className={segBtn('class')} onClick={() => setMode('class')}>
            Por Turma
          </button>
        </div>

        {mode === 'student' ? (
          <div className="flex-1 min-w-[240px]">
            <Select label="Aluno" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Selecione um aluno...</option>
              {students.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}{s.english_level ? ` (${s.english_level})` : ''}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <div className="flex-1 min-w-[240px]">
            <Select label="Turma" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Selecione uma turma...</option>
              {classes.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.level ? ` (${c.level})` : ''}
                </option>
              ))}
            </Select>
          </div>
        )}

        {mode === 'student' && boletim && (
          <div className="flex items-center gap-3 pt-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <User className="w-4 h-4" />
              {boletim.student.full_name}
            </div>
            <Badge tone="indigo">
              <GraduationCap className="w-3.5 h-3.5" />
              {boletim.student.english_level || 'Sem nível'}
            </Badge>
            <Badge tone="blue">
              <Award className="w-3.5 h-3.5" />
              Média Geral: {boletim.overall_average}%
            </Badge>
          </div>
        )}

        {mode === 'class' && classBoletim && (
          <div className="flex items-center gap-3 pt-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users className="w-4 h-4" />
              {classBoletim.class_group?.name}
            </div>
            <Badge tone="indigo">
              <GraduationCap className="w-3.5 h-3.5" />
              {classBoletim.class_group?.level || 'Sem nível'}
            </Badge>
            <Badge tone="blue">
              <Users className="w-3.5 h-3.5" />
              {classBoletim.students?.length} alunos
            </Badge>
          </div>
        )}
      </div>

      {loadingStudents && mode === 'student' && (
        <div className="flex justify-center py-12"><Spinner /></div>
      )}
      {loadingClasses && mode === 'class' && (
        <div className="flex justify-center py-12"><Spinner /></div>
      )}

      {mode === 'student' && !loadingStudents && !studentId && (
        <EmptyState
          icon={<GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-600" />}
          title="Selecione um aluno"
          description="Escolha um aluno acima para visualizar o boletim com notas e frequência."
        />
      )}

      {mode === 'class' && !loadingClasses && !classId && (
        <EmptyState
          icon={<Users className="w-10 h-10 text-slate-300 dark:text-slate-600" />}
          title="Selecione uma turma"
          description="Escolha uma turma acima para visualizar o mapa de notas dos alunos."
        />
      )}

      {loading && mode === 'student' && (
        <div className="flex justify-center py-12"><Spinner /></div>
      )}
      {loadingClass && mode === 'class' && (
        <div className="flex justify-center py-12"><Spinner /></div>
      )}

      {mode === 'class' && !loadingClass && classBoletim && classBoletim.students?.length === 0 && (
        <EmptyState
          icon={<Users className="w-10 h-10 text-slate-300 dark:text-slate-600" />}
          title="Sem alunos na turma"
          description="Nenhum aluno com matrícula ativa ou concluída nesta turma."
        />
      )}

      {mode === 'class' && !loadingClass && classBoletim && classBoletim.students?.length > 0 && (
        <div className="card-surface p-5">
          <div className="flex flex-wrap gap-x-5 gap-y-1 mb-5 text-sm text-slate-500">
            {classBoletim.class_group?.course_name && (
              <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{classBoletim.class_group.course_name}</span>
            )}
            {classBoletim.class_group?.teacher_name && (
              <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" />{classBoletim.class_group.teacher_name}</span>
            )}
            {classBoletim.class_group?.weekdays && (
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{classBoletim.class_group.weekdays} {classBoletim.class_group.start_time}-{classBoletim.class_group.end_time}</span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-white/5">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Aluno</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Avaliações</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Média</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Frequência</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {classBoletim.students.map((row: any) => (
                  <tr key={row.student?.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{row.student?.full_name}</p>
                      <p className="text-xs text-slate-400">{row.student?.email || row.student?.phone || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600">{row.evaluations.length}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900 dark:text-white">{row.average}%</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600">{row.frequency}%</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge tone={situationTone(row.situation)}>{row.situation}</Badge>
                        {row.certificate && (
                          <Badge tone="purple">Certificado: {row.certificate.control_number}</Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mode === 'student' && !loading && boletim && boletim.classes.length === 0 && (
        <EmptyState
          icon={<BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600" />}
          title="Sem matrículas ativas"
          description="Este aluno não possui matrículas ativas ou concluídas para gerar boletim."
        />
      )}

      {mode === 'student' && !loading && boletim && boletim.classes.map((block: any) => (
        <div key={block.class_group_id} className="card-surface overflow-hidden">
          <div className="p-5 border-b border-slate-200/70 dark:border-white/10">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{block.class_name}</h3>
                  {block.level && <Badge tone="indigo">{block.level}</Badge>}
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1 text-sm text-slate-500">
                  {block.course_name && (
                    <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{block.course_name}</span>
                  )}
                  {block.teacher_name && (
                    <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" />{block.teacher_name}</span>
                  )}
                  {block.weekdays && (
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{block.weekdays} {block.start_time}-{block.end_time}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={situationTone(block.situation)}>{block.situation}</Badge>
                {block.certificate && (
                  <Badge tone="purple">Certificado: {block.certificate.control_number}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-5">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{block.average}%</p>
                <p className="text-xs text-slate-500">Média ({block.status_by_grade})</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{block.frequency}%</p>
                <p className="text-xs text-slate-500">Frequência</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{block.present}</p>
                <p className="text-xs text-slate-500">Presenças</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{block.absent}</p>
                <p className="text-xs text-slate-500">Faltas</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-white/5">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Data</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Avaliação</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Peso</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {block.evaluations.map((ev: any) => (
                    <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                      <td className="px-4 py-2.5 text-sm text-slate-600">{formatDate(ev.date)}</td>
                      <td className="px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white">{ev.title}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-500">{ev.weight}</td>
                      <td className="px-4 py-2.5 text-sm font-medium text-right">{ev.score.toFixed(1)}</td>
                    </tr>
                  ))}
                  {block.evaluations.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-6 text-slate-400 text-sm">Nenhuma avaliação lançada</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {block.eligible && !block.certificate && (
              <div className="mt-5 flex items-center justify-between gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Apto a receber o Certificado de Conclusão</p>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-500/80">Média ≥ 70% e frequência ≥ 75% (média {block.average}% · frequência {block.frequency}%)</p>
                </div>
                <Button
                  size="sm"
                  icon={<Award className="w-4 h-4" />}
                  loading={issuing === block.class_group_id}
                  onClick={() => handleIssue(block.class_group_id, block.level)}
                >
                  Emitir Certificado
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
