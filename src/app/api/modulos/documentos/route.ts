import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

const parseNumber = (v: string | null, fallback?: number) => (v ? Number(v) : fallback)

// Este endpoint segue o padrão dos módulos (como contabilidade): compõe SQL dinâmico e usa runQuery.

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

    let listSql = ''
    let totalSql = ''
    let paramsWithPage: unknown[] = []

    // Filtro de período será sempre em d.data_emissao, se fornecido
    const addDateFilters = () => {
      if (de) push('d.data_emissao >=', de)
      if (ate) push('d.data_emissao <=', ate)
    }

    if (view === 'fiscal') {
      // Consulta de Documentos Fiscais (exatamente como especificado)
      addDateFilters()
      conditions.push(`td.categoria = 'fiscal'`)
      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
      const orderClause = 'ORDER BY d.data_emissao DESC NULLS LAST, d.id DESC'
      const limitOffset = `LIMIT $${idx}::int OFFSET $${idx + 1}::int`
      paramsWithPage = [...params, pageSize, offset]

      listSql = `SELECT 
        d.id AS documento_id,
        td.nome AS tipo_documento,
        d.numero,
        d.descricao,
        d.data_emissao,
        d.valor_total,
        d.status,
        f.cfop,
        f.chave_acesso,
        f.natureza_operacao,
        f.modelo,
        f.serie,
        f.xml_url,
        f.data_autorizacao,
        f.ambiente
      FROM documentos.documento d
      LEFT JOIN documentos.tipos_documentos td ON td.id = d.tipo_documento_id
      LEFT JOIN documentos.documentos_fiscais f ON f.documento_id = d.id
      ${whereClause}
      ${orderClause}
      ${limitOffset}`.trim()

      totalSql = `SELECT COUNT(*)::int AS total
      FROM documentos.documento d
      LEFT JOIN documentos.tipos_documentos td ON td.id = d.tipo_documento_id
      LEFT JOIN documentos.documentos_fiscais f ON f.documento_id = d.id
      ${whereClause}`
    } else if (view === 'financeiro') {
      // Consulta de Documentos Financeiros (EXATA como fornecida)
      addDateFilters()
      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
      const orderClause = 'ORDER BY d.id DESC'
      const limitOffset = `LIMIT $${idx}::int OFFSET $${idx + 1}::int`
      paramsWithPage = [...params, pageSize, offset]

      listSql = `SELECT 
        d.id AS documento_id,
        td.nome AS tipo_documento,
        d.numero,
        d.descricao,
        d.data_emissao,
        d.valor_total,
        d.status,
        f.meio_pagamento,
        f.banco_id,
        f.codigo_barras,
        f.data_liquidacao,
        f.valor_pago,
        d.criado_em,
        d.atualizado_em
      FROM documentos.documento d
      LEFT JOIN documentos.tipos_documentos td 
        ON td.id = d.tipo_documento_id
      INNER JOIN documentos.documentos_financeiros f 
        ON f.documento_id = d.id
      ${whereClause}
      ${orderClause}
      ${limitOffset}`.trim()

      totalSql = `SELECT COUNT(*)::int AS total
      FROM documentos.documento d
      LEFT JOIN documentos.tipos_documentos td ON td.id = d.tipo_documento_id
      INNER JOIN documentos.documentos_financeiros f ON f.documento_id = d.id
      ${whereClause}`
    } else if (view === 'contratos') {
      // Consulta de Documentos de Contratos (EXATA conforme campos fornecidos)
      addDateFilters()
      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
      const orderClause = 'ORDER BY d.id DESC'
      const limitOffset = `LIMIT $${idx}::int OFFSET $${idx + 1}::int`
      paramsWithPage = [...params, pageSize, offset]

      listSql = `SELECT 
        d.id AS documento_id,
        td.nome AS tipo_documento,
        d.numero,
        d.descricao,
        d.data_emissao,
        d.valor_total,
        d.status,
        c.data_inicio,
        c.data_fim,
        c.prazo_meses,
        c.renovacao_automatica,
        c.valor_mensal,
        c.objeto,
        c.clausulas_json,
        d.criado_em,
        d.atualizado_em
      FROM documentos.documento d
      LEFT JOIN documentos.tipos_documentos td 
        ON td.id = d.tipo_documento_id
      INNER JOIN documentos.documentos_contratos c 
        ON c.documento_id = d.id
      ${whereClause}
      ${orderClause}
      ${limitOffset}`.trim()

      totalSql = `SELECT COUNT(*)::int AS total
      FROM documentos.documento d
      LEFT JOIN documentos.tipos_documentos td ON td.id = d.tipo_documento_id
      INNER JOIN documentos.documentos_contratos c ON c.documento_id = d.id
      ${whereClause}`
    } else if (view === 'operacional') {
      // Documentos Operacionais: conforme campos fornecidos
      addDateFilters()
      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
      const orderClause = 'ORDER BY d.id DESC'
      const limitOffset = `LIMIT $${idx}::int OFFSET $${idx + 1}::int`
      paramsWithPage = [...params, pageSize, offset]

      listSql = `SELECT 
        d.id AS documento_id,
        td.nome AS tipo_documento,
        d.numero,
        d.descricao,
        d.data_emissao,
        d.valor_total,
        d.status,
        o.responsavel_id,
        o.local_execucao,
        o.data_execucao,
        o.checklist_json,
        o.observacoes,
        d.criado_em,
        d.atualizado_em
      FROM documentos.documento d
      LEFT JOIN documentos.tipos_documentos td 
        ON td.id = d.tipo_documento_id
      INNER JOIN documentos.documentos_operacionais o 
        ON o.documento_id = d.id
      ${whereClause}
      ${orderClause}
      ${limitOffset}`.trim()

      totalSql = `SELECT COUNT(*)::int AS total
      FROM documentos.documento d
      LEFT JOIN documentos.tipos_documentos td ON td.id = d.tipo_documento_id
      INNER JOIN documentos.documentos_operacionais o ON o.documento_id = d.id
      ${whereClause}`
    } else {
      // Genérico por categoria (demais tabs): usa tabela mestre + tipos_documentos
      addDateFilters()
      conditions.push(`td.categoria = $${idx}`)
      params.push(view)
      idx += 1
      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
      const orderClause = 'ORDER BY d.data_emissao DESC NULLS LAST, d.id DESC'
      const limitOffset = `LIMIT $${idx}::int OFFSET $${idx + 1}::int`
      paramsWithPage = [...params, pageSize, offset]

      listSql = `SELECT 
        d.id AS documento_id,
        td.nome AS tipo_documento,
        d.numero,
        d.descricao,
        d.data_emissao,
        d.valor_total,
        d.status
      FROM documentos.documento d
      LEFT JOIN documentos.tipos_documentos td ON td.id = d.tipo_documento_id
      ${whereClause}
      ${orderClause}
      ${limitOffset}`.trim()

      totalSql = `SELECT COUNT(*)::int AS total
      FROM documentos.documento d
      LEFT JOIN documentos.tipos_documentos td ON td.id = d.tipo_documento_id
      ${whereClause}`
    }

    const rows = await runQuery<Record<string, unknown>>(listSql, paramsWithPage)
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
