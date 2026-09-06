---
expx_schema: 1
expx_tool: sprintx
kind: sprint
trabalho_id: super-admin-master
sprint_id: sprint-04
titulo: Frontend master exclusivo e entrega
status: concluido
criterio_saida: hasPermission da bypass so a super_admin a tela de usuarios e exclusiva do super_admin e a suite completa mais build terminam verdes
fases: [F-04.1, F-04.2]
riscos: [Ocultar Configuracoes tira o atalho de trocar a propria senha para quem nao tiver o modulo — aceito na F2 como risco nao bloqueante]
atualizado_em: 2026-09-05
---

# Sprint 04 — Frontend master exclusivo e entrega

## Objetivo

Levar D-01/D-02 para a interface: `hasPermission` deixa de dar bypass automático para `admin` (só `super_admin`), o `Sidebar` passa a checar o módulo `settings`, e a tela de Configurações passa a mostrar os 15 checkboxes de módulo para qualquer role (inclusive `admin`) e restringe a aba "Usuários" exclusivamente ao `super_admin`. Fecha com a suíte completa, build e commit.

## Fases

| Fase | Título | Roda em paralelo com |
|---|---|---|
| F-04.1 | Ajustes de frontend | nenhuma |
| F-04.2 | Suíte completa e entrega | nenhuma |

Detalhe de cada fase em `fases.md`; tasks em `tasks.md`.

## Critério de saída

`pytest` 0 failed, `vitest` 0 failed, `npm run build` exit 0; um `secretary` com só o módulo `students` liberado não vê nenhum outro item no menu e recebe 403 ao chamar `GET /api/financial/dashboard` diretamente.

## Riscos conhecidos

- Ocultar `Configurações` (quando `settings` não estiver liberado) tira o atalho de trocar a própria senha pela UI — aceito como risco não bloqueante na F2 (`00-DECISOES.md`); quem ficar sem o módulo usa "Esqueci minha senha".
