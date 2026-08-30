# FRONTEND (React + TypeScript + Vite + Tailwind)

> Fatos lidos do código real em `frontend/`.

## Contrato de entrada

- **Dependências** (package.json, linhas 10-20): `@fontsource/inter ^5.3.0`, `@supabase/supabase-js ^2.112.4`, `axios ^1.7.7`, `date-fns ^3.6.0`, `lucide-react ^0.441.0`, `react ^18.3.1`, `react-dom ^18.3.1`, `react-router-dom ^6.26.0`, `recharts ^2.12.7`. Dev: `vite ^5.4.3`, `typescript ^5.5.4`, `tailwindcss ^3.4.10`, `@vitejs/plugin-react ^4.3.1`, `postcss`, `autoprefixer`. Scripts: `dev`, `build`, `preview` (6-10) — **sem script de teste**.
- **Vite** (vite.config.ts): porta `5174`, host `0.0.0.0`, proxy `/api` e `/uploads` → `http://localhost:8000`.
- **Tailwind** (tailwind.config.js): `darkMode: 'class'`; paleta `primary` indigo (50-950: `#eef2ff` → `#1e1b4b`); cores `surface` (light `#ffffff`/`#f8fafc`, dark `#0b1220`/`#111a2e`); sombras `card`, `cardHover`, `modal`, `glow`; keyframes `fade-in`, `fade-in-up`, `scale-in`, `slide-in-right`.
- **Client HTTP** (src/services/api.ts): axios `baseURL: "/api"` (5); request interceptor injeta `Authorization: Bearer ${localStorage.getItem('token')}` (10); response interceptor: em 401 (exceto `/auth/login`) limpa `token`/`user` e dispara evento `auth:logout` (18-23). Exporta **15 grupos de API**: `authAPI` (29), `studentsAPI` (44), `auditAPI` (63), `coursesAPI` (67), `plansAPI` (71), `contractsAPI` (83), `enrollmentsAPI` (90), `financialAPI` (99), `carnesAPI` (111), `scheduleAPI` (125), `reportsAPI` (131), `searchAPI` (144), `materialsAPI` (148), `settingsAPI` (175), `studentProfileAPI` (185). ⚠️ **NÃO existem**: `attendanceAPI`, `classesAPI`, `boletinsAPI`, `certificatesAPI`, `teachersAPI`, `evaluationsAPI`, `weightConfigAPI` (embora páginas órfãs os importem — ver Riscos).
- **Supabase** (src/services/supabase.ts): client condicional a `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`; `isSupabaseConfigured`; usado para sync mágico de sessão (AuthContext).
- **Tipos** (src/types/index.ts): 15 interfaces — `User` (1), `Student` (11), `Responsible` (40), `Enrollment` (49), `Installment` (59), `CalendarEvent` (74), `Dashboard` (85), `SearchResult` (98), `TeachingMaterial` (106), `MaterialSale` (117), `AuditLog` (131), `CoursePlan` (142), `PlanCalc` (163), `ContractResult` (171), `FinancialContract` (185). ⚠️ `ClassGroup` e `Evaluation` são importados por páginas órfãs mas NÃO definidos. `SchoolSettings` é declarada em api.ts.

## Contrato de saída

- **Router** (src/App.tsx, rotas 64-78): wrappers `ProtectedRoute` (21: loading/user → Navigate /login), `PermissionRoute` (32: usa `hasPermission`), `HomeRoute` (44).

| Caminho | Página | Proteção |
|---|---|---|
| `/login` | Login (App.tsx:65) | pública |
| `/` | Dashboard (HomeRoute, 66) | logado |
| `/students` | Students (67) | perm `students` |
| `/students/:id` | StudentProfile (68) | perm `students` |
| `/enrollments` | Enrollments (69) | perm `enrollments` |
| `/financial` | Financial (70) | perm `financial` |
| `/planos` | Planos (71) | perm `financial` |
| `/contratos` | Contratos (72) | perm `financial` |
| `/mensalidades` | Mensalidades (73) | perm `financial` |
| `/carnes` | Carnes (74) | perm `financial` |
| `/schedule` | Schedule (75) | perm `schedule` |
| `/reports` | Reports (76) | perm `reports` |
| `/audit` | Audit (77) | perm `audit` |
| `/settings` | Settings (78) | logado |
| `*` | Navigate `/` (79) | — |

- **Contextos**:
  - `AuthContext` (contexts/AuthContext.tsx): expõe `user`, `login`, `applySession`, `logout`, `loading`, `hasPermission`; persiste `token`+`user` em localStorage; escuta `auth:logout`; sincroniza sessão Supabase (magic link).
  - `ThemeContext` (contexts/ThemeContext.tsx, 37 linhas): `theme` (`light`|`dark`), `toggleTheme`; persiste em localStorage `theme`; alterna classe `.dark` no `documentElement`.
- **Hook** `useSettings` (hooks/useSettings.ts, 47 linhas): cache em nível de módulo + listeners; `parsePaymentMethods` (default `PIX,Dinheiro,Débito,Crédito`); retorna `{settings, paymentMethods, refresh}`; `pushSettingsCache` para atualização otimista.
- **Util**: `format.ts` → apenas `formatDate` (ISO → DD-MM-YYYY).

