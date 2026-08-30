# Índice da Base de Conhecimento

Lista dos arquivos da base `docs/analise-sistema/base/`:

- `00-INDICE.md` — Este índice.
- `00-LACUNAS.md` — Lacunas confirmadas no código (frontend órfão, routers backend não registrados, models sem tabela, testes ausentes).
- `01-backend-nucleo.md` — Núcleo backend: FastAPI app, lifespan, JWT, rate limits, CORS, todos os 21 models e tabelas, limitações de upload/pool.
- `02-api-rotas.md` — Contrato completo da API: 14 routers registrados (método/caminho/auth/body/saída/erros) + 7 routers dormentes não registrados.
- `03-servicos-integracoes.md` — Serviços e integrações: PDFs (ReportLab), WhatsApp Z-API, SMTP, PIX BR Code, uploads, auditoria, migração SQLite→Postgres.
- `04-frontend.md` — Frontend: package.json, Vite/Tailwind, rotas do App.tsx, api.ts (15 grupos), types, contextos, 12 componentes de UI, páginas e os 5 arquivos órfãos quebrados.
- `05-configuracao-infra.md` — Configuração e infra: env vars, Docker Compose/Dockerfiles, Render, Vercel, start.bat/start.ps1 (bootstrap admin), migração.
- `06-testes.md` — Varredura de testes: nenhum teste automatizado em todo o repositório (backend, frontend, scripts).