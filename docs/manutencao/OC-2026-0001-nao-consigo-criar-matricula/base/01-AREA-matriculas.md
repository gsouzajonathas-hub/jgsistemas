# ÁREA: Cadastro de matrículas (Módulo Matrículas)

> Mapeamento do fluxo completo de matrícula: da tela (frontend) até a persistência (backend). O problema relatado nesta ocorrência nasce neste fluxo, mas a causa está na dependência (turmas → cursos/professores) que não tem tela.

## O que é e onde vive

- `frontend/src/pages/Enrollments.tsx` — tela de listagem/criação de matrículas (UI).
- `frontend/src/services/api.ts` — `enrollmentsAPI` (métodos `list`, `create`, `update`, `cancel`, etc.), linha 100+ (API client).
- `backend/app/routes/enrollments.py` — endpoints REST `/api/enrollments` (list, create, update, cancel, suspend, renew).
- `backend/app/models/enrollment.py` — modelo/entidade `enrollment`.
- `backend/app/models/class_group.py` — modelo `class_group` (turma), dependência obrigatória da matrícula.
- `backend/app/models/student.py` — modelo `student`, dependência obrigatória da matrícula.

Papel: permitir que um aluno seja vinculado a uma turma com uma data, status e observações. É o ponto central de "entrada" de um aluno na escola.

## Contrato de entrada

**Frontend (`Enrollments.tsx`):**
- Usuário seleciona aluno (`student_id`) e turma (`class_group_id`) num formulário; data de matrícula tem default hoje (`Enrollments.tsx:100`).
- Validações client-side: exige `student_id` ("Selecione o aluno") e `class_group_id` ("Selecione a turma") — `Enrollments.tsx:110-111`.
- Lista de turmas é populada via `classesAPI.list()` — se não houver turmas cadastradas, o `<select>` fica vazio e a matrícula não pode ser salva.

**Backend (`enrollments.py`) — `EnrollmentSchema`:**
```python
class EnrollmentSchema(BaseModel):
    student_id: int
    class_group_id: int
    enrollment_date: Optional[str] = None
    status: str = "active"
    notes: str = ""
```
`backend/app/routes/enrollments.py:16-21`

- `require_role("admin", "secretary")` — só admin e secretaria criam (`enrollments.py:63`).
- Se `enrollment_date` ausente, usa `date.today()` (`enrollments.py:67-68`).
- Validações backend: turma inexistente → 404 "Turma não encontrada" (`enrollments.py:74-75`); capacidade cheia → 400 "Turma atingiu a capacidade máxima" (`enrollments.py:76-77`).

## Contrato de saída

**`POST /api/enrollments` (criar):**
```json
{"id": 16, "message": "Matrícula realizada com sucesso"}
```
- Incrementa `class_group.current_count` em 1 (`enrollments.py:78`).
- Persiste `enrollment` com status default "active".

**`GET /api/enrollments` (listar):**
```json
{"enrollments": [ { "id": 16, "student_id": 2, "class_group_id": 1, "student_name": "Eduardo", "enrollment_date": "2026-09-04", "status": "active", "notes": null, "created_at": "..." } ], "total": 1}
```
- `enrollments.py:50-58`.

**Cancelar/renovar/trancar:**
- `POST /api/enrollments/{id}/cancel` → status "cancelled" e decrementa `current_count` (`enrollments.py:99-111`).
- `POST /api/enrollments/{id}/suspend` → status "suspended" e decrementa (`enrollments.py:114-126`).
- `POST /api/enrollments/{id}/renew` → cria novo registro ativo e incrementa (`enrollments.py:129-153`).

## Estrutura de dados

**`enrollments` (`backend/app/models/enrollment.py:7-17`):**
| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | Integer | PK, index |
| `student_id` | Integer | FK `students.id`, NOT NULL |
| `class_group_id` | Integer | FK `class_groups.id`, NOT NULL |
| `enrollment_date` | Date | NOT NULL |
| `status` | String(20) | default "active" |
| `notes` | Text | nullable |
| `created_at` | DateTime(tz) | server_default now |
| `updated_at` | DateTime(tz) | onupdate |

**`class_groups` (`backend/app/models/class_group.py:7-24`):**
- `course_id` FK `courses.id` NOT NULL, `teacher_id` FK `teachers.id` NOT NULL (`class_group.py:12-13`) — **uma turma SEMPRE depende de curso e professor**.
- `max_capacity` default 20, `current_count` default 0 (`class_group.py:18-19`) — controle de vagas.

