import { NextRequest } from 'next/server';
import { runQuery } from '@/lib/postgres';
import { ORDER_BY_WHITELIST } from './query/orderByWhitelist';
import { parseFinanceiroRequest } from './query/parseFinanceiroRequest';
import { maybeHandleExtratoGroupedView } from './views/extratoGrouped';
import { maybeHandleKpisView } from './views/kpis';
import { maybeHandleFinanceiroContasAPagarView } from './views/contasAPagar';
import { maybeHandleFinanceiroContasAReceberView } from './views/contasAReceber';
import { maybeHandleFinanceiroPagamentosEfetuadosView } from './views/pagamentosEfetuados';
import { maybeHandleFinanceiroPagamentosRecebidosView } from './views/pagamentosRecebidos';
import { maybeHandleFinanceiroTop5ApView } from './views/top5Ap';
import { maybeHandleFinanceiroTop5ArView } from './views/top5Ar';
import { maybeHandleFinanceiroContasAPagarCabecalhosView } from './views/contasAPagarCabecalhos';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  const contasAPagarResponse = await maybeHandleFinanceiroContasAPagarView({
    parsed: { view, de, ate, status, cliente_id, fornecedor_id, valor_min, valor_max, conta_id, categoria_id, tipo, page, pageSize, offset, orderBy, orderDir },
  });
  if (contasAPagarResponse) return contasAPagarResponse;
  const contasAReceberResponse = await maybeHandleFinanceiroContasAReceberView({
    parsed: { view, de, ate, status, cliente_id, fornecedor_id, valor_min, valor_max, conta_id, categoria_id, tipo, page, pageSize, offset, orderBy, orderDir },
  });
  if (contasAReceberResponse) return contasAReceberResponse;
  const pagamentosEfetuadosResponse = await maybeHandleFinanceiroPagamentosEfetuadosView({
    parsed: { view, de, ate, status, cliente_id, fornecedor_id, valor_min, valor_max, conta_id, categoria_id, tipo, page, pageSize, offset, orderBy, orderDir },
  });
  if (pagamentosEfetuadosResponse) return pagamentosEfetuadosResponse;
  const pagamentosRecebidosResponse = await maybeHandleFinanceiroPagamentosRecebidosView({
    parsed: { view, de, ate, status, cliente_id, fornecedor_id, valor_min, valor_max, conta_id, categoria_id, tipo, page, pageSize, offset, orderBy, orderDir },
  });
  if (pagamentosRecebidosResponse) return pagamentosRecebidosResponse;
  const top5ApResponse = await maybeHandleFinanceiroTop5ApView({
    searchParams,
    parsed: { view, de, ate, status, cliente_id, fornecedor_id, valor_min, valor_max, conta_id, categoria_id, tipo, page, pageSize, offset, orderBy, orderDir },
  });
  if (top5ApResponse) return top5ApResponse;
  const top5ArResponse = await maybeHandleFinanceiroTop5ArView({
    searchParams,
    parsed: { view, de, ate, status, cliente_id, fornecedor_id, valor_min, valor_max, conta_id, categoria_id, tipo, page, pageSize, offset, orderBy, orderDir },
  });
  if (top5ArResponse) return top5ArResponse;
  const contasAPagarCabecalhosResponse = await maybeHandleFinanceiroContasAPagarCabecalhosView({
    parsed: { view, de, ate, status, cliente_id, fornecedor_id, valor_min, valor_max, conta_id, categoria_id, tipo, page, pageSize, offset, orderBy, orderDir },
  });
  if (contasAPagarCabecalhosResponse) return contasAPagarCabecalhosResponse;

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
