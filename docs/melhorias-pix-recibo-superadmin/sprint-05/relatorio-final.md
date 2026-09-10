# Relatório Final — Sprint 05 / OC-2026-0003

Data de fechamento: 2026-09-05 · Commits: `9c7e3be` (features), `04c7182` + `4ff3e48` (docs) · Branch `main`, sincronizada (`git push origin main` OK).

## Entregas (produção)

| Entrega | Status | Evidência |
|---|---|---|
| 1. Chave PIX persiste ao reabrir o modal Configurações + QR Code no carnê | ✅ LIVE | QA E4 #1: `PUT /api/settings` (chave QA) → 200; `GET /api/settings` reaberto → chave idêntica (persistência OK) |
| 2. Botão "Recibo" em cada venda de Material Didático baixando PDF `REC-{ano}-{contagem:05d}` | ✅ LIVE | QA E4 #2: venda id=4 → `GET /api/materials/sales/4/receipt` → 200, `application/pdf`, `filename="recibo-REC-2026-00004.pdf"`, assinatura `%PDF` válida |
| 3. Conta Super Admin de suporte (seed via env vars, acesso total, auditoria destacada) | ✅ LIVE | id 2 "Suporte", role `super_admin`, login 200; auditoria logs 80–82 + `superadmin.seed` com `actor_role` |
| 4. Permissões usuários (criar/excluir só admin; proteção do super admin) | ✅ aceito (sprints 01–04) | pytest 77 passed; guards de exclusão testados |

## Ambiente de produção

- **Frontend:** https://jgsistemas.vercel.app (deploy via Vercel CLI, token do usuário; health 200)
- **Backend:** https://jgsistemas-backend.onrender.com (deploy `dep-dae1cr8n74is73bvvsmg` **live**, commit `9c7e3be`)
- **Banco:** Supabase Postgres 17 (pooler `aws-0-us-west-2.pooler.supabase.com`), 27 tabelas; migração aditiva `actor_role` aplicada (9 colunas em `audit_logs`)
- **Env vars do Render:** 17 chaves restauradas via API per-key (SECRET_KEY nova + bloco PG + RESEND_* + SUPPORT_ADMIN_* + demais)

## Bloqueios

Todos os 5 bloqueios resolvidos/superados: B-01 (senha admin desconhecida → contorna com super admin), B-02 (deploy Vercel CLI), B-03 (redeploy Render via API — a API do Render agora é o caminho), B-04 (token Vercel fornecido), B-05 (env vars substituídas sem SECRET_KEY → restauradas). Registro em `00-BLOQUEIOS.md` e `01-BLOQUEIOS-RESOLVIDOS.md`.

## QA funcional E4 (produção, conta super admin)

1. **PIX persistente:** OK (ver evidência acima). Dados de QA limpos (pix_key revertida).
2. **Recibo PDF:** OK (ver evidência acima). Venda fictícia removida após validação; estoque reposto (material 1 = 5); vendas reais 1–3 preservadas.
3. **Auditoria com tipo de ator:** OK — ações do suporte registradas com `actor_role: "super_admin"`.

## Recomendações

1. **SEGURANÇA (prioridade alta):** a senha do banco de produção (`***REDACTED***`) foi exposta na mensagem do commit público `74c2a05`. Fazer **Reset database password** no painel do Supabase (Settings → Database → Reset database password) e atualizar a env `PGPASSWORD` no Render + redeploy. — **CONCLUÍDO 2026-09-05:** senha rotacionada pelo usuário, `PGPASSWORD` atualizada no Render, redeploy `dep-dae20pad0e5s73er2m30` live, health 200, super admin logando com sucesso. Pendência opcional: reescrever o histórico git (o valor antigo permanece na mensagem do commit `74c2a05`).
2. **Rotina de suporte:** a senha da conta de suporte SÓ muda pelo fluxo "esqueci minha senha" (link por e-mail). O seed cria a conta no primeiro boot com `SUPPORT_ADMIN_PASSWORD` e, em reinícios seguintes, sincroniza apenas role/nome/status — **nunca sobrescreve a senha** (correção 2026-09-10: antes o seed revertia a hash a cada startup, derrubando o login após logout/redeploy). Emergência: excluir a conta na tela de usuários — ela é recriada no próximo boot com a senha da env.
3. **Limpeza da manutenção:** ~18 meses úteis sem manutenção do código — considerar atualização de dependências (FastAPI, SQLAlchemy) em uma próxima janela.
4. **Achado BAIXA registrado:** `GET /api/settings` devolve `primary_color` nulo se nunca salvo (schema espera string) — o frontend envia sempre, sem impacto atual; corrigir devolvendo o default no GET.