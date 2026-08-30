# Lacunas

- HSTS no backend: NÃO EXISTE (procurado em todo `backend/app` — nenhum `Strict-Transport-Security`).
- CSP global no backend e no frontend: NÃO EXISTE (só CSP restrita no middleware de `/uploads`; `frontend/index.html` sem meta CSP).
- Lockout de conta por tentativas falhas: NÃO EXISTE (só rate limit por IP nas rotas de auth).
- Rate limit global (não-auth): NÃO EXISTE; limiter é em memória, sem persistência/multi-instância.
- Auditoria: não cobre alterações em alunos/financeiro/matrículas, leituras nem tentativas de login falhas.
- `bcrypt` e `Pillow` usados no código mas não listados em `backend/requirements.txt` (bcrypt vem transitivo de passlib; Pillow não listado).
- `frontend/.env.production`, `frontend/.env.example`: NÃO EXISTEM; `.env.example` do frontend NÃO DOCUMENTADO.
- Limites da plataforma Vercel (hobby) e comportamento Render free: NÃO DOCUMENTADO nos configs locais — coberto pela ingestão externa (04-vercel-deploy.md).
- Timeout do axios no frontend (`api.ts`): NÃO DOCUMENTADO (sem `timeout` explícito).
- Docs Vercel OIDC (`/docs/accounts/oidc`): 404 no acesso 2026-08-30 (URL tentada: https://vercel.com/docs/accounts/oidc).
- Tabela "Usage summary" da página de limits da Vercel: valores numéricos não renderizados no fetch (URL: https://vercel.com/docs/limits/overview).
- Persistência de SQLite/upload em função serverless Vercel: NÃO DOCUMENTADO nas páginas fetchadas (limite estrutural de filesystem efêmero; decisão de arquitetura na F2).