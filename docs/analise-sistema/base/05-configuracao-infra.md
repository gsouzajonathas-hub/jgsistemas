# CONFIGURAÇÃO, INFRAESTRUTURA E DEPLOY

> Fatos lidos dos arquivos reais na raiz do repositório, `backend/` e `frontend/`.

## Contrato de entrada

### Variáveis de ambiente (nomes documentados; valores secretos NÃO revelados)
Fonte: `.env.example` (38 linhas) e `.env` / `backend/.env` (apenas nomes, sem valores).

| Variável | Default | Onde lida |
|---|---|---|
| `DATABASE_URL` | `""` → SQLite `escola.db` | app/database.py:8 |
| `DATA_DIR` | pasta `backend/` | app/utils/paths.py:10-13 |
| `UPLOAD_DIR` | `backend/uploads` | app/utils/paths.py:17-20 |
| `SECRET_KEY` | obrigatória (não inicia com padrão) | app/utils/auth.py:17-27 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | app/utils/auth.py:30 |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:5174,http://localhost:3000` | app/main.py:108 |
| `ENVIRONMENT` | `development` | app/main.py:19 |
| `FRONTEND_URL` | `http://localhost:5173` | app/routes/auth.py:86 |
| `SMTP_HOST/PORT/USER/PASS/FROM` | `587`; FROM=USER | app/services/email_service.py:8-12 |
| `ZAPI_INSTANCE_URL` / `ZAPI_TOKEN` | `""` | app/services/whatsapp_service.py:6-7 |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | `""` | app/routes/auth.py:168-169 |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` | — | frontend/src/services/supabase.ts |

### Dependências do backend (requirements.txt, 14 itens)
`fastapi 0.115.12`, `uvicorn[standard] 0.34.2`, `sqlalchemy 2.0.41`, `aiosqlite 0.21.0`, `asyncpg 0.30.0`, `python-jose[cryptography] 3.4.0`, `passlib[bcrypt] 1.7.4`, `python-multipart 0.0.20`, `python-dotenv 1.1.0`, `openpyxl 3.1.5`, `reportlab 4.4.0`, `aiofiles 24.1.0`, `aiosmtplib 3.0.2`, `httpx 0.28.1`. ⚠️ Sem pytest.

### Docker
- `docker-compose.yml` (49 linhas): serviços **db** (postgres:16-alpine, env `POSTGRES_USER=escola_user`/`POSTGRES_DB=escola_ingles`, porta `127.0.0.1:5432:5432`, volume `pgdata`, healthcheck `pg_isready -U escola_user -d escola_ingles` 5s/5s/5, linhas 4-19), **backend** (build ./backend, porta `127.0.0.1:8000:8000`, env herdadas, volume `uploads:/app/uploads`, `depends_on: db: condition: service_healthy`, linhas 21-37), **frontend** (build ./frontend, porta `127.0.0.1:5173:5173`, `depends_on: backend`, linhas 39-45). Volumes nomeados `pgdata` e `uploads` (47-49).
- `backend/Dockerfile`: `python:3.12-slim`, instala `gcc libpq-dev`, cria `/data/uploads` e `/data/student_files`, CMD `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}` (linha 16).
- `frontend/Dockerfile`: `node:20-alpine`, `npm install` + `npm run build`, instala `serve`, CMD `serve -s dist -l 5173` (linha 16).

### Deploy
- `render.yaml` (26 linhas): 1 serviço web `jgsistemas-backend`, `runtime: docker`, Dockerfile `./backend/Dockerfile`, `plan: free`, `region: oregon`, `healthCheckPath: /api/health`, `autoDeploy: true`; envVars: `DATABASE_URL` (sync false), `SECRET_KEY` (generateValue true), `ACCESS_TOKEN_EXPIRE_MINUTES: "60"`, `CORS_ORIGINS: https://jgsistemas.vercel.app,...`, `FRONTEND_URL: https://jgsistemas.vercel.app`, `ENVIRONMENT: production`, `SUPABASE_URL`/`SUPABASE_ANON_KEY` (sync false).
- `vercel.json` (19 linhas): `buildCommand: cd frontend && npm ci && npm run build`, `outputDirectory: frontend/dist`, rewrites: `/api/:path*` e `/uploads/:path*` → `https://jgsistemas-backend.onrender.com/...`, `/(.*)` → `/index.html` (SPA).

### Scripts de inicialização local
- `start.bat` (27 linhas): ativa venv em `backend/` e roda `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`; abre `http://localhost:8000`.
- `start.ps1` (36 linhas): inicia backend (uvicorn, 127.0.0.1:8000) e frontend (`npx vite --host 127.0.0.1`) em janelas minimizadas; **bootstrap admin no 1º run**: gera senha aleatória de 14 chars e faz `POST /api/auth/register` (`{name:"Admin", email:"admin@escola.com", role:"admin"}`), exibindo credenciais uma única vez (linhas 23-32).

### Migração SQLite → Postgres
`backend/scripts/migrate_sqlite_to_postgres.py` (183 linhas): `Base.metadata.create_all` no Postgres; copia tabelas na ordem de FK preservando IDs (`TRUNCATE ... RESTART IDENTITY CASCADE`); converte boolean 0/1; `setval` nas sequences; ignora órfãs `attendances`, `certificates`, `evaluations`, `grade_weight_configs`, `subscriptions` (122); flags `--tables` e `--dry-run`.

## Contrato de saída

- Healthcheck de deploy: `GET /api/health` → `{"status": "ok", ...}`.
- URLs de produção: backend Render `https://jgsistemas-backend.onrender.com`, frontend Vercel `https://jgsistemas.vercel.app`.

## Limites e cotas

- Render: plano `free` (dorme com inatividade — 1º request lento).
- Postgres container exposto só em `127.0.0.1:5432` (loopback).
- CORS de produção inclui apenas `jgsistemas.vercel.app`, `localhost:5173`, `localhost:5174`.

## Erros conhecidos e tratamento

- **Migrações rodam no startup** (create_all + ALTERs) — sem tooling de migration versionada; rollback manual via git+bkp (README.md).
- Dados de cliente (banco/uploads) ficam FORA do repositório via `DATA_DIR`/`UPLOAD_DIR` (README.md:73).
- .gitignore ignora `venv`, `node_modules`, `*.db`, `uploads/`, `.env*`, `*.log`, caches pytest/mypy/ruff, `.coverage`.

## Riscos para a nossa implementação

1. **Sem testes em nenhuma camada** — nenhuma rede de segurança para deploy automático (`autoDeploy: true` no Render).
2. **Supabase** usado só para auth social/magic link; sem contrato claro no código sobre persistência — o banco de verdade é Postgres/SQLite via SQLAlchemy.
3. **Plano free do Render** + `service_healthy` no compose: cold start e sincronia de healthcheck são pontos frágeis.
4. **Frontend sem Dockerfile de produção no Vercel?** — Vercel builda via vercel.json (`npm ci && npm run build`), não o Dockerfile; os dois caminhos precisam produzir o mesmo `dist`.

## Fonte

- `.env.example`, `.env`, `backend/.env`, `.gitignore`, `docker-compose.yml`, `render.yaml`, `vercel.json`, `start.bat`, `start.ps1`, `backend/requirements.txt`, `backend/Dockerfile`, `frontend/Dockerfile`, `backend/scripts/migrate_sqlite_to_postgres.py`, `frontend/package.json` — acessado em 2026-08-29.