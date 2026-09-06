---
expx_schema: 1
expx_tool: sprintx
kind: decisoes
trabalho_id: super-admin-master
atualizado_em: 2026-09-05
decisoes:
  - id: D-01
    decisao: Somente super_admin gerencia usuarios criar editar excluir e definir permissoes
    alternativa_descartada: Admin comum mantem esse poder como hoje
    motivo: Usuario quer um unico master no sistema
    status: fechada
    bloqueante: false
  - id: D-02
    decisao: Admin comum passa a ser regulavel por permissao de modulo igual secretary e teacher so super_admin mantem bypass automatico total
    alternativa_descartada: Admin comum continua com acesso automatico a tudo sem checagem
    motivo: Usuario quer controle granular real sobre todos os usuarios sem excecao para admin
    status: fechada
    bloqueante: false
  - id: D-03
    decisao: Permissoes por modulo passam a ser validadas de verdade no backend bloqueio real e nao so ocultacao visual no menu
    alternativa_descartada: Manter enforcement so visual no frontend
    motivo: Usuario quer que o sistema funcione a 100 por cento na sua totalidade nao so esconder o menu
    status: fechada
    bloqueante: false
  - id: D-04
    decisao: Auditoria e Configuracoes entram na lista de modulos controlaveis por usuario junto aos 13 modulos existentes totalizando 15
    alternativa_descartada: Manter so os 13 modulos atuais
    motivo: Usuario quer controle total inclusive sobre essas duas telas
    status: fechada
    bloqueante: false
  - id: D-05
    decisao: A migracao marca automaticamente todos os 15 modulos para qualquer usuario com role admin ja existente no banco antes do deploy preservando o acesso atual sem intervencao manual
    alternativa_descartada: Deixar os admins existentes sem nenhum modulo ate o super_admin configurar manualmente
    motivo: Evitar quebrar o acesso do admin atual Admin Deploy no momento do deploy
    status: fechada
    bloqueante: false
  - id: D-06
    decisao: Reaproveitar o mecanismo existente campo permissions JSON no model User mais a lista de chaves de modulo sem criar tabela ou schema novo de permissoes
    alternativa_descartada: Criar um sistema de permissoes por acao create edit delete por modulo mais granular
    motivo: Usuario disse explicitamente que os acessos podem ser os mesmos so precisa mudar quem controla e que o enforcement seja real
    status: fechada
    bloqueante: false
---

# Decisões — super-admin-master

## Decisões

```
D-01 | Somente super_admin gerencia usuários (criar, editar, excluir e definir permissões) | Admin comum mantém esse poder como hoje | Usuário quer um único master no sistema (P-01)
D-02 | Admin comum passa a ser regulável por permissão de módulo, igual secretary/teacher; só super_admin mantém bypass automático total | Admin comum continua com acesso automático a tudo sem checagem | Usuário quer controle granular real sobre todos os usuários, sem exceção para admin (P-02)
D-03 | Permissões por módulo passam a ser validadas de verdade no backend (bloqueio real), não só ocultação visual no menu | Manter enforcement só visual no frontend | Usuário quer que o sistema funcione "100% na sua totalidade", não só esconder o menu (P-03)
D-04 | Auditoria e Configurações entram na lista de módulos controláveis por usuário, junto aos 13 módulos existentes (total 15) | Manter só os 13 módulos atuais | Usuário quer controle total inclusive sobre essas duas telas (P-04)
D-05 | A migração marca automaticamente todos os 15 módulos para qualquer usuário com role admin já existente no banco antes do deploy, preservando o acesso atual sem intervenção manual | Deixar os admins existentes sem nenhum módulo até o super_admin configurar manualmente | Evitar quebrar o acesso do admin atual (Admin Deploy) no momento do deploy (P-05)
D-06 | Reaproveitar o mecanismo existente (campo `permissions` JSON no model User + lista de chaves de módulo), sem criar tabela/schema novo de permissões | Criar um sistema de permissões por ação (create/edit/delete) por módulo, mais granular | Usuário disse explicitamente que "os acessos podem ser os mesmos" — só precisa mudar quem controla e que o enforcement seja real (mensagem original do usuário)
```

## Pendências

Nenhuma pendência.

## Risco conhecido, não bloqueante

`Configurações` vira um módulo ocultável (D-04). A tela de "trocar a própria senha" hoje mora dentro de Configurações (`change-password`, `frontend/src/pages/Settings.tsx`) — se o super_admin desmarcar `Configurações` para alguém, essa pessoa perde o atalho de trocar a própria senha pela UI e passa a depender do fluxo de e-mail ("Esqueci minha senha"). Registrado para a F3 decidir se o formulário de troca de senha precisa migrar para um lugar sempre acessível (ex.: menu do usuário) ou se o comportamento atual é aceitável.
