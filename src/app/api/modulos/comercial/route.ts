import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Whitelist para ordenação segura por view
const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  territorios: {
    territorio: 't.nome',
    descricao: 't.descricao',
    territorio_pai: 'tp.nome',
    ativo: 't.ativo',
    criado_em: 't.criado_em',
    atualizado_em: 't.atualizado_em',
  },
  vendedores: {
    vendedor: 'f.nome',
    email: 'f.email',
    telefone: 'f.telefone',
    territorio: 't.nome',
    comissao: 'v.comissao_padrao',
    vendedor_ativo: 'v.ativo',
    criado_em: 'v.criado_em',
    atualizado_em: 'v.atualizado_em',
  },
  meta_vendedores: {
    vendedor: 'f.nome',
    territorio: 't.nome',
    periodo: 'mv.periodo',
    meta: 'mv.valor_meta',
    criado_em: 'mv.criado_em',
    atualizado_em: 'mv.atualizado_em',
  },
  meta_territorios: {
    territorio: 't.nome',
    territorio_descricao: 't.descricao',
    periodo: 'mt.periodo',
    meta: 'mt.valor_meta',
    criado_em: 'mt.criado_em',
    atualizado_em: 'mt.atualizado_em',
  },
  regras_comissoes: {
    regra: 'rc.nome',
    descricao: 'rc.descricao',
    percentual_padrao: 'rc.percentual_default',
    percentual_minimo: 'rc.percentual_min',
    percentual_maximo: 'rc.percentual_max',
    regra_ativa: 'rc.ativo',
    criado_em: 'rc.criado_em',
    atualizado_em: 'rc.atualizado_em',
  },
  campanhas_vendas: {
    campanha: 'cv.nome',
    tipo: 'cv.tipo',
    descricao: 'cv.descricao',
    data_inicio: 'cv.data_inicio',
    data_fim: 'cv.data_fim',
    ativo: 'cv.ativo',
    criado_em: 'cv.criado_em',
    atualizado_em: 'cv.atualizado_em',
  },
  metas: {
    meta_id: 'm.id',
    mes: 'm.mes',
    ano: 'm.ano',
    vendedor_nome: 'func.nome',
    tipo_meta: 'tm.nome',
    tipo_valor: 'tm.tipo_valor',
    valor_meta: 'm.valor_meta',
    meta_percentual: 'm.meta_percentual',
    territorio_nome: 'terr.nome',
    canal_venda_nome: 'cv.nome',
    filial_nome: 'fil.nome',
    unidade_negocio_nome: 'un.nome',
    sales_office_nome: 'so.nome',
    criado_em: 'm.criado_em',
    atualizado_em: 'm.atualizado_em',
  },
  desempenho: {
    vendedor_nome: 'vendedor_nome',
    ano: 'ano',
    mes: 'mes',
    valor_meta: 'valor_meta',
    valor_atingido: 'valor_atingido',
    atingimento_percent: 'atingimento_percent',
  },
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const view = (searchParams.get('view') || '').toLowerCase()
    if (!view) return Response.json({ success: false, message: 'Parâmetro view é obrigatório' }, { status: 400 })

    // Paginação simples (opcional)
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const pageSize = Math.max(1, Math.min(1000, Number(searchParams.get('pageSize') || 20)))
    const offset = (page - 1) * pageSize

    // Ordenação segura
    const orderByParam = (searchParams.get('order_by') || '').toLowerCase()
    const orderDirParam = (searchParams.get('order_dir') || 'asc').toLowerCase()
    const whitelist = ORDER_BY_WHITELIST[view] || {}
    const orderBy = whitelist[orderByParam]
    const orderDir = orderDirParam === 'desc' ? 'DESC' : 'ASC'

    let selectSql = ''
    let baseSql = ''
    let orderClause = ''

    if (view === 'territorios') {
      selectSql = `SELECT
        t.nome AS territorio,
        t.descricao,
        tp.nome AS territorio_pai,
        t.ativo,
        t.criado_em,
        t.atualizado_em`
      baseSql = `FROM comercial.territorios t
        LEFT JOIN comercial.territorios tp ON tp.id = t.territorio_pai_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY t.nome ASC'
    } else if (view === 'vendedores') {
      selectSql = `SELECT
        f.nome AS vendedor,
        f.email AS email,
        f.telefone AS telefone,
        t.nome AS territorio,
        t.descricao AS territorio_descricao,
        v.comissao_padrao AS comissao,
        v.ativo AS vendedor_ativo,
        v.criado_em,
        v.atualizado_em`
      baseSql = `FROM comercial.vendedores v
        LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
        LEFT JOIN comercial.territorios t ON t.id = v.territorio_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY f.nome ASC'
    } else if (view === 'meta_vendedores') {
      selectSql = `SELECT
        f.nome AS vendedor,
        t.nome AS territorio,
        mv.periodo AS periodo,
        mv.valor_meta AS meta,
        mv.criado_em,
        mv.atualizado_em`
      baseSql = `FROM comercial.metas_vendedores mv
        LEFT JOIN comercial.vendedores v ON v.id = mv.vendedor_id
        LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
        LEFT JOIN comercial.territorios t ON t.id = v.territorio_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY mv.periodo DESC, f.nome ASC'
    } else if (view === 'meta_territorios') {
      selectSql = `SELECT
        t.nome AS territorio,
        t.descricao AS territorio_descricao,
        mt.periodo AS periodo,
        mt.valor_meta AS meta,
        mt.criado_em,
        mt.atualizado_em`
      baseSql = `FROM comercial.metas_territorios mt
        LEFT JOIN comercial.territorios t ON t.id = mt.territorio_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY mt.periodo DESC, t.nome ASC'
    } else if (view === 'regras_comissoes') {
      selectSql = `SELECT
        rc.nome AS regra,
        rc.descricao AS descricao,
        rc.percentual_default AS percentual_padrao,
        rc.percentual_min AS percentual_minimo,
        rc.percentual_max AS percentual_maximo,
        rc.ativo AS regra_ativa,
        rc.criado_em,
        rc.atualizado_em`
      baseSql = `FROM comercial.regras_comissao rc`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY rc.nome ASC'
    } else if (view === 'campanhas_vendas') {
      selectSql = `SELECT
        cv.nome AS campanha,
        cv.tipo,
        cv.descricao,
        cv.data_inicio,
        cv.data_fim,
        cv.ativo,
        pr.nome AS produto,
        cvp.incentivo_percentual,
        cvp.incentivo_valor,
        cvp.meta_quantidade,
        cvp.id AS item_id,
        cv.criado_em,
        cv.atualizado_em`
      baseSql = `FROM comercial.campanhas_vendas cv
        LEFT JOIN comercial.campanhas_vendas_produtos cvp ON cvp.campanha_id = cv.id
        LEFT JOIN produtos.produto pr ON pr.id = cvp.produto_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}, cvp.id ASC` : 'ORDER BY cv.id ASC, cvp.id ASC'
    } else if (view === 'metas') {
      const anoParam = searchParams.get('ano')
      const mesParam = searchParams.get('mes')
      const ano = anoParam ? Number(anoParam) : undefined
      const mes = mesParam ? Number(mesParam) : undefined
      selectSql = `SELECT
        m.id AS meta_id,
        m.mes,
        m.ano,
        m.vendedor_id,
        func.nome AS vendedor_nome,
        tm.nome AS tipo_meta,
        tm.tipo_valor,
        m.valor_meta,
        m.meta_percentual,
        terr.nome AS territorio_nome,
        cv.nome   AS canal_venda_nome,
        fil.nome  AS filial_nome,
        un.nome   AS unidade_negocio_nome,
        so.nome   AS sales_office_nome,
        -- Derivados para colapsável
        (terr.nome IS NULL AND cv.nome IS NULL AND fil.nome IS NULL AND un.nome IS NULL AND so.nome IS NULL) AS parent_flag,
        CASE
          WHEN so.nome   IS NOT NULL THEN 'sales_office_nome'
          WHEN un.nome   IS NOT NULL THEN 'unidade_negocio_nome'
          WHEN fil.nome  IS NOT NULL THEN 'filial_nome'
          WHEN cv.nome   IS NOT NULL THEN 'canal_venda_nome'
          WHEN terr.nome IS NOT NULL THEN 'territorio_nome'
          ELSE NULL
        END AS child_dim,
        COALESCE(so.nome, un.nome, fil.nome, cv.nome, terr.nome) AS child_label,
        CASE
          WHEN (terr.nome IS NULL AND cv.nome IS NULL AND fil.nome IS NULL AND un.nome IS NULL AND so.nome IS NULL)
            THEN 1 ELSE 2
        END AS nivel,
        m.criado_em,
        m.atualizado_em`;
      baseSql = `FROM comercial.metas m
        LEFT JOIN comercial.tipos_metas tm ON tm.id = m.tipo_meta_id
        LEFT JOIN comercial.vendedores v ON v.id = m.vendedor_id
        LEFT JOIN entidades.funcionarios func ON func.id = v.funcionario_id
        LEFT JOIN comercial.territorios terr ON terr.id = m.territorio_id
        LEFT JOIN vendas.canais_venda cv ON cv.id = m.canal_venda_id
        LEFT JOIN empresa.filiais fil ON fil.id = m.filial_id
        LEFT JOIN empresa.unidades_negocio un ON un.id = m.unidade_negocio_id
        LEFT JOIN comercial.sales_offices so ON so.id = m.sales_office_id
        WHERE m.vendedor_id IS NOT NULL`;
      if (ano && String(ano).length === 4) {
        baseSql += ` AND m.ano = ${ano}`
      }
      if (mes && mes >= 1 && mes <= 12) {
        baseSql += ` AND m.mes = ${mes}`
      }
      // Ordem fixa por vendedor, depois nível (Meta Geral antes), ano, mês e rótulo do detalhe
      orderClause = 'ORDER BY vendedor_nome ASC, nivel ASC, m.ano ASC, m.mes ASC, child_label ASC, meta_id ASC'
    } else if (view === 'desempenho') {
      const anoParam = searchParams.get('ano')
      const mesParam = searchParams.get('mes')
      const ano = anoParam ? Number(anoParam) : undefined
      const mes = mesParam ? Number(mesParam) : undefined

      const filtrosMetas: string[] = ["m.vendedor_id IS NOT NULL"]
      if (ano && String(ano).length === 4) filtrosMetas.push(`m.ano = ${ano}`)
      if (mes && mes >= 1 && mes <= 12) filtrosMetas.push(`m.mes = ${mes}`)
      const whereMetas = `WHERE ${filtrosMetas.join(' AND ')}`

      const filtrosPedidos: string[] = []
      if (ano && String(ano).length === 4) filtrosPedidos.push(`EXTRACT(YEAR FROM p.data_pedido) = ${ano}`)
      if (mes && mes >= 1 && mes <= 12) filtrosPedidos.push(`EXTRACT(MONTH FROM p.data_pedido) = ${mes}`)
      const wherePedidos = filtrosPedidos.length ? `WHERE ${filtrosPedidos.join(' AND ')}` : ''

      selectSql = `SELECT * FROM (
        WITH metas AS (
          SELECT m.vendedor_id, func.nome AS vendedor_nome, m.ano, m.mes, SUM(m.valor_meta)::numeric AS valor_meta
          FROM comercial.metas m
          LEFT JOIN comercial.vendedores v ON v.id = m.vendedor_id
          LEFT JOIN entidades.funcionarios func ON func.id = v.funcionario_id
          ${whereMetas}
          GROUP BY m.vendedor_id, func.nome, m.ano, m.mes
        ), ped AS (
          SELECT p.vendedor_id, func.nome AS vendedor_nome,
                 EXTRACT(YEAR FROM p.data_pedido)::int AS ano,
                 EXTRACT(MONTH FROM p.data_pedido)::int AS mes,
                 SUM(p.valor_total)::numeric AS valor_atingido
          FROM vendas.pedidos p
          LEFT JOIN comercial.vendedores v ON v.id = p.vendedor_id
          LEFT JOIN entidades.funcionarios func ON func.id = v.funcionario_id
          ${wherePedidos}
          GROUP BY p.vendedor_id, func.nome, EXTRACT(YEAR FROM p.data_pedido), EXTRACT(MONTH FROM p.data_pedido)
        )
        SELECT COALESCE(m.vendedor_id, ped.vendedor_id) AS vendedor_id,
               COALESCE(m.vendedor_nome, ped.vendedor_nome) AS vendedor_nome,
               COALESCE(m.ano, ped.ano) AS ano,
               COALESCE(m.mes, ped.mes) AS mes,
               COALESCE(m.valor_meta, 0)::numeric AS valor_meta,
               COALESCE(ped.valor_atingido, 0)::numeric AS valor_atingido,
               CASE WHEN COALESCE(m.valor_meta, 0) > 0
                    THEN (COALESCE(ped.valor_atingido, 0) / COALESCE(m.valor_meta, 0)) * 100
                    ELSE NULL END AS atingimento_percent
        FROM metas m
        FULL JOIN ped ON ped.vendedor_id = m.vendedor_id AND ped.ano = m.ano AND ped.mes = m.mes
      ) d`
      baseSql = ''
      orderClause = 'ORDER BY vendedor_nome ASC, ano ASC, mes ASC'
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 })
    }

    const listSql = orderClause ? `${selectSql} ${baseSql} ${orderClause} LIMIT $1::int OFFSET $2::int`.trim() : `${selectSql} LIMIT $1::int OFFSET $2::int`.trim()
    let rows = await runQuery<Record<string, unknown>>(listSql, [pageSize, offset])

    // Para campanhas_vendas, agrupar produtos
    if (view === 'campanhas_vendas') {
      type CampanhaAgregada = {
        campanha: unknown
        tipo: unknown
        descricao: unknown
        data_inicio: unknown
        data_fim: unknown
        ativo: unknown
        criado_em: unknown
        atualizado_em: unknown
        produtos: Array<{
          produto: unknown
          incentivo_percentual: unknown
          incentivo_valor: unknown
          meta_quantidade: unknown
        }>
      }
      const campanhasMap = new Map<string, CampanhaAgregada>()

      for (const row of rows) {
        const campanhaKey = String(row.campanha)

        if (!campanhasMap.has(campanhaKey)) {
          // Primeira vez vendo esta campanha
          campanhasMap.set(campanhaKey, {
            campanha: row.campanha,
            tipo: row.tipo,
            descricao: row.descricao,
            data_inicio: row.data_inicio,
            data_fim: row.data_fim,
            ativo: row.ativo,
            criado_em: row.criado_em,
            atualizado_em: row.atualizado_em,
            produtos: []
          })
        }

        // Adicionar produto se existir
        if (row.item_id) {
          campanhasMap.get(campanhaKey)!.produtos.push({
            produto: row.produto,
            incentivo_percentual: row.incentivo_percentual,
            incentivo_valor: row.incentivo_valor,
            meta_quantidade: row.meta_quantidade,
          })
        }
      }

      rows = Array.from(campanhasMap.values())
    }

    // Total
    const totalSql = view === 'campanhas_vendas'
      ? `SELECT COUNT(DISTINCT cv.id)::int AS total FROM comercial.campanhas_vendas cv`
      : view === 'desempenho'
        ? `SELECT COUNT(*)::int AS total FROM (${selectSql}) t`
        : baseSql ? `SELECT COUNT(*)::int AS total ${baseSql}` : `SELECT 0::int AS total`
    const totalRows = await runQuery<{ total: number }>(totalSql)
    const total = totalRows[0]?.total ?? 0

    return Response.json({
      success: true,
      view,
      page,
      pageSize,
      total,
      rows,
      sql: listSql,
      params: JSON.stringify([pageSize, offset]),
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('🏢 API /api/modulos/comercial error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
