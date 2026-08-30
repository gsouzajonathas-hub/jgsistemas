# Infraestrutura e Deploy (estado atual)

> Fonte: leitura direta dos arquivos de config em 2026-08-30.

## Contrato de entrada

- **Frontend na Vercel** (`vercel.json:1-19`): `buildCommand: cd frontend && npm ci && npm run build` (`vercel.json:3`), `outputDirectory: frontend/dist` (`vercel.json:4`). Rewrites: `/api/:path*` e `/uploads/:path*` → `https://jgsistemas-backend.onrender.com/...` (`vercel.json:5-13`) e SPA fallback `/(.*)` → `/index.html` (`vercel.json:14-17`).
- **Backend no Render** (`render.yaml:1-26`): serviço web `jgsistemas-backend`, runtime docker (`render.yaml:4-5`), plano free, região oregon (`render.yaml:6-7`), health check `/api/health` (`render.yaml:8`), autoDeploy (`render.yaml:9`). Env: `DATABASE_URL` e `SECRET_KEY` sync:false (`render.yaml:11-14`, `SECRET_KEY generateValue:true`), `ACCESS_TOKEN_EXPIRE_MINUTES=60`, `CORS_ORIGINS=https://jgsistemas.vercel.app,http://localhost:5173,http://localhost:5174` (`render.yaml:17-18`), `FRONTEND_URL=https://jgsistemas.vercel.app` (`render.yaml:19-20`), `ENVIRONMENT=production` (`render.yaml:21-22`), `SUPABASE_URL`/`SUPABASE_ANON_KEY` sync:false (`render.yaml:23-26`).
- **Backend Dockerfile** (`backend/Dockerfile:1-16`): python:3.12-slim, instala gcc+libpq-dev, copia requirements.txt, `pip install --no-cache-dir`, `COPY . .`, cria `/data/uploads` e `/data/student_files`, `EXPOSE 8000`, CMD `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`.
- **Frontend Dockerfile** (`frontend/Dockerfile:1-16`): node:20-alpine, `npm install`, `npm run build`, serve estático via `serve -s dist -l 5173`, `EXPOSE 5173`.
- **docker-compose.yml** (`docker-compose.yml:1-49`): db postgres:16-alpine (porta 127.0.0.1:5432, password de `${POSTGRES_PASSWORD}`), backend (127.0.0.1:8000, env DATABASE_URL/SECRET_KEY/CORS_ORIGINS/FRONTEND_URL/ENVIRONMENT, volume uploads), frontend (127.0.0.1:5173). Volumes: pgdata, uploads. Sem hardcode de secrets (usa env vars).
- **fly.toml** (`backend/fly.toml:1-36`): app `jgsistemas-backend`, dockerfile, ENVIRONMENT=production, DATA_DIR=/data, UPLOAD_DIR=/data/uploads, ACCESS_TOKEN_EXPIRE_MINUTES=60, porta interna 8000 (http 80/tls 443), mount `data` → `/data`. (Alternativa de deploy backend; não usada no fluxo Vercel→Render.)
- **.env.example** raiz (`!env.example:1-38`): DATABASE_URL (Postgres ou SQLite), DATA_DIR, UPLOAD_DIR, SECRET_KEY (obrigatória), ACCESS_TOKEN_EXPIRE_MINUTES=60, CORS_ORIGINS=localhosts, ENVIRONMENT=development|production, SMTP_*, ZAPI_*, FRONTEND_URL.
- **README.md**: documenta Docker, dev local, usuário padrão, segurança (SECRET_KEY obrigatória, reset 30min, uploads 5MB validados, login rate limitado, CORS restrito, auditoria), atualização via git com dados fora do repositório (DATA_DIR/UPLOAD_DIR).

## Contrato de saída

- Frontend em produção → domínio Vercel (ex.: `https://jgsistemas.vercel.app`, referenciado em `render.yaml:18,20`).
- Backend em produção → `https://jgsistemas-backend.onrender.com` (referenciado em `vercel.json:8,12`).
- `/api/health` público como health check (`render.yaml:8`, `main.py:176-178`).
- Em ENVIRONMENT=production: docs Swagger/redoc desabilitados (`main.py:20-21,103-104`).

## Limites e cotas

- Plano Render: **free** (`render.yaml:7`) — dorme após inatividade (NÃO DOCUMENTADO pelo config; comportamento padrão Render free).
- Plano Vercel: hobby (inferido do OIDC token em `frontend/.env.local`: `"plan":"hobby"`) — limites NÃO DOCUMENTADOS no config (verificar docs oficiais na base externa 04-vercel-deploy.md).
- NÃO DOCUMENTADO: limite de instância/requests no Render via config atual.

## Erros conhecidos e tratamento

- NÃO DOCUMENTADO em config: sem retries/backoff explícitos em render.yaml/vercel.json.
- README indica: registro de novos usuários passa a exigir admin após bootstrap; backend recusa SECRET_KEY padrão.

## Riscos para a nossa implementação

1. **Arquitetura atual = frontend Vercel + backend Render (SQLite/Postgres)**. Deploy "na Vercel" do backend exigiria repensar (funções serverless efêmeras não persistem SQLite; banco deve ser Postgres gerenciado — Supabase/Render Postgres).
2. **SQLite é padrão local** (`DATA_DIR` vazio → `backend/`; `escola.db`). Em produção precisa `DATABASE_URL` Postgres; existe `backend/scripts/migrate_sqlite_to_postgres.py` (mencionado no git log) e `SUPABASE_URL` referenciado no auth.
3. **CORS_ORIGINS** em render.yaml aponta para `https://jgsistemas.vercel.app` — se o domínio Vercel mudar, quebra login em produção.
4. **Sem headers de segurança no frontend hospedado**: vercel.json não define nenhum `headers` (CSP/HSTS/X-Content-Type-Options) — aplicar via config Vercel é possível e desejado.
5. **ENVIRONMENT não está em vercel.json** — o build frontend não recebe ENVIRONMENT; docs do backend são controlados pelo backend (render.yaml já define production).
6. **Frontend serve sem headers de cache/segurança**; SPA fallback `/(.*)` captura tudo (inclusive `/api` após rewrites — ordem dos rewrites importa).
7. **Vercel OIDC token válido em `frontend/.env.local`** é um segredo vivo do plano hobby do usuário — não cometido, mas deve ser rotacionado/revogado antes do deploy público.
8. **SECRET_KEY real no `.env` raiz** — rotacionar antes do deploy (o README já manda trocar antes de uso real).
9. Deploy atual exige `SUPABASE_URL`/`SUPABASE_ANON_KEY` no Render (sync:false) para o login Supabase não quebrar; e vars VITE_* no build Vercel para o cliente.

## Fonte

- `vercel.json`, `render.yaml`, `docker-compose.yml`, `backend/fly.toml`, `backend/Dockerfile`, `frontend/Dockerfile`, `.env.example`, `README.md` — lidos em 2026-08-30.