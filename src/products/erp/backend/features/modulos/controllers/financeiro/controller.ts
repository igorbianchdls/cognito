import { NextRequest } from 'next/server';
import { runQuery } from '@/lib/postgres';
import { ORDER_BY_WHITELIST } from './query/orderByWhitelist';
import { parseFinanceiroRequest } from './query/parseFinanceiroRequest';
import { maybeHandleExtratoGroupedView } from './views/extratoGrouped';
import { maybeHandleKpisView } from './views/kpis';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const parseNumber = (v: string | null, fallback?: number) => (v ? Number(v) : fallback);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const {
      view,
      de,
      ate,
      status,
      cliente_id,
      fornecedor_id,
      valor_min,
      valor_max,
      conta_id,
      categoria_id,
      tipo,
      page,
      pageSize,
      offset,
      orderBy,
      orderDir,
    } = parseFinanceiroRequest(searchParams, ORDER_BY_WHITELIST);
    if (!view) {
      return Response.json({ success: false, message: 'Parâmetro view é obrigatório' }, { status: 400 });
    }

    const extratoGroupedResponse = await maybeHandleExtratoGroupedView({
      searchParams,
      parsed: { view, de, ate, status, cliente_id, fornecedor_id, valor_min, valor_max, conta_id, categoria_id, tipo, page, pageSize, offset, orderBy, orderDir },
    });
    if (extratoGroupedResponse) return extratoGroupedResponse;

    // Build SQL per view
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    const push = (expr: string, value: unknown) => {
      conditions.push(`${expr} $${idx}`);
      params.push(value);
      idx += 1;
    };

  let baseSql = '';
  let whereDateCol = '';
  let totalSql = '';
  let selectSql = '';

  const kpisResponse = await maybeHandleKpisView({
    searchParams,
    parsed: { view, de, ate, status, cliente_id, fornecedor_id, valor_min, valor_max, conta_id, categoria_id, tipo, page, pageSize, offset, orderBy, orderDir },
  });
  if (kpisResponse) return kpisResponse;

    if (view === 'aging') {
      return Response.json({ success: false, message: 'View removida (lancamentos_financeiros descontinuado)' }, { status: 410 });
    } else if (view === 'cashflow-realized') {
      return Response.json({ success: false, message: 'View removida (lancamentos_financeiros descontinuado)' }, { status: 410 });
    } else if (view === 'cashflow-projected') {
      return Response.json({ success: false, message: 'View removida (lancamentos_financeiros descontinuado)' }, { status: 410 });
    } else if (view === 'top-despesas') {
      return Response.json({ success: false, message: 'View removida (lancamentos_financeiros descontinuado)' }, { status: 410 });
    } else if (view === 'top-receitas') {
      return Response.json({ success: false, message: 'View removida (lancamentos_financeiros descontinuado)' }, { status: 410 });
    } else if (view === 'top-receitas-centro-lucro') {
      return Response.json({ success: false, message: 'View removida (lancamentos_financeiros descontinuado)' }, { status: 410 });
    } else if (view === 'contas-a-pagar') {
      // Contas a Pagar — somente CABEÇALHOS (query fornecida)
      const headerSql = `
SELECT
  cp.id                                AS conta_pagar_id,

  cp.numero_documento,
  cp.tipo_documento,
  cp.status,
  cp.data_documento,
  cp.data_lancamento,
  cp.data_vencimento,

  f.id                                 AS fornecedor_id,
  f.nome_fantasia                      AS fornecedor,
  f.imagem_url                         AS fornecedor_imagem_url,

  cat_h.nome                           AS categoria_despesa,

  dep_h.nome                           AS departamento,
  cc_h.nome                            AS centro_custo,
  fil.nome                             AS filial,
  un.nome                              AS unidade_negocio,

  cp.valor_bruto,
  cp.valor_desconto,
  cp.valor_impostos,
  cp.valor_liquido,

  cp.observacao                        AS descricao

FROM financeiro.contas_pagar cp

LEFT JOIN entidades.fornecedores f
       ON f.id = cp.fornecedor_id

LEFT JOIN financeiro.categorias_despesa cat_h
       ON cat_h.id = cp.categoria_despesa_id

LEFT JOIN empresa.departamentos dep_h
       ON dep_h.id = cp.departamento_id

LEFT JOIN empresa.centros_custo cc_h
       ON cc_h.id = cp.centro_custo_id

LEFT JOIN empresa.filiais fil
       ON fil.id = cp.filial_id

LEFT JOIN empresa.unidades_negocio un
       ON un.id = cp.unidade_negocio_id

ORDER BY
  cp.data_vencimento DESC,
  cp.id DESC
      `.replace(/\n\s+/g, ' ').trim()

      const rows = await runQuery<Record<string, unknown>>(headerSql, [])
      const total = rows.length
      return Response.json({ success: true, view, page, pageSize, total, rows, sql: headerSql, params: '[]' }, { headers: { 'Cache-Control': 'no-store' } })
    } else if (view === 'contas-a-pagar-cabecalhos' || view === 'contas-a-pagar-cabecalhos') {
      // Contas a Pagar — Cabeçalhos (query solicitada)
      try {
        const sql = `
SELECT
  cp.id                                AS conta_pagar_id,

  cp.numero_documento,
  cp.tipo_documento,
  cp.status,
  cp.data_documento,
  cp.data_lancamento,
  cp.data_vencimento,

  f.id                                 AS fornecedor_id,
  f.nome_fantasia                      AS fornecedor,
  f.imagem_url                         AS fornecedor_imagem_url,

  cat_h.nome                           AS categoria_despesa,

  dep_h.nome                           AS departamento,
  cc_h.nome                            AS centro_custo,
  fil.nome                             AS filial,
  un.nome                              AS unidade_negocio,

  cp.valor_bruto,
  cp.valor_desconto,
  cp.valor_impostos,
  cp.valor_liquido,

  cp.observacao                        AS descricao

FROM financeiro.contas_pagar cp

LEFT JOIN entidades.fornecedores f
       ON f.id = cp.fornecedor_id

LEFT JOIN financeiro.categorias_despesa cat_h
       ON cat_h.id = cp.categoria_despesa_id

LEFT JOIN empresa.departamentos dep_h
       ON dep_h.id = cp.departamento_id

LEFT JOIN empresa.centros_custo cc_h
       ON cc_h.id = cp.centro_custo_id

LEFT JOIN empresa.filiais fil
       ON fil.id = cp.filial_id

LEFT JOIN empresa.unidades_negocio un
       ON un.id = cp.unidade_negocio_id

ORDER BY
  cp.data_vencimento DESC,
  cp.id DESC;`.replace(/\n\s+/g, ' ').trim()

        const rows = await runQuery<Record<string, unknown>>(sql, [])
        const total = rows.length
        return Response.json({ success: true, view, page, pageSize, total, rows, sql, params: '[]' }, { headers: { 'Cache-Control': 'no-store' } })
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        return Response.json({ success: false, message: msg }, { status: 400 })
      }
    } else if (view === 'pagamentos-efetuados') {
      // Pagamentos Efetuados — query solicitada (pe/pel/cp/f/cf/mp)
      const sql = `
SELECT
  pe.id                               AS pagamento_id,

  pe.numero_pagamento,
  pe.status,
  pe.data_pagamento,
  pe.data_lancamento,

  f.nome_fantasia                     AS fornecedor,

  cf.nome_conta                       AS conta_financeira,
  mp.nome                             AS metodo_pagamento,

  pe.valor_total_pagamento,

  pe.observacao

FROM financeiro.pagamentos_efetuados pe

-- ligações para descobrir o fornecedor
LEFT JOIN financeiro.pagamentos_efetuados_linhas pel
       ON pel.pagamento_id = pe.id

LEFT JOIN financeiro.contas_pagar cp
       ON cp.id = pel.conta_pagar_id

LEFT JOIN entidades.fornecedores f
       ON f.id = cp.fornecedor_id

-- banco / método
LEFT JOIN financeiro.contas_financeiras cf
       ON cf.id = pe.conta_financeira_id

LEFT JOIN financeiro.metodos_pagamento mp
       ON mp.id = pe.metodo_pagamento_id

GROUP BY
  pe.id,
  pe.numero_pagamento,
  pe.status,
  pe.data_pagamento,
  pe.data_lancamento,
  f.nome_fantasia,
  cf.nome_conta,
  mp.nome,
  pe.valor_total_pagamento,
  pe.observacao

ORDER BY
  pe.data_pagamento DESC,
  pe.id DESC`.replace(/\n\s+/g, ' ').trim()

      const rows = await runQuery<Record<string, unknown>>(sql, [])
      const total = rows.length
      return Response.json({ success: true, view, page, pageSize, total, rows, sql, params: '[]' }, { headers: { 'Cache-Control': 'no-store' } })
    } else if (view === 'contas-a-receber') {
      // Contas a Receber — query atualizada (inclui centro_lucro e remove centro_custo)
      const sql = `
SELECT
  cr.id                                AS conta_receber_id,

  cr.numero_documento,
  cr.tipo_documento,
  cr.status,
  cr.data_documento,
  cr.data_lancamento,
  cr.data_vencimento,

  cli.id                               AS cliente_id,
  cli.nome_fantasia                    AS cliente,
  cli.imagem_url                       AS cliente_imagem_url,

  cat_h.nome                           AS categoria_financeira,
  cat_r.nome                           AS categoria_receita,

  dep_h.nome                           AS departamento,
  cl.nome                              AS centro_lucro,
  fil.nome                             AS filial,
  un.nome                              AS unidade_negocio,

  cr.valor_bruto,
  cr.valor_desconto,
  cr.valor_impostos,
  cr.valor_liquido,

  cr.observacao                        AS descricao

FROM financeiro.contas_receber cr

LEFT JOIN entidades.clientes cli
       ON cli.id = cr.cliente_id

LEFT JOIN financeiro.categorias_financeiras cat_h
       ON cat_h.id = cr.categoria_financeira_id

LEFT JOIN financeiro.categorias_receita cat_r
       ON cat_r.id = cr.categoria_receita_id

LEFT JOIN empresa.departamentos dep_h
       ON dep_h.id = cr.departamento_id

LEFT JOIN empresa.centros_lucro cl
       ON cl.id = cr.centro_lucro_id

LEFT JOIN empresa.filiais fil
       ON fil.id = cr.filial_id

LEFT JOIN empresa.unidades_negocio un
       ON un.id = cr.unidade_negocio_id

ORDER BY
  cr.data_vencimento DESC,
  cr.id DESC`.replace(/\n\s+/g, ' ').trim()

      const rows = await runQuery<Record<string, unknown>>(sql, [])
      const total = rows.length
      return Response.json({ success: true, view, page, pageSize, total, rows, sql, params: '[]' }, { headers: { 'Cache-Control': 'no-store' } })
    } else if (view === 'top5-ap') {
      // Top 5 por Contas a Pagar em aberto (status='aberto')
      const dim = (searchParams.get('dim') || '').toLowerCase(); // fornecedor | centro_custo | filial | categoria | titulo
      const limit = Math.max(1, Math.min(50, parseNumber(searchParams.get('limit'), 5) || 5));
      const tenantId = parseNumber(searchParams.get('tenant_id'));

      const params: unknown[] = []
      let idx = 1
      const filtros: string[] = []
      const statusParam = (searchParams.get('status') || 'aberto').toLowerCase()
      if (statusParam === 'aberto') {
        filtros.push(`LOWER(cp.status) IN ('aberto','pendente','em_aberto','em aberto')`)
      } else {
        filtros.push(`LOWER(cp.status) = $${idx++}`)
        params.push(statusParam)
      }
      if (de) { filtros.push(`cp.data_vencimento >= $${idx++}`); params.push(de) }
      if (ate) { filtros.push(`cp.data_vencimento <= $${idx++}`); params.push(ate) }
      if (tenantId) { filtros.push(`cp.tenant_id = $${idx++}`); params.push(tenantId) }
      const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : ''

      if (dim === 'titulo') {
        // Top 5 títulos (individuais)
        const sql = `
          SELECT cp.id AS conta_pagar_id,
                 COALESCE(NULLIF(TRIM(cp.numero_documento), ''), CONCAT('Conta #', cp.id::text)) AS label,
                 cp.valor_liquido AS total
            FROM financeiro.contas_pagar cp
            ${where}
           ORDER BY cp.valor_liquido DESC NULLS LAST
           LIMIT ${limit}
        `.replace(/\n\s+/g, ' ').trim()
        const rows = await runQuery<{ conta_pagar_id: number; label: string; total: number | null }>(sql, params)
        return Response.json({ success: true, dim: 'titulo', rows, sql_query: sql, sql_params: params })
      }

      // Agrupados por dimensão
      let labelExpr = ''
      if (dim === 'fornecedor') labelExpr = "COALESCE(f.nome_fantasia, 'Sem fornecedor')"
      else if (dim === 'centro_custo' || dim === 'centro-custo') labelExpr = "COALESCE(cc.nome, 'Sem centro de custo')"
      else if (dim === 'filial') labelExpr = "COALESCE(fil.nome, 'Sem filial')"
      else if (dim === 'categoria') labelExpr = "COALESCE(cat.nome, 'Sem categoria')"
      else if (dim === 'departamento') labelExpr = "COALESCE(dep.nome, 'Sem departamento')"
      else if (dim === 'unidade_negocio' || dim === 'unidade-negocio') labelExpr = "COALESCE(un.nome, 'Sem unidade')"
      else {
        return Response.json({ success: false, message: "Parâmetro 'dim' inválido. Use 'fornecedor' | 'centro_custo' | 'filial' | 'categoria' | 'departamento' | 'unidade_negocio' | 'titulo'" }, { status: 400 })
      }

      const sql = `
        SELECT ${labelExpr} AS label,
               COALESCE(SUM(cp.valor_liquido), 0) AS total
          FROM financeiro.contas_pagar cp
          LEFT JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
          LEFT JOIN empresa.centros_custo cc ON cc.id = cp.centro_custo_id
          LEFT JOIN empresa.departamentos dep ON dep.id = cp.departamento_id
          LEFT JOIN empresa.unidades_negocio un ON un.id = cp.unidade_negocio_id
          LEFT JOIN empresa.filiais fil ON fil.id = cp.filial_id
          LEFT JOIN financeiro.categorias_despesa cat ON cat.id = cp.categoria_despesa_id
          ${where}
         GROUP BY 1
         ORDER BY total DESC NULLS LAST
         LIMIT ${limit}
      `.replace(/\n\s+/g, ' ').trim()
      const rows = await runQuery<{ label: string; total: number | null }>(sql, params)
      return Response.json({ success: true, dim, rows, sql_query: sql, sql_params: params })

    } else if (view === 'top5-ar') {
      // Top 5 por Contas a Receber (status='aberto') – categorias de receita e centros de lucro
      const dim = (searchParams.get('dim') || '').toLowerCase(); // categoria | categoria_receita | centro_lucro
      const limit = Math.max(1, Math.min(50, parseNumber(searchParams.get('limit'), 5) || 5));
      const tenantId = parseNumber(searchParams.get('tenant_id'));

      const params: unknown[] = []
      let idx = 1
      const filtros: string[] = []
      const statusParam = (searchParams.get('status') || 'aberto').toLowerCase()
      if (statusParam === 'aberto') {
        filtros.push(`LOWER(cr.status) IN ('aberto','pendente','em_aberto','em aberto')`)
      } else {
        filtros.push(`LOWER(cr.status) = $${idx++}`)
        params.push(statusParam)
      }
      if (de) { filtros.push(`cr.data_vencimento >= $${idx++}`); params.push(de) }
      if (ate) { filtros.push(`cr.data_vencimento <= $${idx++}`); params.push(ate) }
      if (tenantId) { filtros.push(`cr.tenant_id = $${idx++}`); params.push(tenantId) }
      const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : ''

      let labelExpr = ''
      if (dim === 'categoria' || dim === 'categoria_receita') labelExpr = "COALESCE(cat.nome, 'Sem categoria')"
      else if (dim === 'centro_lucro' || dim === 'centro-lucro') labelExpr = "COALESCE(cl.nome, 'Sem centro de lucro')"
      else {
        return Response.json({ success: false, message: "Parâmetro 'dim' inválido. Use 'categoria' | 'centro_lucro'" }, { status: 400 })
      }

      const sql = `
        SELECT ${labelExpr} AS label,
               COALESCE(SUM(cr.valor_liquido), 0) AS total
          FROM financeiro.contas_receber cr
          LEFT JOIN financeiro.categorias_receita cat ON cat.id = cr.categoria_receita_id
          LEFT JOIN empresa.centros_lucro cl ON cl.id = cr.centro_lucro_id
          ${where}
         GROUP BY 1
         ORDER BY total DESC NULLS LAST
         LIMIT ${limit}
      `.replace(/\n\s+/g, ' ').trim()
      const rows = await runQuery<{ label: string; total: number | null }>(sql, params)
      return Response.json({ success: true, dim, rows, sql_query: sql, sql_params: params })

    } else if (view === 'pagamentos-recebidos') {
      // Pagamentos Recebidos — query fornecida (pr/prl/cr/cli/cf/mp)
      const sql = `
SELECT
  pr.id                               AS pagamento_recebido_id,

  pr.numero_pagamento,
  pr.status,
  pr.data_recebimento,
  pr.data_lancamento,

  cli.nome_fantasia                   AS cliente,

  cf.nome_conta                       AS conta_financeira,
  mp.nome                             AS metodo_pagamento,

  pr.valor_total_recebido,

  pr.observacao

FROM financeiro.pagamentos_recebidos pr

-- ligações para descobrir o cliente (vem das linhas)
LEFT JOIN financeiro.pagamentos_recebidos_linhas prl
       ON prl.pagamento_id = pr.id

LEFT JOIN financeiro.contas_receber cr
       ON cr.id = prl.conta_receber_id

LEFT JOIN entidades.clientes cli
       ON cli.id = cr.cliente_id

-- banco / método
LEFT JOIN financeiro.contas_financeiras cf
       ON cf.id = pr.conta_financeira_id

LEFT JOIN financeiro.metodos_pagamento mp
       ON mp.id = pr.metodo_pagamento_id

GROUP BY
  pr.id,
  pr.numero_pagamento,
  pr.status,
  pr.data_recebimento,
  pr.data_lancamento,
  cli.nome_fantasia,
  cf.nome_conta,
  mp.nome,
  pr.valor_total_recebido,
  pr.observacao

ORDER BY
  pr.data_recebimento DESC,
  pr.id DESC`.replace(/\n\s+/g, ' ').trim()

      const rows = await runQuery<Record<string, unknown>>(sql, [])
      const total = rows.length
      return Response.json({ success: true, view, page, pageSize, total, rows, sql, params: '[]' }, { headers: { 'Cache-Control': 'no-store' } })
    } else if (view === 'extrato') {
      baseSql = `FROM financeiro.extratos_bancarios eb
                 LEFT JOIN financeiro.extrato_transacoes t ON t.extrato_id = eb.id
                 LEFT JOIN financeiro.contas_financeiras cf ON cf.id = eb.conta_financeira_id
                 LEFT JOIN financeiro.bancos b ON b.id = eb.conta_id`;
      selectSql = `SELECT eb.id AS extrato_id,
                          eb.data_extrato,
                          b.nome_banco AS banco,
                          b.id AS banco_id,
                          b.imagem_url AS banco_imagem_url,
                          cf.nome_conta AS conta_financeira,
                          cf.tipo_conta,
                          eb.saldo_inicial,
                          eb.total_creditos,
                          eb.total_debitos,
                          eb.saldo_final,
                          eb.status,
                          t.id AS transacao_id,
                          t.data_transacao,
                          t.tipo AS tipo_transacao,
                          t.descricao AS descricao_transacao,
                          t.valor AS valor_transacao,
                          t.origem AS origem_transacao,
                          t.conciliado AS transacao_conciliada`;
      whereDateCol = 'eb.data_extrato';
    } else if (view === 'conciliacao') {
      baseSql = `FROM financeiro.conciliacao_bancaria cb
                 LEFT JOIN financeiro.contas_financeiras cf ON cf.id = cb.conta_id
                 LEFT JOIN financeiro.bancos b ON b.id = cf.banco_id`;
      selectSql = `SELECT cb.id AS conciliacao_id,
                          cb.periodo_inicio,
                          cb.periodo_fim,
                          b.nome_banco AS banco,
                          cf.nome_conta AS conta_financeira,
                          cf.tipo_conta,
                          cb.saldo_inicial,
                          cb.saldo_extrato,
                          cb.saldo_sistema,
                          cb.diferenca,
                          cb.status,
                          cb.criado_em`;
      whereDateCol = 'cb.periodo_fim';
    } else if (view === 'bancos') {
      baseSql = `FROM financeiro.bancos b`;
      selectSql = `SELECT b.id AS banco_id,
                          b.nome_banco,
                          b.numero_banco,
                          b.agencia,
                          b.endereco,
                          b.imagem_url,
                          b.criado_em,
                          b.atualizado_em`;
      whereDateCol = 'b.criado_em';
    } else if (view === 'contas') {
      baseSql = `FROM financeiro.contas_financeiras cf`;
      selectSql = `SELECT cf.id AS conta_id,
                          cf.nome_conta,
                          cf.tipo_conta,
                          cf.agencia,
                          cf.numero_conta,
                          cf.pix_chave,
                          cf.saldo_inicial,
                          cf.saldo_atual,
                          cf.data_abertura,
                          cf.ativo,
                          cf.criado_em,
                          cf.atualizado_em`;
      whereDateCol = 'cf.criado_em';
    } else if (view === 'contas-financeiras') {
      // Contas Financeiras (categorias -> Contas Financeiras)
      baseSql = `FROM financeiro.contas_financeiras cf`;
      selectSql = `SELECT cf.id AS conta_id,
                          cf.tenant_id,
                          cf.criado_por,
                          cf.banco_id,
                          cf.nome_conta,
                          cf.tipo_conta,
                          cf.agencia,
                          cf.numero_conta,
                          cf.pix_chave,
                          cf.moeda_id,
                          cf.saldo_inicial,
                          cf.saldo_atual,
                          cf.data_abertura,
                          cf.ativo,
                          cf.criado_em,
                          cf.atualizado_em,
                          cf.conta_contabil_id`;
      whereDateCol = 'cf.criado_em';
    } else if (view === 'categorias') {
      baseSql = `FROM financeiro.categorias_financeiras cat`;
      selectSql = `SELECT cat.id,
                          cat.tenant_id,
                          cat.criado_por,
                          cat.nome,
                          cat.tipo,
                          cat.descricao,
                          cat.ativo,
                          cat.criado_em,
                          cat.atualizado_em,
                          cat.conta_contabil_id`;
      whereDateCol = 'cat.criado_em';
    } else if (view === 'centros-de-custo') {
      baseSql = `FROM financeiro.centros_custo cc`;
      selectSql = `SELECT cc.id,
                          cc.tenant_id,
                          cc.codigo,
                          cc.nome,
                          cc.descricao,
                          cc.ativo,
                          cc.criado_em,
                          cc.atualizado_em`;
      whereDateCol = 'cc.criado_em';
    } else if (view === 'centros-de-lucro') {
      baseSql = `FROM financeiro.centros_lucro cl`;
      selectSql = `SELECT cl.id,
                          cl.tenant_id,
                          cl.codigo,
                          cl.nome,
                          cl.descricao,
                          cl.ativo,
                          cl.criado_em,
                          cl.atualizado_em`;
      whereDateCol = 'cl.criado_em';
    } else if (view === 'categorias-despesa') {
      baseSql = `FROM financeiro.categorias_despesa cd
                 LEFT JOIN contabilidade.plano_contas pc ON pc.id = cd.plano_conta_id`;
      selectSql = `SELECT cd.id,
                          cd.codigo,
                          cd.nome,
                          cd.descricao,
                          cd.tipo,
                          cd.natureza,
                          cd.categoria_pai_id,
                          cd.plano_conta_id,
                          pc.codigo AS plano_conta_codigo,
                          pc.nome AS plano_conta_nome,
                          cd.criado_em,
                          cd.atualizado_em`;
      whereDateCol = 'cd.criado_em';
    } else if (view === 'categorias-receita') {
      baseSql = `FROM financeiro.categorias_receita cr
                 LEFT JOIN contabilidade.plano_contas pc ON pc.id = cr.plano_conta_id`;
      selectSql = `SELECT cr.id,
                          cr.codigo,
                          cr.nome,
                          cr.descricao,
                          cr.tipo,
                          cr.natureza,
                          cr.plano_conta_id,
                          pc.codigo AS plano_conta_codigo,
                          pc.nome AS plano_conta_nome,
                          cr.ativo,
                          cr.criado_em,
                          cr.atualizado_em`;
      whereDateCol = 'cr.criado_em';
    } else if (view === 'projetos') {
      baseSql = `FROM financeiro.projetos p`;
      selectSql = `SELECT p.id,
                          p.tenant_id,
                          p.codigo,
                          p.nome,
                          p.data_inicio,
                          p.data_fim,
                          p.status,
                          p.descricao,
                          p.ativo,
                          p.criado_em,
                          p.atualizado_em`;
      whereDateCol = 'p.data_inicio';
    } else if (view === 'movimentos') {
      baseSql = `FROM financeiro.movimentos m
                 LEFT JOIN financeiro.contas_financeiras cf
                   ON cf.id = COALESCE(m.conta_financeira_id, m.conta_id)`;
      selectSql = `SELECT m.id,
                          m.data_movimento AS data,
                          CASE
                            WHEN LOWER(COALESCE(m.tipo, '')) IN ('entrada','in') THEN 'entrada'
                            WHEN LOWER(COALESCE(m.tipo, '')) IN ('saida','saída','out') THEN 'saída'
                            WHEN m.valor > 0 THEN 'entrada'
                            ELSE 'saída'
                          END AS tipo,
                          m.valor,
                          NULL::bigint AS categoria_id,
                          NULL::text AS categoria_nome,
                          COALESCE(m.conta_financeira_id, m.conta_id) AS conta_id,
                          COALESCE(cf.nome_conta, 'Sem conta') AS conta_nome,
                          NULL::bigint AS centro_custo_id`;
      whereDateCol = 'm.data_movimento';
      if (conta_id) push('COALESCE(m.conta_financeira_id, m.conta_id) =', conta_id);
      if (tipo === 'entrada') conditions.push(`LOWER(COALESCE(m.tipo, CASE WHEN m.valor > 0 THEN 'entrada' ELSE 'saida' END)) IN ('entrada','in')`);
      if (tipo === 'saída' || tipo === 'saida') conditions.push(`LOWER(COALESCE(m.tipo, CASE WHEN m.valor > 0 THEN 'entrada' ELSE 'saida' END)) IN ('saida','saída','out')`);
      if (valor_min !== undefined) push('m.valor >=', valor_min);
      if (valor_max !== undefined) push('m.valor <=', valor_max);
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 });
    }

    // Para outras views, aplicar filtros de data depois de montar os blocos
    if ((view as string) !== 'contas-a-pagar') {
      if (de) push(`${whereDateCol} >=`, de);
      if (ate) push(`${whereDateCol} <=`, ate);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    let orderClause: string
    if (orderBy) {
      orderClause = `ORDER BY ${orderBy} ${orderDir}`
    } else {
      switch (view) {
        case 'extrato':
          orderClause = 'ORDER BY eb.id ASC, t.data_transacao ASC'
          break
        case 'conciliacao':
          orderClause = 'ORDER BY cb.periodo_fim DESC'
          break
        case 'bancos':
          orderClause = 'ORDER BY b.nome_banco ASC'
          break
        case 'contas':
          orderClause = 'ORDER BY cf.id ASC'
          break
        case 'contas-financeiras':
          orderClause = 'ORDER BY cf.nome_conta ASC'
          break
        case 'categorias':
          orderClause = 'ORDER BY cat.tipo ASC, cat.nome ASC'
          break
        case 'centros-de-custo':
          orderClause = 'ORDER BY cc.codigo ASC'
          break
        case 'centros-de-lucro':
          orderClause = 'ORDER BY cl.codigo ASC'
          break
        case 'projetos':
          orderClause = 'ORDER BY p.data_inicio DESC'
          break
        case 'categorias-despesa':
          orderClause = 'ORDER BY cd.tipo ASC, cd.nome ASC'
          break
        case 'categorias-receita':
          orderClause = 'ORDER BY cr.tipo ASC, cr.nome ASC'
          break
        default:
          orderClause = `ORDER BY ${whereDateCol} DESC`
      }
    }
    const limitOffsetClause = `LIMIT $${idx}::int OFFSET $${idx + 1}::int`;
    const paramsWithPage = [...params, pageSize, offset];

    const listSql = `${selectSql}
                     ${baseSql}
                     ${whereClause}
                     ${orderClause}
                     ${limitOffsetClause}`.replace(/\s+$/m, '').trim();

    const rows = await runQuery<Record<string, unknown>>(listSql, paramsWithPage);

    totalSql = `SELECT COUNT(*)::int AS total ${baseSql} ${whereClause}`;
    const totalRows = await runQuery<{ total: number }>(totalSql, params);
    const total = totalRows[0]?.total ?? 0;

    return Response.json({
      success: true,
      view,
      page,
      pageSize,
      total,
      rows,
      sql: listSql,
      params: JSON.stringify(paramsWithPage),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('📊 API /api/modulos/financeiro error:', error);
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
