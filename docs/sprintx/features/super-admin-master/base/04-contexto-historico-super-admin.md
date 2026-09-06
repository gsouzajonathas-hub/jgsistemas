# Contexto histórico — introdução do super_admin (OC-2026-0003)

> Não veio do memox (não instalado neste projeto). Registrado porque a fonte é um artefato de trabalho anterior já lido nesta mesma sessão, com proveniência preservada.

## Contrato de entrada

Não aplicável — é histórico de decisão, não um recurso.

## Contrato de saída

Decisões já fechadas quando o role `super_admin` foi introduzido:

- D-08: "Super admin tem acesso total: todos os módulos, Configurações e Auditoria, sem restrição de role" — a alternativa descartada foi "Acesso total exceto exclusão de usuários"; ou seja, foi decidido deliberadamente que o acesso é total, SEM exceção de exclusão de usuários (`docs/melhorias-pix-recibo-superadmin/00-DECISOES.md:15`).
- D-09: "Ações do super admin entram na trilha de auditoria com destaque via novo campo (tipo de ator) + coluna própria na tela de Auditoria" (`docs/melhorias-pix-recibo-superadmin/00-DECISOES.md:16`) — implementado como `actor_role` em `AuditLog`.

## Limites e cotas

NÃO DOCUMENTADO além do que consta nas decisões acima.

## Erros conhecidos e tratamento

NÃO DOCUMENTADO.

## Riscos para a nossa implementação

1. D-08 já estabelece o PRINCÍPIO de acesso total do super_admin — esta feature não está criando o conceito do zero, está corrigindo uma lacuna de implementação (o bug de `register` do achado 1 em `base/01-auth-backend.md`) e decidindo pontos que a D-08 não cobriu (se `admin` comum deve perder o bypass automático, se `permissions` passa a ser aplicado de verdade no backend).
2. Nenhuma decisão anterior tratou do enforcement de `permissions` no backend — D-08/D-09 só falam do super_admin, não do mecanismo geral de permissões por módulo.

## Fonte

- `docs/melhorias-pix-recibo-superadmin/00-DECISOES.md` (linhas 15-16) — lido nesta sessão, 2026-09-05
- `docs/melhorias-pix-recibo-superadmin/ORQUESTRADOR.md` (seção 1, objetivo da feature) — lido nesta sessão, 2026-09-05
