# Sprint 07 — Fases

## F01 — Contrato do frontend + remover supabase-sync

- **objetivo**: Garantir que o frontend continua consumindo `/api/*` via axios; remover `supabase-sync` do backend (D-05) e todo código supabase do frontend (login/hooks).
- **Tasks**: T-07.01, T-07.02
- **Critério de saída**: build do frontend sem imports supabase; baseURL `/api` intacto.
- **Roda em paralelo com**: nenhuma (requer impedir regressão de contrato).

## F02 — Configs de deploy (Vercel rewrite → functions app)

- **objetivo**: Configurar `vercel.json` (rewrite `/api/:path*` → `https://<ref>.supabase.co/functions/v1/app/:path*`), variáveis de CORS_ORIGINS/FRONTEND_URL; desativar Render.
- **Tasks**: T-07.03
- **Critério de saída**: config de deploy documentada e aplicável quando credentials chegarem.
- **Roda em paralelo com**: F03.

## F03 — Relatório técnico final

- **objetivo**: Redigir `RELATORIO-TECNICO.md` em PT: arquitetura final (Edge Function única), módulos migrados, libs (pdf-lib/SheetJS/bcryptjs), testes verdes por sprint, decisões honradas (D-01..D-14), pendências (PENDENTE-01..03) e tempo total registrado.
- **Tasks**: T-07.04
- **Critério de saída**: relatório completo e coerente com o estado real do código.
- **Roda em paralelo com**: F02.