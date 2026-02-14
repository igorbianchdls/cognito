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

const TARGET_SCHEMAS = [
  "transporte",
  "logistica",
  "armazem",
  "seguranca",
  "documentos",
  "fiscal",
  "marketing",
  // all gestao*
  "gestaoanalytics",
  "gestaocompras",
  "gestaodeprojetos",
  "gestaodocumentos",
  "gestaoestoque",
  "gestaofinanceira",
  "gestaofuncionarios",
  "gestaologistica",
  "gestaoservicos",
  "gestaovendas_b2b",
  "vendasecommerce",
  "supplychainecommerce",
];

const NEVER_DROP = new Set([
  "auth",
  "storage",
  "realtime",
  "extensions",
  "graphql",
  "graphql_public",
  "vault",
  "pgbouncer",
  "public",
]);

async function main() {
  loadEnvFiles();
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error("SUPABASE_DB_URL ausente (adicione em .env.local).");
    process.exit(1);
  }

  for (const s of TARGET_SCHEMAS) {
    if (NEVER_DROP.has(s)) {
      console.error(`Recusando: schema alvo inclui '${s}', que esta na lista NEVER_DROP.`);
      process.exit(1);
    }
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query("BEGIN");

    // Drop explicitly to match the user request; idempotent.
    for (const schema of TARGET_SCHEMAS) {
      const sql = `DROP SCHEMA IF EXISTS "${schema.replaceAll('"', '""')}" CASCADE`;
      await client.query(sql);
      console.log(`Dropped schema (if existed): ${schema}`);
    }

    await client.query("COMMIT");
    console.log("Drop schemas concluido.");
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error(e instanceof Error ? e.message : String(e));
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();

