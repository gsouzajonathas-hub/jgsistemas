import { useState, useEffect, useRef } from 'react';
import { financialAPI, studentsAPI, materialsAPI } from '../services/api';
import { useSettings } from '../hooks/useSettings';
import type { Installment, TeachingMaterial, MaterialSale } from '../types';
import { Plus, DollarSign, CheckCircle, Clock, AlertTriangle, CreditCard, Package, ShoppingCart, Trash2, Edit, BookOpen, FileText } from 'lucide-react';
import { formatDate } from '../utils/format';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Financial() {
  const [tab, setTab] = useState<'installments' | 'materials' | 'sales'>('installments');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Financeiro</h1>
      </div>

      <div className="flex gap-1 border-b border-slate-200 dark:border-white/10">
        {[
          { key: 'installments', label: 'Mensalidades', icon: CreditCard },
          { key: 'materials', label: 'Materiais Didáticos', icon: BookOpen },
          { key: 'sales', label: 'Vendas de Materiais', icon: ShoppingCart },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'installments' && <InstallmentsTab />}
      {tab === 'materials' && <MaterialsTab />}
      {tab === 'sales' && <SalesTab />}
    </div>
  );
}

function InstallmentsTab() {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState<'installment' | 'plan' | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [dashboard, setDashboard] = useState<any>(null);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [downloading, setDownloading] = useState<number | null>(null);
  const [paying, setPaying] = useState<Installment | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      await financialAPI.generateMonth({ month });
      const [{ data }, dash] = await Promise.all([
        financialAPI.getInstallments({ status: statusFilter, month, limit: 50 }),
        financialAPI.dashboard({ month }),
      ]);
      setInstallments(data.installments);
      setTotal(data.total);
      setDashboard(dash.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, statusFilter]);

  const downloadReceipt = async (paymentId: number, receiptNumber?: string) => {
    setDownloading(paymentId);
    try {
      const resp = await financialAPI.receipt(paymentId);
      const url = URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibo-${receiptNumber || paymentId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(null);
    }
  };

  const handlePayment = async (installmentId: number, method: string) => {
    const { data } = await financialAPI.registerPayment({
      installment_id: installmentId,
      amount: installments.find(i => i.id === installmentId)?.amount || 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: method,
    });
    load();
    if (data?.payment_id) {
      await downloadReceipt(data.payment_id, data.receipt_number);
    }
  };

  const statusLabels: Record<string, string> = { paid: 'Pago', pending: 'Pendente', overdue: 'Vencido', cancelled: 'Cancelado' };
  const statusColors: Record<string, string> = { paid: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', overdue: 'bg-red-100 text-red-700', cancelled: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-sm">{total} mensalidade(s)</p>
        <div className="flex items-center gap-2">
          <input type="month" value={month} onChange={e => e.target.value && setMonth(e.target.value)}
            className="px-3 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          <button onClick={() => setShowModal('installment')} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nova Mensalidade
          </button>
        </div>
      </div>

      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-900">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-green-600">Recebido · {month}</p><p className="text-xl font-bold text-green-700">R$ {(dashboard.total_received || 0).toLocaleString('pt-BR')}</p></div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-100 dark:border-primary-900">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-primary-600">A Vencer · {month}</p><p className="text-xl font-bold text-primary-700">R$ {(dashboard.total_to_due || 0).toLocaleString('pt-BR')}</p></div>
              <Clock className="w-8 h-8 text-primary-500" />
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-900">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-red-600">Vencido (acumulado até pagar)</p><p className="text-xl font-bold text-red-700">R$ {(dashboard.total_overdue || 0).toLocaleString('pt-BR')}</p></div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {['', 'pending', 'paid', 'overdue'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'}`}>
            {s ? statusLabels[s] : 'Todos'}
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Descrição</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Valor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Vencimento</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Pagamento</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {installments.map(i => (
                <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{i.description}</td>
                  <td className="px-4 py-3 text-sm text-slate-900 dark:text-white font-medium">R$ {i.amount.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{formatDate(i.due_date)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{formatDate(i.paid_date)}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[i.status] || 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>{statusLabels[i.status] || i.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    {i.status === 'paid' && i.payment_id && (
                      <button onClick={() => downloadReceipt(i.payment_id!, i.receipt_number)} disabled={downloading === i.payment_id}
                        className="px-3 py-1 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 ml-auto disabled:opacity-50">
                        <FileText className="w-3 h-3" /> {downloading === i.payment_id ? 'Gerando...' : 'Recibo'}
                      </button>
                    )}
                    {i.status !== 'paid' && i.status !== 'cancelled' && (
                      <button onClick={() => setPaying(i)} className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium flex items-center gap-1 ml-auto">
                        <CreditCard className="w-3 h-3" /> Pagar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {installments.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-slate-400">Nenhuma mensalidade encontrada</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal === 'installment' && <InstallmentModal onClose={() => setShowModal(null)} onSaved={() => { setShowModal(null); load(); }} />}
      {paying && (
        <PaymentModal
          installment={paying}
          onClose={() => setPaying(null)}
          onConfirm={async (method) => {
            await handlePayment(paying.id, method);
            setPaying(null);
          }}
        />
      )}
    </div>
  );
}

function MaterialsTab() {
  const [materials, setMaterials] = useState<TeachingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState<'new' | 'edit' | 'sale' | null>(null);
  const [editMaterial, setEditMaterial] = useState<TeachingMaterial | null>(null);
  const [search, setSearch] = useState('');
  const [dashData, setDashData] = useState<any>(null);
  const [deleteMaterialId, setDeleteMaterialId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    materialsAPI.list({ search }).then(({ data }) => setMaterials(data)).finally(() => setLoading(false));
    materialsAPI.dashboard().then(({ data }) => setDashData(data));
  };

  useEffect(() => { load(); }, [search]);

  const handleDelete = async (id: number) => {
    try { await materialsAPI.delete(id); load(); }
    catch (e: any) { alert(e.response?.data?.detail || 'Erro ao excluir material'); }
  };

  const handleSell = (m: TeachingMaterial) => {
    setEditMaterial(m);
    setShowModal('sale');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-sm">{materials.length} material(is) cadastrado(s)</p>
        <button onClick={() => { setEditMaterial(null); setShowModal('new'); }} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Material
        </button>
      </div>

      {dashData && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-blue-600">Total Materiais</p><p className="text-xl font-bold text-blue-700">{dashData.total_materials}</p></div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-900">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-green-600">Total Vendas</p><p className="text-xl font-bold text-green-700">{dashData.total_sales}</p></div>
              <ShoppingCart className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-100 dark:border-primary-900">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-primary-600">Receita Materiais</p><p className="text-xl font-bold text-primary-700">R$ {(dashData.total_revenue || 0).toLocaleString('pt-BR')}</p></div>
              <DollarSign className="w-8 h-8 text-primary-500" />
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-100 dark:border-orange-900">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-orange-600">Estoque Baixo</p><p className="text-xl font-bold text-orange-700">{dashData.low_stock}</p></div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 relative">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar material..."
          className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-[3px] border-primary-600/20 border-t-primary-600 dark:border-primary-400/20 dark:border-t-primary-400" /></div>
      ) : (
        <div className="card-surface overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-white/5">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Material</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Categoria</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Preço</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Estoque</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {materials.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{m.name}</p>
                    {m.description && <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{m.category || '-'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">R$ {m.price.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${m.stock <= 5 ? 'text-red-600' : 'text-slate-500 dark:text-slate-400'}`}>{m.stock}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleSell(m)} className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium flex items-center gap-1" title="Vender">
                        <ShoppingCart className="w-3 h-3" /> Vender
                      </button>
                      <button onClick={() => { setEditMaterial(m); setShowModal('edit'); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg" title="Editar">
                        <Edit className="w-4 h-4 text-slate-500" />
                      </button>
                      <button onClick={() => setDeleteMaterialId(m.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Excluir">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {materials.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-slate-400">Nenhum material cadastrado</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal === 'new' && <MaterialModal onClose={() => setShowModal(null)} onSaved={() => { setShowModal(null); load(); }} />}
      {showModal === 'edit' && editMaterial && <MaterialModal material={editMaterial} onClose={() => { setShowModal(null); setEditMaterial(null); }} onSaved={() => { setShowModal(null); setEditMaterial(null); load(); }} />}
      {showModal === 'sale' && editMaterial && <SaleModal material={editMaterial} onClose={() => { setShowModal(null); setEditMaterial(null); }} onSaved={() => { setShowModal(null); setEditMaterial(null); load(); }} />}

      {deleteMaterialId !== null && (
        <ConfirmDialog
          open
          title="Excluir material"
          message="Tem certeza que deseja excluir este material? Esta ação não pode ser desfeita."
          confirmLabel="Sim, excluir"
          onConfirm={() => { handleDelete(deleteMaterialId); setDeleteMaterialId(null); }}
          onCancel={() => setDeleteMaterialId(null)}
        />
      )}
    </div>
  );
}

function SalesTab() {
  const [sales, setSales] = useState<MaterialSale[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    materialsAPI.listSales({ limit: 100 }).then(({ data }) => { setSales(data.sales); setTotal(data.total); }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <p className="text-slate-500 text-sm">{total} venda(s) registrada(s)</p>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-[3px] border-primary-600/20 border-t-primary-600 dark:border-primary-400/20 dark:border-t-primary-400" /></div>
      ) : (
        <div className="card-surface overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-white/5">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Aluno</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Material</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Qtd</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Unitário</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Pagamento</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {sales.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{s.student_name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{s.material_name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{s.quantity}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">R$ {s.unit_price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-700">R$ {s.total_price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{s.payment_method || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{s.created_at ? formatDate(s.created_at) : '-'}</td>
                </tr>
              ))}
              {sales.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-slate-400">Nenhuma venda registrada</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CurrencyInput({ label, value, onChange, required }: { label: string; value: number; onChange: (v: number) => void; required?: boolean }) {
  const [display, setDisplay] = useState(value > 0 ? value.toFixed(2).replace('.', ',') : '');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value > 0 && document.activeElement !== ref.current) {
      setDisplay(value.toFixed(2).replace('.', ','));
    }
  }, [value]);

  const parse = (v: string): number => {
    const cleaned = v.replace(/[^\d,]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}{required && ' *'}</label>
      <input ref={ref} type="text" inputMode="decimal" placeholder="0,00"
        value={display}
        onFocus={() => { if (value > 0) setDisplay(value.toFixed(2).replace('.', ',')); }}
        onBlur={() => { const num = parse(display); onChange(num); setDisplay(num > 0 ? num.toFixed(2).replace('.', ',') : ''); }}
        onChange={e => { const v = e.target.value; if (/^[\d,]*$/.test(v)) setDisplay(v); }}
        className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
    </div>
  );
}

function MaterialModal({ material, onClose, onSaved }: { material?: TeachingMaterial; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: material?.name || '', description: material?.description || '',
    price: material?.price || 0, stock: material?.stock || 0, category: material?.category || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name) { alert('Nome é obrigatório'); return; }
    setSaving(true);
    try {
      if (material) {
        await materialsAPI.update(material.id, form);
      } else {
        await materialsAPI.create(form);
      }
      onSaved();
    } catch (e: any) {
      alert('Erro ao salvar: ' + (e?.response?.data?.detail || e?.message || 'Desconhecido'));
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111a2e] rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{material ? 'Editar Material' : 'Novo Material'}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <CurrencyInput label="Preço (R$)" value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} required />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estoque</label>
              <input type="text" inputMode="numeric" placeholder="0" value={form.stock || ''}
                onChange={e => { if (/^\d*$/.test(e.target.value)) setForm(f => ({ ...f, stock: parseInt(e.target.value) || 0 })); }}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex: Livro, Cd..."
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SaleModal({ material, onClose, onSaved }: { material: TeachingMaterial; onClose: () => void; onSaved: () => void }) {
  const [students, setStudents] = useState<any[]>([]);
  const { paymentMethods } = useSettings();
  const [form, setForm] = useState({
    student_id: 0, quantity: 1, unit_price: material.price, payment_method: 'PIX', notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { studentsAPI.list({ limit: 100 }).then(({ data }) => setStudents(data.students || [])); }, []);

  useEffect(() => {
    if (paymentMethods.length && !paymentMethods.includes(form.payment_method)) {
      setForm(f => ({ ...f, payment_method: paymentMethods[0] }));
    }
  }, [paymentMethods]);

  const handleSave = async () => {
    if (!form.student_id) { alert('Selecione o aluno'); return; }
    setSaving(true);
    try {
      await materialsAPI.createSale({
        material_id: material.id, student_id: form.student_id,
        quantity: form.quantity, unit_price: form.unit_price,
        payment_method: form.payment_method, notes: form.notes
      });
      onSaved();
    } catch { alert('Erro ao registrar venda'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111a2e] rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Vender: {material.name}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Aluno *</label>
            <select value={form.student_id} onChange={e => setForm(f => ({ ...f, student_id: parseInt(e.target.value) }))}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm">
              <option value={0}>Selecione</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quantidade</label>
              <input type="text" inputMode="numeric" placeholder="1" value={form.quantity || ''}
                onChange={e => { if (/^\d*$/.test(e.target.value)) setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 })); }}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Preço Unitário (R$)</label>
              <CurrencyInput label="" value={form.unit_price} onChange={v => setForm(f => ({ ...f, unit_price: v }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Forma de Pagamento</label>
            <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm">
              {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
          </div>
          <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total: <span className="font-bold text-slate-900 dark:text-white">R$ {(form.unit_price * form.quantity).toFixed(2)}</span></p>
            <p className="text-xs text-slate-500 mt-0.5">Estoque disponível: {material.stock}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving || form.quantity > material.stock} className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Registrando...' : 'Registrar Venda'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({ installment, onClose, onConfirm }: { installment: Installment; onClose: () => void; onConfirm: (method: string) => Promise<void> }) {
  const [method, setMethod] = useState('');
  const [saving, setSaving] = useState(false);
  const { paymentMethods } = useSettings();

  const options = paymentMethods.map(m => ({ value: m, label: m }));

  const confirm = async () => {
    if (!method || saving) return;
    setSaving(true);
    try {
      await onConfirm(method);
    } catch {
      alert('Erro ao registrar o pagamento');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111a2e] rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Forma de Pagamento</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">{installment.description} · R$ {installment.amount.toLocaleString('pt-BR')}</p>
        <div className="grid grid-cols-2 gap-3">
          {options.map(o => (
            <button key={o.value} onClick={() => setMethod(o.value)}
              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${method === o.value ? 'border-primary-600 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
              {o.label}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-sm">Cancelar</button>
          <button onClick={confirm} disabled={!method || saving} className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Processando...' : 'Confirmar Pagamento'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InstallmentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [students, setStudents] = useState<any[]>([]);
  const [form, setForm] = useState({ student_id: 0, description: '', amount: 0, due_date: new Date().toISOString().split('T')[0], payment_method: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { studentsAPI.list({ limit: 100 }).then(({ data }) => setStudents(data.students || [])); }, []);

  const handleSave = async () => {
    if (!form.student_id || !form.description) { alert('Preencha os campos obrigatórios'); return; }
    setSaving(true);
    try { await financialAPI.createInstallment(form); onSaved(); } catch { alert('Erro ao salvar'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111a2e] rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Nova Mensalidade</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Aluno *</label>
            <select value={form.student_id} onChange={e => setForm(f => ({ ...f, student_id: parseInt(e.target.value) }))}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm">
              <option value={0}>Selecione</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição *</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" placeholder="Mensalidade Janeiro/2024" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <CurrencyInput label="Valor (R$)" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} required />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vencimento</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
