#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { Client } from "pg";

function getArg(name) {
  const i = process.argv.indexOf(name);
  if (i === -1) return null;
  return process.argv[i + 1] ?? null;
}

function loadEnv() {
  const cwd = process.cwd();
  const files = [
    ".env.local",
    ".env",
    ".env.development.local",
    ".env.development",
    ".env.production.local",
    ".env.production",
  ];
  for (const f of files) {
    const p = path.join(cwd, f);
    if (fs.existsSync(p)) dotenv.config({ path: p, override: false });
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runOnce(connectionString, sql) {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
    query_timeout: 120000,
    statement_timeout: 120000,
  });

  await client.connect();
  try {
    return await client.query(sql);
  } finally {
    await client.end().catch(() => {});
  }
}

async function main() {
  loadEnv();

  const fileArg = (getArg("--file") || "").trim();
  const sqlArg = (getArg("--sql") || "").trim();
  const retries = Math.max(1, Number(getArg("--retries") || 10));
  const dbUrl = (getArg("--db-url") || process.env.SUPABASE_DB_URL || "").trim();

  if (!dbUrl) {
    console.log("ERR SUPABASE_DB_URL ausente");
    process.exit(1);
  }

  let sql = sqlArg;
  if (!sql && fileArg) {
    const p = path.isAbsolute(fileArg) ? fileArg : path.join(process.cwd(), fileArg);
    if (!fs.existsSync(p)) {
      console.log(`ERR arquivo SQL nao encontrado: ${fileArg}`);
      process.exit(1);
    }
    sql = fs.readFileSync(p, "utf8");
  }

  if (!sql.trim()) {
    console.log("ERR informe --file ou --sql");
    process.exit(1);
  }

  let lastErr = null;
  for (let i = 1; i <= retries; i += 1) {
    try {
      console.log(`attempt=${i} status=connecting`);
      const res = await runOnce(dbUrl, sql);
      console.log(JSON.stringify({
        ok: true,
        attempt: i,
        command: res.command || null,
        rowCount: Number(res.rowCount || 0),
      }, null, 2));
      process.exit(0);
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`attempt=${i} status=error message=${msg}`);
      await sleep(400 * i);
    }
  }

  const finalMsg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  console.log(`ERR ${finalMsg}`);
  process.exit(1);
}

await main();

