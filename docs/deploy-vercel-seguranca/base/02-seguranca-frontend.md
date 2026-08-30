# Segurança do Frontend (estado atual)

> Fonte: auditoria factual por leitura de código em 2026-08-30 (referências `arquivo:linha`).

## Contrato de entrada

- Token JWT: lido de `localStorage` (`frontend/src/contexts/AuthContext.tsx:22-23,37-38,43-44,53,65-66`; `frontend/src/services/api.ts:10,21-22`). Persistência em localStorage (não cookie HttpOnly).
- API client: axios com `baseURL: '/api'` relativa (não hardcoded de domínio, `api.ts:4-7`); request interceptor injeta `Authorization: Bearer <token>` (`api.ts:9-15`); response interceptor em 401 remove token e dispara `auth:logout` (`api.ts:17-27`).
- Login com fluxo de reset de senha via query string: `Login.tsx:8-9` lê `token`/`email` de `useSearchParams`.
- Supabase: `frontend/src/services/supabase.ts:3-4` usa `import.meta.env.VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` — não há valores em `.env` do frontend (só `.env.local` que não os define).

## Contrato de saída

- Rotas protegidas por `ProtectedRoute`/`PermissionRoute` (`App.tsx:69-88`): /students, /students/:id, /enrollments, /boletins, /certificates, /financial, /planos, /contratos, /mensalidades, /carnes, /reports, /audit, /settings.
- Rota `/` (Dashboard) com aniversariantes e inadimplentes (`Dashboard.tsx:31,143`) — dados pessoais no menu inicial para usuário logado.
- PDFs: `window.open(url, '_blank')` apenas com blob URLs geradas pelo backend (`Carnes.tsx:101,822`, `Contratos.tsx:25`, `Planos.tsx:528`, `StudentProfile.tsx:71`).

## Limites e cotas

- NÃO DOCUMENTADO: não há config de timeouts/límites no axios além do default (sem `timeout` explícito em `api.ts`).

## Erros conhecidos e tratamento

- 401 de qualquer endpoint (exceto `/auth/login`): remove token do localStorage e dispara evento `auth:logout` (`api.ts:17-27`).
- NÃO DOCUMENTADO: tratamento de erros de rede 5xx/CORS no cliente.

## Riscos para a nossa implementação

1. **JWT em localStorage** → vulnerável a exfiltração via XSS (`AuthContext.tsx:37-38`, `api.ts:10-12`). Candidato a migração para cookie HttpOnly (mesmo domínio) ou mitigação com CSP estrito.
2. **`frontend/.env.local:2` contém `VERCEL_OIDC_TOKEN` real (JWT OIDC da Vercel)** — arquivo NÃO está no git (verificado: `frontend/.gitignore:2` ignora `.env*`; `git ls-files` não retorna o arquivo; `git check-ignore` confirma). O segredo existe no disco e é válido (plan hobby, env development). Rotacionar/revogar na Vercel e remover o valor do arquivo local.
3. **CSP: NÃO EXISTE** em `frontend/index.html` (sem `<meta http-equiv="Content-Security-Policy">`, há `<script>` inline de tema nas linhas 8-14).
4. **`SECRET_KEY` real no `.env` raiz** (linha 40, valor encontrado pela auditoria) — fora do git, segredo vivo; rotacionar antes do deploy.
5. **Superfície XSS reduzida** (fato positivo): NÃO EXISTE `dangerouslySetInnerHTML`/`innerHTML`, `eval`/`new Function`, `iframe`, `postMessage`, `<a target="_blank">` sem rel, nem redirects com input do usuário (grep sem matches). Renderização via JSX (React escapa por padrão).
6. **`VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` não definidos em nenhum `.env` do frontend** → em produção, Supabase fica desconfigurado a menos que as vars sejam injetadas no build da Vercel. Verificar como o deploy define as vars VITE_* (Vercel precisa delas no projeto).
7. **Caminho do back em produção**: rewrite de `vercel.json` `/api/:path*` → `https://jgsistemas-backend.onrender.com/api/:path*` (Vercel), e `/uploads/:path*` idem. Sem `VITE_API_URL`; baseURL relativa. Qualquer migração de backend exige ajustar `vercel.json`.
8. `.env.example` do frontend: NÃO EXISTE (só raiz/backend). `frontend/.env.production` NÃO EXISTE.

## Fonte

- Leitura direta de código-fonte `frontend/src/**` em 2026-08-30 (referências linha-a-linha acima). Auditoria executada pelo agente explore (sessão bg_f759afd0).