### Componentes de UI (src/components/ui/)
| Componente | Props | Linha |
|---|---|---|
| `Button` | `variant` primary/secondary/ghost/danger/outline, `size` sm/md/lg, `loading`, `icon`; extends ButtonHTMLAttributes | Button.tsx:4-9 |
| `Input` | `label`, `error`, `icon`; extends InputHTMLAttributes | Input.tsx:3-7 |
| `Select` | `label`, `children` | Select.tsx:3-6 |
| `Modal` | `open`, `onClose`, `title`, `subtitle`, `children`, `footer`, `size` md/lg/xl | Modal.tsx:4-20 |
| `Table`/`THead`/`TH`/`TRow`/`TD`/`TableBody` | — | Table.tsx:3-43 |
| `Card` | `hover` | Card.tsx:3-5 |
| `Badge` | `tone` green/amber/red/blue/purple/gray/indigo | Badge.tsx:15-21 |
| `StatusBadge` | mapeia status: active/inactive/transferred/suspended/graduated/paid/pending/overdue/canceled/present/absent/justified | Badge.tsx |
| `EmptyState` | `icon`, `title`, `description`, `action` | EmptyState.tsx:4-14 |
| `Spinner` | `className` (default `h-8 w-8`) | Spinner.tsx:1 |
| `PageHeader` | `title`, `subtitle`, `actions` | PageHeader.tsx:3-11 |

### Páginas e endpoints usados (resumo)
| Página | Função | Endpoints |
|---|---|---|
| Login/Landing/LoginForm | login/página inicial | `authAPI.login` |
| Dashboard | indicadores (saudação por hora) | `reportsAPI.dashboard()` |
| Students | CRUD alunos (paginado 20) | `studentsAPI.list({skip,limit:20,search,status})`, `.delete(id)` |
| StudentProfile | perfil completo do aluno (abas overview/financial/documents) | `studentProfileAPI.get(id)` |
| Enrollments | matrículas com cancelar/trancar/renovar | `enrollmentsAPI.list({status})`, `.cancel/.suspend/.renew(id)` |
| Financial | abas mensalidades/materiais/vendas | `financialAPI`, `studentsAPI`, `materialsAPI`, `useSettings` |
| Mensalidades | gerar mês, listar, pagar | `financialAPI.generateMonth({month})`, `.getInstallments({status,month,limit:200})`, `.dashboard({month})`, `.registerPayment(...)` |
| Carnes | carnês + stats | `carnesAPI.list({...})`, `.stats({month})` |
| Schedule | agenda/calendário | `scheduleAPI.list({month,year})`, `.delete(id)` |
| Reports | relatórios alunos/inadimplentes/matrículas/financeiro | `reportsAPI.activeStudents/.overdue/.enrollments/.financial` |
| Audit | trilha (PAGE_SIZE=50) | `auditAPI.list({skip,limit:50})` |
| Planos | planos financeiros + cálculo | `plansAPI`, `coursesAPI`, `studentsAPI`, `contractsAPI` |
| Contratos | listar + baixar PDF | `contractsAPI.list()`, `.pdf(id)` |
| Settings | escola/usuários/aparência | `settingsAPI.get()`, `authAPI` |
| GlobalSearch (componente) | busca global (debounce 300ms) | `searchAPI.search(q)` |

### Páginas ÓRFÃS (arquivos existem, NÃO roteados, referenciam APIs inexistentes)
`Attendance.tsx`, `Classes.tsx`, `Boletim.tsx`, `Certificates.tsx`, `Evaluations.tsx` — importam de `../services/api` os grupos `attendanceAPI`, `classesAPI`, `boletinsAPI`, `certificatesAPI`, `teachersAPI`, `evaluationsAPI`, `weightConfigAPI` **inexistentes** e tipos `ClassGroup`/`Evaluation` não definidos. Nenhum import delas em App.tsx ou em qualquer outro arquivo. ⚠️ Código morto/Quebrado.

## Limites e cotas

- Paginação no frontend: Students 20/página, Audit 50, Mensalidades 200.
- Busca global com debounce de 300ms (GlobalSearch).
- Proxy de dev: apenas `/api` e `/uploads`; demais caminhos são do Vite.

## Erros conhecidos e tratamento

- 401 (exceto login) → logout automático via evento `auth:logout` (api.ts:18-23).
- LoginForm exibe `err.response?.data?.detail` (LoginForm.tsx).
- `formatDate` é a única util de formatação (format.ts).

## Riscos para a nossa implementação

1. **5 páginas órfãs quebradas** (Frequência, Turmas, Boletim, Certificados, Avaliações): importam APIs/types que não existem. Elas compilam? ⚠️ Se o `tsconfig` não for `strict`/`noUnusedLocals`, o build pode passar mesmo com imports resolvendo para `undefined` — em runtime, `attendanceAPI.bulk` seria `undefined is not a function`. Qualquer plano que toque esses módulos precisa REVIVER API + tipos + rotas, ou remover as páginas.
2. **Frontend presumindo endpoints que o backend não registra** — o mesmo descompasso visto em `02-api-rotas.md` (backend tem rotas dormentes; frontend tem páginas órfãs).
3. **Sem testes de frontend** (nenhum framework/script) — refatorações de componentes de UI são arriscadas sem rede de segurança.
4. **Supabase** habilitado por env vars; sem elas, `supabase` é `null` — fluxos de magic link dependem de config externa.

## Fonte

- `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tailwind.config.js`, `frontend/src/**` — acessado em 2026-08-29.