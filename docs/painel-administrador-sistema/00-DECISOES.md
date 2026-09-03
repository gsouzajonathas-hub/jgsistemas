# Decisões — painel-administrador-sistema

> Uma linha por decisão tomada no planejamento (F2 e, excepcionalmente, F3). Formato fixo. Não apague decisões: uma decisão revertida ganha nova linha que cita a anterior.

## Decisões

```
D-01 | Multi-escola (multi-tenant): super_admin gerencia várias instituições | plataforma single-tenant | usuário quer gerenciar múltiplas escolas/instituições (P-01 A)
D-02 | Login na mesma tela atual, com a role nova super_admin | área de login separada (/admin/login) | reutilizar o fluxo JWT existente (P-02 A)
D-03 | Super_admin gerencia usuários E permissões individuais de cada usuário | permissões apenas por papel padrão | usuário escolheu (P-03 A)
D-04 | Entrega 1 inclui login do super_admin + painel/menu separado + dashboard do sistema | sem painel separado | definição de pronto do usuário (P-04 A)
D-05 | Isolar dados por escola (migração school_id em tabelas operacionais) | manter dados globais sem isolamento | usuário quer isolamento real por escola (P-05 B)
D-06 | admin@jgsistemas.com.br (Admin Deploy, role admin atual) vira o primeiro super_admin | dono (***REDACTED***, role teacher) | escolha explícita do usuário (P-06 A)
D-07 | Atribuir todos os dados existentes à escola id=1 (a única existente) e vincular os 2 usuários a ela | reatribuir/descartar | só existe 1 escola hoje; atribuir tudo à escola 1 (P-07 A)
D-08 | Isolamento TOTAL por school_id em todas as tabelas operacionais (alunos, turmas, financeiro, etc.) | isolamento apenas visual | usuário quer isolamento total (P-08 A)
D-09 | Escopo da 1ª entrega: painel completo do super_admin (dashboard + gestão de escolas + gestão de usuários + permissões) | entrega incremental (só dashboard) | usuário escolheu entrega completa (P-11 C)
D-10 | Super_admin pode "entrar" em qualquer escola e visualizá-la como o admin local dela | super_admin só vê dados agregados | usuário quer o recurso de "entrar na escola" (P-12 A)
D-11 | Aplicar a migração diretamente na produção (Supabase atual) com backup completo antes, e deployar backend+frontend após validar | desenvolver/testar somente local e aplicar depois | usuário autorizou produção com backup (P-13 A + P-14 A)
D-12 | Leads NÃO são isolados por escola nesta entrega; mantenho a tabela leads como está | isolar leads também | usuário escolheu não mexer em leads agora (P-15 B). Observação: leads existe como modelo SQLAlchemy mas não na migração SQL (base/01-modelo-dados.md) — registrar como sugestão no relatório técnico, sem implementar.
```

## Pendências

Nenhuma pendência.
