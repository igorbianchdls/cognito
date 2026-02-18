#!/usr/bin/env node

import { Client } from 'pg'
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'

function getArg(name) {
  const idx = process.argv.indexOf(name)
  if (idx === -1) return null
  return process.argv[idx + 1] ?? null
}

function hasFlag(name) {
  return process.argv.includes(name)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function loadEnvFiles() {
  try {
    const cwd = process.cwd()
    const candidates = [
      '.env.local',
      '.env',
      '.env.development.local',
      '.env.development',
      '.env.production.local',
      '.env.production',
    ].map((f) => path.join(cwd, f))

    for (const envPath of candidates) {
      if (fs.existsSync(envPath)) dotenv.config({ path: envPath, override: false })
    }
  } catch {
    // ignore
  }
}

loadEnvFiles()

const sqlArg = (getArg('--sql') || '').trim()
const fileArg = (getArg('--file') || '').trim()
const dbUrlArg = (getArg('--db-url') || '').trim()
const retries = Math.max(1, Number(getArg('--retries') || 8))
const tx = hasFlag('--tx')
const quiet = hasFlag('--quiet')

const dbUrl = dbUrlArg || process.env.SUPABASE_DB_URL
if (!dbUrl) {
  console.error('SUPABASE_DB_URL ausente (adicione em .env.local ou passe --db-url).')
  process.exit(1)
}

let sql = sqlArg
if (!sql && fileArg) {
  const p = path.isAbsolute(fileArg) ? fileArg : path.join(process.cwd(), fileArg)
  if (!fs.existsSync(p)) {
    console.error(`Arquivo SQL não encontrado: ${fileArg}`)
    process.exit(1)
  }
  sql = fs.readFileSync(p, 'utf8')
}

sql = String(sql || '').trim()
if (!sql) {
  console.error('Informe --sql "..." ou --file caminho.sql')
  process.exit(1)
}

async function runOnce(connectionString, statement) {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  try {
    if (tx) {
      await client.query('BEGIN')
      try {
        const result = await client.query(statement)
        await client.query('COMMIT')
        return result
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {})
        throw error
      }
    }

    return await client.query(statement)
  } finally {
    await client.end().catch(() => {})
  }
}

let lastError = null
for (let attempt = 1; attempt <= retries; attempt += 1) {
  try {
    const result = await runOnce(dbUrl, sql)
    const payload = {
      ok: true,
      attempt,
      command: result.command || null,
      rowCount: Number(result.rowCount || 0),
      rows: Array.isArray(result.rows) ? result.rows : [],
    }
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`)
    process.exit(0)
  } catch (error) {
    lastError = error
    const message = error instanceof Error ? error.message : String(error)
    const isDns = /EAI_AGAIN|getaddrinfo/i.test(message)
    if (!quiet) {
      console.error(`[attempt ${attempt}/${retries}] ${message}`)
    }
    if (!isDns || attempt >= retries) break
    await sleep(350 * attempt)
  }
}

console.error(lastError instanceof Error ? lastError.stack || lastError.message : String(lastError))
process.exit(1)
