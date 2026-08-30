# Fases — Sprint 02

> Um bloco por fase. O paralelismo declarado aqui é definitivo: a execução nunca decide paralelismo sozinha.

**Status do sprint: concluida · 2026-08-29 · suíte backend 35 passed, 0 failed**

---

## F-02.1 — Ativar tabelas, rotas e auditoria

**Status: concluida · 2026-08-29 ·** create_all cria as 4 tabelas; 7 routers respondem; auditoria gravando em attendance/evaluations/classes (test_auditoria_modulos).

**Objetivo:** fazer os módulos Turmas/Frequência/Avaliações/Boletim/Certificados existirem de fato no backend: tabelas criadas, routers registrados, ações auditadas.

**Tasks que a compõem:** T-02.01, T-02.02, T-02.03

**Critério de saída:** banco novo criado via create_all contém as 4 tabelas (`attendances`, `evaluations`, `certificates`, `grade_weight_configs`); os 7 routers respondem em `/api/*`; ações de frequência, avaliações e turmas geram registros em `audit_logs`.

**Roda em paralelo com:** F-02.2

---

## F-02.2 — Correções decididas (D-13, D-14, D-15)

**Status: concluida · 2026-08-29 ·** 404 real em student-profile; SMTP timeout=30s; migração sem subscriptions e com as 4 tabelas reativadas migráveis.

**Objetivo:** aplicar as três correções pontuais aprovadas na F2, cada uma com seu teste.

**Tasks que a compõem:** T-02.04, T-02.05, T-02.06

**Critério de saída:** `GET /api/student-profile/{id}` de aluno inexistente responde 404; envio de e-mail usa timeout=30s; script de migração não cita mais `subscriptions`.

**Roda em paralelo com:** F-02.1

---

## F-02.3 — Testes de integração e fluxo E2E

**Status: concluida · 2026-08-29 ·** suítes de boletins/certificados/frequência/avaliações + fluxo E2E + financeiro crítico: 35 passed, 0 failed.

**Objetivo:** cobrir com testes de integração os módulos reativados, o fluxo E2E completo (D-16) e o fluxo financeiro crítico (D-11).

**Tasks que a compõem:** T-02.07, T-02.08, T-02.09

**Critério de saída:** `pytest` em `backend/` verde (0 failed) com as suítes de boletins, certificados, frequência, avaliações, fluxo E2E e financeiro passando.

**Roda em paralelo com:** nenhuma