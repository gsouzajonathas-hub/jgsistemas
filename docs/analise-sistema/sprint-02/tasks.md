# Tasks — Sprint 02

> Um bloco por task. Na execução (F6), a linha `status` é atualizada em cada transição; ao concluir, acrescente data e resultado da suíte.

---

```yaml
id: T-02.01
titulo: Importar os 4 models no startup (cria as tabelas)
status_atual: concluida · 2026-08-29 · suíte: 4 passed, 0 failed · fix de integração: back_populates attendances/evaluations adicionados em Student e ClassGroup
objetivo: Importar Attendance, Evaluation, Certificate e GradeWeightConfig em app/models/__init__.py para que create_all crie as 4 tabelas no startup (D-05).
arquivos:
  cria: [backend/tests/test_models_tabelas.py]
  altera: [backend/app/models/__init__.py]
teste_integracao: criar engine SQLite novo via fixtures e inspecionar inspect(engine).get_table_names() contém attendances, evaluations, certificates e grade_weight_configs.
teste_funcional: rodar `pytest` em backend/ termina verde com o teste das tabelas passando.
criterio_aceite: banco novo criado pelo app contém as 4 tabelas; suíte verde com 0 failed.
depende_de: [T-01.03]
paralelizavel: false
status: concluida
```

---

```yaml
id: T-02.02
titulo: Registrar os 7 routers dormentes no main.py
status_atual: concluida · 2026-08-29 · suíte: 7 passed, 0 failed · fixes: catch-all SPA agora devolve 404 JSON para /api/* desconhecidas; fixtures idempotentes
objetivo: Incluir teachers, classes, attendance, evaluations, boletins, certificates e weight_config nos routers registrados do app (D-04).
arquivos:
  cria: [backend/tests/test_rotas_registradas.py]
  altera: [backend/app/main.py]
teste_integracao: GET /api/teachers e GET /api/classes com token admin respondem 200 (lista); rota desconhecida responde 404.
teste_funcional: rodar `pytest` em backend/ termina verde com o teste de rotas passando.
criterio_aceite: os 7 routers respondem em seus prefixos /api/*; suíte verde com 0 failed.
depende_de: [T-02.01]
paralelizavel: false
status: concluida
```

---

```yaml
id: T-02.03
titulo: Auditoria nas ações dos módulos reativados
status_atual: concluida · 2026-08-29 · suíte: 10 passed, 0 failed · ação: log_audit em attendance.bulk, evaluation.create/bulk/update/delete, class.create/update/delete · desvio: teachers.py:13 (is_active == "1", quebra em Postgres) foi corrigido dentro do escopo da auditoria
objetivo: Garantir que frequência (bulk), avaliações (create/bulk) e turmas (create/update/delete) gravem em audit_logs, seguindo o padrão existente (log_audit + commit no chamador) (D-08).
arquivos:
  cria: [backend/tests/test_auditoria_modulos.py]
  altera: [backend/app/routes/attendance.py, backend/app/routes/evaluations.py, backend/app/routes/classes.py]
teste_integracao: executar POST /api/attendance/bulk e POST /api/evaluations/bulk com admin e verificar que registros com action em {"attendance.bulk","evaluation.create"} existem em audit_logs.
teste_funcional: rodar `pytest` em backend/ termina verde com o teste de auditoria passando.
criterio_aceite: ações de frequência, avaliações e turmas geram linhas em audit_logs; suíte verde com 0 failed.
depende_de: [T-02.02]
paralelizavel: false
status: concluida
```

---

```yaml
id: T-02.04
titulo: student-profile retorna 404 real (D-15)
status_atual: concluida · 2026-08-29 · suíte: 15 passed, 0 failed
objetivo: Substituir o retorno 200 com {"error": ...} por HTTPException 404 em GET /api/student-profile/{id} quando o aluno não existe.
arquivos:
  cria: [backend/tests/test_student_profile_404.py]
  altera: [backend/app/routes/students_profile.py]
teste_integracao: GET /api/student-profile/999999 com token admin responde status 404 e corpo com detail.
teste_funcional: rodar `pytest` em backend/ termina verde com o teste do 404 passando.
criterio_aceite: aluno inexistente em student-profile responde 404; aluno existente continua 200; suíte verde com 0 failed.
depende_de: [T-01.03]
paralelizavel: true
status: concluida
```

---

```yaml
id: T-02.05
titulo: Timeout explícito de 30s no SMTP (D-14)
status_atual: concluida · 2026-08-29 · suíte: 15 passed, 0 failed
objetivo: Definir timeout=30 na chamada aiosmtplib.send em email_service.py, alinhado ao padrão de 30s do WhatsApp.
arquivos:
  cria: [backend/tests/test_email_timeout.py]
  altera: [backend/app/services/email_service.py]
teste_integracao: inspecionar a chamada send/connection com monkeypatch de aiosmtplib e asserir que timeout=30 é passado.
teste_funcional: rodar `pytest` em backend/ termina verde com o teste do timeout passando.
criterio_aceite: envio de e-mail define timeout=30s; suíte verde com 0 failed.
depende_de: [T-01.01]
paralelizavel: true
status: concluida
```

