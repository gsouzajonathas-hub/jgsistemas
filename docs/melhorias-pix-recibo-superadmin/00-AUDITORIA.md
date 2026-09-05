# Auditoria — melhorias-pix-recibo-superadmin

Data: 2026-09-04 (atualizada 2026-09-05 na F6)

| severidade | arquivo | problema | correção sugerida |
|---|---|---|---|
| MÉDIA | 00-BLOQUEIOS.md | Arquivo diz "Nenhum bloqueio registrado", mas ORQUESTRADOR.md (§2) e sprint-05/sprint.md citam B-01 (senha admin), B-02 (deploy manual via CLI) e B-03 (redeploy Render) como bloqueios vigentes — executor em retomada não encontrará o registro. | Antes da F6, registrar formalmente B-01/B-02/B-03 em 00-BLOQUEIOS.md no formato `B-NN | task | bloqueio | o que destravaria` (o sprint-05/sprint.md já lista; falta o arquivo). |
| MÉDIA | sprint-05/tasks.md (T-05.03) | Criterio_aceite exige conta super admin criada, que depende de ação humana (usuário definir SUPPORT_ADMIN_EMAIL/SUPPORT_ADMIN_PASSWORD no painel do Render — segredo que o agente não escreve). Mitigação existe no sprint-05/sprint.md ("registrar pendência"), mas a task não declara o tratamento "env var ausente". | Na execução: se as env vars não estiverem definidas, registrar bloqueio B-NN em 00-BLOQUEIOS.md, marcar a task `bloqueada` e seguir o que for possível (regra 4 de autonomia); o critério de saída da sprint-05 já aceita "pendência registrada com motivo concreto". |
| MÉDIA | backend/app/routes/auth.py (DELETE /users/{id}), base 03-AREA-auth-roles.md R5 | A conta `super_admin` pode ser excluída por engano via DELETE /users/{id} por outro admin — a base pede "não deve poder ser excluída por engano"; T-04.02 protege rebaixamento (PUT) mas não exclusão (DELETE); reposição só acontece no próximo boot do seed. | **CORRIGIDO na F6 (2026-09-05):** guarda adicionada em `delete_user` (400 "Não é possível excluir a conta de suporte (super admin)") + teste `test_exclusao_de_super_admin_bloqueada`; suíte 77 passed. |
| BAIXA | base 02-AREA-venda-materiais.md R3 | A base registra R3 (endpoint de recibo protegido apenas por autenticação, mais permissivo que escrita) com "decisão a validar na F2"; o plano (T-03.02) mantém o comportamento sem uma decisão D-NN explícita. | Registrar decisão D-NN "recibo de material exige apenas autenticação (dado não sensível, consistente com recibo financeiro)" ou ajustar a proteção na Sprint-03. |
| BAIXA | sprint-02/tasks.md (T-02.02) | `paralelizavel: true` sem paralelo real: na F-02.1, T-02.01 e T-02.03 são `false` e o paralelismo entre fases (F-02.1 ∥ F-02.2) é cross-stack — o atributo pode sugerir paralelismo inexistente. | Inofensivo para a execução (não conflita arquivos); se quiser clareza, trocar para `paralelizavel: false` ou documentar que roda em paralelo com T-02.01 (arquivos distintos: conftest.py vs test_settings_payload.py). |
| BAIXA | sprint-01/tasks.md (T-01.03) | `criterio_aceite` "padrão vi.mock comprovado como replicável" é levemente subjetivo ("replicável"). | Tornar binário: "Financial.test.tsx verde; mock `vi.mock('../services/api')` presente no arquivo" — verificação direta. |

VEREDITO: SIM — o plano está pronto para execução autônoma.

---

## F6 — registro de suítes e build (T-05.01, 2026-09-05)

| suíte | resultado | exit |
|---|---|---|
| pytest (backend, `python -m pytest -q`) | 77 passed (44.93s) | 0 |
| vitest (frontend, `npx vitest run`) | 42 passed (15 files, 19.92s) | 0 |
| typecheck+build (frontend, `npm run build`) | ✓ built in 12.77s | 0 |

