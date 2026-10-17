import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import dotenv from 'dotenv'
import { connection, project } from '../erp/evolution-db.mjs'

// Removes old orphan uploads only; all files referenced by any retained version
// remain stored, including archived/deleted apps. Run with --apply to remove.
const env = dotenv.parse(readFileSync('.env.local')), key = env.APPS_SUPABASE_SERVICE_ROLE_KEY ?? env.ERP_FISCAL_SUPABASE_SERVICE_ROLE_KEY ?? env.TABLES_SUPABASE_SERVICE_ROLE_KEY, db = connection(), apply = process.argv.includes('--apply')
assert(key)
if (key.startsWith('eyJ')) { const c = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()); assert.equal(c.ref, project); assert.equal(c.role, 'service_role') }
try {
 await db.connect()
 const rows = (await db.query("SELECT o.name FROM storage.objects o WHERE o.bucket_id='apps-files' AND o.created_at < now()-interval '24 hours' AND NOT EXISTS(SELECT 1 FROM apps.arquivos a WHERE a.caminho_storage=o.name) ORDER BY o.created_at LIMIT 100")).rows
 for (const row of rows) {
  assert(/^\d+\/[a-f0-9-]{36}\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.json$/.test(row.name))
  if (apply) { const r = await fetch(`https://${project}.supabase.co/storage/v1/object/apps-files`, { method: 'DELETE', headers: { 'content-type': 'application/json', apikey: key, Authorization: 'Bearer ' + key }, body: JSON.stringify({ prefixes: [row.name] }), signal: AbortSignal.timeout(15000) }); assert(r.ok) }
 }
 console.log(JSON.stringify({ status: 'passed', mode: apply ? 'cleanup' : 'dry_run', candidates: rows.length, preservedReferences: true }))
} finally { await db.end() }
