import { NextRequest } from 'next/server';
import { runQuery } from '@/lib/postgres';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Safeguard: whitelist order by columns per view
const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  'contas-a-pagar': {
    lancamento_id: 'lf.id',
    descricao: 'lf.descricao',
    descricao_lancamento: 'lf.descricao',
    valor_total: 'lf.valor',
    data_lancamento: 'lf.data_lancamento',
    data_vencimento: 'lf.data_vencimento',
    status: 'lf.status',
    categoria_financeira: 'cf.nome',
    categoria_nome: 'cf.nome',
    natureza_nome: 'nf.nome',
    natureza_tipo: 'nf.tipo',
    fornecedor: 'f.nome',
    centro_custo: 'cc.nome',
  },
  'contas-a-receber': {
    id: 'lf.id',
    cliente: 'c.nome',
    data_lancamento: 'lf.data_lancamento',
    data_vencimento: 'lf.data_vencimento',
    valor_total: 'lf.valor',
    status: 'lf.status',
  },
  'pagamentos-efetuados': {
    id: 'lf.id',
    descricao_pagamento: 'lf.descricao',
    valor_pago: 'lf.valor',
    data_pagamento: 'lf.data_lancamento',
    data_vencimento: 'lf.data_vencimento',
    status: 'lf.status',
    fornecedor: 'forn.nome',
    categoria_financeira: 'cat.nome',
    conta_financeira: 'cf.nome_conta',
    metodo_pagamento: 'mp.nome',
    centro_custo: 'cc.nome',
    departamento: 'dep.nome',
    filial: 'fil.nome',
    projeto: 'prj.nome',
  },
  'pagamentos-recebidos': {
    id: 'lf.id',
    cliente: 'cli.nome',
    data_lancamento: 'lf.data_lancamento',
    data_recebimento: 'lf.data_lancamento',
    valor: 'lf.valor',
    valor_total: 'lf.valor',
    status: 'lf.status',
    conta_financeira: 'cf.nome_conta',
    categoria: 'cat.nome',
    categoria_financeira: 'cat.nome',
    metodo_pagamento: 'mp.nome',
    centro_lucro: 'cl.nome',
    departamento: 'dep.nome',
    filial: 'fil.nome',
    projeto: 'prj.nome',
    natureza_financeira: 'nf.nome',
  },
  conciliacao: {
    conciliacao_id: 'cb.id',
    periodo_inicio: 'cb.periodo_inicio',
    periodo_fim: 'cb.periodo_fim',
    banco: 'b.nome_banco',
    conta_financeira: 'cf.nome_conta',
    tipo_conta: 'cf.tipo_conta',
    saldo_inicial: 'cb.saldo_inicial',
    saldo_extrato: 'cb.saldo_extrato',
    saldo_sistema: 'cb.saldo_sistema',
    diferenca: 'cb.diferenca',
    status: 'cb.status',
    criado_em: 'cb.criado_em',
  },
  'extrato': {
    extrato_id: 'eb.id',
    data_extrato: 'eb.data_extrato',
    banco: 'b.nome_banco',
    conta_financeira: 'cf.nome_conta',
    tipo_conta: 'cf.tipo_conta',
    saldo_inicial: 'eb.saldo_inicial',
    total_creditos: 'eb.total_creditos',
    total_debitos: 'eb.total_debitos',
    saldo_final: 'eb.saldo_final',
    status: 'eb.status',
    transacao_id: 't.id',
    data_transacao: 't.data_transacao',
    tipo_transacao: 't.tipo',
    valor_transacao: 't.valor',
    origem_transacao: 't.origem',
    transacao_conciliada: 't.conciliado',
  },
  bancos: {
    banco_id: 'b.id',
    nome_banco: 'b.nome_banco',
    numero_banco: 'b.numero_banco',
    agencia: 'b.agencia',
    endereco: 'b.endereco',
    criado_em: 'b.criado_em',
    atualizado_em: 'b.atualizado_em',
  },
  contas: {
    conta_id: 'cf.id',
    nome_conta: 'cf.nome_conta',
    tipo_conta: 'cf.tipo_conta',
    agencia: 'cf.agencia',
    numero_conta: 'cf.numero_conta',
    pix_chave: 'cf.pix_chave',
    saldo_inicial: 'cf.saldo_inicial',
    saldo_atual: 'cf.saldo_atual',
    data_abertura: 'cf.data_abertura',
    ativo: 'cf.ativo',
    criado_em: 'cf.criado_em',
    atualizado_em: 'cf.atualizado_em',
  },
  'contas-financeiras': {
    conta_id: 'cf.id',
    nome_conta: 'cf.nome_conta',
    tipo_conta: 'cf.tipo_conta',
    agencia: 'cf.agencia',
    numero_conta: 'cf.numero_conta',
    pix_chave: 'cf.pix_chave',
    saldo_inicial: 'cf.saldo_inicial',
    saldo_atual: 'cf.saldo_atual',
    data_abertura: 'cf.data_abertura',
    ativo: 'cf.ativo',
    criado_em: 'cf.criado_em',
    atualizado_em: 'cf.atualizado_em',
  },
  categorias: {
    id: 'cat.id',
    nome: 'cat.nome',
    tipo: 'cat.tipo',
    descricao: 'cat.descricao',
    ativo: 'cat.ativo',
    criado_em: 'cat.criado_em',
    atualizado_em: 'cat.atualizado_em',
  },
  'centros-de-custo': {
    id: 'cc.id',
    codigo: 'cc.codigo',
    nome: 'cc.nome',
    descricao: 'cc.descricao',
    ativo: 'cc.ativo',
    criado_em: 'cc.criado_em',
    atualizado_em: 'cc.atualizado_em',
  },
  'centros-de-lucro': {
    id: 'cl.id',
    codigo: 'cl.codigo',
    nome: 'cl.nome',
    descricao: 'cl.descricao',
    ativo: 'cl.ativo',
    criado_em: 'cl.criado_em',
    atualizado_em: 'cl.atualizado_em',
  },
  projetos: {
    id: 'p.id',
    codigo: 'p.codigo',
    nome: 'p.nome',
    data_inicio: 'p.data_inicio',
    data_fim: 'p.data_fim',
    status: 'p.status',
    descricao: 'p.descricao',
    ativo: 'p.ativo',
    criado_em: 'p.criado_em',
    atualizado_em: 'p.atualizado_em',
  },
  movimentos: {
    id: 'm.id',
    data: 'm.data',
    valor: 'm.valor',
  },
};

