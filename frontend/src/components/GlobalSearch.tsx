import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SearchX } from 'lucide-react';
import { searchAPI } from '../services/api';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchAPI.search(query).then(
        (res) => setResults(res.data.results || []),
        () => setResults([])
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const select = (r: any) => {
    navigate(r.url);
    setOpen(false);
    setQuery('');
  };

  const badge = (type: string) => {
    const map: Record<string, string> = { student: 'A', teacher: 'P', course: 'C', class: 'T' };
    return map[type] || 'A';
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2.5 px-3.5 py-2 w-full sm:w-64 text-sm text-slate-400 dark:text-slate-500 bg-slate-100/80 dark:bg-white/5 border border-transparent rounded-xl hover:border-slate-300 dark:hover:border-white/10 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left hidden sm:block">Buscar no sistema...</span>
        <kbd className="hidden sm:inline-flex text-[10px] font-medium text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/10 rounded-md px-1.5 py-0.5">Ctrl K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-xl mx-auto mt-24 px-4 animate-scale-in">
            <div className="bg-white dark:bg-[#0f1a2e] rounded-2xl shadow-modal border border-slate-200/80 dark:border-white/10 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-white/10">
                <Search className="w-5 h-5 text-primary-500" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
                  placeholder="Buscar alunos..."
                  className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
                <button onClick={() => setOpen(false)} className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-200 dark:border-white/10 rounded-md px-1.5 py-0.5">ESC</button>
              </div>

              <div className="max-h-80 overflow-y-auto p-2">
                {query.length >= 2 && results.length === 0 && (
                  <div className="flex flex-col items-center py-10 text-slate-400">
                    <SearchX className="w-8 h-8 mb-2" />
                    <p className="text-sm">Nenhum resultado encontrado</p>
                  </div>
                )}
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => select(r)}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 dark:text-primary-300 text-xs font-bold">{badge(r.type)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{r.title}</p>
                      <p className="text-xs text-slate-500 truncate">{r.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
