import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { connection, root, project } from './evolution-db.mjs'
import { catalog } from './evolution-catalog.mjs'

// Private snapshot, kept under ignored .cache. No record values are printed.
const directory = new URL('.cache/database-backups/', root)
mkdirSync(directory, { recursive: true })
const ident = value => '"' + value.replaceAll('"', '""') + '"'
const tableName = table => ident(table.schema) + '.' + ident(table.relname)
const digest = data => createHash('sha256').update(JSON.stringify(data)).digest('hex')
const canonicalRows = rows => rows.map(row => JSON.stringify(row)).sort()
const remote = connection()
let filename
try {
  await remote.connect()
  await remote.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
  await remote.query("SET LOCAL timezone='UTC'; SET LOCAL datestyle='ISO,YMD'")
  const structure = await catalog(remote)
  const tables = []
  for (const table of structure.rls.filter(row => row.relkind === 'r')) {
    const columns = structure.columns.filter(row => row.table_schema === table.schema && row.table_name === table.relname).map(row => row.column_name)
    const rows = (await remote.query(`SELECT ${columns.map(column => `${ident(column)}::text AS ${ident(column)}`).join(',')} FROM ${tableName(table)}`)).rows
    tables.push({ schema: table.schema, name: table.relname, columns, rows, digest: digest(canonicalRows(rows)) })
  }
  const referencedAuthUsers = (await remote.query('SELECT id::text FROM auth.users WHERE id IN (SELECT auth_user_id FROM shared.usuarios WHERE auth_user_id IS NOT NULL)')).rows
  const sequences = []
  const sequenceMetadata = (await remote.query("SELECT schemaname,sequencename,start_value::text,increment_by::text,min_value::text,max_value::text,cache_size::text,cycle FROM pg_sequences WHERE schemaname IN ('erp','shared','plugin') ORDER BY schemaname,sequencename")).rows
  for (const sequence of sequenceMetadata) {
    const state = (await remote.query(`SELECT last_value::text,is_called FROM ${ident(sequence.schemaname)}.${ident(sequence.sequencename)}`)).rows[0]
    sequences.push({ ...sequence, ...state })
  }
  await remote.query('ROLLBACK')
  const snapshot = { format: 'erp-shared-text-v2', createdAt: new Date().toISOString(), project, structure, referencedAuthUsers, tables, sequences }
  filename = `erp-shared-${snapshot.createdAt.replaceAll(':', '-')}.json`
  const bytes = JSON.stringify(snapshot)
  writeFileSync(new URL(filename, directory), bytes, { flag: 'wx' })
  assert.equal(readFileSync(new URL(filename, directory), 'utf8'), bytes)
  // Read the saved artifact to prove restoration, rather than reusing in-memory records.
  const saved = JSON.parse(readFileSync(new URL(filename, directory), 'utf8'))
  const { db, restoreCatalog } = await import('./evolution-fixture.mjs')
  try {
    await restoreCatalog(saved.structure)
    await db.exec("SET timezone='UTC'; SET datestyle='ISO,YMD'; SET session_replication_role='replica'; BEGIN")
    for (const user of saved.referencedAuthUsers) await db.query('INSERT INTO auth.users(id) VALUES($1)', [user.id])
    for (const table of saved.tables) {
      const placeholders = table.columns.map((column, index) => {
        const meta = saved.structure.columns.find(item => item.table_schema === table.schema && item.table_name === table.name && item.column_name === column)
        const type = meta.data_type === 'ARRAY' ? meta.udt_name.slice(1) + '[]' : meta.data_type
        return '$' + (index + 1) + '::text::' + type
      })
      for (const row of table.rows) await db.query(`INSERT INTO ${ident(table.schema)}.${ident(table.name)} (${table.columns.map(ident).join(',')}) OVERRIDING SYSTEM VALUE VALUES (${placeholders.join(',')})`, table.columns.map(column => row[column]))
    }
    await db.exec('COMMIT; SET session_replication_role=origin')
    for (const sequence of saved.sequences) {
      const target = `${ident(sequence.schemaname)}.${ident(sequence.sequencename)}`
      for (const field of ['start_value','increment_by','min_value','max_value','cache_size','last_value']) assert(/^-?\d+$/.test(sequence[field]), 'Invalid sequence value')
      await db.exec(`ALTER SEQUENCE ${target} INCREMENT BY ${sequence.increment_by} MINVALUE ${sequence.min_value} MAXVALUE ${sequence.max_value} START WITH ${sequence.start_value} CACHE ${sequence.cache_size} ${sequence.cycle ? 'CYCLE' : 'NO CYCLE'}`)
      await db.query('SELECT setval($1::regclass,$2::bigint,$3::boolean)', [target, sequence.last_value, sequence.is_called])
      const state = (await db.query(`SELECT last_value::text,is_called FROM ${target}`)).rows[0]
      assert.equal(state.last_value, sequence.last_value)
      assert.equal(state.is_called, sequence.is_called)
      const next = (await db.query('SELECT nextval($1::regclass)::text AS value', [target])).rows[0].value
      const expected = BigInt(sequence.last_value) + (sequence.is_called ? BigInt(sequence.increment_by) : 0n)
      assert.equal(next, expected.toString(), 'Restored sequence must generate the next original identifier')
    }
    // Force each FK to scan the restored rows, including references between schemas.
    for (const constraint of saved.structure.constraints.filter(row => row.type === 'f')) {
      const target = `${ident(constraint.schema)}.${ident(constraint.table_name)}`
      await db.exec(`ALTER TABLE ${target} DROP CONSTRAINT ${ident(constraint.name)}; ALTER TABLE ${target} ADD CONSTRAINT ${ident(constraint.name)} ${constraint.definition}`)
    }
    for (const table of saved.tables) {
      const rows = (await db.query(`SELECT ${table.columns.map(column => `${ident(column)}::text AS ${ident(column)}`).join(',')} FROM ${ident(table.schema)}.${ident(table.name)}`)).rows
      assert.equal(digest(canonicalRows(rows)), table.digest, `Restore mismatch: ${table.schema}.${table.name}`)
    }
    const proof = { status: 'passed', createdAt: new Date().toISOString(), project, backup: filename, digest: createHash('sha256').update(bytes).digest('hex'), tables: tables.length, rows: tables.reduce((sum, table) => sum + table.rows.length, 0), foreignKeys: saved.structure.constraints.filter(row => row.type === 'f').length, sequences: saved.sequences.length, nextIdentifiersVerified: true, isolatedRestore: true, sourceDataChanges: 0, scope: 'ERP and shared only; excludes plugin, auth, Storage and full-platform configuration' }
    writeFileSync(new URL('restore-proof.json', directory), JSON.stringify(proof, null, 2))
    console.log(JSON.stringify(proof))
  } finally { await db.close() }
} catch (error) {
  await remote.query('ROLLBACK').catch(() => undefined)
  console.error(JSON.stringify({ status: 'failed', backupSaved: Boolean(filename), code: error.code, message: String(error.message).slice(0, 300) }))
  process.exitCode = 1
} finally { await remote.end() }
