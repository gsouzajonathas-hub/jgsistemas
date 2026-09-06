---
expx_schema: 1
expx_tool: sprintx
kind: sprint
trabalho_id: super-admin-master
sprint_id: sprint-03
titulo: Enforcement real de permissao por modulo
status: concluido
criterio_saida: Toda rota de leitura e escrita dos 15 modulos exige require_permission em vez de require_role ou get_current_user puro
fases: [F-03.1]
riscos: [Volume grande de rotas tocadas em arquivos distintos — risco de esquecer alguma rota dentro de um arquivo grande como financial.py ou boletins.py]
atualizado_em: 2026-09-05
---

# Sprint 03 — Enforcement real de permissão por módulo

## Objetivo

Aplicar `require_permission(<modulo>)` em toda rota de leitura e escrita dos 15 módulos, substituindo `require_role` (que hoje só olha o papel, não os módulos) e `get_current_user` puro (que hoje não checa nada) — implementando D-03. Ao final desta sprint, um usuário sem um módulo liberado não consegue mais acessar os dados daquele módulo nem chamando a API diretamente, só a ocultação do menu (já existente) deixa de ser a única barreira.

## Fases

| Fase | Título | Roda em paralelo com |
|---|---|---|
| F-03.1 | Enforcement por módulo | nenhuma |

Detalhe de cada fase em `fases.md`; tasks em `tasks.md`.

## Critério de saída

`grep -rn "require_role\|get_current_user" backend/app/routes/*.py` não mostra mais nenhuma rota dos 15 módulos usando autorização de papel puro para dado de negócio — todas usam `require_permission`; `python -m pytest -q` roda com 0 failed.

## Riscos conhecidos

- Arquivos com muitas rotas (`financial.py`, `boletins.py`, `reports.py`) têm maior chance de uma rota passar despercebida — o critério de saída exige a varredura por grep como prova, não confiar só na leitura do arquivo.
