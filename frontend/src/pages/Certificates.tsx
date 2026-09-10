import { useState, useEffect } from 'react';
import { certificatesAPI, boletinsAPI } from '../services/api';
import { PageHeader, Button, Badge, Spinner, EmptyState, Modal, Select, Input } from '../components/ui';
import { Download, Award, Search, UserPlus } from 'lucide-react';
import { formatDate } from '../utils/format';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Certificates() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [downloading, setDownloading] = useState<number | null>(null);
  const [issueOpen, setIssueOpen] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [studentId, setStudentId] = useState('');
  const [classOptions, setClassOptions] = useState<any[]>([]);
  const [classGroupId, setClassGroupId] = useState('');
  const [level, setLevel] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const loadCertificates = () => {
    setLoading(true);
    certificatesAPI.list().then(({ data }) => setCertificates(data)).catch(() => alert('Erro ao carregar certificados')).finally(() => setLoading(false));
  };

  useEffect(loadCertificates, []);

  const openIssue = async () => {
    setIssueOpen(true);
    setStudentId('');
    setClassGroupId('');
    setLevel('');
    setClassOptions([]);
    if (students.length === 0) {
      const { data } = await boletinsAPI.students();
      setStudents(data);
    }
  };

  const loadStudentClasses = async (id: string) => {
    if (!id) { setClassOptions([]); setClassGroupId(''); return; }
    setLoadingOptions(true);
    try {
      const { data } = await boletinsAPI.get(parseInt(id));
      const options = (data.classes || [])
        .filter((b: any) => b.eligible && !b.certificate)
        .map((b: any) => ({ id: b.class_group_id, name: `${b.class_name} · ${b.level || 'Sem nível'}` }));
      setClassOptions(options);
    } catch {
      setClassOptions([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleIssue = async () => {
    if (!studentId || !classGroupId) return;
    setIssuing(true);
    try {
      await certificatesAPI.issue({ student_id: parseInt(studentId), class_group_id: parseInt(classGroupId), level });
      setIssueOpen(false);
      loadCertificates();
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erro ao emitir certificado');
    } finally {
      setIssuing(false);
    }
  };

  const handleDownload = async (id: number) => {
    setDownloading(id);
    try {
      const { data } = await certificatesAPI.pdf(id);
      downloadBlob(data, `certificado_${id}.pdf`);
    } catch {
      alert('Erro ao baixar certificado');
    } finally {
      setDownloading(null);
    }
  };

  const filtered = certificates.filter((c: any) =>
    (c.student_name || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificados"
        subtitle="Certificados de conclusão de nível emitidos"
        actions={
          <Button icon={<UserPlus className="w-4 h-4" />} onClick={openIssue}>
            Emitir Certificado
          </Button>
        }
      />

      <div className="card-surface p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por aluno..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Award className="w-10 h-10 text-slate-300 dark:text-slate-600" />}
          title="Nenhum certificado"
          description="Emita um certificado para um aluno que tenha média ≥ 70% e frequência ≥ 75%."
        />
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-white/5">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Registro</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Aluno</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Nível</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Média</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Frequência</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Emissão</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filtered.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3 text-sm font-medium text-primary-600 dark:text-primary-400">{c.control_number}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{c.student_name}</td>
                    <td className="px-4 py-3"><Badge tone="indigo">{c.level}</Badge></td>
                    <td className="px-4 py-3 text-sm text-center text-slate-700 dark:text-slate-200">{c.media}%</td>
                    <td className="px-4 py-3 text-sm text-center text-slate-700 dark:text-slate-200">{c.frequency}%</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(c.issue_date)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Download className="w-4 h-4" />}
                        loading={downloading === c.id}
                        onClick={() => handleDownload(c.id)}
                      >
                        PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 px-4 py-3 text-right">{filtered.length} registro(s)</p>
        </div>
      )}

      <Modal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        title="Emitir Certificado"
        subtitle="Apenas alunos com média ≥ 70% e frequência ≥ 75% aparecem nas opções."
        footer={
          <>
            <Button variant="outline" onClick={() => setIssueOpen(false)}>Cancelar</Button>
            <Button
              icon={<Award className="w-4 h-4" />}
              loading={issuing}
              disabled={!studentId || !classGroupId}
              onClick={handleIssue}
            >
              Emitir
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Aluno" value={studentId} onChange={(e) => { setStudentId(e.target.value); loadStudentClasses(e.target.value); }}>
            <option value="">Selecione...</option>
            {students.map((s: any) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </Select>
          <Select label="Turma / Nível" value={classGroupId} onChange={(e) => setClassGroupId(e.target.value)}>
            <option value="">{loadingOptions ? 'Carregando...' : 'Selecione...'}</option>
            {classOptions.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Input label="Nível (opcional)" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Ex: Básico" />
          {classOptions.length === 0 && studentId && !loadingOptions && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Nenhuma turma elegível encontrada para este aluno (média ≥ 70% e frequência ≥ 75%, sem certificado já emitido).
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
