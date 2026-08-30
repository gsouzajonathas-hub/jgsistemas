# Sprint 03 — Frontend: Reativar Módulos e Entregar Fluxo Usável

## Objetivo

Reativar no frontend os módulos de Turmas, Frequência, Avaliações, Boletim e Certificados: criar os tipos e grupos de API ausentes, rotear as 5 páginas órfãs com permissões, corrigir os imports quebrados, cobrir com testes vitest, garantir build limpo (`tsc && vite build`) e executar o checklist manual do fluxo E2E nas telas (D-16).

## Fases

| Fase | Título | Roda em paralelo com |
|---|---|---|
| F-03.1 | Tipos e grupos de API ausentes | nenhuma |
| F-03.2 | Rotas, permissões e correção das páginas órfãs | nenhuma |
| F-03.3 | Testes vitest e build limpo | nenhuma |
| F-03.4 | Checklist manual do fluxo E2E | nenhuma |

Detalhe de cada fase em `fases.md`; tasks em `tasks.md`.

## Critério de saída

`npm run build` (tsc + vite) em `frontend/` passa sem erros; `vitest run` verde (0 failed); as 5 páginas acessíveis via menu com permissões; checklist manual do fluxo E2E preenchido com todas as etapas validades no navegador.

## Riscos conhecidos

- 5 páginas órfãs importam APIs/tipos inexistentes — o build `tsc && vite build` QUEBRA hoje (`base/04-frontend.md`, `frontend/src/services/api.ts`, `frontend/src/types/index.ts`); o critério de aceite é justamente o build passar a limpar.
- O Header referencia `/classes` sem rota (`Header.tsx:11`) — corrigir junto do roteamento (`base/04-frontend.md`).
- Permissões novas (classes/attendance/evaluations/boletins/certificates) precisam ser concedidas a usuários existentes; sem isso a página fica inacessível (`PermissionRoute`, `base/04-frontend.md`).
- O hook useSettings tem cache em módulo — testes vitest precisam resetar o cache entre testes (`base/04-frontend.md`, `hooks/useSettings.ts`).