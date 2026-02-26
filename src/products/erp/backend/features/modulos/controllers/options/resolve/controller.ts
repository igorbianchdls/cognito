import { NextRequest } from 'next/server'
import { normalizeAppsTableName as normalizeAppsTableNameLegacy } from '@/products/apps/shared/queryCatalog'
import { normalizeAppsTableName as normalizeBiTableName } from '@/products/bi/shared/queryCatalog'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

type ResolveBody = {
  model?: string
  table?: string
  field?: string
  q?: string
  limit?: number
  contextFilters?: Record<string, unknown>
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as ResolveBody
    const rawModel = String(body.model || body.table || '').trim()
    const field = String(body.field || '').trim()
    const q = String(body.q || '').trim()
    const limitRaw = Number(body.limit || 50)
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, limitRaw)) : 50

    if (!rawModel) {
      return Response.json({ success: false, message: 'model é obrigatório' }, { status: 400 })
    }
    if (!field) {
      return Response.json({ success: false, message: 'field é obrigatório' }, { status: 400 })
    }

    const canonicalModel = normalizeAppsTableNameLegacy(rawModel) || normalizeBiTableName(rawModel)
    if (!canonicalModel) {
      return Response.json({ success: false, message: `model não suportado: ${rawModel}` }, { status: 400 })
    }
    const moduleSlug = canonicalModel.split('.')[0]
    if (!moduleSlug || !['vendas', 'compras', 'financeiro', 'crm', 'estoque', 'ecommerce', 'trafegopago'].includes(moduleSlug)) {
      return Response.json({ success: false, message: `módulo inválido para model: ${canonicalModel}` }, { status: 400 })
    }

    const params = new URLSearchParams()
    params.set('field', field)
    params.set('limit', String(limit))
    if (q) params.set('q', q)
    const contextFilters =
      body.contextFilters && typeof body.contextFilters === 'object' && !Array.isArray(body.contextFilters)
        ? (body.contextFilters as Record<string, unknown>)
        : {}
    for (const [k, v] of Object.entries(contextFilters)) {
      const key = String(k || '').trim()
      if (!key) continue
      if (Array.isArray(v)) {
        for (const item of v) {
          if (item === null || item === undefined || item === '') continue
          params.append(key, String(item))
        }
        continue
      }
      if (v === null || v === undefined || v === '') continue
      params.append(key, String(v))
    }

    const origin = (() => {
      try {
        return new URL(req.url).origin
      } catch {
        return ''
      }
    })()
    if (!origin) {
      return Response.json({ success: false, message: 'não foi possível resolver origem da requisição' }, { status: 500 })
    }

    const upstream = `${origin}/api/modulos/${moduleSlug}/options?${params.toString()}`
    const response = await fetch(upstream, { method: 'GET', cache: 'no-store' })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      return Response.json(
        {
          success: false,
          message: (payload as any)?.message || 'erro ao resolver options',
          status: response.status,
        },
        { status: response.status },
      )
    }

    return Response.json({
      success: true,
      model: canonicalModel,
      module: moduleSlug,
      field,
      options: Array.isArray((payload as any)?.options) ? (payload as any).options : [],
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: 'erro interno ao resolver options',
        error: error instanceof Error ? error.message : 'erro desconhecido',
      },
      { status: 500 },
    )
  }
}
