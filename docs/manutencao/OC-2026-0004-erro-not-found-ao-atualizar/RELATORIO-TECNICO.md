# Relatório técnico — OC-2026-0004 Erro NOT_FOUND ao atualizar

> Estágio E5. Resumo para humanos (e para quem prioriza o backlog), gravado em 2026-09-05.

## Resumo executivo

Ao atualizar (F5) a página de login do sistema, aparecia a tela de erro **NOT_FOUND** da Vercel — não era um erro do sistema, era a hospedagem devolvendo 404 para a rota `/login` e para todas as chamadas `/api/*`. A causa: a configuração do deploy (`vercel.json`) foi movida para a pasta errada em um commit de 24/08, e a Vercel passou a ignorá-la. A configuração foi restaurada na pasta correta e o arquivo errado foi removido.

## O que aconteceu (causa)

O projeto da Vercel (`jgsistemas`) está ancorado na pasta `frontend/`. A Vercel só lê o `vercel.json` dentro dessa pasta de projeto. No commit `ed9d1f6` (24/08/2026) o `vercel.json` foi movido para a raiz do repositório — onde a Vercel o ignora. Resultado:

- Os redirecionamentos de API (`/api/*` e `/uploads/*` → backend no Render) deixaram de existir → 404 em todas as chamadas de API.
- O "fallback SPA" (qualquer rota sem arquivo físico → `index.html`) deixou de existir → 404 ao atualizar `/login`.

Evidência empírica (05/09/2026): `/` abria, `/login` dava 404, `/api/health` dava 404 no domínio, mas o mesmo `/api/health` respondia 200 direto no backend do Render.

## O que foi feito

1. **Teste de regressão** (`frontend/src/__tests__/vercelConfig.test.ts`): fixa o contrato da config de deploy — falha sem o arquivo correto, passa com ele.
2. **`frontend/vercel.json` criado** com os 3 redirecionamentos (API, uploads e fallback SPA), sem comandos de build — o build atual já funciona pelo padrão da Vercel na pasta `frontend/`.
3. **`vercel.json` da raiz removido** (era a fonte de configuração enganosa e ignorada).
4. Validação: suíte inteira verde (16 arquivos / 45 testes), typecheck OK, escopo conferido via git.

## Como validar em produção (ação externa)

Após o próximo deploy da Vercel (push na branch de produção ou `vercel --prod`):

- `https://jgsistemas.dev.br/login` → deve abrir a tela de login (200), inclusive ao atualizar com F5.
- `https://jgsistemas.dev.br/api/health` → deve responder `{"status":"ok","message":"Sistema de gestão escolar"}`.
- Fazer login normalmente.

## Pendências e novas ocorrências sugeridas (priorizadas)

| Prioridade | Item | Motivo |
|---|---|---|
| ★★★ | **`npm test` não roda no Windows do dev** — `pool: forks` do vitest não inicia o worker nesta máquina (timeout de 60s). Suíte validada com `--pool=threads --maxWorkers=2`. | Bloqueia o fluxo de testes do desenvolvedor; correção pequena no `vitest.config.ts`. |
| ★★ | **Limpeza `.vercel/project.json` da raiz** (link antigo do CLI). | Evita confusão futura sobre onde o projeto Vercel está ancorado. |
| ★ | **Declarar build explicitamente no `frontend/vercel.json`** (`buildCommand`/`outputDirectory` no contexto `frontend/`) se o padrão da Vercel mudar. | Mantém o build estável e autodocumentado. |
| ★★ | **Redeploy + validação em produção** (ação externa — acesso ao deploy). | Fecha a ocorrência de ponta a ponta; sem isso, produção continua no estado antigo até o próximo deploy. |