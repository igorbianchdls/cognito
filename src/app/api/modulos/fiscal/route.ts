import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

const parseNumber = (v: string | null, fb?: number) => (v ? Number(v) : fb)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const view = (searchParams.get('view') || '').toLowerCase()
    if (!view) {
      return Response.json(
        { success: false, message: 'Parâmetro view é obrigatório' },
        { status: 400 }
      )
    }

    // Common filters
    const de = searchParams.get('de') || undefined
    const ate = searchParams.get('ate') || undefined
    const q = searchParams.get('q') || undefined

    // Pagination
    const page = Math.max(1, parseNumber(searchParams.get('page'), 1) || 1)
    const pageSize = Math.max(1, Math.min(1000, parseNumber(searchParams.get('pageSize'), 20) || 20))
    const offset = (page - 1) * pageSize

    // Placeholder responses - queries will be added later
    if (view === 'notas_fiscais') {
      // Placeholder data for Notas Fiscais
      return Response.json({
        success: true,
        rows: [],
        total: 0,
        page,
        pageSize,
        message: 'Query pendente - será adicionada posteriormente'
      })
    }

    if (view === 'notas_fiscais_servico') {
      // Placeholder data for Notas Fiscais de Serviço
      return Response.json({
        success: true,
        rows: [],
        total: 0,
        page,
        pageSize,
        message: 'Query pendente - será adicionada posteriormente'
      })
    }

    return Response.json(
      { success: false, message: `View "${view}" não reconhecida` },
      { status: 400 }
    )
  } catch (error) {
    console.error('API /api/modulos/fiscal error:', error)
    return Response.json(
      {
        success: false,
        message: 'Erro interno',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
