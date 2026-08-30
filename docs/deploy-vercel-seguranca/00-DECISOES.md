# Decisões — deploy-vercel-seguranca

> Uma linha por decisão tomada no planejamento (F2 e, excepcionalmente, F3). Formato fixo. Não apague decisões: uma decisão revertida ganha nova linha que cita a anterior.

## Decisões

```
D-01 | Backend migra por completo para o ecossistema Supabase (sem Render) | FastAPI na Render + Supabase; FastAPI na Vercel + Supabase | usuário: "quero migrar todo backend para supabase" (P-01)
D-02 | Backend é REEESCRITO como Supabase Edge Functions (Deno/TypeScript), descartando o FastAPI/Python e os 38 testes pytest | FastAPI na Vercel (ASGI nativo, ~1/5 do esforço) | usuário: "Reescrever em Edge Functions", consciente do custo ~10x; "vou te dar acessos. depois limpamos o .env das credenciais. Nao reclmae disso, poi estou fazendo consciente" (P-06/P-11)
D-03 | Banco em produção: Supabase Postgres gerenciado (começa LIMPO, sem migração de dados — banco atual só tem dados de teste E2E) | SQLite no disco; migrar dados reais | P-02 + P-13: "só dados de teste, começar limpo"
D-04 | Uploads (fotos, documentos de alunos, logo) persistem em Supabase Storage (bucket privado + URLs assinadas; bucket público somente para logo) | Vercel Blob; disco do servidor | P-03: "Supabase Storage / Vercel Blob" + D-02 (backend vira Supabase) → Supabase Storage é a opção efetiva
D-05 | Login via Supabase não é usado: remover rota supabase-sync do backend e código supabase do frontend | configurar fluxo Supabase Auth; manter inativo | P-04: "Não uso, remover (Recomendado)"
D-06 | Autenticação do app permanece email+senha com JWT (HS256) validado pelas Edge Functions — contrato do frontend (localStorage + axios baseURL /api) fica INALTERADO | Supabase Auth (GoTrue) substituindo o JWT próprio | D-05 (removeu login Supabase) + preservar contrato do frontend; JWT HS256 já validado em base/01-seguranca-backend.md
D-07 | VERCEL_OIDC_TOKEN removido de frontend/.env.local; usuário revoga/rotaciona o token no painel da Vercel (ação manual, fora do código) | ignorar o risco | P-05: "Remover do arquivo + você revoga (Recomendado)"
D-08 | E-mail transacional (reset de senha) via Resend plano FREE: 3.000 emails/mês, 100/dia, até 3 domínios verificados, retenção 30d (fontes: resend.com/pricing; resend.com/docs/knowledge-base/account-quotas-and-limits) | console-only (inválido em produção); SMTP Gmail | P-07: "quero usar o resend no plano gratuito oque acha?" — aprovado; volume de escola cabe no free
D-09 | Remetente do Resend usa domínio próprio do usuário, verificado via DNS no painel do Resend (necessário: jgsistemas.vercel.app NÃO pode enviar) — domínio exato e registro DNS pendentes de fornecimento do usuário | console-only; sem envio | P-12: "Tenho domínio próprio"
D-10 | Domínio público do frontend: https://jgsistemas.vercel.app (TLS automático Vercel; mantém CORS_ORIGINS/FRONTEND_URL atuais de render.yaml nas novas configs) | domínio próprio anexado à Vercel | P-08
D-11 | WhatsApp/Z-API é DESATIVADO no backend (vars ZAPI_INSTANCE_URL/ZAPI_TOKEN estão vazias; código fica fora do escopo) | configurar instância Z-API | P-09: "Não uso, desativar (Recomendado)"
D-12 | Observabilidade mínima: GET /api/health + trilha de auditoria existente (tabela audit_logs). Sem métricas/alertas/backup automático nesta entrega | auditoria ampliada (falhas de login, uploads rejeitados); backup automático | P-14: "Mínimo (health + auditoria) (Recomendado)"
D-13 | Sharding das rotas: UMA Edge Function "app" com roteamento interno replicando o router do FastAPI; frontend continua chamando /api/* (rewrite Vercel → https://<ref>.supabase.co/functions/v1/app) | uma Edge Function por domínio (N deploys, rewrites 1:1 impossível) | manter contrato frontend (axios baseURL /api) sem tocar nas chamadas
D-14 | Critério de pronto do usuário: código com hardening implementado + testes verdes + configs de deploy prontos + relatório técnico final em PT com tempo total. Deploy no painel permanece manual do usuário (sem credenciais minhas) | executar o deploy com credenciais compartilhadas; só relatório sem código | P-10: "Pronto p/ deploy + relatório (Recomendado)"
```

## Pendências

> Todo PENDENTE é bloqueante por padrão e trava a F3. Só marque `(NÃO BLOQUEANTE)` com autorização explícita do usuário, registrando a premissa assumida.

```
PENDENTE-01 | Credenciais de acesso ao Supabase (project ref, access token / service role) que o usuário prometeu fornecer ("vou te dar acessos") | trava: link do supabase CLI + deploy das Edge Functions + criar projeto/banco de produção na F6 | (NÃO BLOQUEANTE) usuário autorizou seguir com premissa: implementação e testes rodam CONTRA O STACK LOCAL do Supabase (supabase start / supabase test); deploy remoto e banco de produção dependem da credencial e ficam como task final "aguardando acesso" — se a credencial não chegar, a entrega cobre stack local + guia de deploy manual e registra o fato no relatório
PENDENTE-02 | Domínio exato do remetente do Resend + criação da API key | trava: variável RESEND_API_KEY e remetente from@<domínio> no plano de config | (NÃO BLOQUEANTE) premissa: código usa RESEND_API_KEY lida de secret do Supabase e remetente "JGSistemas <no-reply@<domínio>>" via variável RESEND_FROM; se não chegar, reset de senha segue console-only em dev e o relatório registra
PENDENTE-03 | Domínio exato do Resend para DNS (SPF/DKIM) | trava: nenhuma no código | (NÃO BLOQUEANTE) verificação de domínio é ação manual do usuário no painel do Resend; não bloqueia implementação
```