BEGIN;

CREATE SCHEMA IF NOT EXISTS shared;

CREATE TABLE IF NOT EXISTS shared.tenants (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE,
  status text NOT NULL DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenants_status_check
    CHECK (status IN ('active', 'suspended', 'disabled')),
  CONSTRAINT tenants_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object')
);

ALTER TABLE shared.tenants
  ADD COLUMN IF NOT EXISTS slug text;

ALTER TABLE shared.tenants
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE shared.tenants
  ALTER COLUMN status SET DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tenants_slug_key'
      AND conrelid = 'shared.tenants'::regclass
  ) THEN
    ALTER TABLE shared.tenants
      ADD CONSTRAINT tenants_slug_key UNIQUE (slug);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tenants_status_check'
      AND conrelid = 'shared.tenants'::regclass
  ) THEN
    ALTER TABLE shared.tenants
      ADD CONSTRAINT tenants_status_check
      CHECK (status IN ('active', 'suspended', 'disabled'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tenants_metadata_object_check'
      AND conrelid = 'shared.tenants'::regclass
  ) THEN
    ALTER TABLE shared.tenants
      ADD CONSTRAINT tenants_metadata_object_check
      CHECK (jsonb_typeof(metadata) = 'object');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS shared.users (
  id bigserial PRIMARY KEY,
  email varchar NOT NULL,
  password_hash varchar NOT NULL DEFAULT '',
  full_name varchar,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shared.users
  ADD COLUMN IF NOT EXISTS auth_user_id uuid;

ALTER TABLE shared.users
  ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE shared.users
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_metadata_object_check'
      AND conrelid = 'shared.users'::regclass
  ) THEN
    ALTER TABLE shared.users
      ADD CONSTRAINT users_metadata_object_check
      CHECK (jsonb_typeof(metadata) = 'object');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_auth_user_id_key'
      AND conrelid = 'shared.users'::regclass
  ) THEN
    ALTER TABLE shared.users
      ADD CONSTRAINT users_auth_user_id_key UNIQUE (auth_user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('auth.users') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'users_auth_user_fkey'
        AND conrelid = 'shared.users'::regclass
    )
  THEN
    ALTER TABLE shared.users
      ADD CONSTRAINT users_auth_user_fkey
      FOREIGN KEY (auth_user_id)
      REFERENCES auth.users (id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS users_email_idx
  ON shared.users (lower(email::text));

CREATE TABLE IF NOT EXISTS shared.tenant_memberships (
  tenant_id bigint NOT NULL
    REFERENCES shared.tenants (id)
    ON DELETE CASCADE,
  user_id bigint NOT NULL
    REFERENCES shared.users (id)
    ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id),
  CONSTRAINT tenant_memberships_role_check
    CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  CONSTRAINT tenant_memberships_status_check
    CHECK (status IN ('active', 'invited', 'suspended')),
  CONSTRAINT tenant_memberships_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX IF NOT EXISTS tenant_memberships_user_idx
  ON shared.tenant_memberships (user_id, status);

CREATE INDEX IF NOT EXISTS tenant_memberships_tenant_role_idx
  ON shared.tenant_memberships (tenant_id, role, status);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'shared'
      AND table_name = 'tenant_memberships'
      AND column_name = 'tenant_id'
      AND data_type <> 'bigint'
  ) THEN
    ALTER TABLE shared.tenant_memberships
      DROP CONSTRAINT IF EXISTS tenant_memberships_tenant_id_fkey;

    ALTER TABLE shared.tenant_memberships
      ALTER COLUMN tenant_id TYPE bigint
      USING tenant_id::bigint;

    ALTER TABLE shared.tenant_memberships
      ADD CONSTRAINT tenant_memberships_tenant_id_fkey
      FOREIGN KEY (tenant_id)
      REFERENCES shared.tenants (id)
      ON DELETE CASCADE;
  END IF;
END $$;

