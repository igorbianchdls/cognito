import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

const parseNumber = (v: string | null, fallback?: number) => (v ? Number(v) : fallback)

const ALL_KNOWN_TYPES = [
  'Nota Fiscal (NF-e)', 'Guia de Imposto',
  'Recibo', 'Fatura', 'Duplicata', 'Extrato Bancário',
  'Ordem de Serviço', 'Conhecimento de Transporte', 'Checklist', 'Relatório Operacional',
  'Procuração', 'Aditivo', 'Termo', 'Notificação Extrajudicial',
  'Proposta', 'Pedido',
  'Contracheque', 'Atestado', 'Holerite', 'Advertência', 'Contrato de Trabalho',
  'Contrato'
]

const TYPES_BY_VIEW: Record<string, string[]> = {
  fiscal: ['Nota Fiscal (NF-e)', 'Guia de Imposto'],
  financeiro: ['Recibo', 'Fatura', 'Duplicata', 'Extrato Bancário'],
  operacional: ['Ordem de Serviço', 'Conhecimento de Transporte', 'Checklist', 'Relatório Operacional'],
  juridico: ['Procuração', 'Aditivo', 'Termo', 'Notificação Extrajudicial'],
  comercial: ['Proposta', 'Pedido'],
  rh: ['Contracheque', 'Atestado', 'Holerite', 'Advertência', 'Contrato de Trabalho'],
  contratos: ['Contrato', 'Aditivo'],
  outros: [],
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const view = (searchParams.get('view') || '').toLowerCase()
    if (!view) {
      return Response.json({ success: false, message: 'Parâmetro view é obrigatório' }, { status: 400 })
    }

    const de = searchParams.get('de') || undefined
    const ate = searchParams.get('ate') || undefined
    const page = Math.max(1, parseNumber(searchParams.get('page'), 1) || 1)
    const pageSize = Math.max(1, Math.min(1000, parseNumber(searchParams.get('pageSize'), 50) || 50))
    const offset = (page - 1) * pageSize

    const conditions: string[] = []
    const params: unknown[] = []
    let idx = 1

    const push = (expr: string, value: unknown) => {
      conditions.push(`${expr} $${idx}`)
      params.push(value)
      idx += 1
    }

    // Filtro por tipo de documento conforme view
    if (view !== 'outros') {
      const types = TYPES_BY_VIEW[view] || []
      if (types.length) {
        const placeholders = types.map((_, i) => `$${idx + i}`).join(', ')
        conditions.push(`d.tipo_documento IN (${placeholders})`)
        params.push(...types)
        idx += types.length
      }
    } else {
      // Outros = tudo que não está nos tipos conhecidos
      const types = ALL_KNOWN_TYPES
      const placeholders = types.map((_, i) => `$${idx + i}`).join(', ')
      conditions.push(`(d.tipo_documento IS NULL OR d.tipo_documento NOT IN (${placeholders}))`)
      params.push(...types)
      idx += types.length
    }

    // Filtro de período (data_emissao)
    if (de) push('d.data_emissao >=', de)
    if (ate) push('d.data_emissao <=', ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const selectSql = `SELECT 
      d.id AS documento_id,
      d.tipo_documento,
      d.numero_documento AS numero,
      d.descricao,
      d.data_emissao,
      d.valor_total,
      d.status,
      COALESCE(d.arquivo_pdf_url, d.arquivo_xml_url) AS arquivo_url
    FROM gestaodocumentos.documentos d`

    const orderClause = 'ORDER BY d.data_emissao DESC NULLS LAST, d.id DESC'
    const limitOffset = `LIMIT $${idx}::int OFFSET $${idx + 1}::int`
    const paramsWithPage = [...params, pageSize, offset]

    const listSql = `${selectSql} ${whereClause} ${orderClause} ${limitOffset}`.trim()
    const rows = await runQuery<Record<string, unknown>>(listSql, paramsWithPage)

    const totalSql = `SELECT COUNT(*)::int AS total FROM gestaodocumentos.documentos d ${whereClause}`
    const totalRows = await runQuery<{ total: number }>(totalSql, params)
    const total = totalRows[0]?.total ?? 0

    return Response.json({
      success: true,
      view,
      page,
      pageSize,
      total,
      rows,
      sql: listSql,
      params: JSON.stringify(paramsWithPage)
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('📄 API /api/modulos/documentos error:', error)
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}

