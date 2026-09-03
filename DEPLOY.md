# Guia de Deploy — Gestão Escolar (JG Sistemas)

Runbook passo-a-passo para colocar o sistema em produção. O deploy é **manual** (feito nos
painéis da Render, Supabase e Vercel); este documento diz exatamente o quê e em que ordem.

## Arquitetura (opção 1)

| Camada | Onde roda | URL |
|---|---|---|
| Frontend (React/Vite) | Vercel | `https://jgsistemas.vercel.app` |
| Backend (FastAPI) | Render (Docker, free) | `jgsistemas-backend.onrender.com` |
| Banco de dados | Supabase Postgres | connection string via `DATABASE_URL` |
| Uploads (fotos/PDF/logo) | Disco persistente do Render (`/data/uploads`) | servido em `/uploads` |
| E-mail transacional | Resend | reset de senha |

- O backend no Render é **API-only**. A interface é servida pela Vercel, que faz `rewrite`
  de `/api/*` e `/uploads/*` para o backend da Render.
- Login é **JWT próprio** (HS256). O Supabase é usado apenas como Postgres — sem Supabase Auth,
  sem RLS, sem Edge Functions.

---

## Pré-requisitos

- Conta na **Render**, **Supabase** (projeto Postgres criado) e **Vercel**.
- O repositório está no GitHub: `github.com/jonathasGodinho/jgsistemas`.
- CLI do Supabase instalada para aplicar a migração: `supabase --version`. (Alternativa: rodar
  o SQL manualmente no painel do Supabase — SQL Editor.)

---

## Etapa 1 — Supabase (banco de dados)

1. Crie o projeto no painel do Supabase. Anote o **Project Ref** (URL `https://<ref>.supabase.co`).
2. Aplique a migração de schema. Na pasta raiz do repositório:
   ```bash
   supabase link --project-ref <REF>
   supabase db push
   ```
   > O arquivo `supabase/migrations/20260830000100_init.sql` cria as 26 tabelas em `public`,
   > idempotente (`create table if not exists`). Sem RLS/triggers — o app valida JWT no backend.
   >
   > **Alternativa sem CLI:** abra o *SQL Editor* do painel Supabase, cole o conteúdo de
   > `supabase/migrations/20260830000100_init.sql` e execute.
3. **NÃO** rode `supabase/seed.sql` em produção (é só para dev local). O usuário admin de
   produção é criado pelo bootstrap da API (Etapa 3).
4. Obtenha a connection string do Postgres. No painel Supabase → *Project Settings* → *Database*
   → *Connection string* (modo **Transaction**, porta 5432) ou via *Pooler*. Formato:
   ```
   postgresql://postgres.<REF>:<SENHA>@aws-0-<regiao>.pooler.supabase.com:5432/postgres
   ```
   > O backend aceita tanto `postgres://` quanto `postgresql://`.

---

## Etapa 2 — Render (backend)

O arquivo `render.yaml` já está configurado (Docker, disco persistente, healthcheck, CORS).
Você pode **Blueprints** (conectar o repo e a Render lê o `render.yaml`) ou criar o Web Service
manualmente apontando para `backend/Dockerfile`.

1. Crie/use o serviço **Web Service** chamado `jgsistemas-backend` a partir do repositório,
   `dockerfilePath: ./backend/Dockerfile`, plano **free**, região **oregon**.
2. **Disco persistente** (obrigatório para não perder uploads): nome `jgsistemas-data`,
   mount path `/data`, tamanho `1` GB.
3. **Variáveis de ambiente** — preencha no painel da Render (valores com "sync: false"
   no render.yaml devem ser digitados manualmente):

   | Variável | Valor |
   |---|---|
   | `DATABASE_URL` | connection string Supabase da Etapa 1 (obrigatório) |
   | `SECRET_KEY` | gere: `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
   | `RESEND_API_KEY` | sua API key do Resend (painel Resend → API Keys) |
   | `RESEND_FROM` | remetente verificado, ex.: `no-reply@seudominio.com` |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` |
   | `CORS_ORIGINS` | `https://jgsistemas.vercel.app,http://localhost:5173,http://localhost:5174` |
   | `FRONTEND_URL` | `https://jgsistemas.vercel.app` |
   | `ENVIRONMENT` | `production` |
   | `DATA_DIR` | `/data` |
   | `UPLOAD_DIR` | `/data/uploads` |

   > **Importante:** em produção, se `DATABASE_URL` estiver ausente ou sem scheme PostgreSQL,
   > o backend **recusa iniciar** (falha rápida) — não degrada para SQLite no filesystem
   > efêmero, o que causaria perda de dados.
4. Ajuste o **healthcheck**: o render.yaml usa `healthCheckPath: /api/health` (o Dockerfile
   também tem `HEALTHCHECK` interno).
5. Salve e deixe a Render fazer o build/deploy. Acompanhe os logs até ver o serviço "Live".
   Teste: `curl https://jgsistemas-backend.onrender.com/api/health` → `{"status":"ok",...}`.

---

## Etapa 3 — Criar o admin de produção

Com o backend no ar, crie o primeiro usuário (admin) via API — o registro só é aberto
enquanto não existir nenhum usuário:

```bash
curl -X POST https://jgsistemas-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@escola.com","password":"<SENHA-FORTE>","role":"admin"}'
```

> Após o primeiro cadastro, novos registros exigem login de um admin.

---

## Etapa 4 — Vercel (frontend)

1. Importe o repositório na Vercel **na raiz** (o `vercel.json` já define o build).
2. O projeto será criado como `jgsistemas` (`https://jgsistemas.vercel.app`).
3. Confirme as configurações do `vercel.json`:
   - `buildCommand`: `cd frontend && npm ci && npm run build`
   - `outputDirectory`: `frontend/dist`
   - `rewrites`: `/api/*` e `/uploads/*` → `https://jgsistemas-backend.onrender.com/...`
     (SPA fallback `/(.*)` → `/index.html`)
4. **Nenhuma env var VITE_* é necessária** no frontend — a API é relativa (`/api`).
5. Deploy. Teste o fluxo: login, logo (`/uploads`), download de PDFs/Excel (blob), reset de senha.

---

## Etapa 5 — Validação end-to-end

Checklist pós-deploy:

- [ ] `GET /api/health` responde `ok` no Render.
- [ ] Login no `https://jgsistemas.vercel.app` funciona.
- [ ] Logo aparece (chamada `/uploads` proxied).
- [ ] Cadastro de aluno com upload de documento/foto persiste entre deploys (disco `/data`).
- [ ] PDF de boletim/certificado e exportação Excel são baixados.
- [ ] Reset de senha chega por e-mail via Resend e o link funciona (30 min).

---

## Notas e decisões

- **Não** versione `frontend_dist/` (build). O Render é API-only; o SPA fica na Vercel.
- **Migração de dados existente:** se houver banco SQLite com dados reais a migrar, use
  `backend/scripts/migrate_sqlite_to_postgres.py` antes do go-live (o banco atual só tem
  dados de teste E2E, decidiu-se começar limpo).
- **Evolução de schema** sem Alembic: adicione arquivos de migração em `supabase/migrations/`
  e rode `supabase db push` (ou SQL manual). O `create_all` do startup cria tabelas novas,
  mas **não** adiciona colunas a tabelas existentes.
- **Plano abandonado:** havia um plano (docs/deploy-vercel-seguranca) de reescrever o backend
  como Supabase Edge Functions (Deno). Ele foi substituído pela opção 1 (FastAPI no Render +
  Supabase Postgres). O `supabase/` hoje contém apenas schema/seed — sem Edge Functions.
