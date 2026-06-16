#!/usr/bin/env node

import { Client } from 'pg'
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'

function getArg(name) {
  const idx = process.argv.indexOf(name)
  return idx === -1 ? null : process.argv[idx + 1] ?? null
}

function hasFlag(name) {
  return process.argv.includes(name)
}

function loadEnvFiles() {
  const cwd = process.cwd()
  for (const file of ['.env.local', '.env', '.env.development.local', '.env.development', '.env.production.local', '.env.production']) {
    const envPath = path.join(cwd, file)
    if (fs.existsSync(envPath)) dotenv.config({ path: envPath, override: false })
  }
}

function normalizeDatasetId(value, label = 'dataset') {
  const normalized = String(value || '').trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '')
  if (!/^[a-z_][a-z0-9_]{0,1023}$/.test(normalized)) {
    throw new Error(`${label} BigQuery invalido: ${value}`)
  }
  return normalized
}

function getTenantDatasets(tenantId) {
  const id = Number(tenantId)
  if (!Number.isInteger(id) || id <= 0) throw new Error(`tenantId invalido: ${tenantId}`)
  return {
    rawDataset: normalizeDatasetId(`org_${id}_raw`, 'rawDataset'),
    normalizedDataset: normalizeDatasetId(`org_${id}_normalized`, 'normalizedDataset'),
  }
}

function destinationConfig(tenantId, projectId) {
  const datasets = getTenantDatasets(tenantId)
  return {
    projectId,
    datasetMode: 'per_tenant',
    dataset: datasets.rawDataset,
    rawDataset: datasets.rawDataset,
    normalizedDataset: datasets.normalizedDataset,
  }
}

function provisioningMetadata(status, extra = {}) {
  return {
    bigQueryProvisioning: {
      status,
      updatedAt: new Date().toISOString(),
      ...extra,
    },
  }
}

async function getAccessToken() {
  const explicit = process.env.GOOGLE_OAUTH_ACCESS_TOKEN?.trim()
  if (explicit) return explicit

  const response = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
    headers: { 'Metadata-Flavor': 'Google' },
    signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) throw new Error(`Falha ao obter token GCP: ${response.status}`)

  const payload = await response.json()
  if (!payload.access_token) throw new Error('Metadata server nao retornou access_token')
  return payload.access_token
}

async function gcpJson(url, init = {}) {
  const token = await getAccessToken()
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    signal: init.signal || AbortSignal.timeout(Number(process.env.GCP_HTTP_TIMEOUT_MS || 30000)),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok && !(init.allowNotFound && response.status === 404)) {
    throw new Error(payload?.error?.message || `Falha na chamada GCP: ${response.status}`)
  }
  return { ok: response.ok, status: response.status, payload }
}

async function ensureDataset(projectId, tenantId, dataset) {
  const datasetId = normalizeDatasetId(dataset)
  const existing = await gcpJson(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${datasetId}`,
    { method: 'GET', allowNotFound: true },
  )
  if (existing.ok) return

  await gcpJson(`https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets`, {
    method: 'POST',
    body: JSON.stringify({
      datasetReference: {
        projectId,
        datasetId,
      },
      location: process.env.BIGQUERY_LOCATION || process.env.GCP_BIGQUERY_LOCATION || 'US',
      labels: {
        managed_by: 'integracoes',
        dataset_mode: 'per_tenant',
        tenant_id: String(tenantId),
      },
    }),
  })
}

async function ensureDefaultDestination(client, tenantId, projectId, reason) {
  const config = destinationConfig(tenantId, projectId)
  await client.query('BEGIN')
  try {
    const existing = await client.query(
      `SELECT *
       FROM integrations.destinations
       WHERE tenant_id = $1
         AND type = 'bigquery'
         AND (metadata->>'isDefault') = 'true'
       ORDER BY id ASC
       LIMIT 1`,
      [tenantId],
    )
    const metadata = {
      isDefault: true,
      datasetMode: 'per_tenant',
      datasetModeMigratedAt: new Date().toISOString(),
      ...provisioningMetadata('pending', { reason }),
    }
    let destination

    if (existing.rows[0]) {
      const updated = await client.query(
        `UPDATE integrations.destinations
         SET status = CASE WHEN status = 'disabled' THEN status ELSE 'active' END,
             config = $3::jsonb,
             metadata = COALESCE(metadata, '{}'::jsonb) || $4::jsonb,
             updated_at = now()
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [existing.rows[0].id, tenantId, JSON.stringify(config), JSON.stringify(metadata)],
      )
      destination = updated.rows[0]
    } else {
      const inserted = await client.query(
        `INSERT INTO integrations.destinations
          (tenant_id, type, name, status, config, metadata, updated_at)
         VALUES
          ($1, 'bigquery', 'BigQuery padrao', 'active', $2::jsonb, $3::jsonb, now())
         RETURNING *`,
        [tenantId, JSON.stringify(config), JSON.stringify({ createdBy: 'provision_script', ...metadata })],
      )
      destination = inserted.rows[0]
    }

    await client.query('COMMIT')
    return { destination, config }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  }
}