---

```yaml
id: T-02.06
titulo: Remover citação de subscriptions da migração (D-13)
status_atual: concluida · 2026-08-29 · suíte: 15 passed, 0 failed · observação: conforme auditoria MÉDIA #3, attendances/evaluations/certificates/grade_weight_configs saíram de TABELAS_ORFAS e entraram em TABELAS_COM_MODELO (agora têm model); TABELAS_ORFAS vazio
objetivo: Excluir `subscriptions` da lista de tabelas ignoradas (ou copiadas) em migrate_sqlite_to_postgres.py — tabela fantasma sem model.
arquivos:
  cria: [backend/tests/test_migracao_sem_subscriptions.py]
  altera: [backend/scripts/migrate_sqlite_to_postgres.py]
teste_integracao: importar o script e verificar que "subscriptions" não aparece em nenhuma lista de tabelas do módulo.
teste_funcional: rodar `pytest` em backend/ termina verde com o teste da migração passando.
criterio_aceite: "subscriptions" ausente do script de migração; suíte verde com 0 failed.
depende_de: [T-01.01]
paralelizavel: true
status: concluida
```

---

```yaml
id: T-02.07
titulo: Teste de integração do fluxo E2E completo
status_atual: concluida · 2026-08-29 · suíte: 35 passed, 0 failed · fluxo validado: aluno→turma→matrícula→frequência 75%→avaliações média 85→boletim (Aprovado, pdf)→certificado (CERT-2026-, pdf)→financeiro (mensalidade, pagamento PIX, recibo pdf)→boletim fechado exibe certificado
objetivo: Percorrer via API todo o fluxo da D-12: professor → turma → matrícula → frequência → avaliações → boletim → certificado (D-16).
arquivos:
  cria: [backend/tests/test_fluxo_e2e.py]
  altera: []
teste_integracao: encadear as chamadas do fluxo com um único cliente de teste e asserir 200 em cada etapa (matrícula cria enrollment, frequência bulk grava, boletim pdf gera bytes, certificado emit com média>=70 e frequência>=75).
teste_funcional: rodar `pytest` em backend/ termina verde com o teste E2E passando.
criterio_aceite: o fluxo completo executa de ponta a ponta via API com resposta 200 em todas as etapas; suíte verde com 0 failed.
depende_de: [T-02.02, T-02.03]
paralelizavel: false
status: concluida
```

---

```yaml
id: T-02.08
titulo: Suítes de integração dos módulos reativados
status_atual: concluida · 2026-08-29 · suíte: 34 passed, 0 failed · cobertura: boletins (média 80.0, situação, freq≥75 elegível, reprovação por frequência, pdf, excel), certificados (média<70 → 400, duplicidade → 400, emissão + níveis + pdf), frequência (bulk com re-lançamento que atualiza, filtros, relatório), avaliações (CRUD, bulk, média ponderada 87.5, 404s)
objetivo: Cobrir validações e contratos de boletins, certificados, frequência e avaliações (geração de PDF/Excel, regras de média, duplicidade, 404s).
arquivos:
  cria: [backend/tests/test_boletins.py, backend/tests/test_certificados.py, backend/tests/test_frequencia.py, backend/tests/test_avaliacoes.py]
  altera: []
teste_integracao: cada suíte valida os endpoints do módulo (ex.: certificado com média<70 responde 400; boletim pdf responde application/pdf).
teste_funcional: rodar `pytest` em backend/ termina verde com as 4 suítes passando.
criterio_aceite: as 4 suítes passam; suíte global verde com 0 failed.
depende_de: [T-02.02]
paralelizavel: false
status: concluida
```

---

```yaml
id: T-02.09
titulo: Teste financeiro crítico (D-11)
status_atual: concluida · 2026-08-29 · suíte: 16 passed, 0 failed
objetivo: Testar o fluxo financeiro essencial em uso: gerar mensalidade do mês, registrar pagamento e emitir recibo.
arquivos:
  cria: [backend/tests/test_financeiro_critico.py]
  altera: []
teste_integracao: POST /api/financial/generate-month gera parcelas, POST /api/financial/payments paga uma parcela (status paid) e GET /api/financial/payments/{id}/receipt responde PDF.
teste_funcional: rodar `pytest` em backend/ termina verde com o teste financeiro passando.
criterio_aceite: geração de mês, pagamento e recibo funcionam via API; suíte verde com 0 failed.
depende_de: [T-01.03]
paralelizavel: false
status: concluida
```