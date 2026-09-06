# Auditoria — super-admin-master

2026-09-05

| severidade | arquivo | problema | correção sugerida |
|---|---|---|---|
| MÉDIA | sprint-04/tasks.md | T-04.01, T-04.02 e T-04.03 declaram `depende_de: []`. Nada nos campos do plano impede tecnicamente que essas tasks rodem antes da sprint-03 (enforcement de backend) terminar — a sequência só existe na numeração das pastas e na Seção 3 do `ORQUESTRADOR.md`, não em `depende_de`. | Declarar `depende_de: [T-03.01]` (ou a lista completa de T-03.01 a T-03.14) nas três tasks de abertura da F-04.1, tornando a dependência entre sprints explícita nos campos, não só na prosa. |
| MÉDIA | ORQUESTRADOR.md | A seção 3 e o frontmatter `caminho_critico` afirmam a cadeia `T-02.02 → T-02.03 → T-03.01`, mas `T-03.01` (sprint-03/tasks.md) declara `depende_de: [T-01.02, T-02.02]` — não inclui `T-02.03`. A cadeia descrita no orquestrador não é sustentada pelos `depende_de` reais das tasks. | Corrigir o `caminho_critico` para refletir apenas dependências declaradas, ou adicionar `T-02.03` ao `depende_de` de uma task representativa da sprint-03 se a intenção é mesmo essa ordem. |
| BAIXA | backend/app/routes/backup.py, backend/app/routes/communication.py | Nenhuma task do plano toca esses dois arquivos. Ambos continuam usando `require_role("admin", ...)` puro — um `admin` comum mantém acesso irrestrito ao backup do banco e ao envio de comunicações mesmo depois desta feature, o que é parcialmente inconsistente com o espírito de D-02 ("admin comum vira regulável"). Não é erro do plano: `backup` e `comunicação` não fazem parte dos 15 módulos de `ALL_PERMISSIONS`/Sidebar declarados em D-04, então ficam fora do escopo por decisão implícita, não por omissão. | Se o usuário quiser esses dois também sob controle do super_admin, é uma decisão nova (D-07) e duas tasks a mais; caso contrário, nenhuma ação — registrar a decisão de escopo explicitamente em `00-DECISOES.md` evitaria a dúvida numa auditoria futura. |

VEREDITO: SIM — o plano está pronto para execução autônoma.
