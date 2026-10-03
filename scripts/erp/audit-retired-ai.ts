import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import { config } from 'dotenv'
import { Client } from 'pg'

import { buildPostgresPoolConfig } from '../../src/lib/postgres'

config({ path: '.env.local', quiet: true })

type AuditClient = {
  connect(): Promise<void>
  query<Row = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: Row[] }>
  end(): Promise<void>
}

const names = ['ai_action_approvals', 'ai_tool_executions', 'ai_connections']
const qualified = names.map((name) => `shared.${name}`)
const output = 'docs/retirada-ai-platform/inventario-banco.md'
const lines = [
  '# Inventario da base de IA retirada',
  '',
  `Consulta executada em ${new Date().toISOString()}.`,
  '',
  'A consulta usa uma transacao somente de leitura e registra apenas contagens e metadados. Nenhuma migracao e aplicada por este comando.',
  '',
]

async function main() {
  let client: AuditClient | undefined
  let phase = 'configuracao'
  try {
    if (!process.env.SUPABASE_DB_URL) throw Object.assign(new Error(), { code: 'DATABASE_URL_MISSING' })
    client = new Client({
      ...buildPostgresPoolConfig(process.env.SUPABASE_DB_URL),
      connectionTimeoutMillis: 15000,
    }) as AuditClient
    phase = 'conexao'
    await client.connect()
    phase = 'consulta'
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
    await client.query("SET LOCAL statement_timeout = '15s'")
    await client.query('SET LOCAL row_security = off')

    lines.push('| Tabela | Existe | Registros | RLS |', '| --- | --- | ---: | --- |')
    for (const name of names) {
      const relation = await client.query<{ exists: boolean; rls: boolean | null }>(
        `SELECT to_regclass($1) IS NOT NULL AS exists,
           (SELECT relrowsecurity FROM pg_class WHERE oid = to_regclass($1)) AS rls`,
        [`shared.${name}`],
      )
      const state = relation.rows[0]
      // Os identificadores vem da lista fixa acima; nenhum nome e recebido do usuario.
      const count = state.exists
        ? (await client.query<{ count: string }>(`SELECT count(*)::text FROM shared.${name}`)).rows[0].count
        : '0'
      lines.push(`| shared.${name} | ${state.exists ? 'Sim' : 'Nao'} | ${count} | ${state.rls ? 'Sim' : 'Nao'} |`)
    }

    const foreignKeys = await client.query<{ source: string; constraint_name: string; target: string }>(
      `SELECT conrelid::regclass::text AS source, conname AS constraint_name,
         confrelid::regclass::text AS target
       FROM pg_constraint
       WHERE contype = 'f'
         AND confrelid = ANY (SELECT to_regclass(name) FROM unnest($1::text[]) AS name)
         AND conrelid <> ALL (SELECT to_regclass(name) FROM unnest($1::text[]) AS name WHERE to_regclass(name) IS NOT NULL)
       ORDER BY source, constraint_name`,
      [qualified],
    )
    const views = await client.query<{ name: string }>(
      `SELECT DISTINCT ns.nspname || '.' || view.relname AS name
       FROM pg_depend AS dependency
       JOIN pg_rewrite AS rewrite ON dependency.classid = 'pg_rewrite'::regclass AND dependency.objid = rewrite.oid
       JOIN pg_class AS view ON view.oid = rewrite.ev_class
       JOIN pg_namespace AS ns ON ns.oid = view.relnamespace
       WHERE dependency.refclassid = 'pg_class'::regclass
         AND dependency.refobjid = ANY (SELECT to_regclass(name) FROM unnest($1::text[]) AS name)
         AND view.relkind IN ('v', 'm')
       ORDER BY name`,
      [qualified],
    )
    const functions = await client.query<{ name: string }>(
      `SELECT ns.nspname || '.' || proc.proname || '(' || pg_get_function_identity_arguments(proc.oid) || ')' AS name
       FROM pg_proc AS proc JOIN pg_namespace AS ns ON ns.oid = proc.pronamespace
       WHERE ns.nspname NOT IN ('pg_catalog', 'information_schema')
         AND proc.prokind IN ('f', 'p')
         AND proc.prosrc ~ '(ai_connections|ai_tool_executions|ai_action_approvals)'
       ORDER BY name`,
    )
    const policies = await client.query<{ name: string }>(
      `SELECT schemaname || '.' || tablename || ': ' || policyname AS name
       FROM pg_policies WHERE schemaname = 'shared' AND tablename = ANY ($1::text[])
       ORDER BY name`,
      [names],
    )
    const indexes = await client.query<{ name: string }>(
      `SELECT schemaname || '.' || indexname AS name
       FROM pg_indexes WHERE schemaname = 'shared' AND tablename = ANY ($1::text[])
       ORDER BY name`,
      [names],
    )

    for (const [title, entries] of [
      ['Chaves estrangeiras externas', foreignKeys.rows.map((row) => `${row.source}.${row.constraint_name} -> ${row.target}`)],
      ['Views dependentes', views.rows.map((row) => row.name)],
      ['Funcoes com referencias textuais (exigem revisao)', functions.rows.map((row) => row.name)],
      ['Politicas exclusivas', policies.rows.map((row) => row.name)],
      ['Indices exclusivos', indexes.rows.map((row) => row.name)],
    ] as const) {
      lines.push('', `## ${title}`, '', ...(entries.length ? entries.map((entry) => `- ${entry}`) : ['Nenhum objeto encontrado.']))
    }
    await client.query('ROLLBACK')
    lines.push('', 'A migracao preparada recusa tabelas com registros e usa DROP RESTRICT. A ausencia de referencias textuais nao garante ausencia de consultas dinamicas externas ao repositorio.')
    console.log('Inventario do banco concluido; nenhuma alteracao aplicada.')
  } catch (error) {
    await client?.query('ROLLBACK').catch(() => undefined)
    const code = String((error as { code?: string }).code || 'AUDIT_UNAVAILABLE')
    lines.push('Inventario indisponivel.', '', `Etapa: ${phase}. Codigo: ${code}.`, '', 'A migracao permanece preparada, sem aplicacao ao banco conectado.')
    console.error(`Inventario indisponivel na etapa ${phase} (${code}).`)
    process.exitCode = 1
  } finally {
    await client?.end().catch(() => undefined)
    mkdirSync(dirname(output), { recursive: true })
    writeFileSync(output, `${lines.join('\n')}\n`)
  }
}

void main()
