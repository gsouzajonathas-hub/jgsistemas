---
expx_schema: 1
expx_tool: runx
kind: tasks
trabalho_id: OC-2026-0005
sprint_id: sprint-01
atualizado_em: 2026-09-10
tasks:
  - id: T-01.01
    titulo: Confirmar que o teste de regressao cobre o defeito relatado
    fase: F-01.1
    status: concluida
    objetivo: Comprovar que test_exclusao_cascata.py satura as FKs do cenario relatado (aluno/turma/curso/plano) e passa
    arquivos:
      cria: []
      altera: []
    teste_regressao: Os 7 casos de test_exclusao_cascata.py devem passar saturando dependencias de aluno, turma, curso e plano
    teste_integracao: DELETE /api/students/{id}, /api/classes/{id}, /api/courses/{id} e /api/financial/plans/{id} retornam 200 com dependencias saturadas
    teste_funcional: pytest tests/test_exclusao_cascata.py roda 7 passed
    criterio_aceite: Os 7 testes de test_exclusao_cascata.py aparecem como PASSED na execucao
    depende_de: []
    paralelizavel: false
    concluida_em: 2026-09-10
    suite: verde
  - id: T-01.02
    titulo: Rodar a suite completa do backend como validacao final
    fase: F-01.1
    status: concluida
    objetivo: Confirmar que o fix nao quebrou nenhum outro teste do sistema
    arquivos:
      cria: []
      altera: []
    teste_integracao: A suite completa do backend permanece verde apos o fix de exclusao
    teste_funcional: pytest no backend retorna 154 passed, 1 skipped
    criterio_aceite: pytest sai com exit code 0 e nenhum teste novo fica vermelho
    depende_de: [T-01.01]
    paralelizavel: false
    concluida_em: 2026-09-10
    suite: verde
---

# Tasks — Sprint 01 — OC-2026-0005

## T-01.01 — Confirmar que o teste de regressão cobre o defeito relatado

- **Objetivo:** comprovar que `test_exclusao_cascata.py` satura as FKs do cenário relatado.
- **Arquivos:** nenhum criado, nenhum alterado (fix já presente).
- **Teste de regressão:** os 7 casos do arquivo devem passar saturando as dependências de
  aluno, turma, curso e plano.
- **Teste de integração:** os quatro endpoints `DELETE` retornam 200 com dependências
  saturadas.
- **Teste funcional:** `pytest tests/test_exclusao_cascata.py` roda 7 passed.
- **Critério de aceite:** os 7 testes aparecem como `PASSED`.
- **Resultado desta sessão:** `7 passed in 21.88s` — confirmado.

## T-01.02 — Rodar a suíte completa do backend como validação final

- **Objetivo:** confirmar que o fix não quebrou nenhum outro teste do sistema.
- **Arquivos:** nenhum criado, nenhum alterado.
- **Teste de integração:** a suíte completa permanece verde após o fix de exclusão.
- **Teste funcional:** `pytest` no backend retorna `154 passed, 1 skipped`.
- **Critério de aceite:** `pytest` sai com exit code 0, sem novo teste vermelho.
- **Resultado desta sessão:** `154 passed, 1 skipped in 184.67s` — confirmado.
