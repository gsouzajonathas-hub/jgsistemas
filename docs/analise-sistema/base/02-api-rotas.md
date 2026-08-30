# API — CONTRATO DAS ROTAS

> Fatos lidos do código real em `backend/app/routes/*.py` e `backend/app/main.py`. Todos os sucessos retornam **200** (nenhuma rota define `status_code` explícito). Erros de framework: 422 (validação Pydantic), 401/403 (Bearer ausente). Auth: `get_current_user` = token JWT válido; `require_role(...)` = 403 "Acesso negado" se papel não permitido.

## Rotas REGISTRADAS (main.py:152-165)

### auth — prefixo `/api/auth` (routes/auth.py)
| Método/Caminho | Auth | Body/Query | Saída/Erros |
|---|---|---|---|
| POST `/api/auth/login` (90) | público; rate 10/300s/IP | `{email*, password*}` | `{access_token, token_type:"bearer", user}`; 401 "Email ou senha incorretos", 403 "Conta desativada", 429 |
| POST `/api/auth/register` (123) | público se 0 usuários; senão admin; rate 5/300s/IP | `{name*, email*, password*, role="secretary", permissions?}` | `{message}`; 400 senha <8 ou "Email já cadastrado", 403 |
| POST `/api/auth/supabase-sync` (158) | Bearer Supabase + credenciais | — | `LoginResponse`; 503 sem SUPABASE_URL, 401 sessão inválida, 400 sem e-mail, 403 inativo |
| POST `/api/auth/forgot-password` (230) | público; rate 5/900s/IP | `{email*}` | `{message}` genérico; token 30 min (TTL `RESET_TOKEN_TTL_MINUTES=30`, auth.py:23) |
| POST `/api/auth/reset-password` (266) | público; rate 5/900s/IP | `{email="", token*, new_password*}` | `{message}`; 400 token inválido/usado/expirado ou senha <8 |
| POST `/api/auth/change-password` (294) | get_current_user | `{current_password*, new_password*}` | `{message}`; 400 senha atual incorreta |
| GET `/api/auth/me` (310) | get_current_user | — | `{id, name, email, role, avatar_url}` |
| GET `/api/auth/users` (321) | require_role("admin") | — | lista `{id, name, email, role, is_active, permissions, created_at}` |
| DELETE `/api/auth/users/{user_id}` (339) | require_role("admin") | path `user_id` | `{message}`; 400 autopróprio, 404 |
| PUT `/api/auth/users/{user_id}` (359) | require_role("admin") | path + `{name?, email?, role?, permissions?, is_active?}` | `{message}`; 404, 400 email duplicado |

### students — prefixo `/api/students` (routes/students.py)
| Método/Caminho | Auth | Body/Query | Saída/Erros |
|---|---|---|---|
| GET `/api/students` (112) | get_current_user | `skip=0, limit=50, search="", status=""` | `{students: [...], total}` |
| GET `/api/students/{student_id}` (139) | get_current_user | path | aluno + responsible; 404 |
| POST `/api/students` (162) | get_current_user | StudentSchema (full_name*; demais default "") | `{id, message}`; 400 CPF duplicado; cria 1ª parcela se monthly_fee |
| PUT `/api/students/{student_id}` (235) | get_current_user | StudentSchema | `{message}`; 404, 400 CPF duplicado |
| DELETE `/api/students/{student_id}` (291) | require_role("admin","secretary") | path | `{message}`; 404; cascade payments/installments/carnes/discounts/sales |
| POST `/api/students/{student_id}/upload` (321) | require_role("admin","secretary") | form `file*`, `category="other"` | `{message, file_name, file_path:"private:..."}`; 400/413 upload |
| GET `/api/students/{student_id}/files` (336) | get_current_user | path | lista de arquivos com URL download |
| GET `/api/students/{student_id}/files/{file_id}/download` (346) | get_current_user | path | FileResponse; 404 |
| DELETE `/api/students/{student_id}/files/{file_id}` (368) | require_role("admin","secretary") | path | `{message}`; 404 |
| GET `/api/students/{student_id}/carne-pdf` (385) | get_current_user | path | StreamingResponse PDF (carnê); 404 |

### courses — prefixo `/api/courses` (routes/courses.py)
| Método/Caminho | Auth | Body/Query | Saída/Erros |
|---|---|---|---|
| GET `/api/courses` (11) | get_current_user | — | lista `{id, name, level}` |

