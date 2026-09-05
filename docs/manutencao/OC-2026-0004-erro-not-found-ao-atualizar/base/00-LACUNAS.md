# Lacunas da base

- Configuração real do projeto na Vercel (Root Directory, Framework Preset, variáveis de ambiente, deploy ativo) **não verificável pelo runx**: CLI sem autenticação (`~/.vercel/auth.json` ausente) e sem acesso ao dashboard. O Root Directory = `frontend/` é inferido por evidência indireta — `frontend/.vercel/project.json` com o mesmo `projectId`, histórico do `vercel.json` (sempre em `frontend/` até `ed9d1f6`) e comportamento observado (rewrites inativos).
- Sem acesso a logs do lado da Vercel (deploy logs, edge logs) — a comprovação foi feita por observação empírica HTTP.