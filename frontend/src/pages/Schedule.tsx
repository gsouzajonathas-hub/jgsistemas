import { useState, useEffect } from 'react';
import { scheduleAPI } from '../services/api';
import type { CalendarEvent } from '../types';
import { Plus, Trash2, Calendar as CalIcon, GraduationCap, Users, FileText, PartyPopper, Sun } from 'lucide-react';
import { formatDate } from '../utils/format';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Schedule() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [deleteEventId, setDeleteEventId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    const m = currentMonth.getMonth() + 1;
    const y = currentMonth.getFullYear();
    scheduleAPI.list({ month: m, year: y }).then(({ data }) => setEvents(data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [currentMonth]);

  const handleDelete = async (id: number) => {
    try { await scheduleAPI.delete(id); load(); }
    catch (e: any) { alert(e.response?.data?.detail || 'Erro ao excluir evento'); }
  };

  const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
    aula: { icon: GraduationCap, color: 'bg-blue-500', label: 'Aula' },
    reuniao: { icon: Users, color: 'bg-green-500', label: 'Reunião' },
    evento: { icon: PartyPopper, color: 'bg-purple-500', label: 'Evento' },
    prova: { icon: FileText, color: 'bg-red-500', label: 'Prova' },
    feriado: { icon: Sun, color: 'bg-orange-500', label: 'Feriado' },
  };

  const today = new Date();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Agenda</h1>
          <p className="text-slate-500 text-sm">Calendário de eventos</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Evento
        </button>
      </div>

      <div className="card-surface p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-slate-400">&larr;</button>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{monthNames[month]} {year}</h2>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-slate-400">&rarr;</button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const dayEvents = getEventsForDay(day);
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            return (
              <div key={day} className={`min-h-[80px] p-1.5 rounded-lg border ${isToday ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-slate-200 dark:border-white/10'} hover:bg-slate-50 dark:hover:bg-white/5`}>
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary-600 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'}`}>{day}</div>
                {dayEvents.slice(0, 3).map(e => {
                  const config = typeConfig[e.event_type] || typeConfig.aula;
                  return (
                    <div key={e.id} className="flex items-center gap-1 mb-0.5 group">
                      <div className={`w-1.5 h-1.5 rounded-full ${config.color} flex-shrink-0`} />
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{e.title}</span>
                    </div>
                  );
                })}
                {dayEvents.length > 3 && <span className="text-xs text-slate-400">+{dayEvents.length - 3}</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {Object.entries(typeConfig).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.color}`} />
            <span className="text-sm text-slate-500 dark:text-slate-400">{config.label}</span>
          </div>
        ))}
      </div>

      {events.length > 0 && (
        <div className="card-surface p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Próximos Eventos</h3>
          <div className="space-y-2">
            {events.slice(0, 10).map(e => {
              const config = typeConfig[e.event_type] || typeConfig.aula;
              return (
                <div key={e.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${config.color} rounded-lg flex items-center justify-center`}>
                      <config.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{e.title}</p>
                      <p className="text-xs text-slate-500">{formatDate(e.date)} {e.start_time || ''}</p>
                    </div>
                  </div>
                  <button onClick={() => setDeleteEventId(e.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && <EventModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}

      {deleteEventId !== null && (
        <ConfirmDialog
          open
          title="Excluir evento"
          message="Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita."
          confirmLabel="Sim, excluir"
          onConfirm={() => { handleDelete(deleteEventId); setDeleteEventId(null); }}
          onCancel={() => setDeleteEventId(null)}
        />
      )}
    </div>
  );
}

function EventModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: '', event_type: 'aula', date: new Date().toISOString().split('T')[0], start_time: '', end_time: '', description: '', color: '#3B82F6' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title) { alert('Título é obrigatório'); return; }
    setSaving(true);
    try { await scheduleAPI.create(form); onSaved(); } catch { alert('Erro ao salvar'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111a2e] rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Novo Evento</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
              <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm">
                {['aula', 'reuniao', 'evento', 'prova', 'feriado'].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Início</label>
              <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fim</label>
              <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Salvando...' : 'Criar Evento'}
          </button>
        </div>
      </div>
    </div>
  );
}
