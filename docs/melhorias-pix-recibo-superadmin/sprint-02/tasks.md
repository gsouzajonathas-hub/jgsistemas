# Tasks — Sprint 02

> Um bloco por task. Repita o bloco abaixo para cada task da sprint, preenchendo TODOS os campos — nenhum é opcional. Na execução (F6), a linha `status` é atualizada em cada transição; ao concluir, acrescente data e resultado da suíte.

---

```yaml
id: T-02.01
titulo: Teste de reprodução da lacuna L2 (GET → PUT → GET com pix_key)
objetivo: Escrever teste pytest que (1) obtém o payload atual de GET /api/settings, (2) faz PUT /api/settings com esse payload + pix_key alterada, (3) faz GET novamente e assere pix_key == valor salvo. Rodar ANTES de qualquer correção e registrar o resultado (falha ou passagem) em base/00-LACUNAS.md.
arquivos:
  cria: [backend/tests/test_settings_pix_repro.py]
  altera: [backend/tests/conftest.py]
teste_integracao: O teste exercita o fluxo real da API (TestClient + fixtures idempotentes de settings).
teste_funcional: Dado um settings existente, PUT com payload completo + pix_key e GET em seguida retornam a mesma chave.
criterio_aceite: O teste documenta a causa real (404/422/perda de valor ou passagem limpa) com a evidência registrada em 00-LACUNAS.md.
depende_de: [T-01.01]
paralelizavel: false
status: concluida  # 2026-09-05 · suíte: reproduziu 422 (H1 confirmada); evidência registrada em base/00-LACUNAS.md
```

---

```yaml
id: T-02.02
titulo: Confirmar/shape do payload do frontend (dark_mode boolean)
objetivo: Teste que replica o payload que o frontend envia (SettingsSchema + id/logo_url extras ignorados + dark_mode como boolean, se for o caso) e confirma que o PUT não devolve 422 — eliminando ou confirmando a hipótese H1 da lacuna L2.
arquivos:
  cria: [backend/tests/test_settings_payload.py]
  altera: []
teste_integracao: PUT com dark_mode=true e campos extras (id, logo_url) retorna 200 e persiste.
teste_funcional: Enviando dark_mode como boolean, a resposta é 200 e os valores persistidos batem com o request.
criterio_aceite: O teste verde confirma tolerância do schema ao payload real do frontend; se falhar, o ajuste mínimo vai em T-02.03.
depende_de: [T-01.01]
paralelizavel: true
status: concluida  # 2026-09-05 · RED confirmado: 422 só nos 4 campos nuláveis (address/phone/email/cnpj); dark_mode=True aceito e extras ignorados — ajuste vai em T-02.03
```

---

```yaml
id: T-02.03
titulo: Correção mínima no backend (se a reprodução falhar)
objetivo: Se T-02.01 ou T-02.02 falharem, corrigir o mínimo no handler PUT /api/settings (backend/app/routes/settings.py) e no schema SettingsSchema (mesmo arquivo, L16-28) para persistir pix_key e aceitar o payload do frontend — sem refatorar nada além da causa.
arquivos:
  cria: []
  altera: [backend/app/routes/settings.py]
teste_integracao: Os testes T-02.01/T-02.02 passam após a correção.
teste_funcional: GET → PUT(payload frontend + pix_key) → GET mantém pix_key.
criterio_aceite: Reprodução verde; nenhum teste existente quebrou (pytest completo 0 failed).
depende_de: [T-02.01, T-02.02]
paralelizavel: false
status: concluida  # 2026-09-05 · suíte: 63 passed, 0 failed (SchemaSettings: address/phone/email/cnpj → str | None)
```

---

```yaml
id: T-02.04
titulo: Teste vitest do handleSave com erro (D-12)
objetivo: Escrever teste em frontend/src/__tests__/Settings.test.tsx que stubba settingsAPI.update rejeitando e assere que o formulário mantém a chave PIX digitada e a mensagem "Erro ao salvar. Tente novamente." aparece.
arquivos:
  cria: []
  altera: [frontend/src/__tests__/Settings.test.tsx]
teste_integracao: O teste renderiza a página Settings com o mock de services/api (padrão T-01.03).
teste_funcional: Digitando pix_key e falhando o PUT, o campo continua com o valor digitado e a mensagem de erro é visível.
criterio_aceite: Teste falha (red) antes da implementação — prova que a guarda D-12 não existe — e passa após T-02.05.
depende_de: [T-01.03]
paralelizavel: false
status: concluida  # 2026-09-05 · RED confirmado: 5 tests, 1 failed (mensagem D-12 não existe no DOM)
```

---

```yaml
id: T-02.05
titulo: Implementar guarda D-12 e cache via resposta do servidor
objetivo: Em frontend/src/pages/Settings.tsx, envolver o PUT em try/catch: em erro, manter o estado do formulário intacto e exibir "Erro ao salvar. Tente novamente."; em sucesso, atualizar o cache global com a resposta do servidor (pushSettingsCache com o retorno da API) em vez do objeto local — fecha a hipótese H2 do cache velho.
arquivos:
  cria: []
  altera: [frontend/src/pages/Settings.tsx]
teste_integracao: O teste T-02.04 passa com a implementação.
teste_funcional: Preparar state, falhar a API e verificar que o campo preserva o valor e a mensagem aparece; em sucesso, pushSettingsCache recebe a resposta real.
criterio_aceite: T-02.04 verde; build frontend exit 0; nenhum teste existente quebrou.
depende_de: [T-02.04]
paralelizavel: false
status: concluida  # 2026-09-05 · suíte: 37 passed/12 files (tsc --noEmit limpo); D-12 + pushSettingsCache pós-GET
```