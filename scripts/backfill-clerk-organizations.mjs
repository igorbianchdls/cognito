#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import dotenv from "dotenv";
import { Client } from "pg";

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? null : process.argv[i + 1] ?? null;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function loadEnv() {
  const cwd = process.cwd();
  for (const file of [".env.local", ".env", ".env.production.local", ".env.production"]) {
    const p = path.join(cwd, file);
    if (fs.existsSync(p)) dotenv.config({ path: p, override: false });
  }
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} ausente`);
  return value;
}

async function clerkRequest(pathname, body) {
  if (!process.env.CLERK_SECRET_KEY?.trim()) {
    const child = spawnSync("clerk", [
      "api",
      pathname,
      "--instance",
      "dev",
      "-d",
      JSON.stringify(body),
      "--yes",
    ], { encoding: "utf8" });
    if (child.status !== 0) {
      throw new Error((child.stderr || child.stdout || "clerk api falhou").trim());
    }
    return JSON.parse(child.stdout);
  }

  const response = await fetch(`https://api.clerk.com/v1${pathname}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${requiredEnv("CLERK_SECRET_KEY")}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const first = Array.isArray(payload.errors) ? payload.errors[0] : null;
    throw new Error(first?.long_message || first?.message || `Clerk HTTP ${response.status}`);
  }
  return payload;
}

async function main() {
  loadEnv();
  const email = (getArg("--email") || "").trim().toLowerCase();
  const all = hasFlag("--all");
  if (!email && !all) throw new Error("Use --email usuario@dominio.com ou --all");

  const client = new Client({
    connectionString: requiredEnv("SUPABASE_DB_URL"),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    const rows = await client.query(
      `SELECT
         tenants.id::bigint AS tenant_id,
         tenants.name::text AS tenant_name,
         tenants.slug::text AS tenant_slug,
         users.id::bigint AS user_id,
         users.email::text AS email,
         users.clerk_user_id::text AS clerk_user_id
       FROM shared.tenant_memberships AS memberships
       JOIN shared.tenants AS tenants
         ON tenants.id = memberships.tenant_id
       JOIN shared.users AS users
         ON users.id = memberships.user_id
       WHERE tenants.status = 'active'
         AND tenants.clerk_organization_id IS NULL
         AND memberships.status = 'active'
         AND memberships.role IN ('owner', 'admin')
         AND users.clerk_user_id IS NOT NULL
         AND ($1::text = '' OR lower(users.email::text) = $1::text)
       ORDER BY tenants.id ASC`,
      [all ? "" : email],
    );

    for (const row of rows.rows) {
      const org = await clerkRequest("/organizations", {
        created_by: row.clerk_user_id,
        name: row.tenant_name,
        private_metadata: {
          ownerClerkUserId: row.clerk_user_id,
          source: "cognito_backfill",
          tenantId: Number(row.tenant_id),
        },
        public_metadata: {
          app: "cognito",
        },
      });

      await client.query("BEGIN");
      try {
        await client.query(
          `UPDATE shared.tenants
           SET
             clerk_organization_id = $2,
             clerk_organization_slug = $3,
             metadata = COALESCE(metadata, '{}'::jsonb) || $4::jsonb,
             updated_at = now()
           WHERE id = $1`,
          [
            row.tenant_id,
            org.id,
            org.slug || null,
            JSON.stringify({ clerkOrganizationId: org.id, source: "cognito_backfill" }),
          ],
        );
        await client.query(
          `UPDATE shared.tenant_memberships
           SET
             clerk_organization_id = $3,
             clerk_role = 'org:admin',
             metadata = COALESCE(metadata, '{}'::jsonb) || $4::jsonb,
             updated_at = now()
           WHERE tenant_id = $1
             AND user_id = $2`,
          [
            row.tenant_id,
            row.user_id,
            org.id,
            JSON.stringify({ clerkOrganizationId: org.id, source: "cognito_backfill" }),
          ],
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      }

      console.log(JSON.stringify({
        email: row.email,
        ok: true,
        organizationId: org.id,
        tenantId: Number(row.tenant_id),
      }));
    }

    if (!rows.rows.length) {
      console.log(JSON.stringify({ ok: true, matched: 0 }));
    }
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
