#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { Client } from 'pg'
import dotenv from 'dotenv'

function loadEnvFiles() {
  const cwd = process.cwd()
  const files = [
    '.env.local',
    '.env',
    '.env.development.local',
    '.env.development',
    '.env.production.local',
    '.env.production',
  ]
  for (const file of files) {
    const p = path.join(cwd, file)
    if (fs.existsSync(p)) dotenv.config({ path: p, override: false })
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function escapeXml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function normalize(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function padId(id) {
  return String(id).padStart(4, '0')
}

function buildInitials(name) {
  const stop = new Set(['ltda', 'me', 'eireli', 'sa', 's', 'a', 'da', 'de', 'do', 'dos', 'das'])
  const words = String(name || '')
    .replace(/[^A-Za-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !stop.has(normalize(w)))

  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return 'SM'
}

function classifyCliente(nome) {
  const n = normalize(nome)
  if (/(tecnologia|cloud|data|digital|software|internet|telecom)/.test(n)) return 'tech'
  if (/(engenharia|industrial|manutencao|predial|facilities|operacoes)/.test(n)) return 'ops'
  if (/(seguranca|security)/.test(n)) return 'security'
  if (/(consultoria|advisory|bpo)/.test(n)) return 'consulting'
  if (/(servicos|servico)/.test(n)) return 'services'
  return 'business'
}

function classifyFornecedor(nome) {
  const n = normalize(nome)
  if (/(asaas|pagamento|bank|banco|pix|finance)/.test(n)) return 'finance'
  if (/(google|meta|hostinger|cloud|nordlink|telecom|nuvem|databridge|fastdesk|internet)/.test(n)) return 'tech'
  if (/(correios|logistica|distribuidora|transport)/.test(n)) return 'logistics'
  if (/(juridico|contabil|advisory|bpo)/.test(n)) return 'consulting'
  if (/(limpeza|manutencenter|facilities|operacional)/.test(n)) return 'ops'
  return 'business'
}

const PALETTES = {
  tech: { a: '#0f172a', b: '#1d4ed8', accent: '#38bdf8' },
  ops: { a: '#14532d', b: '#0f766e', accent: '#34d399' },
  security: { a: '#7f1d1d', b: '#b91c1c', accent: '#fca5a5' },
  consulting: { a: '#4c1d95', b: '#7c3aed', accent: '#c4b5fd' },
  services: { a: '#9a3412', b: '#ea580c', accent: '#fdba74' },
  business: { a: '#374151', b: '#111827', accent: '#9ca3af' },
  finance: { a: '#064e3b', b: '#059669', accent: '#6ee7b7' },
  logistics: { a: '#1e3a8a', b: '#2563eb', accent: '#93c5fd' },
}

function symbolPath(segment) {
  switch (segment) {
    case 'tech':
      return '<path d="M86 98h84v12H86zM104 86h48v12h-48zM104 122h48v12h-48z" fill="white" opacity="0.96"/>'
    case 'ops':
      return '<circle cx="128" cy="110" r="20" fill="white"/><path d="M128 74l9 12h15l-4 14 10 10-13 6-3 15-14-4-14 4-3-15-13-6 10-10-4-14h15z" fill="white" opacity="0.32"/>'
    case 'security':
      return '<path d="M128 74l36 14v26c0 24-16 41-36 50-20-9-36-26-36-50V88z" fill="white" opacity="0.96"/>'
    case 'consulting':
      return '<path d="M90 94h76v44H90z" fill="white"/><path d="M112 84h32v10h-32z" fill="white" opacity="0.78"/>'
    case 'services':
      return '<path d="M96 94h64v12H96zM96 114h64v12H96zM96 134h48v12H96z" fill="white" opacity="0.96"/>'
    case 'finance':
      return '<path d="M90 142h20v-24H90zM118 142h20V98h-20zM146 142h20V84h-20z" fill="white" opacity="0.96"/>'
    case 'logistics':
      return '<path d="M86 102h56v30H86zM142 110h18l10 10v12h-28z" fill="white" opacity="0.96"/><circle cx="106" cy="138" r="8" fill="white"/><circle cx="152" cy="138" r="8" fill="white"/>'
    default:
      return '<circle cx="128" cy="112" r="28" fill="white" opacity="0.96"/>'
  }
}

function makeSvg({ name, segment, initials }) {
  const palette = PALETTES[segment] || PALETTES.business
  const safeName = escapeXml(name)
  const safeInitials = escapeXml(initials)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" role="img" aria-label="${safeName}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.a}"/>
      <stop offset="100%" stop-color="${palette.b}"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="42" fill="url(#bg)"/>
  <circle cx="128" cy="110" r="54" fill="${palette.accent}" opacity="0.16"/>
  ${symbolPath(segment)}
  <text x="128" y="206" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" font-size="44" font-weight="700" fill="white" letter-spacing="2">${safeInitials}</text>
</svg>`
}

async function main() {
  loadEnvFiles()
  const dbUrl = process.env.SUPABASE_DB_URL
  if (!dbUrl) {
    console.error('SUPABASE_DB_URL ausente.')
    process.exit(1)
  }

  const cwd = process.cwd()
  const clientesDir = path.join(cwd, 'public', 'logos', 'entities', 'clientes')
  const fornecedoresDir = path.join(cwd, 'public', 'logos', 'entities', 'fornecedores')
  ensureDir(clientesDir)
  ensureDir(fornecedoresDir)

  let client = null
  let lastError = null
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const c = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    })
    try {
      await c.connect()
      client = c
      break
    } catch (error) {
      lastError = error
      await c.end().catch(() => {})
      const msg = error instanceof Error ? error.message : String(error)
      const transientDns = /EAI_AGAIN|getaddrinfo/i.test(msg)
      if (!transientDns || attempt === 6) break
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt))
    }
  }
  if (!client) throw lastError || new Error('Falha ao conectar no banco.')
  try {
    const clientesRes = await client.query(
      `SELECT id, nome_fantasia
         FROM entidades.clientes
        WHERE tenant_id = 1
        ORDER BY id ASC`
    )
    const fornecedoresRes = await client.query(
      `SELECT id, nome_fantasia
         FROM entidades.fornecedores
        ORDER BY id ASC`
    )

    await client.query('BEGIN')

    for (const row of clientesRes.rows) {
      const id = Number(row.id)
      const nome = String(row.nome_fantasia || `Cliente ${id}`)
      const initials = buildInitials(nome)
      const segment = classifyCliente(nome)
      const filename = `cli-${padId(id)}.svg`
      const relPath = `/logos/entities/clientes/${filename}`
      const absPath = path.join(clientesDir, filename)
      const svg = makeSvg({ name: nome, segment, initials })
      fs.writeFileSync(absPath, svg, 'utf8')
      await client.query(
        `UPDATE entidades.clientes
            SET imagem_url = $1,
                atualizado_em = now()
          WHERE id = $2
            AND tenant_id = 1`,
        [relPath, id]
      )
    }

    for (const row of fornecedoresRes.rows) {
      const id = Number(row.id)
      const nome = String(row.nome_fantasia || `Fornecedor ${id}`)
      const initials = buildInitials(nome)
      const segment = classifyFornecedor(nome)
      const filename = `for-${padId(id)}.svg`
      const relPath = `/logos/entities/fornecedores/${filename}`
      const absPath = path.join(fornecedoresDir, filename)
      const svg = makeSvg({ name: nome, segment, initials })
      fs.writeFileSync(absPath, svg, 'utf8')
      await client.query(
        `UPDATE entidades.fornecedores
            SET imagem_url = $1
          WHERE id = $2`,
        [relPath, id]
      )
    }

    await client.query('COMMIT')

    process.stdout.write(
      JSON.stringify(
        {
          ok: true,
          clientes: clientesRes.rowCount || 0,
          fornecedores: fornecedoresRes.rowCount || 0,
          clientesDir,
          fornecedoresDir,
        },
        null,
        2
      ) + '\n'
    )
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    await client.end().catch(() => {})
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error))
  process.exit(1)
})
