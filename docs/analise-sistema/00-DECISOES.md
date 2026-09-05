# Decisões — analise-sistema

> Uma linha por decisão tomada no planejamento (F2 e, excepcionalmente, F3). Formato fixo. Não apague decisões: uma decisão revertida ganha nova linha que cita a anterior.

## Decisões

```
D-01 | Objetivo da entrega: reativar de ponta a ponta os módulos Turmas, Frequência, Avaliações, Boletim e Certificados (backend + frontend) | Estabilizar o que funciona / nova funcionalidade / só análise | Usuário escolheu reativar os módulos quebrados (base F1: 5 páginas órfãs + 7 routers dormentes)
D-02 | Entrega preparada para cliente, mas ambiente-alvo desta iteração é LOCAL (localhost); deploy (Render/Vercel) fica para depois | Deploy já nesta entrega | Usuário decidiu ambientes = só local (P-13)
D-03 | Ajustar tudo para funcionar estruturado localmente, pronto para subir/entregar ao cliente | Manter estado atual | P-06: usuário trata o sistema em localhost e precisa de tudo funcionando antes de entregar
D-04 | Reativar código existente (sem redesenho): importar os 7 routers no main.py, criar os grupos API ausentes (attendance/classes/boletins/certificates/teachers/evaluations/weightConfig) no api.ts, definir os tipos ClassGroup/Evaluation e rotear as 5 páginas no App.tsx | Reescrever módulos com melhorias / backend primeiro | P-07: usar o código já escrito, minimizando risco e retrabalho
D-05 | Criar as 4 tabelas ausentes (attendances, evaluations, certificates, grade_weight_configs) importando os models no startup — create_all (padrão atual do projeto, main.py:28-29) | Migração explícita (Alembic) | P-08: seguir o padrão existente; projeto não usa migrations versionadas
D-06 | Usar o schema modelado como está, sem campos/entidades novos nos módulos reativados | Adicionar campos novos | P-09
D-07 | Manter integração Supabase como está (auth JWT local + sync opcional via env vars) | Remover Supabase | P-10
D-08 | Auditoria (audit_logs) também nos módulos reativados: novas ações de frequência/avaliações/boletim/certificados entram na trilha | Logging estruturado adicional | P-11
D-09 | Manter política de erro atual das integrações: sucesso/falha no body (success:false) sem retry/fila | Retry simples / fila de envios | P-12
D-10 | Segredos: fluxo atual — .env local fora do git + env vars onde houver deploy; nunca valores no repositório | Gerenciador de segredos | P-14
D-11 | Criar fundação de testes nesta entrega: pytest (backend) + vitest (frontend), cobrindo os módulos reativados e fluxos críticos (incl. financeiro) | Sem testes agora / só um lado | P-15: repositório tem ZERO testes (base 06-testes.md); build quebrado não é detectável sem rede de segurança
D-12 | Definição de pronto: fluxo E2E completo (professor → turma → matrícula → frequência → avaliações com pesos → boletim PDF/Excel → certificado PDF) com toda a estrutura realmente funcionando | Pronto limitado a telas sem erro | P-16
D-13 | Remover a citação da tabela `subscriptions` do backend/scripts/migrate_sqlite_to_postgres.py:122 (tabela fantasma, sem model nem uso) | Criar model Subscription | P-17
D-14 | Definir timeout explícito de 30s no envio de e-mail (email_service.py) — alinhado ao timeout de 30s do WhatsApp | Manter default da biblioteca | P-18
D-15 | Corrigir GET /api/student-profile/{id} para retornar 404 real quando aluno não existe (hoje 200 com {error}, students_profile.py:25) | Manter comportamento atual | P-19: alinhar ao padrão REST do resto da API
D-16 | Verificação do fluxo E2E (D-12): teste de integração no backend percorrendo o fluxo completo via API + checklist manual das telas no navegador | Adicionar Playwright / verificação só manual | Decisão registrada na F3 (única pergunta permitida na fase)
D-17 | SUPERSEDE D-05: adotar Alembic como fonte única de verdade do schema (backend/alembic/), substituindo create_all + ALTER TABLE manuais no lifespan (main.py) e supabase/migrations/. Migração baseline (892b733803aa) gerada a partir dos models atuais e validada contra SQLite vazio e Postgres 16 real; boot detecta banco já existente sem alembic_version e roda `stamp head` em vez de `upgrade head`, evitando recriar tabelas em produção. Novas mudanças de schema passam a ser `alembic revision --autogenerate` | Manter create_all/ALTER manual / migrar só para supabase/migrations | Divergência identificada em análise de sistema (2026-09-05): create_all+ALTER (dev/SQLite) e supabase/migrations/20260830000100_init.sql (prod) eram duas fontes de schema que já haviam divergido (audit_logs.actor_role só existia via ALTER em runtime); usuário escolheu Alembic entre as 3 opções apresentadas
```

## Pendências

```
Nenhuma pendência.
```