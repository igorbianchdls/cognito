-- Minimal stand-ins for what Supabase provides (roles, auth.jwt(), storage) and the ERP tables the access rules read
-- (shared.*), so the migrations of the editor, social, drive, analytics, videohosting and inbox schemas run in a plain
-- Postgres. Used by CI (scripts/test-db.sh) and locally; never applied to the real project.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN CREATE ROLE supabase_auth_admin NOLOGIN; END IF;
END $$;
create schema auth; create schema storage; create schema extensions;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
create function auth.role() returns text language sql stable as $$ select auth.jwt()->>'role' $$;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[], owner uuid);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets, name text, owner uuid, owner_id text, metadata jsonb);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
grant usage on schema auth, storage to anon, authenticated, service_role;
grant all on storage.objects to anon, authenticated, service_role;
grant select on storage.buckets to anon, authenticated, service_role;
create schema shared;
create table shared.empresas (id bigint primary key, clerk_organization_id text, status text not null default 'active');
create table shared.usuarios (id bigint primary key, clerk_user_id text);
create table shared.usuarios_empresas (empresa_id bigint, usuario_id bigint, role text, status text, suspenso_localmente boolean default false);
insert into shared.empresas values (1,'org_A','active'),(2,'org_B','active'),(3,'org_OFF','disabled');
insert into shared.usuarios values (1,'u_owner'),(2,'u_viewer'),(3,'u_member'),(4,'u_susp'),(5,'u_off');
insert into shared.usuarios_empresas values (1,1,'owner','active',false),(1,2,'viewer','active',false),(1,3,'member','active',false),(1,4,'member','suspended',true),(3,5,'owner','active',false);
