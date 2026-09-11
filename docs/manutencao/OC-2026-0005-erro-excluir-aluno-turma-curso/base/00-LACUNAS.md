# Lacunas

- **Ambiente real de reprodução do usuário (produção ou local) e se o backend/frontend já
  estava rodando com o commit `a835e9f` no momento do relato.** NÃO DETERMINADO — o usuário
  não informou. Impacto: não bloqueante para a causa raiz (comprovada por código + teste),
  mas relevante para o E4 QA e para decidir se falta apenas deploy.
- **Exclusão de arquivos físicos (Supabase Storage/disco local) ao excluir aluno.** NÃO
  DETERMINADO se é esperado pelo usuário (o relato não especifica). O registro `FileUpload`
  é removido do banco; o arquivo em si não é removido do Storage/disco neste fluxo. Fora do
  escopo desta ocorrência por não constar no relato nem ter evidência de ser o defeito
  relatado — registrado aqui apenas como observação, não bloqueante.
