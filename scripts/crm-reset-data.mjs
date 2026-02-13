#!/usr/bin/env node

import { Client } from "pg";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

function loadEnvFiles() {
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

function quoteIdent(ident) {
  // Minimal quoting for PostgreSQL identifiers.
  return `"${String(ident).replaceAll('"', '""')}"`;
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
    const tablesRes = await client.query(
      `
      select table_name
      from information_schema.tables
      where table_schema = 'crm'
        and table_type = 'BASE TABLE'
      order by table_name
    `
    );

    const tables = tablesRes.rows.map((r) => r.table_name).filter(Boolean);
    if (!tables.length) {
      console.log("Nenhuma tabela encontrada no schema crm.");
      return;
    }

    const qualified = tables.map((t) => `crm.${quoteIdent(t)}`).join(", ");
    const sql = `TRUNCATE TABLE ${qualified} RESTART IDENTITY CASCADE`;

    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");

    console.log(`CRM reset OK. Tabelas truncadas: ${tables.length}`);
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore
    }
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();

