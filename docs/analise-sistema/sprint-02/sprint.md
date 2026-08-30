# Sprint 02 — Backend: Reativar Módulos e Corrigir Lacunas

## Objetivo

Criar as 4 tabelas ausentes (importando os models no startup), registrar os 7 routers dormentes no app, adicionar auditoria nas ações reativadas, aplicar as correções decididas (student-profile 404, SMTP timeout 30s, remover `subscriptions`) e cobrir tudo com testes de integração — incluindo o teste do fluxo E2E completo (D-16) e o teste financeiro crítico (D-11).

## Fases

| Fase | Título | Roda em paralelo com |
|---|---|---|
| F-02.1 | Ativar tabelas, rotas e auditoria | F-02.2 |
| F-02.2 | Correções decididas (D-13, D-14, D-15) | F-02.1 |
| F-02.3 | Testes de integração e fluxo E2E | nenhuma |

Detalhe de cada fase em `fases.md`; tasks em `tasks.md`.

## Critério de saída

`pytest` em `backend/` roda verde (0 failed) incluindo: teste que confirma a criação das 4 tabelas, teste que confirma as 14+7 rotas registradas, teste do fluxo E2E completo (professor → turma → matrícula → frequência → avaliações → boletim → certificado), teste financeiro crítico e os testes das 3 correções.

## Riscos conhecidos

- Criação de schema é `create_all` + ALTERs manuais sem migrations — importar os 4 models cria as tabelas só em bancos novos; bancos existentes precisam recriar ou ALTER manual (`base/01-backend-nucleo.md`, `main.py:28-29`).
- 7 routers dormentes definem rotas sem paginação em vários pontos e um retorno `200 {error}` em student-profile — corrigido por decisão D-15 (`base/02-api-rotas.md`).
- Auditoria não faz commit — ações reativadas devem seguir o padrão (commit no chamador) ou o registro se perde (`base/03-servicos-integracoes.md`, `utils/audit.py:4`).
- Registro de routers no main.py muda o contrato exposto: qualquer cliente que atualmente recebe 404 nesses endpoints passará a receber respostas reais — risco aceito pela decisão D-04/D-01.