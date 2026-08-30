# TESTES AUTOMATIZADOS

> Resultado da varredura por testes em todo o repositório. **Nenhum teste automatizado foi encontrado** em backend, frontend ou scripts.

## Contrato de entrada

- **Backend**: `requirements.txt` (14 itens) NÃO lista `pytest` nem ferramenta de teste. Busca por arquivos `test_*.py`/`*_test.py` em `backend/` não encontrou nada.
- **Frontend**: `package.json` não possui script de teste (`dev`, `build`, `preview` apenas — linhas 6-10) e nenhuma dependência de teste (nada de jest/vitest/testing-library). Busca por arquivos `*.test.ts(x)`/`*.spec.ts(x)` em `frontend/` não encontrou nada.
- **Raiz/scripts**: não há suíte de testes, Makefile de CI ou workflow de verificação.

## Contrato de saída

- NÃO DOCUMENTADO — não existem testes, não há contrato de saída a descrever.

## Limites e cotas

- NÃO DOCUMENTADO — não há runner nem limites configurados.

## Erros conhecidos e tratamento

- NÃO DOCUMENTADO — não há testes para detectar erros automaticamente. O único "healthcheck" é a rota `GET /api/health` (`backend/app/main.py:168-170`), usada pelo Render (`render.yaml:8`).

## Riscos para a nossa implementação

1. **Zero cobertura de regressão** em um sistema com 21 tabelas, 14 routers ativos + 7 dormentes e 22 páginas — qualquer mudança nos módulos financeiro/matrícula/aluno tem risco alto de quebrar fluxos sem detecção.
2. **Deploy automático sem rede de segurança**: Render `autoDeploy: true` (`render.yaml:16`) publica em produção qualquer `push` na branch — sem testes, erro = incidente.
3. **Páginas órfãs no frontend** (ver `04-frontend.md`) compilam sem testes de tipo/CI para impedir — possível que o `build` passe com imports resolvendo para `undefined`, quebrando em runtime.
4. **F2 DESCOBERTA → F3 PLANO** deverão decidir explícitamente se a F6 EXECUÇÃO inclui fundação de testes (pytest + vitest) antes de qualquer feature.

## Fonte

- `backend/requirements.txt`, `frontend/package.json`, busca `glob` por `**/*test*` e `**/*spec*` em `backend/` e `frontend/` — acessado em 2026-08-29.