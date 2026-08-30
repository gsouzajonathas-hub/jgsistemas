# Tasks — Sprint 01

> Um bloco por task. Na execução (F6), a linha `status` é atualizada em cada transição; ao concluir, acrescente data e resultado da suíte.

---

```yaml
id: T-01.01
titulo: Harness pytest do backend com banco isolado
status_atual: concluida · 2026-08-29 · suíte: 1 passed, 0 failed
objetivo: Configurar pytest, dependências de teste e fixture de app+banco SQLite temporário com o primeiro teste de referência (health).
arquivos:
  cria: [backend/requirements-dev.txt, backend/tests/conftest.py, backend/tests/test_health.py]
  altera: [backend/pyproject.toml (se existir) ou backend/requirements.txt para pytest-cov/httpx de teste]
teste_integracao: TestClient do app com DB temporário e GET /api/health retorna 200 com {"status":"ok"}.
teste_funcional: rodar `pytest` em backend/ termina em verde com o teste de health passando.
criterio_aceite: `pytest` em backend/ executa sem erro e termina com 0 failed; conftest provê override do banco (SQLite em tmp_path) sem tocar em DATABASE_URL real.
depende_de: []
paralelizavel: true
status: concluida
```

---

```yaml
id: T-01.02
titulo: Harness vitest do frontend com testing-library
status_atual: concluida · 2026-08-29 · suíte: 2 passed, 0 failed
objetivo: Adicionar vitest + jsdom + @testing-library/react, setup e um teste smoke de componente puro (formatDate/Button).
arquivos:
  cria: [frontend/vitest.config.ts, frontend/src/setupTests.ts, frontend/src/test/smoke.test.tsx]
  altera: [frontend/package.json]
teste_integracao: render do componente Button com testing-library encontra o texto do botão no DOM.
teste_funcional: rodar `vitest run` em frontend/ termina em verde com o smoke test passando.
criterio_aceite: `vitest run` em frontend/ executa sem erro e termina com 0 failed; script `test` adicionado ao package.json.
depende_de: []
paralelizavel: true
status: concluida
```

---

```yaml
id: T-01.03
titulo: Fixtures de dados de teste (admin, aluno, turma, professor)
status_atual: concluida · 2026-08-29 · suíte: 2 passed, 0 failed
objetivo: Criar fixtures compartilhadas — usuário admin autenticado (token JWT), aluno, turma e professor — para as sprints de negócio.
arquivos:
  cria: [backend/tests/fixtures.py, backend/tests/test_fixtures_demo.py]
  altera: []
teste_integracao: fixture admin produz token JWT válido que GET /api/students com esse header responde 200.
teste_funcional: rodar `pytest` em backend/ termina em verde incluindo o teste-demonstração das fixtures.
criterio_aceite: fixtures auth_headers/admin/aluno/turma/professor importáveis e funcionais; suíte verde com 0 failed.
depende_de: [T-01.01]
paralelizavel: false
status: concluida
```