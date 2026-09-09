import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import { Download, FileText, Table, Users, AlertTriangle, BookOpen, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '../utils/format';

export default function Reports() {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState('');

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    gray: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600',
  };

  const reportTypes = [
    { id: 'alunos', title: 'Alunos Ativos', description: 'Lista completa de todos os alunos ativos no sistema', icon: Users, color: 'blue' },
    { id: 'inadimplentes', title: 'Inadimplentes', description: 'Alunos com mensalidades vencidas', icon: AlertTriangle, color: 'red' },
    { id: 'matriculas', title: 'Matrículas', description: 'Todas as matrículas realizadas', icon: BookOpen, color: 'purple' },
    { id: 'financeiro', title: 'Financeiro', description: 'Resumo financeiro do período', icon: DollarSign, color: 'yellow' },

  ];

  const fetchReport = async (id: string) => {
    if (activeReport === id) {
      setActiveReport(null);
      setReportData(null);
      return;
    }
    setActiveReport(id);
    setLoading(true);
    setReportData(null);
    try {
      let response;
      switch (id) {
        case 'alunos': response = await reportsAPI.activeStudents(); break;
        case 'inadimplentes': response = await reportsAPI.overdue(); break;
        case 'matriculas': response = await reportsAPI.enrollments(); break;
        case 'financeiro': response = await reportsAPI.financial(); break;

        default: response = { data: [] };
      }
      setReportData(response.data);
    } catch {
      alert('Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportId: string, format: string) => {
    setDownloading(reportId + format);
    try {
      let response;
      if (reportId === 'alunos') {
        response = format === 'pdf' ? await reportsAPI.studentsPDF() : await reportsAPI.studentsExcel();
      } else if (reportId === 'inadimplentes') {
        response = format === 'pdf' ? await reportsAPI.overduePDF() : await reportsAPI.overdueExcel();
      } else {
        setDownloading('');
        return;
      }
      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportId}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erro ao baixar relatório');
    } finally {
      setDownloading('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Relatórios</h1>
        <p className="text-slate-500 text-sm">Clique em um relatório para visualizar os dados</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map(report => {
          const isActive = activeReport === report.id;
          return (
            <div key={report.id} className={`bg-white dark:bg-[#111a2e] rounded-xl border transition-all ${isActive ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-900/50 shadow-lg' : 'border-slate-200 dark:border-white/10 hover:shadow-lg'} `}>
              <div className="p-6 cursor-pointer" onClick={() => fetchReport(report.id)}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[report.color] || colorMap.gray}`}>
                    <report.icon className="w-5 h-5" />
                  </div>
                  {isActive ? <ChevronLeft className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{report.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{report.description}</p>
              </div>

              {isActive && (
                <div className="px-6 pb-6">
                  <div className="flex gap-2 mb-4">
                    {(report.id === 'alunos' || report.id === 'inadimplentes') && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownload(report.id, 'pdf'); }}
                          disabled={downloading === report.id + 'pdf'}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          <FileText className="w-4 h-4" />
                          {downloading === report.id + 'pdf' ? 'Gerando...' : 'PDF'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownload(report.id, 'xlsx'); }}
                          disabled={downloading === report.id + 'xlsx'}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          <Table className="w-4 h-4" />
                          {downloading === report.id + 'xlsx' ? 'Gerando...' : 'Excel'}
                        </button>
                      </>
                    )}
                  </div>

                  {loading && (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-primary-600/20 border-t-primary-600 dark:border-primary-400/20 dark:border-t-primary-400" />
                    </div>
                  )}

                  {!loading && reportData && (
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      {report.id === 'alunos' && <ActiveStudentsTable data={reportData} />}
                      {report.id === 'inadimplentes' && <OverdueTable data={reportData} />}
                      {report.id === 'matriculas' && <EnrollmentsTable data={reportData} />}
                      {report.id === 'financeiro' && <FinancialSummary data={reportData} />}

                    </div>
                  )}

                  {!loading && reportData && (
                    <p className="text-xs text-slate-400 mt-3 text-right">{Array.isArray(reportData) ? reportData.length : 0} registro(s)</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActiveStudentsTable({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <p className="text-center text-slate-400 py-4">Nenhum aluno ativo encontrado</p>;
  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 dark:bg-white/5 sticky top-0">
        <tr>
          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Nº</th>
          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Nome</th>
          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">CPF</th>
          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Telefone</th>
          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Nivel</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
        {data.map((s: any, idx: number) => (
          <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
            <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
            <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{s.full_name}</td>
            <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{s.cpf || '-'}</td>
            <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{s.phone || '-'}</td>
            <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{s.english_level || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function OverdueTable({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <p className="text-center text-slate-400 py-4">Nenhum inadimplente encontrado</p>;
  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 dark:bg-white/5 sticky top-0">
        <tr>
          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Nº</th>
          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Aluno</th>
          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Descricao</th>
          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Valor</th>
          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Vencimento</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
        {data.map((i: any, idx: number) => (
          <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
            <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
            <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{i.student_name}</td>
            <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{i.description}</td>
            <td className="px-3 py-2 text-red-600 dark:text-red-400 font-medium">R$ {i.amount?.toFixed(2)}</td>
            <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{formatDate(i.due_date)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EnrollmentsTable({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <p className="text-center text-slate-400 py-4">Nenhuma matricula encontrada</p>;
  const statusColors: Record<string, string> = { 'Ativa': 'bg-green-100 text-green-700', 'Cancelada': 'bg-red-100 text-red-700', 'Concluida': 'bg-blue-100 text-blue-700', 'Transferida': 'bg-yellow-100 text-yellow-700' };
  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 dark:bg-white/5 sticky top-0">
        <tr>
          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Nº</th>
          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Aluno</th>
          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Turma</th>
          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Data</th>
          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
        {data.map((e: any, idx: number) => (
          <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
            <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
            <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{e.student_name}</td>
            <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{e.class_name}</td>
            <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{formatDate(e.enrollment_date)}</td>
            <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[e.status] || 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>{e.status}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FinancialSummary({ data }: { data: any }) {
  if (!data) return <p className="text-center text-slate-400 py-4">Sem dados financeiros</p>;
  const navigate = useNavigate();
  const items = [
    { label: 'Total Esperado', value: `R$ ${(data.total_expected || 0).toLocaleString('pt-BR')}`, color: 'text-slate-900 dark:text-white' },
    { label: 'Total Recebido', value: `R$ ${(data.total_received || 0).toLocaleString('pt-BR')}`, color: 'text-green-600' },
    { label: 'Total Vencido', value: `R$ ${(data.total_overdue || 0).toLocaleString('pt-BR')}`, color: 'text-red-600' },
    { label: 'Receita Mensal', value: `R$ ${(data.monthly_income || 0).toLocaleString('pt-BR')}`, color: 'text-blue-600' },
    { label: 'Pagamentos Pendentes', value: `${data.count_pending || 0}`, color: 'text-yellow-600' },
    { label: 'Pagamentos Atrasados', value: `${data.count_overdue || 0}`, color: 'text-red-600' },
    { label: 'Pagamentos Realizados', value: `${data.count_paid || 0}`, color: 'text-green-600' },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, idx) => (
          <div key={idx} className="bg-slate-50 dark:bg-white/5 rounded-lg p-3">
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>
      <button onClick={() => navigate('/mensalidades')} className="w-full px-4 py-2.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors text-center">
        Ver Mensalidades Detalhadas →
      </button>
    </div>
  );
}


