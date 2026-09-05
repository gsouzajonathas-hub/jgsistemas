# Tasks — Sprint 05

> Um bloco por task. Repita o bloco abaixo para cada task da sprint, preenchendo TODOS os campos — nenhum é opcional. Na execução (F6), a linha `status` é atualizada em cada transição; ao concluir, acrescente data e resultado da suíte.

---

```yaml
id: T-05.01 # CONCLUÍDA 2026-09-05 — pytest 77 passed (44.93s); vitest 42 passed/15 files; build exit 0
titulo: Suítes completas + build frontend
objetivo: Rodar `python -m pytest` (backend) e `npx vitest run` (frontend) e `npm run build`, registrando contagens e exit codes no relatório de entrega.
arquivos:
  cria: []
  altera: [docs/melhorias-pix-recibo-superadmin/00-AUDITORIA.md]
teste_integracao: Nenhuma regressão entre as sprints — mesmos testes existentes + novos passando.
teste_funcional: As três entregas sendo exercitadas pelas suítes completas terminam com 0 failed e build exit 0.
criterio_aceite: pytest 0 failed; vitest 0 failed; build exit 0.
depende_de: [T-02.03, T-02.05, T-03.02, T-03.04, T-04.01, T-04.02, T-04.03, T-04.04, T-04.05, T-04.06]
paralelizavel: false
status: concluida
```

---

```yaml
id: T-05.02 # CONCLUÍDA 2026-09-05 — deploy Vercel com token do usuário; health 200 nas duas URLs (jgsistemas.vercel.app)
titulo: Deploy do frontend via Vercel CLI
objetivo: A partir de frontend/, rodar `npx vercel --prod --token <vcp_token>` (token em variável de ambiente, nunca em arquivo), capturar a URL do deploy e confirmar health 200.
arquivos:
  cria: []
  altera: []
teste_integracao: O deploy reflete o build da T-05.01.
teste_funcional: Acessando a URL publicada, o login carrega a aplicação (status 200).
criterio_aceite: Deploy concluído com URL confirmada e health 200.
depende_de: [T-05.01]
paralelizavel: false
status: concluida
```

---

```yaml
id: T-05.03 # CONCLUÍDA 2026-09-05 — env vars restauradas (17 chaves: 14 base + 3 SUPPORT_ADMIN_*), 2 redeploys API live (dep-dae18gad0e5s73eo2org / dep-dae1cr8n74is73bvvsmg), health 200, actor_role criado, conta super_admin "Suporte" criada (id 2), login OK
titulo: Redeploy do backend no Render + env vars de suporte
objetivo: Fazer o deploy do backend no Render (push + redeploy manual conforme B-03): restaurar as env vars de produção no serviço (conjunto completo: SECRET_KEY nova + bloco PG* + RESEND_*), redeploy manual, e verificar /api/health 200 + migração actor_role no Postgres. Depois solicitar ao usuário que defina SUPPORT_ADMIN_EMAIL/SUPPORT_ADMIN_PASSWORD no painel (o agente nunca escreve o valor do segredo) e reiniciar — usuário informou "Vou colar email + senha + nome" (valores ainda não entregues).
arquivos:
  cria: []
  altera: [docs/melhorias-pix-recibo-superadmin/00-BLOQUEIOS.md]
teste_integracao: Com as env vars definidas, o boot cria a conta super admin no Postgres.
teste_funcional: GET /api/health 200; login da conta de suporte funciona; GET /api/audit retorna logs com actor_role.
criterio_aceite: Health 200, conta super admin criada e actor_role presente na resposta de auditoria.
depende_de: [T-05.02]
paralelizavel: false
status: concluida
```

---

```yaml
id: T-05.04 # CONCLUÍDA 2026-09-05 — QA E4 validado em produção: (1) chave PIX persiste ao reabrir; (2) recibo REC-2026-00004.pdf (4ª venda do ano) gerado com assinatura %PDF válida; (3) auditoria com actor_role=super_admin (logs 80-82 + superadmin.seed). Dados de QA limpos após validação (venda fic e pix revertidas). Evidências em 00-AUDITORIA.md §F6
titulo: QA funcional E4 dos três itens em produção
objetivo: Validar em produção (via conta super admin criada): (1) Configurações → salvar chave PIX → reabrir mantém e QR segue no carnê; (2) Financeiro → Materiais Didáticos → botão Recibo baixa PDF com nome recibo-REC-{ano}-{contagem}.pdf; (3) Auditoria mostra as ações do super admin com o destaque da coluna. Registrar evidência de cada fluxo.
arquivos:
  cria: []
  altera: [docs/melhorias-pix-recibo-superadmin/00-AUDITORIA.md]
teste_integracao: Fluxos reais de ponta a ponta no ambiente de produção.
teste_funcional: Cada um dos três fluxos termina no resultado esperado (chave persistida, PDF baixado, badge visível).
criterio_aceite: Três fluxos validados com evidência; qualquer falha vira pendência detalhada — nunca entrega "confiada".
depende_de: [T-05.03]
paralelizavel: false
status: concluida
```