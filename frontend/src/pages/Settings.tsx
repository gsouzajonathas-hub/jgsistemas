import { useState, useEffect } from 'react';
import { settingsAPI, authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { pushSettingsCache } from '../hooks/useSettings';
import { Save, Upload, Building, Palette, Users, Plus, X } from 'lucide-react';

const PAYMENT_METHOD_OPTIONS = ['PIX', 'Dinheiro', 'Débito', 'Crédito', 'Cartão', 'Transferência'];

const ALL_PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'students', label: 'Alunos' },

  { key: 'enrollments', label: 'Matrículas' },
  { key: 'financial', label: 'Financeiro' },
  { key: 'schedule', label: 'Agenda' },
  { key: 'reports', label: 'Relatórios' },
];

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: string;
  permissions: string[];
}

const emptyForm: UserForm = { name: '', email: '', password: '', role: 'secretary', permissions: [] };

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [tab, setTab] = useState<'school' | 'users' | 'appearance'>('school');
  const [saved, setSaved] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  useEffect(() => {
    settingsAPI.get().then(({ data }) => setSettings(data)).finally(() => setLoading(false));
    if (user?.role === 'admin') {
      authAPI.getUsers().then(({ data }) => setUsers(data));
    }
  }, []);


  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(settings);
      pushSettingsCache(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { alert('Erro ao salvar'); } finally { setSaving(false); }
  };

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { data } = await settingsAPI.uploadLogo(file);
    setSettings((s: any) => ({ ...s, logo_url: data.logo_url }));
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Excluir este usuário?')) return;
    await authAPI.deleteUser(id);
    setUsers(u => u.filter(user => user.id !== id));
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (u: any) => {
    setEditingUser(u);
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      permissions: u.permissions || [],
    });
    setFormError('');
    setModalOpen(true);
  };

  const togglePermission = (key: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter(p => p !== key)
        : [...f.permissions, key],
    }));
  };

  const currentMethods: string[] = (settings?.payment_methods || 'PIX,Dinheiro,Débito,Crédito')
    .split(',').map((m: string) => m.trim()).filter(Boolean);

  const togglePaymentMethod = (m: string) => {
    setSettings((s: any) => {
      const list = (s?.payment_methods || 'PIX,Dinheiro,Débito,Crédito')
        .split(',').map((x: string) => x.trim()).filter(Boolean);
      const next = list.includes(m) ? list.filter((x: string) => x !== m) : [...list, m];
      const ordered = PAYMENT_METHOD_OPTIONS.filter(o => next.includes(o));
      return { ...s, payment_methods: ordered.join(',') };
    });
  };

  const handleFormSubmit = async () => {
    setFormError('');
    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Preencha nome e email.');
      return;
    }
    if (!editingUser && !form.password) {
      setFormError('Preencha a senha.');
      return;
    }
    setFormSaving(true);
    try {
      if (editingUser) {
        const data: any = { name: form.name, email: form.email, role: form.role, permissions: form.permissions };
        await authAPI.updateUser(editingUser.id, data);
      } else {
        await authAPI.createUser({ name: form.name, email: form.email, password: form.password, role: form.role, permissions: form.permissions });
      }
      const { data: updatedUsers } = await authAPI.getUsers();
      setUsers(updatedUsers);
      setModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Erro ao salvar usuário.');
    } finally {
      setFormSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-[3px] border-primary-600/20 border-t-primary-600 dark:border-primary-400/20 dark:border-t-primary-400" /></div>;

  const roleLabels: Record<string, string> = { admin: 'Administrador', secretary: 'Secretaria', teacher: 'Professor', financial: 'Financeiro', coordinator: 'Coordenador' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h1>
        <p className="text-slate-500 text-sm">Gerencie as configurações do sistema</p>
      </div>

      <div className="flex gap-1 border-b border-slate-200 dark:border-white/10">
        {[
          { key: 'school', label: 'Escola', icon: Building },
          { key: 'users', label: 'Usuários', icon: Users },
          { key: 'appearance', label: 'Aparência', icon: Palette },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {saved && <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 rounded-lg text-sm">Configurações salvas com sucesso!</div>}

      {tab === 'school' && settings && (
        <div className="card-surface p-6 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="w-20 h-20 bg-slate-100 dark:bg-white/10 rounded-xl flex items-center justify-center overflow-hidden">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="w-20 h-20 object-cover" />
                ) : (
                  <Building className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer">
                <Upload className="w-3 h-3 text-white" />
                <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
              </label>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Logo da Escola</h3>
              <p className="text-sm text-slate-500">Clique no ícone para alterar</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Escola</label>
              <input value={settings.school_name || ''} onChange={e => setSettings((s: any) => ({ ...s, school_name: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CNPJ</label>
              <input value={settings.cnpj || ''} onChange={e => setSettings((s: any) => ({ ...s, cnpj: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Chave PIX (para QR Code no carnê)</label>
              <input value={settings.pix_key || ''} onChange={e => setSettings((s: any) => ({ ...s, pix_key: e.target.value }))}
                placeholder="CPF/CNPJ, e-mail, telefone ou chave aleatória"
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
              <input value={settings.phone || ''} onChange={e => setSettings((s: any) => ({ ...s, phone: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input value={settings.email || ''} onChange={e => setSettings((s: any) => ({ ...s, email: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Endereço</label>
              <input value={settings.address || ''} onChange={e => setSettings((s: any) => ({ ...s, address: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Slogan (rodapé dos documentos)</label>
              <input value={settings.slogan || ''} onChange={e => setSettings((s: any) => ({ ...s, slogan: e.target.value }))}
                placeholder="Ex.: Investir no seu inglês é abrir portas para o mundo"
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rede social (rodapé dos documentos)</label>
              <input value={settings.social_media || ''} onChange={e => setSettings((s: any) => ({ ...s, social_media: e.target.value }))}
                placeholder="Ex.: @escoladingles"
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
            </div>

          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Formas de pagamento aceitas</label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Usadas em todos os modais do financeiro, carnês e recibos.
            </p>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHOD_OPTIONS.map(m => (
                <button key={m} type="button" onClick={() => togglePaymentMethod(m)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-colors ${currentMethods.includes(m)
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 font-medium'
                    : 'border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      )}

      {tab === 'users' && (
        <div className="card-surface overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{users.length} usuário(s)</span>
            <button onClick={openCreateModal}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" /> Novo Usuário
            </button>
          </div>
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-white/5">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Perfil</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Permissões</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{u.email}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-xs font-medium">{roleLabels[u.role] || u.role}</span></td>
                  <td className="px-4 py-3">
                    {u.role === 'admin' ? (
                      <span className="text-xs text-slate-400">Todos</span>
                    ) : u.permissions && u.permissions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {u.permissions.slice(0, 3).map((p: string) => (
                          <span key={p} className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded text-[10px]">{ALL_PERMISSIONS.find(ap => ap.key === p)?.label || p}</span>
                        ))}
                        {u.permissions.length > 3 && <span className="text-[10px] text-slate-400">+{u.permissions.length - 3}</span>}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Todos</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>{u.is_active ? 'Ativo' : 'Inativo'}</span></td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => openEditModal(u)} className="text-primary-600 dark:text-primary-400 hover:text-primary-800 text-sm">Editar</button>
                    {u.id !== user?.id && (
                      <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700 text-sm">Excluir</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'appearance' && settings && (
        <div className="card-surface p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cor Principal</label>
            <div className="flex items-center gap-3">
              <input type="color" value={settings.primary_color || '#3B82F6'}
                onChange={e => setSettings((s: any) => ({ ...s, primary_color: e.target.value }))}
                className="w-12 h-10 rounded-lg cursor-pointer" />
              <span className="text-sm text-slate-500 dark:text-slate-400">{settings.primary_color}</span>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-[#0d1626] rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {formError && <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">{formError}</div>}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha *</label>
                  <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Perfil</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none text-sm">
                  <option value="admin">Administrador</option>
                  <option value="secretary">Secretaria</option>
                  <option value="teacher">Professor</option>
                </select>
              </div>

              {form.role !== 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Módulos com acesso</label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Selecione os módulos que este usuário poderá acessar.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_PERMISSIONS.map(p => (
                      <label key={p.key} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                        form.permissions.includes(p.key)
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300'
                          : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
                      }`}>
                        <input
                          type="checkbox"
                          checked={form.permissions.includes(p.key)}
                          onChange={() => togglePermission(p.key)}
                          className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-white/10">
              <button onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 border border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg text-sm font-medium">
                Cancelar
              </button>
              <button onClick={handleFormSubmit} disabled={formSaving}
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                <Save className="w-4 h-4" /> {formSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
