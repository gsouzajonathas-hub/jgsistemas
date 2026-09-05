# Tasks — Sprint 01

> Um bloco por task. Repita o bloco abaixo para cada task da sprint, preenchendo TODOS os campos — nenhum é opcional. Na execução (F6), a linha `status` é atualizada em cada transição; ao concluir, acrescente data e resultado da suíte.

---

```yaml
id: T-01.01
titulo: Fixtures de backend das três áreas
objetivo: Adicionar em backend/tests/fixtures.py as fixtures settings_com_pix (school_settings única com pix_key), material_sale_ctx (material + student + venda, com get_or_create idempotente como as fixtures atuais) e valores_super_admin (dict de env SUPPORT_ADMIN_EMAIL/SUPPORT_ADMIN_PASSWORD/SUPPORT_ADMIN_NAME), mais um teste de fumaça cada em backend/tests/test_fixtures.py.
arquivos:
  cria: [backend/tests/test_fixtures.py]
  altera: [backend/tests/fixtures.py]
teste_integracao: As fixtures retornam objetos/valores com o formato esperado pelos handlers (Settings com .pix_key, MaterialSale com .id, dict de credenciais).
teste_funcional: Rodando pytest no arquivo novo, os três testes de fumaça passam (0 failed).
criterio_aceite: backend/tests/test_fixtures.py roda verde com 0 failed e as três fixtures estão exportadas por fixtures.py.
depende_de: []
paralelizavel: true
status: concluida  # 2026-09-05 · suíte: 60 passed, 0 failed (3 novos + 57 existentes)
```

---

```yaml
id: T-01.02
titulo: Baseline vitest com comandos documentados
objetivo: Rodar a suíte vitest existente (34 testes) do zero com `npx vitest run` e registrar o comando de teste no 00-DECISOES.md ou no ORQUESTRADOR.md (F4) como referência de execução.
arquivos:
  cria: []
  altera: [docs/melhorias-pix-recibo-superadmin/00-DECISOES.md]
teste_integracao: O comando de teste do frontend executa sem erro de setup.
teste_funcional: `npx vitest run` na pasta frontend/ termina com 0 failed (34/34).
criterio_aceite: Suíte frontend existe e roda com 0 failed; comando registrado no artefato de decisões.
depende_de: []
paralelizavel: true
status: concluida  # 2026-09-05 · suíte: 34 passed, 0 failed (11 arquivos)
```

---

```yaml
id: T-01.03
titulo: Teste-exemplo com mock de services/api
objetivo: Criar __tests__/Financial.test.tsx inicial que renderiza a página (com AuthProvider mockado ou hasPermission aceito) e demonstra vi.mock('../services/api') stubando materialsAPI.receipt e settingsAPI.get — servindo de padrão para as sprints seguintes.
arquivos:
  cria: [frontend/src/__tests__/Financial.test.tsx]
  altera: []
teste_integracao: O mock de services/api faz a página renderizar sem chamada real de rede.
teste_funcional: Teste novo roda com 0 failed junto da suíte existente.
criterio_aceite: Financial.test.tsx verde e o padrão vi.mock comprovado como replicável.
depende_de: [T-01.02]
paralelizavel: false
status: concluida  # 2026-09-05 · suíte: 36 passed, 0 failed (34 existentes + 2 novos); divergência: arquivo em src/pages/__tests__/Financial.test.tsx (padrão do repo), não src/__tests__/
```