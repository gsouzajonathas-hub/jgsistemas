---
expx_schema: 1
expx_tool: runx
kind: ocorrencia
trabalho_id: OC-2026-0004
titulo: Erro NOT_FOUND ao atualizar
tipo_ocorrencia: bug
recebido_em: 2026-09-05
origem: chat
tem_reproducao: true
modulo_afetado: [login]
atualizado_em: 2026-09-05
---

# OC-2026-0004 — Erro NOT_FOUND ao atualizar

## Identificação

| Campo | Valor |
|---|---|
| identificador | OC-2026-0004 |
| titulo | Erro NOT_FOUND ao atualizar |
| tipo | bug |
| aberta em | 2026-09-05 |

## Relato original do cliente

> ta dando esse erro quando atualiza 04: NOT_FOUND
> Code: NOT_FOUND
> ID: gru1::w4wdc-1788619230295-51d2c05028eb

## Passos de reprodução

1. Abrir `https://jgsistemas.dev.br` — a raiz carrega a landing (200).
2. Navegar até a página de login (`/login`) e pressionar F5 (recarregar).
3. O navegador faz `GET /login` na Vercel e recebe **HTTP 404** com a página de erro da Vercel:
   `404: NOT_FOUND` / `Code: NOT_FOUND` / `ID: gru1::...` / link para `vercel.com/docs/errors/NOT_FOUND`.

> O erro **não** vem do Supabase: `gru1::` é o request ID da edge da Vercel e a página é o template 404 da Vercel. A mesma falha afeta a API: `GET /api/health` e `POST /api/auth/login` também retornam 404 no domínio (rewrite `/api` → Render inativo).

## Ambiente, versão e dados relevantes

- **Ambiente:** produção — frontend em `https://jgsistemas.dev.br` (Vercel), backend em `https://jgsistemas-backend.onrender.com`
- **Versão:** deploy atual posterior ao commit `ed9d1f6` (2026-08-24, "Move config Vercel p/ raiz (root build delega ao frontend) e adiciona fallback SPA")
- **Usuário/perfil:** cliente (relato via chat)
- **Dados envolvidos:** n/a — erro de configuração de deploy, não de dados
- **Evidências anexadas:** mensagem de erro: `NOT_FOUND` / `Code: NOT_FOUND` / `ID: gru1::w4wdc-1788619230295-51d2c05028eb`