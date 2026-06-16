ALTER TABLE shared.tenants
  ADD COLUMN IF NOT EXISTS clerk_organization_id text,
  ADD COLUMN IF NOT EXISTS clerk_organization_slug text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tenants_clerk_organization_id_key'
      AND conrelid = 'shared.tenants'::regclass
  ) THEN
    ALTER TABLE shared.tenants
      ADD CONSTRAINT tenants_clerk_organization_id_key UNIQUE (clerk_organization_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS tenants_clerk_organization_slug_idx
  ON shared.tenants (clerk_organization_slug)
  WHERE clerk_organization_slug IS NOT NULL;

ALTER TABLE shared.tenant_memberships
  ADD COLUMN IF NOT EXISTS clerk_organization_id text,
  ADD COLUMN IF NOT EXISTS clerk_membership_id text,
  ADD COLUMN IF NOT EXISTS clerk_role text;

CREATE UNIQUE INDEX IF NOT EXISTS tenant_memberships_clerk_membership_id_key
  ON shared.tenant_memberships (clerk_membership_id)
  WHERE clerk_membership_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS tenant_memberships_clerk_organization_idx
  ON shared.tenant_memberships (clerk_organization_id, status)
  WHERE clerk_organization_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS shared.tenant_invitations (
  id bigserial PRIMARY KEY,
  tenant_id bigint REFERENCES shared.tenants (id) ON DELETE SET NULL,
  clerk_organization_id text NOT NULL,
  clerk_invitation_id text NOT NULL UNIQUE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'pending',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenant_invitations_role_check
    CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  CONSTRAINT tenant_invitations_status_check
    CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  CONSTRAINT tenant_invitations_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX IF NOT EXISTS tenant_invitations_tenant_status_idx
  ON shared.tenant_invitations (tenant_id, status);

CREATE INDEX IF NOT EXISTS tenant_invitations_clerk_organization_idx
  ON shared.tenant_invitations (clerk_organization_id, status);

CREATE INDEX IF NOT EXISTS tenant_invitations_email_idx
  ON shared.tenant_invitations (lower(email));

COMMENT ON COLUMN shared.tenants.clerk_organization_id IS 'Clerk Organization id linked to this tenant/workspace.';
COMMENT ON COLUMN shared.tenant_memberships.clerk_membership_id IS 'Clerk organization membership id mirrored for operational settings.';
COMMENT ON TABLE shared.tenant_invitations IS 'Mirrors Clerk organization invitations for workspace observability and settings.';
