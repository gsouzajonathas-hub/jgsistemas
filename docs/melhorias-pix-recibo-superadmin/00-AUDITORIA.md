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