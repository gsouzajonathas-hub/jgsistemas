# Deploy na Vercel — Documentação oficial (modo EXTERNO)

> Fatos extraídos da documentação oficial da Vercel (vercel.com/docs) em 2026-08-30 via fetch direto das URLs listadas em cada item. Número sempre com a URL de origem ao lado.

## Contrato de entrada

- **Headers via vercel.json** (config `headers`): a página oficial redireciona para `/docs/headers` (System Headers); a sintaxe `source/headers/has` não é exibida ali — aponta para `/docs/project-configuration/vercel-json#headers` (https://vercel.com/docs/edge-network/headers). Usos documentados da página: cache-control, accept-encoding e headers customizados. Suporte a X-Frame-Options/CSP/HSTS/X-Content-Type-Options: NÃO DOCUMENTADO nessa página (link relacionado "CDN security" menciona "security headers").
- **Rewrites**: `"rewrites": [{ "source": "...", "destination": "..." }]` em vercel.json; suporta wildcards (`:path*`), regex com capture groups nomeados e condição `has` (ex.: header `x-vercel-ip-country`). Rewrite para origem externa é o padrão documentado: `"source": "/api/:path*", "destination": "https://api.example.com/:path*"` (https://vercel.com/docs/edge-network/rewrites). Precedência rewrites-vs-headers: NÃO DOCUMENTADO.
- **Python**: runtime Python suportado para Functions; executa apps **ASGI e WSGI nativamente**; **FastAPI sem adapter** (detecção via requirements.txt/pyproject.toml/Pipfile; `app = FastAPI()`); entrypoints `app.py|index.py|server.py|main.py|wsgi.py|asgi.py` ou `src/`/`app/`, custom via `tool.vercel.entrypoint`; versões 3.12 (default), 3.13, 3.14; funções file-based em `/api` seguem suportadas (https://vercel.com/docs/functions/runtimes/python).
- **Vite**: Vercel detecta Vite automaticamente; SPA fallback oficial `"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]`; system env vars acessíveis no build com prefixo `VITE_` (ex.: `VITE_VERCEL_ENV`); modo Multi-Page App recomendado para produção (https://vercel.com/docs/frameworks/vite). `buildCommand`/`outputDirectory` na página Vite: NÃO DOCUMENTADO.

## Contrato de saída

- O que a Vercel devolve ao deployar SPA: site estático servido pelo edge; rewrites resolvidos em ordem; `/api/*` e `/uploads/*` podem ser proxy externo.
- Env vars: Production, Preview, Custom e Development; mudanças valem só para deployments novos (https://vercel.com/docs/projects/environment-variables).

## Limites e cotas

- Function bundle (uncompressed): **250 MB**; **500 MB para Python**; large functions até 5 GB (beta, Fluid compute) (https://vercel.com/docs/functions/limitations).
- Memória: Hobby **2 GB / 1 vCPU** (default e máx.); Pro/Ent 4 GB / 2 vCPU (idem).
- Duração: Hobby **300s default e máximo**; Pro/Ent 300s default, 800s máx, 1800s extended beta (idem).
- Request/response body: **4,5 MB** (413 `FUNCTION_PAYLOAD_TOO_LARGE`) (idem).
- File descriptors: **1.024** (idem).
- Filesystem efêmero/persistência de SQLite entre invocações: **NÃO DOCUMENTADO** na página de limitations (https://vercel.com/docs/functions/limitations) — fato conhecido da plataforma: funções serverless têm filesystem efêmero (NÃO DOCUMENTADO nas páginas fetchadas).
- Env vars: **64 KB por deployment** (Node/Python/Ruby/Go/PHP); Edge/Middleware 5 KB por var; **1000 vars por ambiente por projeto** (https://vercel.com/docs/projects/environment-variables + https://vercel.com/docs/limits/overview).
- WAF: IP blocking Hobby **até 3**, Pro 100, Ent 1000 (project-level); custom rules Hobby **até 3**, Pro 40, Ent 1000; managed rulesets N/A Hobby/Pro (Enterprise); mudanças valem em 300ms (https://vercel.com/docs/security/vercel-waf).
- Rate limiting WAF: Hobby **1 regra por projeto**, **1.000.000 requests incluídos**, fixed window 10s–10min, counting keys IP + JA4 Digest; excesso → default 429 ou Log/Deny/Challenge; contagem por região (https://vercel.com/docs/security/vercel-waf/rate-limiting).
- Deployments/dia Hobby: **100**; builds/hora: **100**; build time máx: **45 min** (https://vercel.com/docs/limits/overview).
- Rotas por deployment: **2.048** (rewrites+redirects+headers contam como rotas) (idem).
- Static upload CLI: Hobby **100 MB**; **15.000 arquivos** por deploy; disk 32 GB; 200 projetos; 50 domínios/projeto (idem).
- Proxied request timeout: **120s** (`ROUTER_EXTERNAL_TARGET_ERROR`) (idem).
- Runtime logs Hobby: **1 hora** (número truncado no fetch; texto indica "hour on Hobby") (idem).
- Tabela "Usage summary" (bandwidth/CPU/invocations): valores numéricos NÃO renderizados no fetch — NÃO DOCUMENTADO.

## Erros conhecidos e tratamento

- 413 `FUNCTION_PAYLOAD_TOO_LARGE`: corpo > 4,5 MB (https://vercel.com/docs/functions/limitations).
- `ROUTER_EXTERNAL_TARGET_ERROR`: timeout de 120s no proxy de rewrites externos (https://vercel.com/docs/limits/overview).
- Excesso de rate limit WAF → HTTP 429 (configurável) (https://vercel.com/docs/security/vercel-waf/rate-limiting).
- OIDC docs (`/docs/accounts/oidc`): **404** no acesso em 2026-08-30 — NÃO DOCUMENTADO.

## Riscos para a nossa implementação

1. **Se o backend for para a Vercel**: bundle 500 MB ok, mas filesystem efêmero → **SQLite não persiste**; banco precisa ser Postgres externo (Supabase/Neon/Render) e **uploads precisam de storage externo** (não persistem no filesystem efêmero). Retornos de busca: NÃO DOCUMENTADO nas páginas fetchadas, mas é limitação estrutural de serverless.
2. **Hobby**: 1 regra de rate limit, 3 custom rules, 3 IP blocks — suficiente para proteção básica; managed rulesets (OWASP CRS) indisponível no Hobby.
3. **1M requests incluídos** no rate limit — escola pequena ok; monitorar.
4. Rewrite externo com timeout 120s — chamadas longas do backend (geração de PDF/report) devem ficar abaixo disso ou virar async.
5. Arquitetura atual (frontend Vercel + backend Render) já usa o padrão documentado de rewrite externo (`vercel.json:5-13`).
6. Env vars VITE_* devem existir no projeto Vercel (Production/Preview) para o build do frontend.

## Fonte

- Fetch direto em 2026-08-30 das URLs citadas em cada item (domínio vercel.com/docs). Extração feita pelo agente librarian (sessão bg_1504775c).