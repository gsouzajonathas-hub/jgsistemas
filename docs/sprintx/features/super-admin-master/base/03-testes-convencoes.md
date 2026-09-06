# Convenções de teste do projeto

## Contrato de entrada

- Backend: `python -m pytest -q` a partir de `backend/` (`backend/tests/conftest.py`). Banco SQLite temporário isolado por execução (`conftest.py:10-16`), `SECRET_KEY`/`DATABASE_URL`/`ENVIRONMENT` de teste setados antes de qualquer import do app.
- Frontend: `npx vitest run` a partir de `frontend/` (vitest + Testing Library); typecheck com `npx tsc --noEmit`; build com `npm run build`.

## Contrato de saída

- Fixtures disponíveis (`backend/tests/fixtures.py`): `db_session` (sessão async sobre o banco temporário), `admin_user` (`role="admin"`, email `admin@teste.local`, via `_get_or_create`), `auth_headers` (JWT do `admin_user`, **sem** o campo `role` no payload — `create_access_token({"sub": str(admin_user.id)})`, `fixtures.py:58-60`).
- `test_super_admin.py` já define localmente `super_admin_user` (fixture própria, `role="super_admin"`) e `super_admin_headers` (JWT completo, com `role`) — não estão em `fixtures.py` compartilhado, são locais desse arquivo (`backend/tests/test_super_admin.py:111-132`).

## Limites e cotas

NÃO DOCUMENTADO — sem timeout ou limite de execução configurado explicitamente nos arquivos lidos.

## Erros conhecidos e tratamento

NÃO DOCUMENTADO.

## Riscos para a nossa implementação

1. Qualquer teste novo que precise de um `super_admin` autenticado deve reutilizar (ou promover para `fixtures.py` compartilhado) o padrão já usado em `test_super_admin.py`, para não duplicar a criação do usuário/token em cada arquivo novo.
2. `auth_headers` (admin comum) não carrega `role` no JWT — isso é aceito porque `get_current_user` sempre busca o `User` no banco pelo `sub` e lê `role` de lá (`utils/auth.py:80-84`), nunca confia no payload do token para autorização. Qualquer novo teste que monte token manualmente deve seguir o mesmo padrão (não é preciso colocar `role` no payload para os testes de autorização passarem).

## Fonte

- `backend/tests/conftest.py` (linhas 1-28) — lido nesta sessão, 2026-09-05
- `backend/tests/fixtures.py` (linhas 25-60) — lido nesta sessão, 2026-09-05
- `backend/tests/test_super_admin.py` (arquivo completo) — lido nesta sessão, 2026-09-05
