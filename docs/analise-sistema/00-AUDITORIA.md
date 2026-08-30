# Auditoria — analise-sistema

Data: 2026-08-29

## Achados

| severidade | arquivo | problema | correção sugerida |
|---|---|---|---|
| MÉDIA | sprint-03/tasks.md (T-03.04, T-03.05) | `teste_integracao` declara "render das páginas não lança exceção", mas as tasks não criam arquivos de teste (`cria: []`, só `altera:` páginas); os arquivos de teste só nascem na T-03.06 — o teste declarado não é executável na própria task | Criar os arquivos `__tests__` nas próprias T-03.04/T-03.05 (TDD: teste antes do código) e a T-03.06 passa a apenas consolidar/executar a suíte, sem recriar arquivos; ou reescrever `teste_integracao` de T-03.04/05 para `tsc --noEmit` e deixar o render na T-03.06 |
| MÉDIA | sprint-03/tasks.md (T-03.03) + ORQUESTRADOR.md (§7 item 5) | O guard de rota exige permissões novas (classes/attendance/evaluations/boletins/certificates), mas o plano não declara como o usuário admin obtém essas permissões — sem mecanismo, o checklist manual (T-03.08) pode travar por falta de permissão | Declarar na T-03.03 (ou task própria) o mecanismo concreto: padrão de permissões default para role admin definido em código/seed, coberto por teste |
| MÉDIA | sprint-02/tasks.md (T-02.06) | Remover `subscriptions` da lista de ignoradas do migrate, mas o mesmo script (linha 122) também lista as 4 tabelas que a T-02.01 transforma em models — mantendo-as ignoradas, a migração não copiaria dados reais dessas tabelas | Na T-02.06, revisar a lista inteira de tabelas ignoradas do script: manter ignoradas apenas tabelas sem model; remover também as 4 tabelas que passaram a ser models |
| BAIXA | sprint-03/tasks.md (T-03.01, T-03.02) | `teste_integracao` baseado só em `tsc --noEmit` pode passar com implementação vazia (ex.: remover imports das páginas, ou tipos `any`) — baixa discriminação isolada | Contar com a T-03.06 (render real das páginas) como teste discriminante; opcionalmente adicionar um teste de tipo que consuma os grupos/API de fato |

## Veredito

VEREDITO: SIM — o plano está pronto para execução autônoma.