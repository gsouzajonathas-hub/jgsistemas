# Deploy e infraestrutura — Vercel (frontend)

> Mapeado a partir do código e de observação empírica (HTTP em produção, 2026-09-05). Onde o código não deixa claro, `NÃO DETERMINADO`.

## O que é e onde vive

- `frontend/` — root directory do projeto Vercel "jgsistemas": React + TypeScript + Vite, build em `frontend/vite.config.ts` (saída `dist`).
- `frontend/.vercel/project.json` — âncora do deploy: projeto `prj_RANJgKpUDVwHczWNBc12R98raysc` (org `team_THFE2H8TesKYPkyxr9vbCezV`, nome `jgsistemas`).
- `vercel.json` (raiz) — config de deploy **ignorada** pela Vercel (está fora do root directory).
- `.vercel/project.json` (raiz) — mesmo `projectId` do `frontend/` (link antigo; não é a âncora ativa).
- Backend hospedado à parte: Render — `https://jgsistemas-backend.onrender.com` (health 200).

Papel da área: servir a SPA e fazer proxy de `/api/*` e `/uploads/*` para o backend no Render.

## Contrato de entrada

- `vercel.json` define: `rewrites` de `/api/:path*` e `/uploads/:path*` → `https://jgsistemas-backend.onrender.com/:path*`, e fallback SPA `/(.*)` → `/index.html`.
- A Vercel lê `vercel.json` **somente dentro do root directory** do projeto (`frontend/`). Config fora dele é ignorada.

## Contrato de saída

- `GET /` → HTML da SPA (200).
- `GET /login` (e demais rotas SPA) → `index.html` via fallback (200).
- `GET /api/*` e `GET /uploads/*` → resposta do backend Render via rewrite (proxy).
- Sem fallback/rewrites: qualquer rota além de arquivos estáticos existentes retorna 404 da edge; `/api/*` retorna 404 sem tocar o backend.

## Estrutura de dados

N/A — infraestrutura, sem banco de dados. Dados de negócio ficam no backend (Render, SQLite/Postgres).

## Funções e trechos relevantes

`vercel.json` (raiz, 2026-09-05 — a ser substituído pelo `frontend/vercel.json`):
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd frontend && npm ci && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://jgsistemas-backend.onrender.com/api/:path*" },
    { "source": "/uploads/:path*", "destination": "https://jgsistemas-backend.onrender.com/uploads/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
`vercel.json:1-18`

`frontend/.vercel/project.json` (âncora do deploy):
```json
{
  "projectId": "prj_RANJgKpUDVwHczWNBc12R98raysc",
  "orgId": "team_THFE2H8TesKYPkyxr9vbCezV",
  "projectName": "jgsistemas"
}
```
`frontend/.vercel/project.json:1-6`

## Quem chama e quem é chamado

**Chamadores:** navegador do cliente (`GET /`, `/login`, `/api/*`); edge da Vercel (aplica rewrites e fallback do `vercel.json` do root directory).

**Dependências:** backend Render (`https://jgsistemas-backend.onrender.com/api/*` e `/uploads/*`) — fronteira HTTP atravessada pelos rewrites.

## Testes existentes

Nenhum teste de config de deploy no repositório. Não há teste que valide a presença/estrutura do `vercel.json` dentro do root directory.

## Limites e regras de negócio conhecidas

- A Vercel só lê `vercel.json` do root directory do projeto — config em outra pasta é ignorada (regra de plataforma).
- Fallback SPA `/(.*)` → `/index.html` é necessário porque o frontend usa React Router com rotas client-side.
- Backend e uploads vivem fora da Vercel — sem rewrite, `/api/*` e `/uploads/*` quebram em produção.

## Riscos para esta ocorrência

- O fix só vale após um novo deploy da Vercel (o commit/push precisa chegar ao projeto — integração git ou `vercel --prod`).
- Se o redeploy não acontecer, o sistema continua com F5/login/API quebrados — não confundir "config corrigida no repo" com "produção corrigida".
- Remover o `vercel.json` da raiz não afeta o deploy atual (ele já é ignorado), mas elimina a dupla fonte de verdade.

## Fonte

`vercel.json` (raiz), `frontend/.vercel/project.json`, `.vercel/project.json` (raiz), `git log -- frontend/vercel.json` (commits `1d157ce`, `bc9b278`, `3d66a7b`, `ed9d1f6`), observação empírica com HTTP em produção (2026-09-05) — mapeado em 2026-09-05