### enrollments — prefixo `/api/enrollments` (routes/enrollments.py)
| Método/Caminho | Auth | Body/Query | Saída/Erros |
|---|---|---|---|
| GET `/api/enrollments` (24) | get_current_user | `skip=0, limit=50, status="", class_group_id?` | `{enrollments, total}` |
| POST `/api/enrollments` (62) | require_role("admin","secretary") | `{student_id*, class_group_id*, enrollment_date?, status="active", notes=""}` | `{id, message}`; 404 turma, 400 capacidade máxima |
| PUT `/api/enrollments/{enrollment_id}` (84) | require_role("admin","secretary") | body | `{message}`; 404 |
| POST `/api/enrollments/{id}/cancel` (99) | require_role("admin","secretary") | path | `{message}`; 404 |
| POST `/api/enrollments/{id}/suspend` (114) | require_role("admin","secretary") | path | `{message}` (trancamento); 404 |
| POST `/api/enrollments/{id}/renew` (129) | require_role("admin","secretary") | path | `{message, new_id}`; 404 turma, 400 capacidade |

### financial — prefixo `/api/financial` (routes/financial.py)
| Método/Caminho | Auth | Body/Query | Saída/Erros |
|---|---|---|---|
| GET `/api/financial/plans` (126) | get_current_user | — | lista de planos |
| POST `/api/financial/plans` (139) | require_role("admin","secretary") | PlanSchema (`name*`, `value*`, `installments=1`, `duration_months=1`, `discount_type="percent"`, ...) | `{id, message}`; 400 duração<1, parcelas<1 |
| PUT `/api/financial/plans/{plan_id}` (152) | require_role("admin","secretary") | body | `{message}`; 404 |
| DELETE `/api/financial/plans/{plan_id}` (164) | require_role("admin","secretary") | path | `{message}`; 404, 400 se há parcelas vinculadas |
| POST `/api/financial/plans/{plan_id}/toggle` (181) | require_role("admin","secretary") | path | `{is_active, message}`; 404 |
| POST `/api/financial/plans/{plan_id}/contract` (195) | require_role("admin","secretary") | path + ContractSchema | contrato criado (dict rico); 404 aluno/plano, 400 plano inativo, parcelas 1-24, modo inválido, data inválida |
| GET `/api/financial/contracts` (295) | get_current_user | `status=""` | lista de contratos |
| POST `/api/financial/contracts/{id}/sign` (337) | require_role("admin","secretary") | path | `{message, status:"signed"}`; 404 |
| POST `/api/financial/contracts/{id}/cancel` (350) | require_role("admin","secretary") | path | `{message, status:"cancelled"}`; 404 |
| GET `/api/financial/contracts/{id}/pdf` (367) | get_current_user | path | StreamingResponse PDF; 404 |
| GET `/api/financial/installments` (432) | get_current_user | `student_id?, status="", month="", skip=0, limit=50` | `{installments, total}` |
| POST `/api/financial/generate-month` (492) | require_role("admin","secretary") | `{month*}` (AAAA-MM) | `{created, month}` |
| POST `/api/financial/installments` (535) | require_role("admin","secretary") | `{student_id*, description*, amount*, due_date*, plan_id?, ...}` | `{id, message}`; 404 aluno |
| POST `/api/financial/payments` (551) | require_role("admin","secretary") | `{installment_id*, amount*, payment_date*, payment_method*, notes=""}` | `{message, payment_id, receipt_number}`; 404, 400 já paga/cancelada |
| GET `/api/financial/payments/{id}/receipt` (590) | get_current_user | path | StreamingResponse PDF recibo; 404 |
| GET `/api/financial/dashboard` (622) | get_current_user | `month=""` | totais financeiros |
| POST `/api/financial/discounts` (680) | require_role("admin","secretary") | `{student_id*, name*, percentage=0, amount=0, ...}` | `{id, message}` |

### carnes — prefixo `/api/carnes` (routes/carnes.py)
| Método/Caminho | Auth | Body/Query | Saída/Erros |
|---|---|---|---|
| GET `/api/carnes` (116) | get_current_user | `search="", status="", month="", student_id?, course_id?, skip=0, limit=50` | `{carnets, total}` |
| GET `/api/carnes/stats` (229) | get_current_user | `month=""` | `{total_carnets, total_to_receive, total_received, total_open, total_overdue}` |
| GET `/api/carnes/{carnet_id}/pdf` (266) | get_current_user | path | StreamingResponse PDF; 404 |
| GET `/api/carnes/{carnet_id}` (348) | get_current_user | path | carnê completo; 404 |
| POST `/api/carnes` (434) | require_role("admin","secretary") | `{student_id*, installment_value*, first_due_date*, total_installments=12, late_fee_pct=2.0, interest_daily_pct=0.033, interval="monthly", payment_methods="PIX,Dinheiro,Cartão", ...}` | `{id, message}` |
| POST `/api/carnes/{carnet_id}/payments/{installment_id}` (484) | require_role("admin","secretary") | `{amount*, payment_date*, payment_method*, notes=""}` | `{message, payment_id, receipt_number, late_fee, interest}`; 404, 400 já paga/cancelada |
| POST `/api/carnes/{carnet_id}/cancel` (556) | require_role("admin","secretary") | path | `{message}`; 404 |
| POST `/api/carnes/custom-pdf` (578) | require_role("admin","secretary") | `{student_id*, installment_ids*[], segunda_via=False}` | StreamingResponse PDF; 400 sem parcelas/parcelas inválidas/não pertencem |
| GET `/api/carnes/student/{student_id}/installments` (676) | get_current_user | path | lista de parcelas do aluno |

