#!/usr/bin/env node

import { Client } from "pg";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

// Load env files if present (do not override existing env vars).
// This keeps usage short: `node scripts/supabase-crm-get.mjs --sql "SELECT ..."`
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

const sql = (getArg("--sql") || "").trim();
const dbUrlArg = (getArg("--db-url") || "").trim();
const retries = Math.max(1, Number(getArg("--retries") || 8));
const dbUrl = process.env.SUPABASE_DB_URL;

const effectiveDbUrl = dbUrlArg || dbUrl;

if (!dbUrl) {
  console.error("SUPABASE_DB_URL ausente (adicione em .env.local ou passe --db-url).");
  process.exit(1);
}

if (!sql) {
  console.error("Informe --sql \"SELECT ...\".");
  process.exit(1);
}

const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();
if (!normalized.startsWith("select ")) {
  console.error("Apenas SELECT é permitido.");
  process.exit(1);
}

if (normalized.includes(";")) {
  console.error("Não use ';' na query.");
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let lastError = null;
for (let attempt = 1; attempt <= retries; attempt += 1) {
  const client = new Client({
    connectionString: effectiveDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query(sql);
    process.stdout.write(`${JSON.stringify(result.rows, null, 2)}\n`);
    process.exit(0);
  } catch (error) {
    lastError = error;
    const msg = error instanceof Error ? error.message : String(error);
    const isDns = /EAI_AGAIN|getaddrinfo/i.test(msg);
    if (!isDns || attempt >= retries) break;
    await sleep(300 * attempt);
  } finally {
    await client.end().catch(() => {});
  }
}

console.error(lastError instanceof Error ? lastError.message : String(lastError));
process.exit(1);