async function markProvisioning(client, tenantId, destinationId, status, metadata) {
  const payload = provisioningMetadata(status, metadata)
  await client.query('BEGIN')
  try {
    if (destinationId) {
      await client.query(
        `UPDATE integrations.destinations
         SET metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb,
             updated_at = now()
         WHERE id = $1 AND tenant_id = $2`,
        [destinationId, tenantId, JSON.stringify(payload)],
      )
    }
    await client.query(
      `UPDATE shared.tenants
       SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
           updated_at = now()
       WHERE id = $1`,
      [tenantId, JSON.stringify(payload)],
    )
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  }
}

async function listTenantIds(client, tenantArg, all) {
  if (tenantArg) return [Number(tenantArg)]
  if (!all) throw new Error('Use --tenant <id> ou --all')
  const result = await client.query(
    `SELECT id
     FROM shared.tenants
     WHERE status = 'active'
     ORDER BY id`,
  )
  return result.rows.map((row) => Number(row.id))
}

loadEnvFiles()

const dbUrl = process.env.SUPABASE_DB_URL
if (!dbUrl) {
  console.error('SUPABASE_DB_URL ausente.')
  process.exit(1)
}

const projectId = process.env.GCP_PROJECT_ID || 'creatto-463117'
const tenantArg = getArg('--tenant')
const all = hasFlag('--all')
const dryRun = hasFlag('--dry-run')
const reason = getArg('--reason') || 'manual_backfill'

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  const tenantIds = await listTenantIds(client, tenantArg, all)
  const results = []

  for (const tenantId of tenantIds) {
    const datasets = getTenantDatasets(tenantId)
    if (dryRun) {
      results.push({ tenantId, projectId, ...datasets, dryRun: true })
      continue
    }

    const { destination, config } = await ensureDefaultDestination(client, tenantId, projectId, reason)
    try {
      await ensureDataset(projectId, tenantId, config.rawDataset)
      await ensureDataset(projectId, tenantId, config.normalizedDataset)
      await markProvisioning(client, tenantId, destination.id, 'succeeded', {
        projectId,
        rawDataset: config.rawDataset,
        normalizedDataset: config.normalizedDataset,
        reason,
      })
      results.push({ ok: true, tenantId, destinationId: String(destination.id), projectId, ...datasets })
    } catch (error) {
      await markProvisioning(client, tenantId, destination.id, 'failed', {
        projectId,
        reason,
        error: (error instanceof Error ? error.message : String(error)).slice(0, 1000),
      }).catch(() => {})
      results.push({
        ok: false,
        tenantId,
        destinationId: String(destination.id),
        projectId,
        ...datasets,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  process.stdout.write(`${JSON.stringify({ ok: true, results }, null, 2)}\n`)
} catch (error) {
  console.error(error instanceof Error ? error.stack || error.message : String(error))
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