### schedule — prefixo `/api/schedule` (routes/schedule.py)
| Método/Caminho | Auth | Body/Query | Saída/Erros |
|---|---|---|---|
| GET `/api/schedule` (24) | get_current_user | `month?, year?` | lista de eventos |
| POST `/api/schedule` (45) | require_role("admin","secretary") | `{title*, event_type*, date*, start_time="", end_time="", description="", color="#3B82F6"}` | `{id, message}` |
| DELETE `/api/schedule/{event_id}` (69) | require_role("admin","secretary") | path | `{message}`; 404 |

### reports — prefixo `/api/reports` (routes/reports.py)
| Método/Caminho | Auth | Saída |
|---|---|---|
| GET `/api/reports/dashboard` (15) | get_current_user | indicadores do dashboard |
| GET `/api/reports/active-students` (60) | get_current_user | lista alunos ativos |
| GET `/api/reports/inactive-students` (73) | get_current_user | lista |
| GET `/api/reports/overdue` (86) | get_current_user | lista inadimplentes |
| GET `/api/reports/enrollments` (112) | get_current_user | lista matrículas |
| GET `/api/reports/financial` (139) | get_current_user | dict financeiro |
| GET `/api/reports/students-excel` (179) | get_current_user | StreamingResponse XLSX |
| GET `/api/reports/students-pdf` (204) | get_current_user | StreamingResponse PDF |
| GET `/api/reports/overdue-excel` (303) | get_current_user | StreamingResponse XLSX |
| GET `/api/reports/overdue-pdf` (336) | get_current_user | StreamingResponse PDF |

### search — prefixo `/api/search` (routes/search.py)
| Método/Caminho | Auth | Body/Query | Saída |
|---|---|---|---|
| GET `/api/search` (15) | get_current_user | `q=""` | `{results: [...]}`; `q` <2 chars → `{results: []}` (17-18) |

### settings — prefixo `/api/settings` (routes/settings.py)
| Método/Caminho | Auth | Body/Query | Saída/Erros |
|---|---|---|---|
| GET `/api/settings` (43) | get_current_user | — | settings dict |
| PUT `/api/settings` (55) | require_role("admin","secretary") | SettingsSchema (school_name="Gestão Escolar", payment_methods="PIX,Dinheiro,Débito,Crédito", primary_color="#3B82F6", dark_mode=0, due_day=5, ...) | `{message}` |
| POST `/api/settings/logo` (66) | require_role("admin","secretary") | form `file*` | `{logo_url:"/uploads/{filename}"}`; valida imagem (400/413) |

### student-profile — prefixo `/api/student-profile` (routes/students_profile.py)
| Método/Caminho | Auth | Saída/Erros |
|---|---|---|
| GET `/api/student-profile/{student_id}` (18) | get_current_user | `{student, responsible, enrollments, installments, files}`; ⚠️ erro retorna 200 `{"error": "Aluno não encontrado"}` (linha 25), não HTTPException |
| GET `/api/student-profile/{student_id}/pdf` (99) | get_current_user | StreamingResponse PDF (ficha); 404 |

### materials — prefixo `/api/materials` (routes/materials.py)
| Método/Caminho | Auth | Body/Query | Saída/Erros |
|---|---|---|---|
| GET `/api/materials` (30) | get_current_user | `search="", category=""` | lista |
| GET `/api/materials/sales` (49) | get_current_user | `student_id?, material_id?, skip=0, limit=50` | `{sales, total}` |
| GET `/api/materials/dashboard` (95) | get_current_user | — | `{total_materials, total_sales, total_revenue, low_stock}` |
| POST `/api/materials` (112) | require_role("admin","secretary") | `{name*, description="", price=0, stock=0, category=""}` | `{id, message}` |
| POST `/api/materials/sales` (121) | require_role("admin","secretary") | `{material_id*, student_id*, quantity=1, unit_price=0, ...}` | `{id, message}`; 404 material |
| PUT `/api/materials/{material_id}` (149) | require_role("admin","secretary") | body | `{message}`; 404 |
| DELETE `/api/materials/{material_id}` (161) | require_role("admin","secretary") | path | `{message}`; 404, 400 se há vendas |

