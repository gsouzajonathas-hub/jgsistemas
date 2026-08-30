# Lacunas

Lacunas confirmadas por leitura do código real (grep + leitura de arquivos). Nada foi inventado. Cada item aponta para o arquivo da base com detalhes.

## 1. Módulos de API ausentes em `frontend/src/services/api.ts`
Imports não resolvidos (erros de compilação) usados por 5 páginas órfãs:

- `classesAPI` — importado em `Classes.tsx:2`, `Attendance.tsx:2`, `Evaluations.tsx:2`, `Boletim.tsx:3`.
- `attendanceAPI` — importado em `Attendance.tsx:2`.
- `evaluationsAPI` — importado em `Evaluations.tsx:2`.
- `weightConfigAPI` — importado em `Evaluations.tsx:2`.
- `boletinsAPI` — importado em `Boletim.tsx:3`, `Certificates.tsx:2`.
- `certificatesAPI` — importado em `Boletim.tsx:3`, `Certificates.tsx:2`.
- `teachersAPI` — importado em `Classes.tsx:2`.

Confirmado por grep: nenhuma ocorrência de `classesAPI|attendanceAPI|evaluationsAPI|weightConfigAPI|boletinsAPI|certificatesAPI|teachersAPI` em `api.ts`. → Detalhes em `04-frontend.md`.

## 2. Tipos ausentes em `frontend/src/types/index.ts`
- `ClassGroup` — importado em `Classes.tsx:3`.
- `Evaluation` — importado em `Evaluations.tsx:3`.

Confirmado por grep: nenhuma ocorrência de `ClassGroup|Evaluation` em `types/index.ts`. → `04-frontend.md`.

## 3. Páginas órfãs (sem rota registrada)
`Classes.tsx`, `Attendance.tsx`, `Evaluations.tsx`, `Boletim.tsx`, `Certificates.tsx` existem em `pages/` mas **NÃO são importados nem registrados** em `App.tsx` (imports nas linhas 5–19). Logo, são inacessíveis via rota — os módulos **Frequência, Turmas, Boletins e Certificados** do README não têm tela ativa. O `Header.tsx:11` ainda referencia `/classes` (rota inexistente). → `04-frontend.md`.

## 4. Routers backend não registrados no app
`backend/app/main.py` registra 14 routers (`main.py:152-165`). **Existem porém NÃO são registrados**: `teachers.py`, `classes.py`, `attendance.py`, `evaluations.py`, `boletins.py`, `certificates.py`, `weight_config.py` (importados em `routes/__init__.py`, mesmo conjunto). As rotas definidas nesses arquivos respondem 404/inexistente em produção. → `02-api-rotas.md`.

## 5. Models sem tabela criada (não importados no startup)
`app/models/__init__.py` não importa `Attendance`, `Evaluation`, `Certificate`, `GradeWeightConfig`. Como a criação de schema é `Base.metadata.create_all` no startup (`main.py:28-29`), as tabelas `attendances`, `evaluations`, `certificates`, `grade_weight_configs` **não existem** no banco — apenas o código está presente. → `01-backend-nucleo.md`.

## 6. Nenhum teste automatizado em todo o repositório
- Backend: `requirements.txt` sem pytest; nenhum `test_*.py`/`*_test.py`.
- Frontend: `package.json` sem script de teste (`dev/build/preview` apenas, linhas 6-10); nenhum `*.test.ts(x)`/`*.spec.ts(x)`.
- Sem CI/verificação. → `06-testes.md`.

## 7. Tabela `subscriptions` citada sem model correspondente
`backend/scripts/migrate_sqlite_to_postgres.py:122` ignora a tabela `subscriptions` na lista de órfãs, mas **não existe** model `Subscription` em `backend/app/models/`. Origem da tabela: NÃO DOCUMENTADO. → `03-servicos-integracoes.md`, `05-configuracao-infra.md`.

## 8. Timeout do SMTP não documentado
`backend/app/services/email_service.py` usa `aiosmtplib.send(...)` sem parâmetro de timeout (linha 31) — o valor efetivo depende do default da biblioteca. → `03-servicos-integracoes.md`.

## Observação (NÃO é lacuna)
- `materialsAPI` existe em `api.ts` (linhas 148–156) e é usado corretamente por `Financial.tsx` — não é um gap.
- `student-profile` retorna 200 com `{"error": ...}` em vez de 404 (`students_profile.py:25`) — comportamento inconsistente com o padrão REST do restante, registrado como risco em `02-api-rotas.md`.