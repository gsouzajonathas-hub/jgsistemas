---
expx_schema: 1
expx_tool: runx
kind: ocorrencia
trabalho_id: OC-2026-0002
titulo: Usuarios nao sao excluidos nas configuracoes
tipo_ocorrencia: bug
recebido_em: 2026-09-04
origem: chat-usuario
tem_reproducao: true
modulo_afetado: [configuracoes, usuarios, auditoria]
atualizado_em: 2026-09-04
---

# OC-2026-0002 — Usuarios nao sao excluidos nas configuracoes

> Formato completo em `references/00-schema.md`. Substitua os marcadores; NUNCA omita uma chave — ausente e `null`, lista vazia e `[]`. Sem acento em chave nem em valor de enum. `atualizado_em` e reescrito a cada gravacao.

## O que o usuario relatou (verbatim)

> "nas configurações nao esta excluidno usuarios. Preciso que valide isso e permita Criar, editar e excluir usuario. Ao excluir um usuario ou excluirt qualquer opção importante preciso que apareça uma tela com uma mensagem de confirmação de exclusao daquele item escolhido para reforçar a ação que esa sendo feita e fazer com que a pessoa tenha uma segunda chance na escolha da ação do mesmo. Sendo assim toda vez que excluir algum usuario ou modal precisa confirmar a exclusao apos clicar no botao de excluir . A mensagem deve ser tipo um alerta com bnotao em vermelhor ou amarelo. veja ai e implemente e faça ja o deploy disso"

## Pedido em duas partes

1. **Bug:** validar e permitir Criar / Editar / Excluir usuário em Configurações — hoje a exclusão não funciona.
2. **Melhoria-ux embutida no chamado:** toda exclusão de usuário (e de "qualquer opção importante") deve abrir uma tela/modal de confirmação com botão vermelho ou amarelo, dando segunda chance antes de executar.

## Passos de reproducao (provado por teste)

1. Logar como admin.
2. Ir em Configurações → aba Usuários.
3. Clicar em "Excluir" em um usuário que **não** seja a própria conta logada.
4. O `window.confirm` nativo abre, a pessoa confirma, e a exclusão **não acontece** — nenhuma mensagem de erro aparece (o `handleDeleteUser` de `Settings.tsx` não tem `try/catch`; a chamada `DELETE /api/auth/users/{id}` falha com 500 no backend e a promise rejeita em silêncio).

Causa do 500 (provada por teste de regressão reproduzindo a falha): o usuário tem registros de trilha de auditoria (`audit_logs.user_id` → FK `users.id`) e/ou de comunicação (`communication_logs.sent_by` → FK `users.id`); **nenhuma das FKs tem `ondelete`**, então o Postgres de produção (e o SQLite de teste com `PRAGMA foreign_keys=ON`) recusa o `DELETE FROM users` com `IntegrityError` — mesmo com `passive_deletes=True` na relação `User.audit_logs`, que só funciona quando a cascade existe no banco.

## Regras da skill aplicadas

- E1 porta de entrada: **prova obrigatoria** — causa raiz comprovada por `teste_falho` (teste de regressão criado e rodado, vermelho).
- Escopo travado pela lista de `arquivos_impactados` de `01-CAUSA-RAIZ.md`.
- TDD: o teste de regressão já existe e guia o fix do E3.