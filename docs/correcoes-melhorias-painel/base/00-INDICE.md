# Índice — Base (F1) — correcoes-melhorias-painel

> Feature (slug): `correcoes-melhorias-painel`
> Fase corrente: F1 INGESTÃO (base registrada a partir do mapeamento do explore)
> Escopo: pacote de correções de bugs, melhorias e novas funcionalidades do painel da escola (2º bloco de demandas).

## Arquivos da base

| Arquivo | Conteúdo |
|---|---|
| `00-INDICE.md` | Este índice |
| `00-LACUNAS.md` | Lacunas e pontos frágeis encontrados no mapeamento |
| `01-mapeamento-bugs.md` | Mapeamento consolidado das 9 áreas + decisões técnicas |

## Estrutura do fluxo

| Fase | Status |
|---|---|
| F1 INGESTÃO | ✅ base registrada |
| F2 DESCOBERTA | pendente |
| F3 PLANO | pendente |
| F4 ORQUESTRADOR | pendente |
| F5 AUDITORIA | pendente |
| F6 EXECUÇÃO | pendente |

## Slug/entidade técnica

- Backend: `backend/app/routes/*.py` + `backend/app/services/*.py` (receipt/PDF) + `backend/app/utils/auth.py`
- Frontend: `frontend/src/pages/*.tsx` + `frontend/src/services/api.ts` + `frontend/src/contexts/AuthContext.tsx`
- Infra: `backend/app/main.py` (migrations, sem Alembic), `backend/app/database.py`, `backend/app/utils/paths.py`
