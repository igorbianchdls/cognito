import { auth, clerkClient } from "@clerk/nextjs/server";

import { withTransaction, type SQLClient } from "@/lib/postgres";
import {
  createClerkOrganization,
  updateClerkOrganizationMetadata,
  type ClerkOrganizationPayload,
} from "@/products/auth/server/clerkOrganizationClient";
import type {
  AuthTenantMembership,
  ClerkTenantBootstrapResult,
} from "@/products/auth/shared/authContracts";

type SharedUserRow = {
  id: string | number;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  clerk_user_id: string | null;
  status: string;
};

type TenantMembershipRow = {
  clerk_membership_id: string | null;
  clerk_organization_id: string | null;
  clerk_organization_slug: string | null;
  empresa_id: string | number;
  tenant_name: string;
  tenant_slug: string | null;
  role: string;
};

type TenantRow = {
  clerk_organization_id?: string | null;
  clerk_organization_slug?: string | null;
  id: string | number;
  name: string;
  slug: string | null;
};

import { applyPortalInvitations } from "./portalInvitationAccess";

type ClerkProfile = {
  clerkUserId: string;
  clerkOrganizationId: string | null;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  emailVerified?: boolean;
};

export type ClerkProfileInput = ClerkProfile;

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "tenant";
}

function getEmailDomain(email: string) {
  const domain = email.split("@")[1]?.trim().toLowerCase();
  return domain &&
    domain !== "gmail.com" &&
    domain !== "hotmail.com" &&
    domain !== "outlook.com"
    ? domain.split(".")[0]
    : "";
}

