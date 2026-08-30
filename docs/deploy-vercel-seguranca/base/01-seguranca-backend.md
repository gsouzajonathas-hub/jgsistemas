# Segurança do Backend (estado atual)

> Fonte: auditoria factual por leitura de código em 2026-08-30 (referências `arquivo:linha` apontadas em cada item).

## Contrato de entrada

- Autenticação: JWT HS256 (`backend/app/utils/auth.py:29`), token com `exp` = now + `ACCESS_TOKEN_EXPIRE_MINUTES` (default 60, `auth.py:30`). SECRET_KEY de env; backend recusa iniciar com chaves padrão (`auth.py:17-27`).
- Senha: bcrypt nativo (`import bcrypt`, `auth.py:5,35-40`); mínimo 8 chars (`validate_password`, `auth.py:43-45`).
- Login: rate limit por IP 10/300s (`routes/auth.py:93`), resposta genérica anti-enumeração (`auth.py:99`), auditoria de login (`auth.py:104`).
- Register: rate limit 5/300s (`auth.py:127`); bootstrap aberto só sem usuários, depois exige admin (`auth.py:133-137`).
- Reset de senha: token único `secrets.token_urlsafe(32)`, hash SHA-256, TTL 30 min, inválido após uso (`utils/auth.py:48-49`, `routes/auth.py:68-69,244,288-289`); rate limit 5/900s em forgot e reset (`auth.py:235,270`).
- Supabase sync: valida token contra servidor via httpx (`auth.py:174-180`), env `SUPABASE_URL`/`SUPABASE_ANON_KEY`.
- Uploads: extensão + MIME + magic bytes; limite 5 MB (`utils/uploads.py:6,9-39,58-60`); bloqueia HTML/SVG/JS; nome `uuid4().hex + ext` (`uploads.py:65`).

## Contrato de saída

- CORS: origens de `CORS_ORIGINS` (default localhost 5173/5174/3000, `main.py:109`), `allow_credentials=True` (`main.py:115`), nunca `*` com credenciais.
- Headers globais: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin` (`main.py:121-128`).
- Headers de `/uploads`: `Content-Disposition: attachment` para não-imagens, `Content-Security-Policy: default-src 'none'`, `X-Frame-Options: DENY` (`main.py:131-142`).
- `/api/health`: público (`main.py:176-178`).
- `/docs` e `/redoc`: habilitados só se `ENVIRONMENT != production` (`main.py:20-21,103-104`); `render.yaml` define production → docs ocultos no deploy.
- Documentos de alunos: servidos por endpoint autenticado `/api/students/{id}/files/{file_id}/download` (não são públicos; `routes/students.py:346-365`).
- Auditoria: tabela `audit_logs` (user_id, action, entity, entity_id, details, ip_address, created_at), rota admin-only `GET /api/audit` (`routes/audit.py:12-43`).

## Limites e cotas

- Rate limit local: login 10/300s, register 5/300s, forgot 5/900s, reset 5/900s (`routes/auth.py:93,127,235,270`) — limiter em memória (`utils/security.py:14-23`), sem persistência, sem multi-instância.
- Upload: 5 MB (`utils/uploads.py:6`).
- Token JWT: 60 min default (`utils/auth.py:30`).
- Reset token: 30 min (`routes/auth.py:23`).

## Erros conhecidos e tratamento

- SECRET_KEY inválida/padrão → recusa iniciar (`utils/auth.py:17-27`).
- Credenciais erradas → resposta genérica "Email ou senha incorretos" (`routes/auth.py:99`).
- Upload inválido → rejeitado por extensão/MIME/magic (`utils/uploads.py`).
- NÃO DOCUMENTADO: comportamento de lockout de conta (não existe lockout por conta; só rate limit por IP).

## Riscos para a nossa implementação

1. **HSTS: NÃO EXISTE** em código nem infra (sem `Strict-Transport-Security`).
2. **CSP global: NÃO EXISTE** (só no `/uploads`).
3. **Rate limit global: NÃO EXISTE** (só rotas de auth); em memória → perde histórico em restart e não escala multi-instância.
4. **Auditoria incompleta**: não cobre alterações em alunos/financeiro/matrículas, nem tentativas de login falhas.
5. **Lockout de conta: NÃO EXISTE** — força bruta por conta ainda possível (mitigado só pela resposta genérica + rate limit por IP).
6. **Dependências não pinadas**: `bcrypt` importado mas não listado em `requirements.txt` (vem transitivo de passlib); `Pillow` (PIL) usado (`certificates.py:163`) mas não listado.
7. **SECRET_KEY real presente no `.env` local** (fora do git — `git ls-files` confirma; mas é segredo vivo a rotacionar antes de deploy).
8. **SPA catch-all** (`main.py:184-192`) serve arquivos de `frontend_dist` por caminho da URL sem `basename` — candidato a revisão de path traversal (mitigado parcialmente por `os.path.isfile` e bloqueio de prefixo `api/`).
9. SQL: uso de ORM; `text()` só em migrações de startup sem input do usuário (`main.py:35-85`). LIKE com escape (`routes/search.py:11-12,24-27`). Sem SQL injection detectada.
10. Path traversal em uploads: mitigado via `os.path.basename` (`utils/paths.py:26`, `routes/students.py:87-91`); logo em PDFs também via `get_upload_path` com basename.

## Fonte

- Leitura direta de código-fonte `backend/app/**` em 2026-08-30 (referências linha-a-linha acima). Auditoria executada pelo agente explore (sessão bg_56ebbfa7).