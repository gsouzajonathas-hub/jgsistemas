# Decisões — melhorias-pix-recibo-superadmin

> Uma linha por decisão tomada no planejamento (F2 e, excepcionalmente, F3). Formato fixo. Não apague decisões: uma decisão revertida ganha nova linha que cita a anterior.

## Decisões

```
D-01 | Produção usa PostgreSQL como banco separado e persistente (P-01 A) | SQLite em disco efêmero do Render | Banco persiste entre deploys/reinícios; elimina a hipótese de perda de dados por ambiente
D-02 | Conta de suporte é uma role própria "super_admin", exibida como tal, com acesso total e auditoria destacada (P-02 B) | Conta admin comum sem diferenciação | O usuário quer distinguir claramente o acesso de suporte da JG Sistemas
D-03 | Conta de suporte é criada automaticamente no startup do backend, com credenciais vindas de variáveis de ambiente (P-03 B) | Criação manual na tela de usuários | Conta de emergência deve existir mesmo se o admin não conseguir logar
D-04 | DoD do PIX: salvar com mensagem de sucesso, chave continua ao reabrir o modal e QR Code continua no carnê (P-04 B) | Apenas salvar o valor | "Resolvido" para o usuário inclui o fluxo completo do QR no carnê
D-05 | Recibo de material: botão "Recibo" em cada venda na listagem de Materiais Didáticos, baixando o PDF (padrão do Financeiro) (P-05 A) | Abrir em nova aba | Consistência com o fluxo já existente de mensalidade
D-06 | Credenciais da conta de suporte em variáveis de ambiente no painel do Render: SUPPORT_ADMIN_EMAIL e SUPPORT_ADMIN_PASSWORD (nomes definidos pelo orquestrador) (P-06 A) | Arquivo de configuração no servidor | Segredos fora do repositório e do código
D-07 | Conta de suporte é criada em todos os ambientes onde as variáveis estiverem definidas (produção e local/dev, para teste) (P-07 B) | Somente produção | O usuário quer poder testar o login localmente
D-08 | Super admin tem acesso total: todos os módulos, Configurações e Auditoria, sem restrição de role (P-08 A) | Acesso total exceto exclusão de usuários | "Pra verificar" quando der problema — sem barreiras
D-09 | Ações do super admin entram na trilha de auditoria com destaque via novo campo (tipo de ator) + coluna própria na tela de Auditoria (P-09 B + P-12 A) | Apenas tag textual no detalhe | O usuário quer localizar rapidamente os acessos do suporte
D-10 | Recibo de venda de material passa a usar o mesmo formato do Financeiro: `REC-{ano}-{contagem:05d}` (recibo do Financeiro usa `REC-{ano}-{count:05d}` — financial.py:577-580). Confirmação na F3 (P-F3-01). (P-10 B) | Formato atual `MAT-{sale.id:06d}` — material_receipt_service.py:105 | Uniformidade entre os recibos do sistema
D-11 | Escopo da entrega: somente chave PIX, recibo de material e conta super admin — nada mais (P-11 A) | Itens adicionais | Não há demanda extra confirmada
D-12 | Falha ao salvar o PIX: o modal mantém tudo o que foi digitado e mostra "Erro ao salvar. Tente novamente." (P-13 A) | Apagar o formulário | Evita retrabalho e perda de digitação
D-13 | Recuperação de senha do suporte = atualizar a variável de ambiente e reiniciar o backend; a conta é recriada/atualizada no startup (P-14 A) | Link de reset por e-mail | Fluxo de emergência independente de e-mail corporativo
```

> Nota técnica (não é pendência): a whitelist de roles atual (`backend/app/routes/auth.py:155` e `:349`) só aceita `admin|secretary|teacher` e rebaixa qualquer outra role para `secretary`. A F3 deve garantir que o seed automático da conta de suporte seja independente dessa whitelist e que `PUT /users/{id}` não consiga rebaixar a role `super_admin` por engano. Lacuna L2 (causa do PIX) será tratada com teste de reprodução na F3 antes de qualquer correção.

> Comandos de teste registrados na F6 (T-01.02): backend `python -m pytest -q` (60 passed na última execução completa); frontend `npx vitest run` (34 passed em 11 arquivos, baseline T-01.02).

## Pendências

Nenhuma pendência.