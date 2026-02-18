import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'
import { resolveTenantId } from '@/lib/tenant'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  templates: {
    template: 't.id',
    codigo: 't.codigo',
    nome: 't.nome',
    tipo: 't.tipo',
    status: 't.ativo',
    criado_em: 't.criado_em',
    atualizado_em: 't.atualizado_em',
  },
  'template-versions': {
    versao_id: 'v.id',
    template_id: 'v.template_id',
    template_codigo: 't.codigo',
    template_nome: 't.nome',
    versao: 'v.versao',
    status: 'v.publicado',
    publicado_em: 'v.publicado_em',
    criado_em: 'v.criado_em',
    atualizado_em: 'v.atualizado_em',
  },
  documentos: {
    documento: 'd.id',
    titulo: 'd.titulo',
    origem_tipo: 'd.origem_tipo',
    origem_id: 'd.origem_id',
    status: 'd.status',
    template_codigo: 't.codigo',
    template_nome: 't.nome',
    template_versao: 'v.versao',
    gerado_em: 'd.gerado_em',
    enviado_em: 'd.enviado_em',
    criado_em: 'd.criado_em',
    atualizado_em: 'd.atualizado_em',
  },
}

const parseNumber = (v: string | null, fb?: number) => (v ? Number(v) : fb)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const view = (searchParams.get('view') || '').toLowerCase()
    if (!view) return Response.json({ success: false, message: 'Parâmetro view é obrigatório' }, { status: 400 })

    const tenantId = resolveTenantId(req.headers)
    const de = searchParams.get('de') || undefined
    const ate = searchParams.get('ate') || undefined
    const q = searchParams.get('q') || undefined
    const status = searchParams.get('status') || undefined
    const tipo = searchParams.get('tipo') || undefined
    const page = Math.max(1, parseNumber(searchParams.get('page'), 1) || 1)
    const pageSize = Math.max(1, Math.min(1000, parseNumber(searchParams.get('pageSize'), 20) || 20))
    const offset = (page - 1) * pageSize
    const orderByParam = (searchParams.get('order_by') || '').toLowerCase()
    const orderDirParam = (searchParams.get('order_dir') || 'desc').toLowerCase()
    const whitelist = ORDER_BY_WHITELIST[view] || {}
    const orderBy = whitelist[orderByParam] || undefined
    const orderDir = orderDirParam === 'asc' ? 'ASC' : 'DESC'

    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => {
      conditions.push(`${expr} $${i}`)
      params.push(val)
      i += 1
    }

    let selectSql = ''
    let baseSql = ''
    let whereDateCol = ''
    let defaultOrder = ''

    if (view === 'templates') {
      selectSql = `SELECT
        t.id AS template,
        t.codigo,
        t.nome,
        t.tipo,
        t.descricao,
        CASE WHEN t.ativo THEN 'Ativo' ELSE 'Inativo' END AS status,
        t.criado_em,
        t.atualizado_em`
      baseSql = `FROM documentos.templates t`
      whereDateCol = 't.criado_em'
      defaultOrder = 'ORDER BY t.nome ASC'
      push('t.tenant_id =', tenantId)
      if (tipo) push('LOWER(t.tipo) =', tipo.toLowerCase())
      if (status) {
        if (status.toLowerCase() === 'ativo') push('t.ativo =', true)
        if (status.toLowerCase() === 'inativo') push('t.ativo =', false)
      }
      if (q) {
        conditions.push(`(t.codigo ILIKE '%' || $${i} || '%' OR t.nome ILIKE '%' || $${i} || '%' OR COALESCE(t.descricao,'') ILIKE '%' || $${i} || '%')`)
        params.push(q)
        i += 1
      }
    } else if (view === 'template-versions') {
      selectSql = `SELECT
        v.id AS versao_id,
        v.template_id,
        t.codigo AS template_codigo,
        t.nome AS template_nome,
        v.versao,
        CASE WHEN v.publicado THEN 'Publicado' ELSE 'Rascunho' END AS status,
        v.publicado_em,
        v.notas,
        v.criado_em,
        v.atualizado_em`
      baseSql = `FROM documentos.template_versions v
        LEFT JOIN documentos.templates t ON t.id = v.template_id AND t.tenant_id = v.tenant_id`
      whereDateCol = 'v.criado_em'
      defaultOrder = 'ORDER BY v.template_id DESC, v.versao DESC'
      push('v.tenant_id =', tenantId)
      if (tipo) push('LOWER(COALESCE(t.tipo, \'\')) =', tipo.toLowerCase())
      if (status) {
        if (status.toLowerCase() === 'publicado') push('v.publicado =', true)
        if (status.toLowerCase() === 'rascunho') push('v.publicado =', false)
      }
      if (q) {
        conditions.push(`(COALESCE(t.codigo,'') ILIKE '%' || $${i} || '%' OR COALESCE(t.nome,'') ILIKE '%' || $${i} || '%' OR COALESCE(v.notas,'') ILIKE '%' || $${i} || '%')`)
        params.push(q)
        i += 1
      }
    } else if (view === 'documentos') {
      selectSql = `SELECT
        d.id AS documento,
        d.titulo,
        d.origem_tipo,
        d.origem_id,
        d.status,
        t.codigo AS template_codigo,
        t.nome AS template_nome,
        v.versao AS template_versao,
        d.gerado_em,
        d.enviado_em,
        d.criado_em,
        d.atualizado_em`
      baseSql = `FROM documentos.documentos d
        LEFT JOIN documentos.templates t ON t.id = d.template_id AND t.tenant_id = d.tenant_id
        LEFT JOIN documentos.template_versions v ON v.id = d.template_version_id AND v.tenant_id = d.tenant_id`
      whereDateCol = 'd.criado_em'
      defaultOrder = 'ORDER BY d.id DESC'
      push('d.tenant_id =', tenantId)
      if (tipo) push('LOWER(COALESCE(t.tipo, \'\')) =', tipo.toLowerCase())
      if (status) push('LOWER(COALESCE(d.status, \'\')) =', status.toLowerCase())
      if (q) {
        conditions.push(`(d.titulo ILIKE '%' || $${i} || '%' OR COALESCE(d.origem_tipo,'') ILIKE '%' || $${i} || '%' OR COALESCE(t.codigo,'') ILIKE '%' || $${i} || '%')`)
        params.push(q)
        i += 1
      }
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 })
    }

    if (de && whereDateCol) push(`${whereDateCol} >=`, de)
    if (ate && whereDateCol) push(`${whereDateCol} <=`, ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : defaultOrder
    const limitOffset = `LIMIT $${i}::int OFFSET $${i + 1}::int`
    const paramsWithPage = [...params, pageSize, offset]

    const listSql = `${selectSql}
      ${baseSql}
      ${whereClause}
      ${orderClause}
      ${limitOffset}`.trim()

    const rows = await runQuery<Record<string, unknown>>(listSql, paramsWithPage)
    const totalSql = `SELECT COUNT(*)::int AS total ${baseSql} ${whereClause}`
    const totalRows = await runQuery<{ total: number }>(totalSql, params)
    const total = totalRows[0]?.total ?? 0

    return Response.json({
      success: true,
      view,
      page,
      pageSize,
      total,
      rows,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('📄 API /api/modulos/documentos error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 },
    )
  }
}