INSERT INTO shared.tenants (id, name, slug, status, metadata)
VALUES (
  1,
  'Cognito Default',
  'default',
  'active',
  jsonb_build_object('createdBy', 'migration_43', 'legacyTenant', true)
)
ON CONFLICT (id) DO UPDATE SET
  name = CASE
    WHEN shared.tenants.name IS NULL OR shared.tenants.name = '' THEN EXCLUDED.name
    ELSE shared.tenants.name
  END,
  slug = COALESCE(shared.tenants.slug, EXCLUDED.slug),
  status = CASE
    WHEN shared.tenants.status IN ('active', 'suspended', 'disabled') THEN shared.tenants.status
    ELSE EXCLUDED.status
  END,
  metadata = shared.tenants.metadata || EXCLUDED.metadata,
  updated_at = now();

UPDATE shared.tenants
SET
  slug = 'tenant-' || id::text,
  updated_at = now()
WHERE slug IS NULL;

WITH existing_tenants AS (
  SELECT tenant_id FROM integrations.connected_accounts WHERE to_regclass('integrations.connected_accounts') IS NOT NULL
  UNION
  SELECT tenant_id FROM integrations.connections WHERE to_regclass('integrations.connections') IS NOT NULL
  UNION
  SELECT tenant_id FROM integrations.destinations WHERE to_regclass('integrations.destinations') IS NOT NULL
  UNION
  SELECT tenant_id FROM integrations.pipelines WHERE to_regclass('integrations.pipelines') IS NOT NULL
  UNION
  SELECT tenant_id FROM integrations.plugin_permissions WHERE to_regclass('integrations.plugin_permissions') IS NOT NULL
  UNION
  SELECT tenant_id FROM integrations.plugin_action_audit WHERE to_regclass('integrations.plugin_action_audit') IS NOT NULL
  UNION
  SELECT tenant_id FROM integrations.sync_runs WHERE to_regclass('integrations.sync_runs') IS NOT NULL
  UNION
  SELECT tenant_id FROM integrations.sync_cursors WHERE to_regclass('integrations.sync_cursors') IS NOT NULL
  UNION
  SELECT tenant_id FROM integrations.events WHERE to_regclass('integrations.events') IS NOT NULL
)
INSERT INTO shared.tenants (id, name, slug, status, metadata)
SELECT DISTINCT
  tenant_id,
  'Tenant ' || tenant_id::text,
  'tenant-' || tenant_id::text,
  'active',
  jsonb_build_object('createdBy', 'migration_43', 'backfilled', true)
FROM existing_tenants
WHERE tenant_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  tenant_sequence regclass;
BEGIN
  tenant_sequence := pg_get_serial_sequence('shared.tenants', 'id')::regclass;
  IF tenant_sequence IS NOT NULL THEN
    PERFORM setval(
      tenant_sequence,
      GREATEST(COALESCE((SELECT max(id) FROM shared.tenants), 1), 1),
      true
    );
  END IF;
EXCEPTION
  WHEN undefined_table OR undefined_object THEN
    NULL;
END $$;