### audit — prefixo `/api/audit` (routes/audit.py)
| Método/Caminho | Auth | Body/Query | Saída |
|---|---|---|---|
| GET `/api/audit` (12) | require_role("admin") | `skip=0, limit=100` | `{total, logs}` |

### communication — prefixo `/api/communication` (routes/communication.py)
| Método/Caminho | Auth | Body/Query | Saída/Erros |
|---|---|---|---|
| GET `/api/communication` (24) | get_current_user | `skip=0, limit=50` | lista de logs |
| GET `/api/communication/students` (38) | get_current_user | `search=""` | lista `{id, full_name, email, whatsapp}` |
| POST `/api/communication/send` (61) | require_role("admin","secretary"); rate 30/900s usuário, 60/900s IP | `{channel*, recipient*, subject="", message*}` | `{success, message}`; canais: email (200 `{success:false}` se inválido), whatsapp (200 false se número inválido), sms (falha "não configurado"), desconhecido → 200 `{success:false, message:"Canal ... não suportado"}` |

## Rotas NÃO REGISTRADAS (existem mas NÃO são incluídas no app)

`main.py:11-16` e `main.py:152-165` registram apenas 14 routers. **Não expostos**: `teachers.py`, `classes.py`, `attendance.py`, `evaluations.py`, `boletins.py`, `certificates.py`, `weight_config.py` (`routes/__init__.py` importa o mesmo conjunto).

Endpoints definidos nesses arquivos (ficam DORMENTES — chamar → 404/rota inexistente):
- **teachers**: `GET /api/teachers` (teachers.py:11)
- **classes**: `GET/POST /api/classes` (41, 62), `PUT/DELETE /api/classes/{id}` (75, 91), `GET /api/classes/count` (102)
- **attendance**: `GET /api/attendance` (25), `POST /api/attendance/bulk` (43, `{class_group_id*, date*, records:[{student_id*, status*, notes=""}]}`), `GET /api/attendance/report/{class_group_id}` (72)
- **evaluations**: `GET/POST /api/evaluations` (41, 74), `POST /api/evaluations/bulk` (88), `PUT/DELETE /api/evaluations/{eval_id}` (111, 129), `GET /api/evaluations/average/{student_id}` (140 — Aprovado/Recuperação/Reprovado)
- **boletins**: `GET /api/boletins/students` (131), `GET /api/boletins/{student_id}` (141 — função `get_boletim` também importada por certificates.py:15), `GET /api/boletins/turma/{class_group_id}` (212), `GET /api/boletins/{student_id}/pdf` (357), `GET /api/boletins/turma/{class_group_id}/pdf` (516), `GET /api/boletins/{student_id}/excel` (666), `GET /api/boletins/turma/{class_group_id}/excel` (708)
- **certificates**: `GET /api/certificates` (39), `GET /api/certificates/student/{student_id}` (63), `POST /api/certificates` (79 — critérios: média ≥ 70% e frequência ≥ 75%, linhas 93-94), `GET /api/certificates/{certificate_id}/pdf` (155)
- **weight_config**: `GET /api/weight-config` (25), `PUT /api/weight-config` (38)

## Limites e cotas

- Paginação padrão dos GETs: `skip=0, limit=50` (limit=100 no audit).
- Rate limits: ver `01-backend-nucleo.md`.
- Geração de mês: `generate-month` cria mensalidades do mês informado (AAAA-MM).

## Erros conhecidos e tratamento

- Regra geral: recursos não encontrados → 404; conflito de negócio → 400; permissão → 403; autenticação → 401; rate limit → 429; validação Pydantic → 422.
- ⚠️ Exceção: `GET /api/student-profile/{student_id}` devolve 200 com `{"error": ...}` em vez de 404 (students_profile.py:25).

## Riscos para a nossa implementação

1. **API dormante**: 7 módulos (frequência, avaliações, boletins, certificados, turmas, professores, pesos) têm código de rota pronto mas desligado — qualquer feature nova que presuma esses endpoints existirem quebrará em produção.
2. **Comunicação retorna sucesso/falha no body (200)** em vez de status HTTP — o frontend precisa tratar `success: false`.
3. **Contrato de aluno cria parcela automaticamente** quando `monthly_fee` informado — impacto financeiro oculto em cadastros.
4. **Sem paginação em vários relatórios** (active-students, overdue, enrollments, financial) — risco com volume grande.

## Fonte

- `backend/app/routes/*.py`, `backend/app/main.py` — acessado em 2026-08-29.