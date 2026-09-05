# Orquestrador — melhorias-pix-recibo-superadmin

> Porta de entrada da execução. Escrito para quem abriu o repositório agora e não sabe nada. Só caminhos relativos; nunca o valor de um segredo.

## 1. Objetivo

Entregar três melhorias no sistema de gestão escolar: (1) a chave PIX salva em Configurações persiste ao reabrir o modal e o QR Code continua no carnê, com guarda de erro no salvamento; (2) venda de material didático gera recibo PDF numerado `REC-{ano}-{contagem:05d}` (mesmo formato do Financeiro), acessível por um botão "Recibo" na listagem de Materiais Didáticos; (3) conta de suporte com role própria `super_admin`, criada automaticamente no startup a partir de variáveis de ambiente, com acesso total e ações destacadas na trilha de auditoria.

## 2. Mapa e ordem de leitura

1. Este arquivo (`ORQUESTRADOR.md`)
2. `00-DECISOES.md` — decisões que governam o plano (D-01 a D-13)
3. `base/00-INDICE.md` — e os arquivos da base que ele lista
4. `00-BLOQUEIOS.md` — B-01 (senha admin), B-02 (deploy manual via CLI), B-03 (redeploy Render)
5. `sprint-01/sprint.md` → `fases.md` → `tasks.md`
6. `sprint-02/sprint.md` → `fases.md` → `tasks.md`
7. `sprint-03/sprint.md` → `fases.md` → `tasks.md`
8. `sprint-04/sprint.md` → `fases.md` → `tasks.md`
9. `sprint-05/sprint.md` → `fases.md` → `tasks.md`
10. `00-AUDITORIA.md` — achados MÉDIA/BAIXA que permanecem válidos (criado na F5)

## 3. Rota de execução

- Sprint 01 (capacidade de teste): F-01.1 ∥ F-01.2 (paralelas)
- Sprint 02 (PIX): F-02.1 ∥ F-02.2 (paralelas)
- Sprint 03 (recibo): F-03.1 ∥ F-03.2 (paralelas)
- Sprint 04 (super admin): F-04.1 → F-04.2 (sequenciais — ambas tocam `backend/app/main.py`); F-04.1 ∥ F-04.3 e F-04.2 ∥ F-04.3 (frontend em paralelo com as duas)
- Sprint 05 (integração e entrega) : F-05.1 → F-05.2 → F-05.3 → F-05.4 (sequencial)

**Caminho crítico:** T-01.01 → T-02.01 → T-02.03 → (T-03.01 → T-03.02) / (T-04.01 → T-04.02 → T-04.03 → T-04.04) → T-05.01 → T-05.02 → T-05.03 → T-05.04. O ramo de super admin (T-04.01→T-04.04) é o mais longo dentro das sprints de negócio; as fases frontend (F-02.2, F-03.2, F-04.3) rodam em paralelo aos respectivos backends e entram na verificação final em T-05.01.

## 4. Ferramentas

- **MCPs / SDKs:** nenhum além do padrão
- **Testes backend:** `python -m pytest -q` (na pasta `backend/`)
- **Testes frontend:** `npm test` (na pasta `frontend/` — vitest, `vitest run`)
- **Lint:** NÃO EXISTE NO PROJETO
- **Typecheck:** `npm run build` (na pasta `frontend/` — roda `tsc && vite build`); backend não tem typecheck
- **Segredos:** `SUPPORT_ADMIN_EMAIL`, `SUPPORT_ADMIN_PASSWORD` (e `SUPPORT_ADMIN_NAME` opcional) — painel do Render; senha do `admin@jgsistemas.com.br` — só com o usuário; token da Vercel — `.env` local de quem opera. NUNCA escreva o valor.

## 5. Agentes

- **Implementador** — escreve primeiro os dois testes da task, vê ambos falharem, implementa até passarem.
- **Revisor de testes** — antes de aceitar o verde, responde: este teste falharia com uma implementação errada? Se não, o teste volta.
- **Auditor de aceite** — verifica de fato o `criterio_aceite` da task antes de permitir `status: concluida`.

**Agente único:** assume os três papéis em sequência dentro de cada task, nesta ordem, tratando cada papel como um portão — não avança ao papel seguinte sem fechar o anterior. A aprovação final da feature NÃO é feita aqui: é a T-05.04 (QA funcional em produção), papel distinto da execução.

## 6. Regras de autonomia

1. Não pergunte nada; não peça autorização para nada.
2. O teste vem antes do código, sempre.
3. Task só é `concluida` com teste de integração E funcional passando e `criterio_aceite` verificado. Não existe "concluído com ressalva".
4. Dúvida nova ou pré-requisito faltando: registrar em `00-BLOQUEIOS.md` (`B-NN | task | bloqueio | o que destravaria`), marcar a task `bloqueada`, pular para a próxima paralelizável. Nunca parar e esperar.
5. Só rode em paralelo o que o plano declarou paralelizável (Seção 3); a execução nunca decide paralelismo.
6. Atualize `status` em `tasks.md` a cada transição; ao concluir, acrescente data e resultado da suíte.
7. Critério de saída de fase/sprint não atendido = não avança.
8. Escopo travado: só arquivos listados nas tasks; nada de refactor de brinde. O valor de `SUPPORT_ADMIN_PASSWORD` nunca é impresso, logado, commitado nem escrito em arquivo.

## 7. Definição de pronto global

- [ ] `pytest` (backend) 0 failed; `npm test` (frontend) 0 failed; `npm run build` exit 0.
- [ ] Chave PIX: GET → PUT (payload real do frontend + pix_key) → GET mantém a chave (teste de reprodução documenta a causa L2 em `base/00-LACUNAS.md`); falha de API não apaga o formulário (D-12: mensagem "Erro ao salvar. Tente novamente."); ao reabrir o modal a chave continua e o QR Code segue no carnê.
- [ ] Recibo de material: `Content-Disposition` no formato `recibo-REC-{ano}-{contagem:05d}.pdf`, contagens anuais não colidem, botão "Recibo" presente em cada venda da listagem de Materiais Didáticos e o clique baixa o PDF (mesmo padrão do Financeiro).
- [ ] Super admin: conta criada no startup a partir das env vars (idempotente, sem senha em log), `require_role` aceita `super_admin` como admin em tudo, `register`/`update_user` não criam nem rebaixam a role, `PUT /users/{id}` não rebaixa conta de suporte; coluna `actor_role` existe em SQLite e Postgres (migração aditiva), `GET /api/audit` devolve o campo e a tela de Auditoria destaca ações de super admin (badge); select de roles na tela de usuários não oferece `super_admin`.
- [ ] Deploy: frontend publicado via Vercel CLI (health 200), backend redeploy no Render com env vars de suporte definidas, `/api/health` 200, migração `actor_role` aplicada no Postgres.
- [ ] QA funcional em produção (T-05.04): os três fluxos validados com evidência — chave PIX persistida + QR no carnê, recibo PDF baixado com nome `recibo-REC-*.pdf`, auditoria mostrando ações do super admin com destaque.
- [ ] Nenhum arquivo fora do escopo declarado alterado; nenhum segredo com valor em arquivo, log ou commit.

## 8. Como retomar uma sessão interrompida

1. Leia este arquivo inteiro.
2. Leia o `status` de cada task em cada `sprint-NN/tasks.md`.
3. Leia `00-BLOQUEIOS.md`.
4. Continue da primeira task `pendente` ou `em_andamento` cujas dependências (`depende_de`) estão todas `concluida`. Ignore as `bloqueada` até que o bloqueio registrado seja resolvido.