function getTenantName(profile: ClerkProfile) {
  const domain = getEmailDomain(profile.email);
  if (domain)
    return domain.replace(
      /(^|-)([a-z])/g,
      (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`,
    );
  return profile.fullName
    ? `${profile.fullName} Workspace`
    : `${profile.email} Workspace`;
}

function normalizeCompanyName(value: unknown) {
  const name = toText(value).replace(/\s+/g, " ");
  if (name.length < 2) {
    throw new Error("Nome da empresa deve ter pelo menos 2 caracteres.");
  }
  if (name.length > 120) {
    throw new Error("Nome da empresa deve ter no maximo 120 caracteres.");
  }
  return name;
}

function normalizeMembership(row: TenantMembershipRow): AuthTenantMembership {
  const role = toText(row.role);
  return {
    clerkMembershipId: row.clerk_membership_id,
    clerkOrganizationId: row.clerk_organization_id,
    clerkOrganizationSlug: row.clerk_organization_slug,
    tenantId: Number(row.empresa_id),
    tenantName: row.tenant_name,
    tenantSlug: row.tenant_slug,
    role:
      role === "owner" || role === "admin" || role === "viewer"
        ? role
        : "member",
  };
}

async function getCurrentClerkProfile(): Promise<ClerkProfile | null> {
  const authState = await auth();
  if (!authState.userId) return null;

  const client = await clerkClient();
  const user = await client.users.getUser(authState.userId);
  const primaryEmail = user.primaryEmailAddress || user.emailAddresses[0];
  const email = primaryEmail?.emailAddress || "";
  if (!email) {
    throw new Error("Usuario Clerk sem email principal.");
  }

  const fullName =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    null;
  return {
    clerkUserId: authState.userId,
    clerkOrganizationId: authState.orgId || null,
    email,
    emailVerified: primaryEmail?.verification?.status === "verified",
    fullName,
    avatarUrl: user.imageUrl || null,
  };
}

async function findUserByClerkId(
  client: Pick<SQLClient, "query">,
  clerkUserId: string,
): Promise<SharedUserRow | null> {
  const result = await client.query(
    `SELECT id, email, full_name, avatar_url, clerk_user_id, status
     FROM shared.usuarios
     WHERE clerk_user_id = $1
     LIMIT 1`,
    [clerkUserId],
  );
  return (result.rows[0] as SharedUserRow | undefined) || null;
}

async function linkUserByEmail(
  client: Pick<SQLClient, "query">,
  profile: ClerkProfile,
): Promise<SharedUserRow | null> {
  if (!profile.emailVerified) return null;
  const result = await client.query(
    `UPDATE shared.usuarios
     SET
       clerk_user_id = $1,
       email = $2,
       full_name = COALESCE(NULLIF($3, ''), full_name),
       avatar_url = COALESCE(NULLIF($4, ''), avatar_url),
       metadata = metadata || jsonb_build_object('linkedBy', 'clerk', 'linkedAt', now()),
       updated_at = now()
     WHERE clerk_user_id IS NULL
       AND auth_user_id IS NULL AND password_hash='' AND status='active'
       AND lower(email::text) = lower($2::text)
     RETURNING id, email, full_name, avatar_url, clerk_user_id, status`,
    [
      profile.clerkUserId,
      profile.email,
      profile.fullName || "",
      profile.avatarUrl || "",
    ],
  );
  return (result.rows[0] as SharedUserRow | undefined) || null;
}

async function createSharedUser(
  client: Pick<SQLClient, "query">,
  profile: ClerkProfile,
): Promise<SharedUserRow> {
  const result = await client.query(
    `INSERT INTO shared.usuarios
       (email, password_hash, full_name, avatar_url, clerk_user_id, metadata, updated_at)
     VALUES
       ($1, '', $2, $3, $4, $5::jsonb, now())
     RETURNING id, email, full_name, avatar_url, clerk_user_id, status`,
    [
      profile.email,
      profile.fullName,
      profile.avatarUrl,
      profile.clerkUserId,
      JSON.stringify({
        createdBy: "clerk_bootstrap",
        source: "clerk",
        emailVerified: profile.emailVerified === true,
      }),
    ],
  );
  return result.rows[0] as SharedUserRow;
}

async function touchSharedUser(
  client: Pick<SQLClient, "query">,
  user: SharedUserRow,
  profile: ClerkProfile,
) {
  await client.query(
    `UPDATE shared.usuarios
     SET
       email = $2,
       full_name = COALESCE(NULLIF($3, ''), full_name),
       avatar_url = COALESCE(NULLIF($4, ''), avatar_url),
       metadata = (metadata - 'clerkDeletedAt' - 'clerkDeleted') || jsonb_build_object('source', 'clerk','emailVerified',$5::boolean),
       updated_at = now()
     WHERE id = $1`,
    [
      user.id,
      profile.email,
      profile.fullName || "",
      profile.avatarUrl || "",
      profile.emailVerified === true,
    ],
  );
}

export async function syncSharedUser(
  client: Pick<SQLClient, "query">,
  profile: ClerkProfile,
): Promise<SharedUserRow> {
  profile = { ...profile, email: profile.email.trim().toLowerCase() };
  if (!profile.email.includes("@") || !profile.clerkUserId.startsWith("user_"))
    throw new Error("Identidade Clerk invalida.");
  // Consistent ordering serializes both same-identity and same-email bootstrap races.
  for (const key of [
    `email:${profile.email}`,
    `user:${profile.clerkUserId}`,
  ].sort())
    await client.query("SELECT pg_advisory_xact_lock(73006,hashtext($1))", [
      key,
    ]);
  let user = await findUserByClerkId(client, profile.clerkUserId);
  if (!user) user = await linkUserByEmail(client, profile);
  if (!user) return createSharedUser(client, profile);
  if (user.status !== "active")
    throw new Error("Usuario suspenso ou desativado.");
  await touchSharedUser(client, user, profile);
  return user;
}

async function listMemberships(
  client: Pick<SQLClient, "query">,
  sharedUserId: number,
): Promise<AuthTenantMembership[]> {
  const result = await client.query(
    `SELECT
       tenants.id::text AS empresa_id,
       tenants.name::text AS tenant_name,
       tenants.slug::text AS tenant_slug,
       tenants.clerk_organization_id::text AS clerk_organization_id,
       tenants.clerk_organization_slug::text AS clerk_organization_slug,
       memberships.clerk_membership_id::text AS clerk_membership_id,
       memberships.role::text AS role
     FROM shared.usuarios_empresas AS memberships
     JOIN shared.empresas AS tenants
       ON tenants.id = memberships.empresa_id
     WHERE memberships.usuario_id = $1
       AND memberships.status = 'active'
       AND NOT memberships.suspenso_localmente
       AND EXISTS(SELECT 1 FROM shared.usuarios WHERE id=$1 AND status='active')
       AND tenants.status = 'active'
     ORDER BY
       CASE memberships.role
         WHEN 'owner' THEN 1
         WHEN 'admin' THEN 2
         WHEN 'member' THEN 3
         WHEN 'viewer' THEN 4
         ELSE 5
       END,
       tenants.id ASC`,
    [sharedUserId],
  );
  return (result.rows as TenantMembershipRow[]).map(normalizeMembership);
}

async function createInitialTenant(
  client: Pick<SQLClient, "query">,
  sharedUserId: number,
  profile: ClerkProfile,
  options: {
    clerkOrganization?: ClerkOrganizationPayload | null;
    companyName?: string;
    tenantName?: string;
  } = {},
): Promise<AuthTenantMembership> {
  const tenantName =
    options.tenantName ||
    (options.companyName
      ? normalizeCompanyName(options.companyName)
      : getTenantName(profile));
  const baseSlug = slugify(tenantName);
  const suffix = profile.clerkUserId
    .slice(-8)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  const slug =
    options.clerkOrganization?.slug || `${baseSlug}-${suffix || sharedUserId}`;
  const metadata = {
    clerkOrganizationId: options.clerkOrganization?.id || null,
    createdBy: "clerk_bootstrap",
    source: options.clerkOrganization ? "clerk_organization" : "clerk",
    ownerClerkUserId: profile.clerkUserId,
    onboardingCompletedAt: new Date().toISOString(),
  };

  const tenantResult = options.clerkOrganization
    ? await client.query(
        `INSERT INTO shared.empresas
         (name, slug, status, clerk_organization_id, clerk_organization_slug, metadata, updated_at)
       VALUES
         ($1, $2, 'active', $3, $4, $5::jsonb, now())
       ON CONFLICT (clerk_organization_id)
       DO UPDATE SET
         name = EXCLUDED.name,
         slug = COALESCE(EXCLUDED.slug, shared.empresas.slug),
         status = shared.empresas.status,
         clerk_organization_slug = EXCLUDED.clerk_organization_slug,
         metadata = COALESCE(shared.empresas.metadata, '{}'::jsonb) || EXCLUDED.metadata,
         updated_at = now()
       RETURNING id, name, slug, clerk_organization_id, clerk_organization_slug`,
        [
          tenantName,
          slug,
          options.clerkOrganization.id,
          options.clerkOrganization.slug || null,
          JSON.stringify(metadata),
        ],
      )
    : await client.query(
        `INSERT INTO shared.empresas (name, slug, status, metadata, updated_at)
       VALUES ($1, $2, 'active', $3::jsonb, now())
       ON CONFLICT (slug)
       DO UPDATE SET
         updated_at = now()
       RETURNING id, name, slug`,
        [tenantName, slug, JSON.stringify(metadata)],
      );
  const tenant = tenantResult.rows[0] as TenantRow;

  await client.query(
    `INSERT INTO shared.usuarios_empresas
       (empresa_id, usuario_id, role, status, clerk_organization_id, clerk_role, metadata, updated_at)
     VALUES
       ($1, $2, 'owner', 'active', $3, $4, $5::jsonb, now())
     ON CONFLICT (empresa_id, usuario_id)
     DO UPDATE SET
       role = CASE
         WHEN shared.usuarios_empresas.role IN ('owner', 'admin') THEN shared.usuarios_empresas.role
         ELSE EXCLUDED.role
       END,
       status = shared.usuarios_empresas.status,
       clerk_organization_id = COALESCE(EXCLUDED.clerk_organization_id, shared.usuarios_empresas.clerk_organization_id),
       clerk_role = COALESCE(EXCLUDED.clerk_role, shared.usuarios_empresas.clerk_role),
       metadata = COALESCE(shared.usuarios_empresas.metadata, '{}'::jsonb) || EXCLUDED.metadata,
       updated_at = now()`,
    [
      tenant.id,
      sharedUserId,
      options.clerkOrganization?.id || null,
      options.clerkOrganization ? "org:admin" : null,
      JSON.stringify({
        clerkOrganizationId: options.clerkOrganization?.id || null,
        createdBy: "clerk_bootstrap",
        source: options.clerkOrganization ? "clerk_organization" : "clerk",
        onboardingRole: "owner",
      }),
    ],
  );

  return {
    clerkMembershipId: null,
    clerkOrganizationId:
      tenant.clerk_organization_id || options.clerkOrganization?.id || null,
    clerkOrganizationSlug:
      tenant.clerk_organization_slug || options.clerkOrganization?.slug || null,
    tenantId: Number(tenant.id),
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    role: "owner",
  };
}

function buildBootstrapResult(
  profile: ClerkProfile,
  sharedUserId: number,
  memberships: AuthTenantMembership[],
): ClerkTenantBootstrapResult {
  const activeTenant = profile.clerkOrganizationId
    ? memberships.find(
        (membership) =>
          membership.clerkOrganizationId === profile.clerkOrganizationId,
      ) || null
    : memberships[0] || null;
  return {
    clerkUserId: profile.clerkUserId,
    sharedUserId,
    email: profile.email,
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl,
    memberships,
    needsOnboarding: memberships.length === 0,
    activeTenant,
  };
}

export async function ensureClerkTenantBootstrap(): Promise<ClerkTenantBootstrapResult | null> {
  const profile = await getCurrentClerkProfile();
  if (!profile) return null;

  return withTransaction(async (client) => {
    const user = await syncSharedUser(client, profile);
    const sharedUserId = Number(user.id);
    for (const company of (
      await client.query(
        "SELECT m.empresa_id FROM shared.usuarios_empresas m WHERE m.usuario_id=$1 AND m.status='active' AND EXISTS(SELECT 1 FROM shared.convites_empresa i WHERE i.empresa_id=m.empresa_id AND i.status='accepted' AND i.acesso_portal_contador AND i.metadata->>'portalAccessApplied' IS DISTINCT FROM 'true') ORDER BY m.empresa_id",
        [sharedUserId],
      )
    ).rows)
      await applyPortalInvitations(client, Number(company.empresa_id));
    const memberships = await listMemberships(client, sharedUserId);

    return buildBootstrapResult(profile, sharedUserId, memberships);
  });
}

export async function createClerkOnboardingTenant(
  companyName: string,
): Promise<ClerkTenantBootstrapResult | null> {
  const profile = await getCurrentClerkProfile();
  if (!profile) return null;

  const initialState = await withTransaction(async (client) => {
    const user = await syncSharedUser(client, profile);
    const sharedUserId = Number(user.id);
    const memberships = await listMemberships(client, sharedUserId);
    return buildBootstrapResult(profile, sharedUserId, memberships);
  });

  if (!initialState.needsOnboarding) return initialState;

  const tenantName = companyName
    ? normalizeCompanyName(companyName)
    : getTenantName(profile);
  const baseSlug = slugify(tenantName);
  const suffix = profile.clerkUserId
    .slice(-8)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  const slug = `${baseSlug}-${suffix || initialState.sharedUserId}`;
  const organization = await createClerkOrganization({
    createdByClerkUserId: profile.clerkUserId,
    name: tenantName,
    privateMetadata: {
      ownerClerkUserId: profile.clerkUserId,
      source: "cognito_onboarding",
    },
    publicMetadata: {
      app: "cognito",
    },
    slug,
  });

  const state = await withTransaction(async (client) => {
    const user = await syncSharedUser(client, profile);
    const sharedUserId = Number(user.id);
    let memberships = await listMemberships(client, sharedUserId);

    if (!memberships.length) {
      memberships = [
        await createInitialTenant(client, sharedUserId, profile, {
          clerkOrganization: organization,
          tenantName,
        }),
      ];
    }

    return buildBootstrapResult(profile, sharedUserId, memberships);
  });

  const tenantId = state.activeTenant?.tenantId;
  if (tenantId) {
    await updateClerkOrganizationMetadata({
      organizationId: organization.id,
      privateMetadata: {
        ownerClerkUserId: profile.clerkUserId,
        source: "cognito_onboarding",
        tenantId,
      },
      publicMetadata: {
        app: "cognito",
      },
    }).catch(() => undefined);
  }

  return state;
}

export async function syncClerkProfile(
  profile: ClerkProfileInput,
): Promise<ClerkTenantBootstrapResult> {
  return withTransaction((client) =>
    syncClerkProfileWithClient(client, profile),
  );
}

export async function syncClerkProfileWithClient(
  client: Pick<SQLClient, "query">,
  profile: ClerkProfileInput,
): Promise<ClerkTenantBootstrapResult> {
  const user = await syncSharedUser(client, profile);
  const sharedUserId = Number(user.id);
  const memberships = await listMemberships(client, sharedUserId);
  return buildBootstrapResult(profile, sharedUserId, memberships);
}

export async function markClerkUserDeleted(
  clerkUserId: string,
): Promise<boolean> {
  return withTransaction((client) =>
    markClerkUserDeletedWithClient(client, clerkUserId),
  );
}

export async function markClerkUserDeletedWithClient(
  client: Pick<SQLClient, "query">,
  clerkUserId: string,
): Promise<boolean> {
  const id = toText(clerkUserId);
  if (!id) return false;

  {
    const existing = await client.query(
      "SELECT id FROM shared.usuarios WHERE clerk_user_id=$1",
      [id],
    );
    const userId = existing.rows[0]?.id;
    if (!userId) return false;
    await client.query(
      "UPDATE shared.empresas e SET status='suspended',updated_at=now() WHERE e.status='active' AND EXISTS(SELECT 1 FROM shared.usuarios_empresas m WHERE m.empresa_id=e.id AND m.usuario_id=$1 AND m.role='owner' AND m.status='active') AND NOT EXISTS(SELECT 1 FROM shared.usuarios_empresas m JOIN shared.usuarios u ON u.id=m.usuario_id WHERE m.empresa_id=e.id AND m.usuario_id<>$1 AND m.role='owner' AND m.status='active' AND u.status='active')",
      [userId],
    );
    await client.query(
      "UPDATE shared.usuarios SET status='disabled',metadata=metadata||jsonb_build_object('clerkDeleted',true,'clerkDeletedAt',now()),updated_at=now() WHERE id=$1",
      [userId],
    );

    await client.query(
      `UPDATE shared.usuarios_empresas
       SET
         status = 'suspended',
         metadata = metadata || jsonb_build_object('suspendedBy', 'clerk_webhook', 'suspendedAt', now()),
         updated_at = now()
       WHERE usuario_id = $1
         AND status = 'active'`,
      [userId],
    );
    return true;
  }
}