Última execução pytest completa: `77 passed in 44.93s`. Última execução vitest completa: `15 passed (15) / 42 passed (42)`. Build: `✓ built in 12.77s`, exit 0.

Achado MÉDIA (DELETE de super_admin) corrigido na F6 — ver tabela acima.

---

## F6 — QA funcional E4 em produção (T-05.04, 2026-09-05)

Ambiente: backend `https://jgsistemas-backend.onrender.com` (deploy `dep-dae1cr8n74is73bvvsmg`, commit `9c7e3be`, **live**); frontend `https://jgsistemas.vercel.app` (health 200).

| # | fluxo | evidência | resultado |
|---|---|---|---|
| 1 | Configurações → chave PIX persiste ao reabrir | `PUT /api/settings` (pix_key QA marcada) → 200; `GET /api/settings` reaberto → pix_key idêntica | ✅ OK |
| 2 | Materiais → venda → botão Recibo baixa PDF | venda id=4 (PIX, aluno Igor, material "Livro mundo do saber" R$ 390) → `GET /api/materials/sales/4/receipt` → 200, `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="recibo-REC-2026-00004.pdf"`, assinatura `%PDF` válida (3737 bytes); numeração REC-{ano}-{contagem:05d} = 4ª venda do ano | ✅ OK |
| 3 | Auditoria mostra ações do super admin com `actor_role` | `GET /api/audit` → logs 80–82 do usuário Suporte com `actor_role: "super_admin"` (login) + `superadmin.seed` (id 79, details email do suporte); total 75 logs | ✅ OK |

Dados de QA **limpos após validação**: venda fictícia id=4 removida do Postgres (DELETE), estoque do material 1 reposto (5), pix_key de QA revertida para vazia (UPDATE). 3 vendas reais remanescentes (ids 1–3, preservadas).

Achado colateral de QA (registrado, não bloqueante): `GET /api/settings` retorna `primary_color` como `null` mesmo o schema exigindo string — o `PUT` com payload derivado do GET falha com 422 se o valor não for resgatado pelo frontend; não afeta fluxos do frontend (que envia o campo sempre). Registrado em BAIXA para revisão futura (schema default em `SettingsSchema` já cobre, mas GET deveria devolver o default).

---

## F7 — Varredura e limpeza de segredos no repositório (2026-09-05)

Solicitação do usuário: nenhuma chave/segredo de conexão pode permanecer exposta no código, nas docs ou no histórico git.

**Varredura** (working tree + todos os blobs + mensagens de todos os commits):
- Segredos reais encontrados (todos em `docs/` e na mensagem do commit do suporte a `PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE`): senha antiga do Postgres (já rotacionada), project ref do Supabase e e-mail do dono. Nenhum token (Render/Vercel/Supabase/Resend) estava versionado.
- `.env` locais confirmados como não versionados (`.gitignore` cobre `.env`, `.env.local`, `.env.production`); apenas `.env.example` com placeholders é rastreado.
- Falsos positivos (não são segredos): exemplos didáticos em `.env.example`, `README.md`, `DEPLOY.md`, `render.yaml`, `docker-compose.yml` (`postgresql://user:senha@host/db`, `<REF>:<SENHA>`, `${POSTGRES_PASSWORD}`).

**Limpeza**:
- `git filter-repo --replace-text` (blobs) + `--message-callback` (mensagens) redigiram todos os valores reais para `***REDACTED***` em **todos** os commits; reflog expirado e `git gc --prune=now` removeram os objetos antigos; backup em bundle com histórico antigo foi deletado.
- `git push --force origin main` (histórico reescrito `... → fc22897`); remoto sem tags/branches adicionais apontando para o histórico antigo; repositório é **privado**.
- Pós-limpeza: varredura local sem nenhum match de segredo real (restam apenas placeholders); `/api/health` 200 (deploy íntegro); mensagem do commit com `PG*` redigida confirmada via API do GitHub.

**Conclusão**: NDA está exposto — nenhum segredo real permanece no working tree, no histórico git ou no remoto.