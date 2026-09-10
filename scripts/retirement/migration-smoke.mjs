import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { PGlite } from '../../.next/cache/retirement-pg/node_modules/@electric-sql/pglite/dist/index.js'
import { retiredRelations } from './targets.mjs'
import { inspectRetirementCatalog } from './catalog.mjs'

const migration = readFileSync('scripts/retirement/sql/retire-integrations.sql', 'utf8')
const db = new PGlite()
const relationExists = async name => Boolean((await db.query('SELECT to_regclass($1) AS relation', [name])).rows[0].relation)
try {
  await db.exec(migration)
  await db.exec(`CREATE SCHEMA plugin; CREATE SCHEMA shared; CREATE SCHEMA erp;
    CREATE TABLE shared.keep_me(id int); INSERT INTO shared.keep_me VALUES(7);
    CREATE TABLE erp.keep_me(id int); INSERT INTO erp.keep_me VALUES(8);
    CREATE TABLE plugin.alerts(id int); INSERT INTO plugin.alerts VALUES(9);`)
  // Connector DDL from the original migration; exclude the unrelated ecommerce seed.
  await db.exec(readFileSync('scripts/sql/21_plugin_connectors.sql', 'utf8').split('WITH ecommerce_source AS')[0])
  const selected = readdirSync('scripts/sql').filter(file => /^(2[7-9]|3[0-9]|40|42|44|47|49|51)_/.test(file) || file === '48_integracoes_plugin_action_audit_ecommerce_domain.sql').sort()
  for (const file of selected) {
    try { await db.exec(readFileSync('scripts/sql/' + file, 'utf8')) }
    catch(error) { throw new Error(`Historical migration ${file}: ${error.message}`) }
  }
  await db.exec('CREATE TABLE integrations.keep_me(id int); INSERT INTO integrations.keep_me VALUES(10)')
  const inventory = await inspectRetirementCatalog(db)
  assert(inventory.relations.some(r => r.retirement_target))
  assert(inventory.foreignKeys.length > 0)
  assert(inventory.relations.some(r => r.name === 'keep_me' && !r.retirement_target))
  await assert.rejects(db.exec(migration), /prerequisites not confirmed/)
  await db.exec('ROLLBACK')
  assert(await relationExists('integrations.connections'))
  await db.exec("SET app.integrations_retirement_ready = 'true'")
  await db.exec('CREATE VIEW erp.external_dependency AS SELECT id FROM integrations.connections')
  await assert.rejects(db.exec(migration), /depend/)
  await db.exec('ROLLBACK')
  assert(await relationExists('mcp_app.integration_connections'), 'Earlier view drops must roll back')
  assert(await relationExists('erp.external_dependency'))
  await db.exec('DROP VIEW erp.external_dependency')
  await db.exec('CREATE TABLE erp.external_fk(id bigint REFERENCES integrations.connections(id))')
  await assert.rejects(db.exec(migration), /depend/)
  await db.exec('ROLLBACK')
  assert(await relationExists('mcp_app.integration_connections'))
  await db.exec('DROP TABLE erp.external_fk')
  await db.exec(migration)
  for (const name of retiredRelations) assert(!await relationExists(name), `${name} remains`)
  for (const name of ['shared.keep_me','erp.keep_me','plugin.alerts','mcp_app.alerts','integrations.keep_me']) {
    assert.equal((await db.query(`SELECT count(*)::int AS n FROM ${name}`)).rows[0].n, 1, `${name} was modified`)
  }
  await db.exec("SET app.integrations_retirement_ready = 'false'")
  await db.exec(migration)
  // An unlisted partition must never disappear as an automatic dependency.
  await db.exec('CREATE TABLE integrations.connections(id int) PARTITION BY RANGE(id); CREATE TABLE erp.partition_keep PARTITION OF integrations.connections FOR VALUES FROM (0) TO (10)')
  await db.exec("SET app.integrations_retirement_ready = 'true'")
  await assert.rejects(db.exec(migration), /Unlisted inherited table or partition/)
  await db.exec('ROLLBACK')
  assert(await relationExists('erp.partition_keep'))
  console.log(`PostgreSQL isolado: ${selected.length} migracoes historicas; retirada, catalogo, repeticao, precondicoes, rollback por view/FK e protecao de particao aprovados.`)
} finally { await db.close() }
