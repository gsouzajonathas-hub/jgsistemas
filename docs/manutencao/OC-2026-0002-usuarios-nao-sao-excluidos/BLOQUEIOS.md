---
expx_schema: 1
expx_tool: runx
kind: bloqueios
trabalho_id: OC-2026-0002
atualizado_em: 2026-09-04
bloqueios:
  - id: B-01
    task: T-01.06
    aberto_em: 2026-09-04
    resolvido_em: null
    descricao: QA em producao (E4) depende da senha do admin@jgsistemas.com.br, que nao esta registrada em nenhum doc; solicitar ao usuario no E4 (nunca escrever o valor)
  - id: B-02
    task: T-01.06
    aberto_em: 2026-09-04
    resolvido_em: null
    descricao: Deploy do frontend depende de Vercel CLI manual da raiz do repo - a integracao git do Vercel aponta para jonathasGodinho/jgsistemas (repo renomeado para gsouzajonathas-hub/jgsistemas) e o relink via API falhou (origem: OC-2026-0001 B-03)
---

> Frontmatter obrigatorio (expx-schema v1). Formato completo em `references/00-schema.md`. Substitua os marcadores; NUNCA omita uma chave — ausente e `null`, lista vazia e `[]`. Sem acento em chave nem em valor de enum. `atualizado_em` e reescrito a cada gravacao.

# Bloqueios — OC-2026-0002

> Bloqueio é o que IMPEDE uma task de terminar. Não é "vai demorar", não é dificuldade, não é coisa de outra sprint. Se a task pode ser executada mesmo com o problema, não é bloqueio — registre como risco no `sprint.md`.

---

## B-01 — Senha do admin para QA em produção

- **Task:** T-01.06 (na prática, E4)
- **Aberto em:** 2026-09-04
- **Descrição:** o QA funcional em produção (`https://jgsistemas.dev.br`) exige login com `admin@jgsistemas.com.br`. A senha não está em nenhum doc do projeto. Bloqueio operacional, não técnico — o E3 (código + testes + build + commit + deploy) não depende dela.
- **O que destravaria:** usuário informar a senha (nunca registrá-la em doc).

---

## B-02 — Deploy manual via Vercel CLI obrigatório

- **Task:** T-01.06
- **Aberto em:** 2026-09-04
- **Descrição:** a integração git do Vercel aponta para `jonathasGodinho/jgsistemas` (repositório renomeado para `gsouzajonathas-hub/jgsistemas`, repoId 1353166786). O relink via API falhou porque a credencial do GitHub App não alcança a conta renomeada. O deploy desta ocorrência será manual: `npx vercel deploy --prod --yes --token <token> --scope team_THFE2H8TesKYPkyxr9vbCezV .` a partir da RAZ do repo (com `vercel.json` que sobe o build do `frontend/` e mantém os rewrites `/api` e `/uploads`).
- **O que destravaria:** usuário reinstalar o app Vercel no GitHub para `gsouzajonathas-hub` (ação no browser), ou manter deploys manuais — o caminho atual, já validado na OC-2026-0001.