DO $$
BEGIN
  IF to_regclass('auth.users') IS NOT NULL THEN
    UPDATE shared.users AS users
    SET
      auth_user_id = auth_users.id,
      full_name = COALESCE(
        users.full_name,
        auth_users.raw_user_meta_data ->> 'full_name',
        auth_users.raw_user_meta_data ->> 'name'
      ),
      metadata = users.metadata || jsonb_build_object('updatedBy', 'migration_43', 'source', 'auth.users'),
      updated_at = now()
    FROM auth.users AS auth_users
    WHERE users.auth_user_id IS NULL
      AND auth_users.email IS NOT NULL
      AND lower(users.email::text) = lower(auth_users.email::text);

    INSERT INTO shared.users (
      auth_user_id,
      email,
      password_hash,
      full_name,
      metadata,
      created_at,
      updated_at
    )
    SELECT
      auth_users.id,
      auth_users.email,
      'supabase-auth',
      COALESCE(
        auth_users.raw_user_meta_data ->> 'full_name',
        auth_users.raw_user_meta_data ->> 'name'
      ),
      jsonb_build_object('createdBy', 'migration_43', 'source', 'auth.users'),
      COALESCE(auth_users.created_at, now()),
      now()
    FROM auth.users AS auth_users
    WHERE auth_users.email IS NOT NULL
    ON CONFLICT (auth_user_id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(shared.users.full_name, EXCLUDED.full_name),
      metadata = shared.users.metadata || EXCLUDED.metadata,
      updated_at = now();
  END IF;
END $$;

WITH ranked_users AS (
  SELECT
    id,
    row_number() OVER (ORDER BY created_at ASC, id ASC) AS user_rank
  FROM shared.users
)
INSERT INTO shared.tenant_memberships (tenant_id, user_id, role, status, metadata)
SELECT
  1,
  id,
  CASE WHEN user_rank = 1 THEN 'owner' ELSE 'member' END,
  'active',
  jsonb_build_object('createdBy', 'migration_43', 'legacyDefaultTenant', true)
FROM ranked_users
ON CONFLICT (tenant_id, user_id) DO NOTHING;

DO $$
DECLARE
  fk text[];
  fk_defs constant text[][] := ARRAY[
    ARRAY['integrations.connected_accounts', 'integrations_connected_accounts_tenant_fkey'],
    ARRAY['integrations.connections', 'integrations_connections_tenant_fkey'],
    ARRAY['integrations.destinations', 'integrations_destinations_tenant_fkey'],
    ARRAY['integrations.pipelines', 'integrations_pipelines_tenant_fkey'],
    ARRAY['integrations.plugin_permissions', 'integrations_plugin_permissions_tenant_fkey'],
    ARRAY['integrations.plugin_action_audit', 'integrations_plugin_action_audit_tenant_fkey'],
    ARRAY['integrations.sync_runs', 'integrations_sync_runs_tenant_fkey'],
    ARRAY['integrations.sync_cursors', 'integrations_sync_cursors_tenant_fkey'],
    ARRAY['integrations.events', 'integrations_events_tenant_fkey']
  ];
BEGIN
  FOREACH fk SLICE 1 IN ARRAY fk_defs LOOP
    IF to_regclass(fk[1]) IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = fk[2]
          AND conrelid = fk[1]::regclass
      )
    THEN
      EXECUTE format(
        'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (tenant_id) REFERENCES shared.tenants (id) ON DELETE RESTRICT',
        fk[1],
        fk[2]
      );
    END IF;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION shared.current_auth_user_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claim_sub text;
BEGIN
  claim_sub := nullif(current_setting('request.jwt.claim.sub', true), '');
  IF claim_sub IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN claim_sub::uuid;
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION shared.current_user_id()
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT users.id
  FROM shared.users AS users
  WHERE users.auth_user_id = shared.current_auth_user_id()
  LIMIT 1
$$;

DROP FUNCTION IF EXISTS shared.is_tenant_member(integer);
DROP FUNCTION IF EXISTS shared.has_tenant_role(integer, text[]);

CREATE OR REPLACE FUNCTION shared.is_tenant_member(input_tenant_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM shared.tenant_memberships AS memberships
    WHERE memberships.tenant_id = input_tenant_id
      AND memberships.user_id = shared.current_user_id()
      AND memberships.status = 'active'
  )
$$;

CREATE OR REPLACE FUNCTION shared.has_tenant_role(input_tenant_id bigint, allowed_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM shared.tenant_memberships AS memberships
    WHERE memberships.tenant_id = input_tenant_id
      AND memberships.user_id = shared.current_user_id()
      AND memberships.status = 'active'
      AND memberships.role = ANY(allowed_roles)
  )
$$;

COMMENT ON TABLE shared.tenants IS 'Canonical tenant/workspace registry shared across products.';
COMMENT ON TABLE shared.tenant_memberships IS 'Maps users to tenants and product access roles.';
COMMENT ON FUNCTION shared.is_tenant_member(bigint) IS 'Helper for future RLS and API authorization checks. RLS is intentionally not enabled by this migration.';

COMMIT;
