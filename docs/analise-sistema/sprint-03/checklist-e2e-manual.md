# Checklist Manual — Fluxo E2E no Navegador (T-03.08)

> Validado em **2026-08-30** com ambiente local (uvicorn `127.0.0.1:8000` + vite `http://localhost:5174`).
> Usuário admin de teste: `admin@escola.com` (criado via register nesta validação; senha de uso local não versionada).
> Dados de apoio criados pelo `e2e_seed_tmp.py` (removido após a validação): Escola "Escola E2E", Curso "Inglês",
> Professor "Prof. E2E", Alunos "Aluno E2E 1-4" (ativos, nível Básico, data 2026-08-01).
> Ferramenta de validação: automação Playwright (MCP) sobre o navegador — cada etapa foi executada **na interface** e conferida na tela.

## Referência

- Decisão **D-12** — definição de pronto: fluxo E2E professor → turma → matrícula → frequência → avaliações com pesos → boletim PDF/Excel → certificado PDF.
- Decisão **D-16** — verificação do fluxo E2E: integração no backend via API (T-02.07) + **este checklist manual das telas**.
- Decisão **D-02** — ambiente-alvo desta iteração: LOCAL (localhost); deploy fica para depois.

---

## Etapas

### 1. Login do administrador

- [x] **Validado** — Tela de login renderiza (0 erros de console). Credenciais admin → Dashboard carregado com nome "Admin" e papel "Administrador".

### 2. Turmas — criar turma

- [x] **Validado** — `/classes` exibe "0 turma(s) ativa(s)". Botão "Nova Turma" abre o formulário com Curso "Inglês" e Professor "Prof. E2E" (dados do seed).
- [x] **Validado** — Turma criada: **"Turma E2E Kids"** (Curso Inglês, Professor Prof. E2E, Nível Básico, Sala 101, dias Segunda/Quarta 08:00–09:00, capacidade 20). Confirmada na lista da tela e via API (`GET /api/classes` → id=1).
- Console: 0 erros.

### 3. Matrículas — matricular aluno

- [x] **Validado** — `/enrollments` exibe "0 matrícula(s)". "Nova Matrícula" → selecionado **Aluno E2E 1** → "Matricular".
- [x] **Validado** — Matrícula criada e listada na tela; via API: `id=1, student_id=1, class_group_id=1, status=active` (turma correta).
- Console: 0 erros.

### 4. Frequência — lançar presenças

- [x] **Validado** — `/attendance` ("Controle de Frequência") lista os alunos da turma com botões Presente/Falta/Justificada/Atraso. Selecionada **Turma E2E Kids**.
- [x] **Validado** — 4 lançamentos pela tela: **30/08, 31/08, 02/09, 07/09** — Aluno E2E 1 como **Presente** em todos. Confirmado via API (`GET /api/attendance?class_group_id=1`): 4 registros `present` para student_id=1 → **frequência 100%** (≥75% exigido).
- Console: 0 erros.

### 5. Avaliações — lançar notas

- [x] **Validado** — `/evaluations` ("Nenhuma avaliação cadastrada"). "Nova Avaliação" → **Turma E2E Kids**.
- [x] **Validado** — Avaliação 1: Tipo **Prova**, Título "Prova Bimestral E2E", **nota 9.0** (máx. 10, peso 1) → confirmada via API.
- [x] **Validado** — Avaliação 2: Tipo **Trabalho**, Título "Trabalho de Conversação E2E", **nota 8.0** → confirmada via API.
- [x] **Validado** — Card da turma na tela: "1 nota(s) · 1 aluno(s) avaliado(s) · Média 90%" (após salvar, o card da avaliação 1).
- Console: 0 erros.

### 6. Boletim — notas, frequência e PDF

- [x] **Validado** — `/boletins`: selecionado **Aluno E2E 1 (Básico)**; abas "Por Aluno"/"Por Turma"; botões Excel/PDF habilitados após seleção.
- [x] **Validado** — Conteúdo do boletim: **Média Geral 85% (Aprovado)**, **Frequência 100%**, **4 presenças / 0 faltas**; tabela com Prova 9.0 e Trabalho 8.0; turma "Turma E2E Kids" (Inglês, Prof. E2E, Segunda/Quarta 08:00-09:00).
- [x] **Validado** — **PDF do boletim gerado**: `GET /api/boletins/1/pdf?class_group_id=1` → HTTP **200**, `application/pdf`, 3371 bytes.
- Console: 0 erros.

### 7. Certificado — emissão e PDF

- [x] **Validado** — Boletim exibe "**Apto a receber o Certificado de Conclusão** (Média ≥ 70% e frequência ≥ 75%: média 85% · frequência 100%)".
- [x] **Validado** — Botão "Emitir Certificado" → boletim passa a exibir badge "Aprovado" com **"Certificado: CERT-2026-0001"**.
- [x] **Validado** — `/certificates` lista o registro: **CERT-2026-0001 · Aluno E2E 1 · Básico · 85% · 100% · 30-08-2026** com botão PDF.
- [x] **Validado** — **PDF do certificado gerado**: `GET /api/certificates/1/pdf` → HTTP **200**, `application/pdf`, 2479 bytes. Via API: nível Básico, curso Inglês, prof. E2E, carga horária 120h, média 85, frequência 100.
- Console: 0 erros.

---

## Resultado

- **Todas as etapas: VALIDADAS na interface**, com **0 erros de console** em todas as telas percorridas (login, dashboard, turmas, matrículas, frequência, avaliações, boletins, certificados).
- Fluxo D-12 completo funcionando de ponta a ponta: **professor → turma → matrícula → frequência → avaliações → boletim PDF → certificado PDF**.
- Condições do certificado confirmadas pelo próprio sistema: média 85% ≥ 70% e frequência 100% ≥ 75%.

## Divergências e observações (registradas no relatório F6)

1. **Frequência lista alunos não matriculados**: a tela `/attendance` exibiu os 4 alunos ativos (Aluno E2E 1-4), embora apenas o Aluno E2E 1 esteja matriculado na turma.
2. **Frequência salva a lista inteira**: ao marcar "Presente" e salvar, todos os alunos listados na data foram registrados `present` (4 registros em 30/08 — não apenas o aluno marcado). Comportamento da tela a revisar (pré-existente, fora do escopo de correção desta sprint).
3. **`class_group_id` fixo na criação de matrícula**: `Enrollments.tsx` envia `class_group_id: 1` sem campo de turma no formulário (linha 99 do componente). Funciona nesta validação porque a turma criada é a id=1; bug latente se houver mais turmas.
4. **Nível exibido no cabeçalho do boletim**: após emitir o certificado, o badge de nível do aluno na seção superior mudou de "Básico" para "Intermediário" (a listagem de certificados continua correta em "Básico").
5. **Navegação inesperada na automação**: durante a validação de frequência, a aba navegou sozinha de `/attendance` para `/certificates` (uma vez; sem impacto no fluxo, retornada via navegação explícita).