const parseNumber = (v: string | null, fallback?: number) => (v ? Number(v) : fallback);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const view = (searchParams.get('view') || '').toLowerCase();
    if (!view) {
      return Response.json({ success: false, message: 'Parâmetro view é obrigatório' }, { status: 400 });
    }

    // Common filters
    const de = searchParams.get('de') || undefined; // YYYY-MM-DD
    const ate = searchParams.get('ate') || undefined; // YYYY-MM-DD
    const status = searchParams.get('status') || undefined;
    const cliente_id = searchParams.get('cliente_id') || undefined;
    const fornecedor_id = searchParams.get('fornecedor_id') || undefined;
    const valor_min = parseNumber(searchParams.get('valor_min'));
    const valor_max = parseNumber(searchParams.get('valor_max'));
    const conta_id = searchParams.get('conta_id') || undefined;
    const categoria_id = searchParams.get('categoria_id') || undefined;
    const tipo = searchParams.get('tipo') || undefined; // entrada | saída (movimentos)

    // Pagination
    const page = Math.max(1, parseNumber(searchParams.get('page'), 1) || 1);
    const pageSize = Math.max(1, Math.min(1000, parseNumber(searchParams.get('pageSize'), 1000) || 1000));
    const offset = (page - 1) * pageSize;

    // Sorting
    const orderByParam = (searchParams.get('order_by') || '').toLowerCase();
    const orderDirParam = (searchParams.get('order_dir') || 'desc').toLowerCase();
    const orderWhitelist = ORDER_BY_WHITELIST[view] || {};
    const orderBy = orderWhitelist[orderByParam] || undefined;
    const orderDir = orderDirParam === 'asc' ? 'ASC' : 'DESC';

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

    if (view === 'contas-a-pagar') {
      // Contas a Pagar – query mais completa, mantendo campos esperados pela UI
      baseSql = `FROM financeiro.lancamentos_financeiros lf
                 LEFT JOIN financeiro.categorias_financeiras cf ON cf.id = lf.categoria_id
                 LEFT JOIN financeiro.naturezas_financeiras nf ON nf.id = cf.natureza_id
                 LEFT JOIN empresa.centros_custo cc ON cc.id = lf.centro_custo_id
                 LEFT JOIN entidades.fornecedores f ON f.id = lf.entidade_id
                 LEFT JOIN empresa.centros_lucro cl ON cl.id = lf.centro_lucro_id
                 LEFT JOIN empresa.departamentos dp ON dp.id = lf.departamento_id
                 LEFT JOIN empresa.filiais fl ON fl.id = lf.filial_id
                 LEFT JOIN financeiro.projetos pj ON pj.id = lf.projeto_id`;
      selectSql = `SELECT
                        lf.id AS lancamento_id,
                        lf.id AS conta_id,
                        lf.entidade_id AS fornecedor_id,
                        lf.descricao AS descricao,
                        lf.data_lancamento,
                        lf.data_vencimento,
                        lf.valor AS valor_total,
                        lf.status,

                        cf.nome AS categoria_nome,
                        nf.nome AS natureza_nome,
                        nf.tipo AS natureza_tipo,
                        cf.nome AS fornecedor_categoria,
                        cc.nome AS centro_custo_nome,
                        f.nome AS fornecedor,
                        f.imagem_url AS fornecedor_imagem_url,
                        cl.nome AS centro_lucro_nome,
                        dp.nome AS departamento_nome,
                        fl.nome AS filial_nome,
                        pj.nome AS projeto_nome`;
      whereDateCol = 'lf.data_vencimento';
      conditions.push(`LOWER(lf.tipo) = 'conta_a_pagar'`);
      if (fornecedor_id) push('lf.entidade_id =', fornecedor_id);
      if (status) push('LOWER(lf.status) =', status.toLowerCase());
      if (valor_min !== undefined) push('lf.valor >=', valor_min);
      if (valor_max !== undefined) push('lf.valor <=', valor_max);
      if (de) push(`${whereDateCol} >=`, de);
      if (ate) push(`${whereDateCol} <=`, ate);
    } else if (view === 'pagamentos-efetuados') {
      // Pagamentos Efetuados – query mais completa conforme solicitado
      baseSql = `FROM financeiro.lancamentos_financeiros lf
                 LEFT JOIN financeiro.metodos_pagamento mp ON mp.id = lf.metodo_pagamento_id
                 LEFT JOIN financeiro.contas_financeiras cf ON cf.id = lf.conta_financeira_id
                 LEFT JOIN financeiro.categorias_financeiras cat ON cat.id = lf.categoria_id
                 LEFT JOIN empresa.centros_custo cc ON cc.id = lf.centro_custo_id
                 LEFT JOIN empresa.departamentos dep ON dep.id = lf.departamento_id
                 LEFT JOIN empresa.filiais fil ON fil.id = lf.filial_id
                 LEFT JOIN financeiro.projetos prj ON prj.id = lf.projeto_id
                 LEFT JOIN entidades.fornecedores forn ON forn.id = lf.fornecedor_id`;
      selectSql = `SELECT
                        lf.id,
                        lf.data_lancamento AS data_pagamento,
                        lf.data_vencimento,
                        lf.valor AS valor_pago,
                        lf.descricao AS descricao_pagamento,
                        lf.status,
                        mp.nome AS metodo_pagamento,
                        cf.nome_conta AS conta_financeira,
                        cat.nome AS categoria_financeira,
                        cc.nome AS centro_custo,
                        dep.nome AS departamento,
                        fil.nome AS filial,
                        prj.nome AS projeto,
                        forn.nome AS fornecedor,
                        forn.imagem_url AS fornecedor_imagem_url`;
      whereDateCol = 'lf.data_lancamento';
      conditions.push(`lf.tipo = 'pagamento_efetuado'`);
      if (fornecedor_id) push('lf.fornecedor_id =', fornecedor_id);
      if (status) push('LOWER(lf.status) =', status.toLowerCase());
      if (valor_min !== undefined) push('lf.valor >=', valor_min);
      if (valor_max !== undefined) push('lf.valor <=', valor_max);
    } else if (view === 'pagamentos-recebidos') {
      // Pagamentos Recebidos – query completa conforme solicitado
      baseSql = `FROM financeiro.lancamentos_financeiros lf
                 LEFT JOIN financeiro.metodos_pagamento mp ON mp.id = lf.metodo_pagamento_id
                 LEFT JOIN financeiro.contas_financeiras cf ON cf.id = lf.conta_financeira_id
                 LEFT JOIN financeiro.categorias_financeiras cat ON cat.id = lf.categoria_id
                 LEFT JOIN financeiro.naturezas_financeiras nf ON nf.id = cat.natureza_id
                 LEFT JOIN empresa.centros_lucro cl ON cl.id = lf.centro_lucro_id
                 LEFT JOIN empresa.departamentos dep ON dep.id = lf.departamento_id
                 LEFT JOIN empresa.filiais fil ON fil.id = lf.filial_id
                 LEFT JOIN financeiro.projetos prj ON prj.id = lf.projeto_id
                 LEFT JOIN entidades.clientes cli ON cli.id = lf.cliente_id`;
      selectSql = `SELECT
                          lf.id,
                          lf.data_lancamento AS data_recebimento,
                          lf.data_lancamento,
                          lf.data_vencimento,
                          lf.valor AS valor_total,
                          lf.descricao AS descricao,
                          'ENTRADA' AS natureza,
                          mp.nome AS metodo_pagamento,
                          cf.nome_conta AS conta_financeira,
                          cat.nome AS categoria,
                          nf.nome AS natureza_financeira,
                          cl.nome AS centro_lucro,
                          dep.nome AS departamento,
                          fil.nome AS filial,
                          prj.nome AS projeto,
                          cli.nome AS cliente,
                          cli.imagem_url AS cliente_imagem_url,
                          cat.nome AS cliente_categoria`;
      whereDateCol = 'lf.data_lancamento';
      conditions.push(`lf.tipo = 'pagamento_recebido'`);
      if (cliente_id) push('lf.cliente_id =', cliente_id);
      if (status) push('LOWER(lf.status) =', status.toLowerCase());
      if (valor_min !== undefined) push('lf.valor >=', valor_min);
      if (valor_max !== undefined) push('lf.valor <=', valor_max);
    } else if (view === 'contas-a-receber') {
      // Contas a Receber – query mais completa, mantendo campos esperados pela UI
      baseSql = `FROM financeiro.lancamentos_financeiros lf
                 LEFT JOIN financeiro.categorias_financeiras cf ON cf.id = lf.categoria_id
                 LEFT JOIN empresa.centros_lucro cl ON cl.id = lf.centro_lucro_id
                 LEFT JOIN empresa.departamentos dp ON dp.id = lf.departamento_id
                 LEFT JOIN empresa.filiais fl ON fl.id = lf.filial_id
                 LEFT JOIN financeiro.projetos pj ON pj.id = lf.projeto_id
                 LEFT JOIN entidades.clientes c ON c.id = lf.entidade_id`;
      selectSql = `SELECT
                          lf.id AS lancamento_id,
                          lf.entidade_id AS cliente_id,
                          lf.descricao AS descricao,
                          lf.data_lancamento,
                          lf.data_vencimento,
                          lf.valor AS valor_total,
                          lf.status,

                          cf.nome AS categoria_nome,
                          cf.nome AS cliente_categoria,
                          cl.nome AS centro_lucro_nome,
                          dp.nome AS departamento_nome,
                          fl.nome AS filial_nome,
                          pj.nome AS projeto_nome,
                          c.nome AS cliente,
                          c.imagem_url AS cliente_imagem_url`;
      // Filtro principal por data: vencimento
      whereDateCol = 'lf.data_vencimento';
      conditions.push(`LOWER(lf.tipo) = 'conta_a_receber'`);
      if (cliente_id) push('lf.entidade_id =', cliente_id);
      if (status) push('LOWER(lf.status) =', status.toLowerCase());
      if (valor_min !== undefined) push('lf.valor >=', valor_min);
      if (valor_max !== undefined) push('lf.valor <=', valor_max);
    } else if (view === 'extrato') {
      baseSql = `FROM financeiro.extratos_bancarios eb
                 LEFT JOIN financeiro.extrato_transacoes t ON t.extrato_id = eb.id
                 LEFT JOIN financeiro.contas_financeiras cf ON cf.id = eb.conta_financeira_id
                 LEFT JOIN financeiro.bancos b ON b.id = eb.conta_id`;
      selectSql = `SELECT eb.id AS extrato_id,
                          eb.data_extrato,
                          b.nome_banco AS banco,
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
      baseSql = `FROM gestaofinanceira.movimentos m
                 LEFT JOIN gestaofinanceira.categorias cat ON cat.id = m.categoria_id
                 LEFT JOIN gestaofinanceira.contas c ON c.id = m.conta_id`;
      selectSql = `SELECT m.id,
                          m.data,
                          CASE WHEN m.valor > 0 THEN 'entrada' ELSE 'saída' END AS tipo,
                          m.valor,
                          m.categoria_id,
                          COALESCE(cat.nome, 'Sem categoria') AS categoria_nome,
                          m.conta_id,
                          COALESCE(c.nome, 'Sem conta') AS conta_nome,
                          m.centro_custo_id`;
      whereDateCol = 'm.data';
      if (conta_id) push('m.conta_id =', conta_id);
      if (categoria_id) push('m.categoria_id =', categoria_id);
      if (tipo === 'entrada') conditions.push('m.valor > 0');
      if (tipo === 'saída' || tipo === 'saida') conditions.push('m.valor < 0');
      if (valor_min !== undefined) push('m.valor >=', valor_min);
      if (valor_max !== undefined) push('m.valor <=', valor_max);
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 });
    }

    // Para outras views, aplicar filtros de data depois de montar os blocos
    if (view !== 'contas-a-pagar') {
      if (de) push(`${whereDateCol} >=`, de);
      if (ate) push(`${whereDateCol} <=`, ate);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    let orderClause: string
    if (orderBy) {
      orderClause = `ORDER BY ${orderBy} ${orderDir}`
    } else {
      switch (view) {
        case 'contas-a-pagar':
          orderClause = 'ORDER BY lf.data_vencimento ASC NULLS LAST, lf.id ASC'
          break
        case 'pagamentos-efetuados':
          orderClause = 'ORDER BY lf.data_lancamento DESC, lf.id DESC'
          break
        case 'pagamentos-recebidos':
          orderClause = 'ORDER BY lf.data_lancamento DESC, lf.id DESC'
          break
        case 'contas-a-receber':
          orderClause = 'ORDER BY lf.data_vencimento ASC NULLS LAST, lf.id ASC'
          break
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
