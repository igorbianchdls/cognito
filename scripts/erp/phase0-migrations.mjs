import { readFileSync } from 'node:fs'

// Migrações recentes do ERP (Fase 0: RLS por contexto, validação por escopo, estabilidade; Fase 1: comercial),
// aplicadas pelas fixtures locais que reproduzem o schema atual depois da migração do shared.
export const PHASE0_MIGRATIONS = [
  '20261008100000_erp_rls_contexto.sql',
  '20261008110000_erp_validacao_escopo.sql',
  '20261008120000_erp_estabilidade_fase0.sql',
]
export const PHASE1_MIGRATIONS = ['20261008130000_erp_comercial_fase1.sql', '20261008140000_erp_devolucoes.sql', '20261008150000_erp_permissoes_vendedor.sql']
export const PHASE2_MIGRATIONS = ['20261009100000_erp_dre_categorias.sql', '20261009110000_erp_anexos.sql', '20261009120000_erp_conciliacao_cartao.sql', '20261009130000_erp_orcamento_metas.sql', '20261009140000_erp_nfse_dps.sql']
export async function applyMigrations(db, files) {
  for (const file of files) await db.exec(readFileSync(`supabase/migrations/${file}`, 'utf8'))
}
export const applyPhase0Migrations = db => applyMigrations(db, PHASE0_MIGRATIONS)
export const applyRecentMigrations = (db, { skip = [] } = {}) =>
  applyMigrations(db, [...PHASE0_MIGRATIONS, ...PHASE1_MIGRATIONS, ...PHASE2_MIGRATIONS].filter(file => !skip.includes(file)))
