# SERVIÇOS E INTEGRAÇÕES EXTERNAS

> Fatos lidos do código real em `backend/app/services/*.py` e `backend/app/utils/*.py`.

## Contrato de entrada

| Serviço | Função pública | Entrada |
|---|---|---|
| Recibo (services/receipt_service.py) | `build_receipt_pdf(payment, installment, student, settings) -> bytes` (235) | objetos ORM (payment/installment/student/settings) |
| Carnê (services/carne_service.py) | `build_carne_pdf(carnet, installments, student, responsible, settings, course_info=None, contract_info=None) -> bytes` (767); `build_carne_pdf_custom(inst_data, student, responsible, settings, ..., segunda_via=False, ...)` (778) | carnet + parcelas + escola via settings |
| Contrato (services/contract_service.py) | `build_contract_pdf(data: dict) -> bytes` (32) | dict com chaves school, student, guardian, contract, plan, course_name, parcels, city, contract_number |
| Ficha do aluno (services/student_sheet_service.py) | `build_student_sheet_pdf(data: dict) -> bytes` (40) | dict com school, enrollment_number, student, responsible, city |
| Estilo de relatórios (services/report_style.py) | `draw_report_header(c, w, h, settings, subtitle)` (12); `draw_report_footer(c, w, h, settings, left_text, right_text)` (59) | canvas ReportLab + settings da escola |
| WhatsApp (services/whatsapp_service.py) | `async send_whatsapp(phone: str, message: str) -> dict` (5) | telefone + mensagem |
| E-mail (services/email_service.py) | `async send_email(to: str, subject: str, body: str) -> dict` (7) | destinatário, assunto, corpo |
| PIX (utils/pix.py) | `build_pix_payload(key, merchant_name, merchant_city, amount=None, txid="***") -> str` (27); `crc16(payload)` (5); `pix_city_from_address(address)` (49) | chave PIX, nome/cidade do recebedor, valor, txid |
| Uploads (utils/uploads.py) | `async validate_and_save(file: UploadFile, allowed_exts=None) -> (nome_arquivo, conteúdo)` (42) | UploadFile |
| Auditoria (utils/audit.py) | `async log_audit(db, user, action, entity=None, entity_id=None, details=None, ip_address=None)` (4) | sessão, usuário, ação, entidade |

## Contrato de saída

- **Documentos** (recibo/carnê/contrato/ficha): bytes de PDF gerados localmente com **ReportLab** (A4). Carnê inclui QR Code PIX (`QrCodeWidget` com `barLevel="M"`, carne_service.py:83; payload via `build_pix_payload` com `txid=f"PARC{id}"`, 743-746). Recibo/contrato/ficha usam `settings.logo_url`; margens do contrato: L/R 20mm, topo 16mm, base 18mm (contract_service.py:36-37).
- **WhatsApp (Z-API)**: `{"success": True, "error": None, "provider_id": ...}` ou `{"success": False, "error": "Z-API: {msg}"}` (whatsapp_service.py:28-34). Chamada `POST {ZAPI_INSTANCE_URL}/send-text` com headers `Client-Token` e payload `{phone, message}` (19-21). Timeout 30s (24).
- **E-mail (SMTP)**: `{"success": True, "error": None}` ou `{"success": False, "error": str(e)}`. Usa `aiosmtplib.send(..., start_tls=True)` (email_service.py:27-34). Mensagem `MIMEMultipart("alternative")` com texto plano + HTML.
- **PIX**: payload EMV/BR Code offline: GUI `br.gov.bcb.pix`, MCC `0000`, moeda `986` (BRL), chave máx 77 chars, merchant_name máx 25, merchant_city máx 15, txid máx 25 default `***`, campo 6304 + CRC16 (pix.py:29-46).
- **Uploads**: retorna `(uuid4().hex + ext, conteúdo)` — não salva em disco (salvamento é do chamador); destinos resolvidos por `app/utils/paths.py` (`get_upload_dir`, `get_upload_path`, `get_student_files_dir` = `{DATA_DIR}/student_files`, fora do static público).
- **Auditoria**: cria `AuditLog` sem commit (commit do chamador). Eventos registrados (call sites): `certificate.issue` (certificates.py:139), `login` (auth.py:104, 211), `user.create/update/delete` (auth.py:152, 203, 352, 386), `auth.forgot/reset/change_password` (auth.py:244, 289, 305), `carne.custom_pdf` (carnes.py:663), `student.create/update/delete/upload` (students.py:228, 285, 314, 330), `student.file_delete` (students.py:378), `plan.toggle` / `plan.contract` (financial.py:189, 276), `contract.sign/cancel` (financial.py:345, 357), `settings.update` / `settings.logo_upload` (settings.py:60, 77), `event.create/delete` (schedule.py:64, 75).

## Limites e cotas

- Upload: máx **5 MB** (`uploads.py:6`); extensões: png, jpg/jpeg, gif, webp, pdf, doc, docx, xls, xlsx, csv (`uploads.py:9-21`); imagens: png, jpg/jpeg, gif, webp (`IMAGE_EXTENSIONS`, 23).
- WhatsApp: timeout 30s (`whatsapp_service.py:24`).
- E-mail: `SMTP_PORT` default "587", STARTTLS; timeout NÃO DOCUMENTADO (`email_service.py:9, 31`).
- Carnê: `late_fee_pct` default 2.0; `interest_daily_pct` default 0.033 (carne_service.py:457-458, 790-791).

## Erros conhecidos e tratamento

- **Upload** (`uploads.py:48-63`): extensão não permitida → 400 "Tipo de arquivo não permitido"; MIME declarado não bate com extensão → 400 "Conteúdo do arquivo não corresponde à extensão"; >5 MB → 413 "Arquivo excede o tamanho máximo de 5 MB"; magic bytes não conferem (sobe extensão) → 400 "Conteúdo do arquivo inválido ou corrompido". Office/csv sem magic bytes passam direto (38).
- **WhatsApp**: config ausente → `{"success": False, "error": "Configuração Z-API não encontrada..."}` (10); falha HTTP → `Z-API: {message|error|str}` (31-32); exceção → `str(e)` (34).
- **E-mail**: config ausente → `{"success": False, "error": "Configuração SMTP não encontrada..."}` (15); exceção → `str(e)` (37).
- **Telefone WhatsApp**: normalização remove não-dígitos; se `len <= 11` prefixa "55" (whatsapp_service.py:12-17).

## Riscos para a nossa implementação

1. **Z-API e SMTP sem config** não quebram o app — as rotas respondem `success:false` no body. O usuário só descobre que o envio falhou olhando a resposta.
2. **QR PIX depende de `settings.pix_key`/`school_name`/`address`** — sem chave PIX cadastrada, o carnê sai sem QR.
3. **Auditoria não faz commit** — qualquer rota que leia `log_audit` mas falhe no commit perde o registro silenciosamente.
4. **Uploads valida por conteúdo (magic bytes)**, mas office/csv não são validados por conteúdo real — risco residual de arquivo malicioso com extensão permitida.
5. **Migração SQLite→Postgres** (`backend/scripts/migrate_sqlite_to_postgres.py`) ignora `attendances`, `certificates`, `evaluations`, `grade_weight_configs`, `subscriptions` (122) — coerente com o modelo, mas `subscriptions` não tem model correspondente.

## Fonte

- `backend/app/services/*.py`, `backend/app/utils/{pix,uploads,audit,constants,paths}.py`, `backend/app/models/audit_log.py`, `backend/scripts/migrate_sqlite_to_postgres.py` — acessado em 2026-08-29.