**Exemplo real (produção, 2026-09-04, criado nesta investigação):**
- `enrollments` id 16: `student_id=2`, `class_group_id=1`, `enrollment_date='2026-09-04'`, `status='cancelled'` (cancelada ao final da prova).
- `class_groups` id 1: `name='TESTE OC2026-0001'`, `course_id=2`, `teacher_id=2`, `current_count=1`.

## Funções e trechos relevantes

Criação de matrícula (backend):
```python
@router.post("")
async def create_enrollment(data: EnrollmentSchema, current_user=Depends(require_role("admin", "secretary")), db: AsyncSession = Depends(get_db)):
    d = data.model_dump()
    if d.get("enrollment_date"):
        d["enrollment_date"] = date.fromisoformat(d["enrollment_date"])
    else:
        d["enrollment_date"] = date.today()
    enrollment = Enrollment(**d)
    db.add(enrollment)

    result = await db.execute(select(ClassGroup).where(ClassGroup.id == data.class_group_id))
    cg = result.scalar_one_or_none()
    if not cg:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    if cg.max_capacity and cg.current_count >= cg.max_capacity:
        raise HTTPException(status_code=400, detail="Turma atingiu a capacidade máxima")
    cg.current_count += 1

    await db.commit()
    return {"id": enrollment.id, "message": "Matrícula realizada com sucesso"}
```
`backend/app/routes/enrollments.py:62-81`

Validação da tela de turmas (frontend) — a turma exige curso e professor:
```typescript
if (!form.name || !form.course_id || !form.teacher_id) { alert('Preencha nome, curso e professor.'); return; }
```
`frontend/src/pages/Classes.tsx:139`

## Quem chama e quem é chamado

**Chamadores (frontend):**
- `Enrollments.tsx` chama `enrollmentsAPI.create`/`list`/`cancel`/`suspend`/`renew` e `classesAPI.list` (para popular o select de turmas).
- `Classes.tsx` chama `classesAPI.create` (com `course_id`/`teacher_id` de selects populados por `coursesAPI.list` e `teachersAPI.list`).

**Dependências (backend):**
- `get_db` (`app/database.py`) — sessão async.
- `require_role`, `get_current_user` (`app/utils/auth.py`) — autenticação/autorização.
- Tabelas relacionadas: `students`, `class_groups`, `courses`, `teachers`, `payments`/`installments`/`carnes` (financeiro ligado à matrícula de estudante).

## Testes existentes

- `backend/tests/test_fluxo_e2e.py` — fluxo E2E cobrindo aluno → turma → matrícula → financeiro (referenciado no resumo; suíte backend local passou: 49 testes).
- As validações "Selecione a turma" / "Preencha nome, curso e professor." não têm teste automatizado de UI (não há suíte E2E de frontend).

## Limites e regras de negócio conhecidas

- Capacidade da turma: `current_count` não pode exceder `max_capacity` (`enrollments.py:76-77`).
- Turma exige curso + professor obrigatoriamente (`class_group.py:12-13`; `Classes.tsx:139`).
- Só admin/secretaria matrícula (`enrollments.py:63`).
- Renovação cria novo registro ativo, mantendo o antigo `renewed` (`enrollments.py:143-151`).
- Cancelamento/trancamento mantêm o registro com status alterado (não excluem) (`enrollments.py:105,120`).

## Riscos para esta ocorrência

- Mexer na validação de turma (`Classes.tsx`) pode quebrar a criação de turmas — a dependência curso/professor é obrigatória no schema (`class_group.py:12-13`).
- Mexer no fluxo de matrícula (`enrollments.py`) pode quebrar contagem de vagas (`current_count`) e o vínculo financeiro.
- **Dados de teste criados nesta investigação em produção** (curso id 2, professor id 2, turma id 1, matrícula id 16 cancelada) não puderam ser totalmente removidos via API por proteção de integridade referencial — a turma não é apagável enquanto existir matrícula (mesmo cancelada) referenciando-a.

## Fonte

- `backend/app/routes/enrollments.py`, `backend/app/models/enrollment.py`, `backend/app/models/class_group.py`, `frontend/src/pages/Enrollments.tsx`, `frontend/src/pages/Classes.tsx`, `frontend/src/services/api.ts` — lidos em 2026-09-04; prova funcional executada contra produção via API.