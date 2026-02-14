#!/usr/bin/env node

import { Client } from "pg";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

function loadEnvFiles() {
  // Do not override already-set env vars.
  try {
    const cwd = process.cwd();
    const candidates = [
      ".env.local",
      ".env",
      ".env.development.local",
      ".env.development",
      ".env.production.local",
      ".env.production",
    ].map((f) => path.join(cwd, f));
    for (const envPath of candidates) {
      if (fs.existsSync(envPath)) dotenv.config({ path: envPath, override: false });
    }
  } catch {
    // ignore
  }
}

async function ensureConstraint(client, { schema, table, name, sql }) {
  const exists = await client.query(
    `
    select 1
    from information_schema.table_constraints
    where constraint_schema = $1
      and table_name = $2
      and constraint_name = $3
    limit 1
  `,
    [schema, table, name]
  );

  if (exists.rowCount > 0) return;
  await client.query(sql);
}

async function main() {
  loadEnvFiles();

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error("SUPABASE_DB_URL ausente (adicione em .env.local).");
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query("BEGIN");

    await client.query(`CREATE SCHEMA IF NOT EXISTS airtable`);

    // Note: user requested simple names: schema/table/field/record/cell/link/view.
    // In Postgres these are common words, so we always use quoted identifiers.

    await client.query(`
      CREATE TABLE IF NOT EXISTS airtable."schema" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id bigint NOT NULL DEFAULT 1,
        name text NOT NULL,
        description text NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS airtable_schema_tenant_id_idx ON airtable."schema" (tenant_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS airtable_schema_created_at_idx ON airtable."schema" (created_at DESC)`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS airtable_schema_tenant_name_ux ON airtable."schema" (tenant_id, lower(name))`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS airtable."table" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id bigint NOT NULL DEFAULT 1,
        schema_id uuid NOT NULL,
        name text NOT NULL,
        slug text NOT NULL,
        description text NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await ensureConstraint(client, {
      schema: "airtable",
      table: "table",
      name: "airtable_table_schema_fk",
      sql: `ALTER TABLE airtable."table" ADD CONSTRAINT airtable_table_schema_fk FOREIGN KEY (schema_id) REFERENCES airtable."schema"(id) ON DELETE CASCADE`,
    });
    await client.query(`CREATE INDEX IF NOT EXISTS airtable_table_tenant_id_idx ON airtable."table" (tenant_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS airtable_table_schema_id_idx ON airtable."table" (schema_id)`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS airtable_table_schema_slug_ux ON airtable."table" (schema_id, lower(slug))`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS airtable."field" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id bigint NOT NULL DEFAULT 1,
        schema_id uuid NOT NULL,
        table_id uuid NOT NULL,
        name text NOT NULL,
        slug text NOT NULL,
        type text NOT NULL,
        required boolean NOT NULL DEFAULT false,
        config jsonb NOT NULL DEFAULT '{}'::jsonb,
        "order" integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await ensureConstraint(client, {
      schema: "airtable",
      table: "field",
      name: "airtable_field_schema_fk",
      sql: `ALTER TABLE airtable."field" ADD CONSTRAINT airtable_field_schema_fk FOREIGN KEY (schema_id) REFERENCES airtable."schema"(id) ON DELETE CASCADE`,
    });
    await ensureConstraint(client, {
      schema: "airtable",
      table: "field",
      name: "airtable_field_table_fk",
      sql: `ALTER TABLE airtable."field" ADD CONSTRAINT airtable_field_table_fk FOREIGN KEY (table_id) REFERENCES airtable."table"(id) ON DELETE CASCADE`,
    });
    await client.query(`CREATE INDEX IF NOT EXISTS airtable_field_tenant_id_idx ON airtable."field" (tenant_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS airtable_field_table_id_idx ON airtable."field" (table_id)`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS airtable_field_table_slug_ux ON airtable."field" (table_id, lower(slug))`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS airtable."record" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id bigint NOT NULL DEFAULT 1,
        schema_id uuid NOT NULL,
        table_id uuid NOT NULL,
        title text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await ensureConstraint(client, {
      schema: "airtable",
      table: "record",
      name: "airtable_record_schema_fk",
      sql: `ALTER TABLE airtable."record" ADD CONSTRAINT airtable_record_schema_fk FOREIGN KEY (schema_id) REFERENCES airtable."schema"(id) ON DELETE CASCADE`,
    });
    await ensureConstraint(client, {
      schema: "airtable",
      table: "record",
      name: "airtable_record_table_fk",
      sql: `ALTER TABLE airtable."record" ADD CONSTRAINT airtable_record_table_fk FOREIGN KEY (table_id) REFERENCES airtable."table"(id) ON DELETE CASCADE`,
    });
    await client.query(`CREATE INDEX IF NOT EXISTS airtable_record_tenant_id_idx ON airtable."record" (tenant_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS airtable_record_table_id_created_at_idx ON airtable."record" (table_id, created_at DESC)`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS airtable."cell" (
        tenant_id bigint NOT NULL DEFAULT 1,
        schema_id uuid NOT NULL,
        table_id uuid NOT NULL,
        record_id uuid NOT NULL,
        field_id uuid NOT NULL,
        text text NULL,
        number numeric NULL,
        bool boolean NULL,
        date date NULL,
        json jsonb NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (record_id, field_id)
      )
    `);
    await ensureConstraint(client, {
      schema: "airtable",
      table: "cell",
      name: "airtable_cell_schema_fk",
      sql: `ALTER TABLE airtable."cell" ADD CONSTRAINT airtable_cell_schema_fk FOREIGN KEY (schema_id) REFERENCES airtable."schema"(id) ON DELETE CASCADE`,
    });
    await ensureConstraint(client, {
      schema: "airtable",
      table: "cell",
      name: "airtable_cell_table_fk",
      sql: `ALTER TABLE airtable."cell" ADD CONSTRAINT airtable_cell_table_fk FOREIGN KEY (table_id) REFERENCES airtable."table"(id) ON DELETE CASCADE`,
    });
    await ensureConstraint(client, {
      schema: "airtable",
      table: "cell",
      name: "airtable_cell_record_fk",
      sql: `ALTER TABLE airtable."cell" ADD CONSTRAINT airtable_cell_record_fk FOREIGN KEY (record_id) REFERENCES airtable."record"(id) ON DELETE CASCADE`,
    });
    await ensureConstraint(client, {
      schema: "airtable",
      table: "cell",
      name: "airtable_cell_field_fk",
      sql: `ALTER TABLE airtable."cell" ADD CONSTRAINT airtable_cell_field_fk FOREIGN KEY (field_id) REFERENCES airtable."field"(id) ON DELETE CASCADE`,
    });
    await client.query(`CREATE INDEX IF NOT EXISTS airtable_cell_field_id_idx ON airtable."cell" (field_id)`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS airtable."link" (
        tenant_id bigint NOT NULL DEFAULT 1,
        schema_id uuid NOT NULL,
        field_id uuid NOT NULL,
        from_record_id uuid NOT NULL,
        to_record_id uuid NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (field_id, from_record_id, to_record_id)
      )
    `);
    await ensureConstraint(client, {
      schema: "airtable",
      table: "link",
      name: "airtable_link_schema_fk",
      sql: `ALTER TABLE airtable."link" ADD CONSTRAINT airtable_link_schema_fk FOREIGN KEY (schema_id) REFERENCES airtable."schema"(id) ON DELETE CASCADE`,
    });
    await ensureConstraint(client, {
      schema: "airtable",
      table: "link",
      name: "airtable_link_field_fk",
      sql: `ALTER TABLE airtable."link" ADD CONSTRAINT airtable_link_field_fk FOREIGN KEY (field_id) REFERENCES airtable."field"(id) ON DELETE CASCADE`,
    });
    await ensureConstraint(client, {
      schema: "airtable",
      table: "link",
      name: "airtable_link_from_fk",
      sql: `ALTER TABLE airtable."link" ADD CONSTRAINT airtable_link_from_fk FOREIGN KEY (from_record_id) REFERENCES airtable."record"(id) ON DELETE CASCADE`,
    });
    await ensureConstraint(client, {
      schema: "airtable",
      table: "link",
      name: "airtable_link_to_fk",
      sql: `ALTER TABLE airtable."link" ADD CONSTRAINT airtable_link_to_fk FOREIGN KEY (to_record_id) REFERENCES airtable."record"(id) ON DELETE CASCADE`,
    });
    await client.query(`CREATE INDEX IF NOT EXISTS airtable_link_to_record_id_idx ON airtable."link" (to_record_id)`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS airtable."view" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id bigint NOT NULL DEFAULT 1,
        table_id uuid NOT NULL,
        name text NOT NULL,
        config jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await ensureConstraint(client, {
      schema: "airtable",
      table: "view",
      name: "airtable_view_table_fk",
      sql: `ALTER TABLE airtable."view" ADD CONSTRAINT airtable_view_table_fk FOREIGN KEY (table_id) REFERENCES airtable."table"(id) ON DELETE CASCADE`,
    });
    await client.query(`CREATE INDEX IF NOT EXISTS airtable_view_tenant_id_idx ON airtable."view" (tenant_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS airtable_view_table_id_idx ON airtable."view" (table_id)`);

    await client.query("COMMIT");
    console.log("Airtable migrate concluido.");
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error(e instanceof Error ? e.message : String(e));
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();

