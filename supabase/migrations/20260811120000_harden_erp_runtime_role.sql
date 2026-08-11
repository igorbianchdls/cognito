BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_runtime') THEN
    CREATE ROLE erp_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END
$$;

GRANT erp_runtime TO postgres;
GRANT USAGE ON SCHEMA erp TO erp_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA erp TO erp_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA erp TO erp_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA erp
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO erp_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA erp
  GRANT USAGE, SELECT ON SEQUENCES TO erp_runtime;

CREATE OR REPLACE FUNCTION shared.current_user_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = shared, public
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.erp_user_id', true), '')::bigint,
    (
      SELECT users.id
      FROM shared.users AS users
      WHERE users.auth_user_id = shared.current_auth_user_id()
      LIMIT 1
    )
  )
$$;

CREATE OR REPLACE FUNCTION shared.is_tenant_member(input_tenant_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = shared, public
AS $$
  SELECT
    (
      NULLIF(current_setting('app.erp_tenant_id', true), '') IS NULL
      OR NULLIF(current_setting('app.erp_tenant_id', true), '')::bigint = input_tenant_id
    )
    AND EXISTS (
      SELECT 1
      FROM shared.tenant_memberships AS memberships
      WHERE memberships.tenant_id = input_tenant_id
        AND memberships.user_id = shared.current_user_id()
        AND memberships.status = 'active'
    )
$$;

CREATE OR REPLACE FUNCTION shared.has_erp_capability(input_tenant_id bigint, input_capability text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = shared, public
AS $$
  SELECT
    (
      NULLIF(current_setting('app.erp_tenant_id', true), '') IS NULL
      OR NULLIF(current_setting('app.erp_tenant_id', true), '')::bigint = input_tenant_id
    )
    AND EXISTS (
      SELECT 1
      FROM shared.tenant_memberships AS memberships
      LEFT JOIN shared.erp_profile_permissions AS permissions
        ON permissions.profile_id = memberships.erp_profile_id
       AND permissions.capability = input_capability
      WHERE memberships.tenant_id = input_tenant_id
        AND memberships.user_id = shared.current_user_id()
        AND memberships.status = 'active'
        AND (memberships.role IN ('owner', 'admin') OR permissions.capability IS NOT NULL)
    )
$$;

REVOKE ALL ON FUNCTION shared.current_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION shared.is_tenant_member(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION shared.has_erp_capability(bigint, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION shared.current_user_id() TO authenticated, service_role, erp_runtime;
GRANT EXECUTE ON FUNCTION shared.is_tenant_member(bigint) TO authenticated, service_role, erp_runtime;
GRANT EXECUTE ON FUNCTION shared.has_erp_capability(bigint, text) TO authenticated, service_role, erp_runtime;

COMMIT;
