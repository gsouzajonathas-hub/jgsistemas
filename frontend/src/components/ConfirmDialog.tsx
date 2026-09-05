import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  color?: 'red' | 'amber';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal de confirmação de exclusão/ações destrutivas.
 * Dá a segunda chance pedida: mostra mensagem clara e exige clicar
 * no botão vermelho (destrutivo) ou amarelo (aviso) para executar.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Sim, excluir',
  cancelLabel = 'Cancelar',
  color = 'red',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmClasses =
    color === 'amber'
      ? 'bg-amber-500 hover:bg-amber-600 text-white'
      : 'bg-red-600 hover:bg-red-700 text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-[#0d1626] rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 p-6">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${
              color === 'amber'
                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 border border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg text-sm font-medium"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${confirmClasses}`}
          >
            <AlertTriangle className="w-4 h-4" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}