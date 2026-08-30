# Índice da Base de Conhecimento

| Arquivo | Resumo |
|---|---|
| 01-seguranca-backend.md | Estado factual da segurança do backend: JWT/bcrypt, CORS, uploads, headers, injeção, rate limit, auditoria, dependências, health/docs. Lacunas: HSTS, CSP global, lockout, rate limit global, deps não pinadas, SPA catch-all. |
| 02-seguranca-frontend.md | Estado factual da segurança do frontend: JWT em localStorage, api.ts, secrets (VERCEL_OIDC_TOKEN em .env.local não versionado), sem CSP, superfície XSS reduzida, rotas de dados sensíveis. |
| 03-infra-deploy-atual.md | Arquitetura de deploy atual: frontend Vercel (vercel.json) + backend Render (render.yaml), Dockerfiles, docker-compose, fly.toml, .env.example, README. |
| 04-vercel-deploy.md | Documentação oficial Vercel (2026-08-30): headers/rewrites (proxy externo ok), Python/FastAPI nativo ASGI, limites Hobby (500MB Python, 4,5MB body, 300s, 1 regra rate limit, 3 custom rules, 100 deploys/dia, 2048 rotas), WAF, env vars VITE_*, SPA fallback. SQLite não persiste em serverless (limite estrutural). |