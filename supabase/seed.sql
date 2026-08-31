-- ============================================================================
-- Seed local (dev/testes) — NUNCA roda em produção além do migration init.
-- Cria o usuário administrador padrão do aplicativo (auth JWT própria, D-06).
-- Senha do seed local: SenhaForte#2026!  (hash bcrypt pré-gerado)
-- ============================================================================

insert into public.users (name, email, password_hash, role, is_active)
select 'Administrador', 'admin@escola.com',
       '$2b$12$8hY57hDvBHvjbvCimaUEVOpwCGXxZQG9ZjrUXUTAhlQ9nsJRlR4KC',
       'admin', true
where not exists (select 1 from public.users where email = 'admin@escola.com');