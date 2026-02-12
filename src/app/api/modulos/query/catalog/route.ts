import { NextRequest } from 'next/server'
import {
  APPS_QUERY_TABLES,
  getAppsTableCatalog,
  listAppsTableCatalogs,
  normalizeAppsTableName,
  toLegacyModel,
} from '@/features/apps/shared/queryCatalog'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tableOrModel = searchParams.get('table') || searchParams.get('model') || ''
    const moduleFilter = (searchParams.get('module') || '').trim().toLowerCase()

    if (tableOrModel) {
      const table = normalizeAppsTableName(tableOrModel)
      if (!table) {
        return Response.json({ success: false, message: `Tabela/modelo nao suportado: ${tableOrModel}` }, { status: 400 })
      }
      const catalog = getAppsTableCatalog(table)
      return Response.json({
        success: true,
        table,
        legacyModel: toLegacyModel(table),
        catalog,
      })
    }

    const allowedModules = new Set(['vendas', 'compras', 'financeiro'])
    const module = allowedModules.has(moduleFilter) ? (moduleFilter as 'vendas' | 'compras' | 'financeiro') : undefined
    const items = listAppsTableCatalogs(module).map((entry) => ({
      ...entry,
      legacyModel: toLegacyModel(entry.table),
    }))

    return Response.json({
      success: true,
      count: items.length,
      tables: APPS_QUERY_TABLES,
      items,
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: 'Erro ao carregar catalogo de query',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    )
  }
}

