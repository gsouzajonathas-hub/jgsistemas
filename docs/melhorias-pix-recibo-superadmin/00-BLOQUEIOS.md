# Bloqueios

> Formato: `B-NN | task | descrição do bloqueio | o que destravaria`. Registrados na F6 (execução); consultar sempre que uma task ficar `bloqueada`.

```
B-01 | T-05.04 | Senha do admin@jgsistemas.com.br desconhecida — QA funcional em produção dependia de credencial | Conta super admin criada via env vars (T-05.03) permite acesso total sem a senha do admin; se as env vars não forem definidas, o QA fica pendente
B-02 | T-05.02 | Deploy manual via Vercel CLI obrigatório — integração git da Vercel aponta para repositório renomeado (não usa auto-deploy do git) | Rodar `npx vercel --prod --token <vcp_token>` manualmente (token em env, nunca em arquivo)
B-03 | T-05.03 | Redeploy do backend no Render é manual no painel; RAW SQL de migração aditiva (actor_role) precisa ser verificado no Postgres | Redeploy manual + verificar `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_role VARCHAR(30)` no Postgres de produção
B-04 | T-05.02 | Token da Vercel indisponível na máquina de operação — sem `VCP_TOKEN`/`VERCEL_TOKEN` em variável de ambiente, sem chave em `.env`, e sem sessão local do CLI (`~/.vercel/auth.json` ausente); B-02 proíbe auto-deploy do git | Usuário fornecer o token da Vercel em variável de ambiente (`$env:VERCEL_TOKEN`) para rodar `npx vercel --prod`; sem isso, T-05.02/T-05.03/T-05.04 ficam bloqueadas conforme regra 4
```