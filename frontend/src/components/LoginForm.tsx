import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';

interface LoginFormProps {
  title?: string;
  subtitle?: string;
  onSuccess?: () => void;
  onForgot?: () => void;
}

const inputClass = "w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all duration-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10";

export default function LoginForm({ title = 'Bem-vindo de volta', subtitle = 'Entre com suas credenciais para acessar o sistema.', onSuccess, onForgot }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-surface p-8 animate-fade-in-up">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl border border-red-100 dark:border-red-500/20">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="seu@email.com" required />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Senha</label>
            {onForgot && (
              <button type="button" onClick={onForgot} className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                Esqueci minha senha
              </button>
            )}
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-12`}
              placeholder="••••••••"
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-base w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 text-sm shadow-sm shadow-primary-600/25 disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Entrar
        </button>
      </form>
    </div>
  );
}
