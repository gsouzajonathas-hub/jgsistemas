import { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import type { Dashboard as DashboardData } from '../types';
import { Users, UserCheck, AlertTriangle, Clock, Cake, DollarSign, TrendingUp, ArrowUpRight, UserPlus } from 'lucide-react';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, PageHeader } from '../components/ui';
import { formatDate } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsAPI.dashboard().then(({ data }) => { setData(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-[3px] border-primary-600/20 border-t-primary-600 dark:border-primary-400/20 dark:border-t-primary-400" /></div>;
  if (!data) return <div className="text-center text-slate-500 p-8">Erro ao carregar dados</div>;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const cards = [
    { label: 'Total de Alunos', value: data.total_students, icon: Users, from: 'from-blue-500', to: 'to-indigo-500', light: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Matrículas Ativas', value: data.active_enrollments, icon: UserCheck, from: 'from-emerald-500', to: 'to-teal-500', light: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Inadimplentes', value: data.overdue_count, icon: AlertTriangle, from: 'from-red-500', to: 'to-rose-500', light: 'bg-red-50 dark:bg-red-500/10' },
    { label: 'Vencendo em 7 dias', value: data.due_soon_count, icon: Clock, from: 'from-amber-500', to: 'to-orange-500', light: 'bg-amber-50 dark:bg-amber-500/10' },
    { label: 'Receita Mensal', value: `R$ ${(data.monthly_income || 0).toLocaleString('pt-BR')}`, icon: DollarSign, from: 'from-emerald-500', to: 'to-green-500', light: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Aniversariantes', value: data.birthdays.length, icon: Cake, from: 'from-pink-500', to: 'to-rose-500', light: 'bg-pink-50 dark:bg-pink-500/10' },
  ];

  const financialData = [
    { name: 'Recebido', value: data.total_received || 0 },
    { name: 'Pendente', value: (data.total_expected || 0) - (data.total_received || 0) },
  ];

  const COLORS = ['#10b981', '#f59e0b'];

  const chartTooltipStyle = {
    backgroundColor: 'var(--chart-bg, #ffffff)',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: '12px',
    boxShadow: '0 12px 32px -12px rgba(15,23,42,0.3)',
    fontSize: '13px',
    color: 'var(--chart-text, #0f172a)',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={<>{greeting}, <span className="gradient-text">{user?.name.split(' ')[0]}</span></>}
        subtitle="Aqui está a visão geral do seu sistema hoje."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <Card key={card.label} hover className="p-5 animate-fade-in-up" >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">{card.value}</p>
              </div>
              <div className={`${card.light} w-11 h-11 rounded-xl flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 bg-gradient-to-br ${card.from} ${card.to} bg-clip-text text-transparent`} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Atualizado agora</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-500" />
            Financeiro
          </h3>
          {financialData.every(d => d.value === 0) ? (
            <p className="text-slate-400 text-center py-8">Sem dados financeiros</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={financialData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label={({ name, value }) => `R$ ${value.toLocaleString('pt-BR')}`}>
                    {financialData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-sm text-slate-500 dark:text-slate-400">Recebido</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-sm text-slate-500 dark:text-slate-400">Pendente</span></div>
              </div>
            </>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Cake className="w-5 h-5 text-pink-500" />
            Aniversariantes do Mês
          </h3>
          {data.birthdays.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Nenhum aniversariante este mês</p>
          ) : (
            <div className="space-y-1">
              {data.birthdays.map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{b.full_name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{b.full_name}</p>
                    <p className="text-xs text-slate-500">{formatDate(b.birth_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-500" />
          Últimos Alunos Cadastrados
        </h3>
        {data.recent_students.length === 0 ? (
          <p className="text-slate-400 text-center py-8">Nenhum aluno cadastrado</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {data.recent_students.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
                  {s.photo_url ? (
                    <img src={s.photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <span className="text-white text-xs font-bold">{s.full_name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{s.full_name}</p>
                  <p className="text-xs text-slate-500">{s.created_at ? formatDate(s.created_at) : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
