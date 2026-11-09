-- Papel de menor privilégio usado pela aplicação em tempo de execução.
--
-- O app só lê e escreve dados (DML). Criar/alterar tabelas fica com o dono do
-- banco, usado apenas pelas migrations (DIRECT_URL). Se a aplicação for
-- comprometida, o atacante não consegue apagar tabelas nem mudar o schema.
--
-- Rode uma vez, conectado como dono (ex.: neondb_owner), trocando a senha:
--   psql "$DIRECT_URL" -v app_password="'senha-forte'" -f prisma/sql/app-role.sql
-- Depois use `crowslot_app` no DATABASE_URL.

CREATE ROLE crowslot_app LOGIN PASSWORD :app_password;

GRANT CONNECT ON DATABASE neondb TO crowslot_app;
GRANT USAGE ON SCHEMA public TO crowslot_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO crowslot_app;
REVOKE ALL ON TABLE _prisma_migrations FROM crowslot_app;

-- Tabelas criadas por migrations futuras já nascem com as mesmas permissões.
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO crowslot_app;
