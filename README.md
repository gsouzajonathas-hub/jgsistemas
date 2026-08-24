# Gestão Escolar - JG Sistemas

Sistema completo para gerenciamento escolar.

## Tecnologias

- **Frontend:** React + TypeScript + Tailwind CSS + Vite
- **Backend:** Python FastAPI + SQLAlchemy + PostgreSQL
- **Auth:** JWT (JSON Web Tokens)
- **Infra:** Docker + Docker Compose

## Como Executar

### Com Docker (Recomendado)

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/docs

### Desenvolvimento Local

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Usuário Padrão

Na primeira execução (bootstrap), crie o usuário administrador via API ou rodando `start.ps1`
(o script gera uma senha aleatória e exibe uma única vez no console):

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@escola.com","password":"<senha-forte>","role":"admin"}'
```

> **Segurança:** após o primeiro usuário, o registro de novos usuários passa a exigir
> login de um administrador. Troque a `SECRET_KEY` (veja abaixo) antes de qualquer uso real.

## Segurança

- **SECRET_KEY** é obrigatória e o backend **recusa iniciar** com a chave padrão. Gere uma:
  `python -c "import secrets; print(secrets.token_urlsafe(48))"`
- **Redefinição de senha** usa link único com validade de 30 minutos (token único). Sem SMTP
  configurado, o link é exibido no console do backend para uso local.
- **Uploads** validados por extensão, MIME e conteúdo real; limite de 5 MB; bloqueio de
  arquivos executáveis/HTML.
- **Login** com limite de tentativas por IP e respostas genéricas (sem enumeração de usuários).
- **CORS** restrito às origens em `CORS_ORIGINS` (nunca `*` com credenciais).
- **Trilha de auditoria** registra logins, usuários, alunos, configurações e certificados
  (visível para admin em `GET /api/audit`).

## Como Atualizar (git)

O projeto é versionado com git. **Os dados de cada cliente (banco e uploads) ficam FORA do repositório** via variáveis `DATA_DIR` e `UPLOAD_DIR` — nunca são sobrescritos pelo `git pull`.

1. Na máquina do desenvolvedor: commitar as melhorias e criar a tag da versão:
   ```bash
   git add -A && git commit -m "melhorias" && git tag v1.1 && git push --tags
   ```
2. No servidor/cliente (checkout do código):
   ```bash
   git fetch && git checkout v1.1   # ou git pull na main
   cd backend && pip install -r requirements.txt
   cd ../frontend && npm ci && npm run build
   ```
3. Reiniciar o backend — as migrações de banco rodam sozinhas no startup.
4. Conferir `http://localhost:8000/api/health` e testar o login.

**Antes de qualquer atualização, faça backup:** copie a pasta de dados (onde ficam `escola.db` e `uploads/`).

**Rollback:** `git checkout <versão-anterior>` e restaurar o backup, depois reiniciar.

## Variáveis de Ambiente

Configure em um arquivo `.env` (veja `.env.example`):

| Variável | Descrição | Default |
|---|---|---|
| `DATA_DIR` | Pasta do banco SQLite (`escola.db`) | pasta `backend/` |
| `UPLOAD_DIR` | Pasta de uploads e logos | `backend/uploads` |
| `DATABASE_URL` | Postgres (ex.: `postgresql://...`) ou SQLite (`sqlite:///caminho`) | SQLite local |
| `SECRET_KEY` | Chave do JWT (obrigatória; o backend não inicia com a padrão) | - |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Validade do token | `60` |
| `CORS_ORIGINS` | Origens permitidas (separadas por vírgula) | localhost |
| `FRONTEND_URL` | URL pública do frontend (links de redefinição de senha) | `http://localhost:5173` |
| `SMTP_HOST/PORT/USER/PASS/FROM` | Envio de e-mail | - |
| `ZAPI_INSTANCE_URL` / `ZAPI_TOKEN` | WhatsApp (Z-API) | - |

## Módulos

1. **Login** - Autenticação JWT com recuperação de senha
2. **Dashboard** - Visão geral com gráficos e indicadores
3. **Alunos** - Cadastro completo com upload de documentos
4. **Turmas** - Gerenciamento de turmas e horários
5. **Matrículas** - Matrículas com renovação, cancelamento e trancamento
6. **Frequência** - Controle de presença com relatórios
7. **Avaliações** - Provas, trabalhos e cálculo de média
8. **Financeiro** - Mensalidades, pagamentos e planos
9. **Agenda** - Calendário de eventos
10. **Comunicação** - WhatsApp, Email e SMS
11. **Relatórios** - Exportação PDF e Excel
12. **Pesquisa** - Busca inteligente em todo o sistema
13. **Perfil do Aluno** - Página completa com histórico
14. **Configurações** - Logo, cores, usuários e permissões
