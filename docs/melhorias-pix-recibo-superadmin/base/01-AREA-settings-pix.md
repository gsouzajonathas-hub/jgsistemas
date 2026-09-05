# Configurações da escola — Chave PIX (Settings + carnê)

## Contrato de entrada

- GET/PUT `/settings` usam o mesmo `SettingsSchema` (backend/app/routes/settings.py:16-28): `school_name` default `"Gestão Escolar"`; `address`, `phone`, `email`, `cnpj`, `pix_key`, `slogan`, `social_media` default `""`; `payment_methods` default `"PIX,Dinheiro,Débito,Crédito"`; `primary_color` default `"#3B82F6"`; `dark_mode: int = 0`; `due_day: int = 5`. Nenhum campo é obrigatório no PUT (todos têm default).
- `PUT /settings` exige autenticação e role `admin|secretary` — `require_role("admin", "secretary")` (settings.py:55). `GET /settings` exige apenas autenticação (settings.py:43).
- Frontend envia o **objeto inteiro** recebido do GET (inclui `id` e `logo_url`, que NÃO estão no schema — Pydantic v2 ignora campos extras por padrão; comportamento do framework, não documentado no projeto): `settingsAPI.update(settings)` em frontend/src/pages/Settings.tsx:64 (handleSave, L61-71). Input da chave PIX em Settings.tsx:243-247 (`setSettings({...s, pix_key: e.target.value})`).
- Upload de logo: `POST /settings/logo`, `UploadFile`, validado por `validate_and_save` com `IMAGE_EXTENSIONS` (settings.py:65-76).

## Contrato de saída

- `GET /settings` → objeto com `id`, `school_name`, `logo_url` (via `storage.display_url`), `address`, `phone`, `email`, `cnpj`, `pix_key` (`s.pix_key or ""`), `primary_color`, `dark_mode`, `due_day`, `slogan`, `social_media`, `payment_methods` (settings.py:45-51).
- `PUT /settings` → `{"message": "Configurações atualizadas"}` (settings.py:62) + `log_audit("settings.update")` (settings.py:59-60).
- `POST /settings/logo` → `{"logo_url": ...}` (settings.py:76).
- Consumo do PIX no carnê: `has_qr = bool(pix_payload) and status != "paid"` (backend/app/services/carne_service.py:554); `pix_key = (getattr(settings, "pix_key", "") or "").strip()` (carne_service.py:708); payload via `build_pix_payload` (carne_service.py:739-740; definição em backend/app/utils/pix.py:27).

## Limites e cotas

- `pix_key` é `VARCHAR(200)` (backend/app/models/settings.py:16); **sem validação de formato PIX no backend** — o schema aceita qualquer string (settings.py:22).
- Upload de logo: limite 5 MB, validação por extensão, MIME e conteúdo real (README.md, seção "Segurança" → "Uploads").
- Migração aditiva no startup: `ALTER TABLE school_settings ADD COLUMN pix_key VARCHAR(200)` quando a coluna não existe (backend/app/main.py:79-80).
- Rate limit para `/settings`: **NÃO DOCUMENTADO** (sem decorator em settings.py; na suíte de testes o rate limit global é desligado — backend/tests/conftest.py:16).

## Erros conhecidos e tratamento

- 401 sem token válido (`get_current_user`, backend/app/utils/auth.py:71-84).
- 403 "Acesso negado" para roles fora de `admin|secretary` no PUT/logo (`require_role`, auth.py:87-92 + settings.py:55).
- Tratamento de erro no modal de Configurações: **NÃO DOCUMENTADO** (handleSave em Settings.tsx:61-71 não relido em detalhe nesta sessão).
- GET/PUT nunca falham por ausência de linha: o registro é auto-criado se não existir (settings.py:31-39).

## Riscos para a nossa implementação

- R1: o PUT envia o objeto completo do GET; qualquer campo não validável pelo schema (ex.: `dark_mode: int` vs boolean vindo do frontend) causaria 422 e o relato "não salva" — **não confirmado**, exige reprodução (LACUNA L2).
- R2: cache global pode servir valor antigo a outras páginas após salvar, se não houver refresh (`pushSettingsCache`, frontend/src/hooks/useSettings.ts:4-10 e 19-34) — hipótese H2.
- R3: persistência do banco em produção não confirmada (LACUNA L1) — hipótese H3.
- R4: sem validação de formato da chave PIX, o QR do carnê é montado com a chave crua (carne_service.py:739).

## Fonte

backend/app/routes/settings.py; backend/app/models/settings.py; backend/app/utils/pix.py; backend/app/services/carne_service.py; backend/app/main.py:79-80; frontend/src/pages/Settings.tsx; frontend/src/hooks/useSettings.ts; frontend/src/services/api.ts — acessado em 2026-09-04.