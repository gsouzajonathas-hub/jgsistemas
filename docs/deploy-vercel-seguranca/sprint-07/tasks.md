# Sprint 07 — Tasks

Caminhos relativos à raiz do repositório. Status inicial de toda task: `pendente`.

---

## T-07.01 | Confirmar contrato axios baseURL /api no frontend

- **objetivo**: Garantir que o frontend usa `baseURL: "/api"` (não aponta para :8000) e que nenhum endpoint chamado mude de path após a migração.
- **cria**: `supabase/functions/app/ROTA-MAP.md` (mapa rota FastAPI → `/api/*` Edge Function)
- **altera**: — (somente validação/leitura)
- **teste_integracao**: scan de `frontend/src` confirma `axios.create({ baseURL: "/api" })` e zero ocorrências de `:8000`/`localhost:8000`.
- **teste_funcional**: `npm run build` no frontend conclui sem erros de import.
- **criterio_aceite**: baseURL `/api` intacto e build do frontend OK.
- **depende_de**: nenhuma (auditoria) — mas bloqueia T-07.03
- **paralelizavel**: false
- **status**: pendente

---

## T-07.02 | Remover supabase-sync do backend e código supabase do frontend

- **objetivo**: Aplicar D-05: excluir rota `supabase-sync` do FastAPI e qualquer import de `@supabase/supabase-js` no frontend.
- **cria**: — 
- **altera**: `backend/app/routes/supabase_sync.py` (remover registro em main), `frontend/src/**` (remover hooks supabase/login)
- **teste_integracao**: grep no backend não encontra `supabase_sync`; grep no frontend não encontra `@supabase/supabase-js`.
- **teste_funcional**: testes do frontend (vitest) continuam verdes após remoção.
- **criterio_aceite**: código supabase removido sem regressão no build/testes frontend.
- **depende_de**: T-07.01
- **paralelizavel**: false
- **status**: pendente

---

## T-07.03 | Configs de deploy (Vercel rewrite → Edge Function app)

- **objetivo**: Criar `vercel.json` com rewrite `/api/:path*` → `https://<ref>.supabase.co/functions/v1/app/:path*` e doc de variáveis (CORS_ORIGINS, FRONTEND_URL, SECRET_KEY); desativar render.yaml.
- **cria**: `vercel.json`, `supabase/functions/app/.env.example` (SECRET_KEY/SUPABASE_URL/ANON/SERVICE_ROLE/RESEND_API_KEY/RESEND_FROM/CORS_ORIGINS/FRONTEND_URL)
- **altera**: `render.yaml` (marcar descontinuado — sem deploy ativo)
- **teste_integracao**: `vercel.json` parseia como JSON válido com `rewrites` apontando para o URL da function.
- **teste_funcional**: doc explica como `supabase link` + `supabase functions deploy app` completam o deploy quando credentials chegarem (PENDENTE-01).
- **criterio_aceite**: config de deploy pronta e documentada (aplicação real aguardando credencial).
- **depende_de**: T-07.01
- **paralelizavel**: true
- **status**: pendente

---

## T-07.04 | Relatório técnico final em PT

- **objetivo**: Redigir relatório técnico final consolidando arquitetura, módulos, libs, testes, decisões e pendências, com tempo total registrado (D-14).
- **cria**: `docs/deploy-vercel-seguranca/RELATORIO-TECNICO.md`
- **altera**: —
- **teste_integracao**: relatório lista cada sprint/endpoint migrado e o status de teste correspondente.
- **teste_funcional**: seção "Pendências" cobre PENDENTE-01..03 e o que falta para deploy real.
- **criterio_aceite**: relatório completo, factual, em PT, coerente com o código.
- **depende_de**: todas as sprints anteriores (estado final)
- **paralelizavel**: false
- **status**: pendente

---

> **Total: 4 tasks.**