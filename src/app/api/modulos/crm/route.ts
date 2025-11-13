import { NextRequest } from 'next/server';
import { runQuery } from '@/lib/postgres';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  oportunidades: {
    oportunidade: 'o.id',
    lead: 'l.nome',
    lead_empresa: 'l.empresa',
    cliente: 'cli.nome_fantasia',
    vendedor: 'f.nome',
    territorio: 't.nome',
    fase: 'fp.nome',
    ordem_fase: 'fp.ordem',
    valor_estimado: 'o.valor_estimado',
    probabilidade: 'o.probabilidade',
    data_prevista: 'o.data_prevista',
    status: 'o.status',
    criado_em: 'o.criado_em',
    atualizado_em: 'o.atualizado_em',
  },
  leads: {
    lead: 'l.id',
    nome: 'l.nome',
    empresa: 'l.empresa',
    email: 'l.email',
    telefone: 'l.telefone',
    origem: 'l.origem',
    responsavel: 'l.responsavel',
    status: 'l.status',
    tag: 'l.tag',
    criado_em: 'l.criado_em',
    atualizado_em: 'l.atualizado_em',
  },
  atividades: {
    atividade: 'a.id',
    lead: 'l.nome',
    oportunidade: 'o.id',
    responsavel: 'f.nome',
    tipo: 'a.tipo',
    data_prevista: 'a.data_prevista',
    data_conclusao: 'a.data_conclusao',
    status: 'a.status',
    criado_em: 'a.criado_em',
    atualizado_em: 'a.atualizado_em',
  },
  interacoes: {
    interacao: 'i.id',
    lead: 'l.nome',
    oportunidade: 'o.id',
    responsavel: 'f.nome',
    canal: 'i.canal',
    data_interacao: 'i.data_interacao',
    criado_em: 'i.criado_em',
    atualizado_em: 'i.atualizado_em',
  },
  oportunidades_produtos: {
    oportunidade: 'o.id',
    lead: 'l.nome',
    empresa_lead: 'l.empresa',
    vendedor: 'f.nome',
    territorio: 't.nome',
    fase: 'fp.nome',
    ordem_fase: 'fp.ordem',
    produto: 'pr.nome',
    valor_estimado: 'o.valor_estimado',
    status: 'o.status',
    data_prevista: 'o.data_prevista',
    criado_em: 'o.criado_em',
    atualizado_em: 'o.atualizado_em',
  },
  pipeline: {
    pipeline: 'p.nome',
    fase: 'fp.nome',
    ordem_fase: 'fp.ordem',
    oportunidade: 'o.id',
    lead: 'l.nome',
    empresa_lead: 'l.empresa',
    vendedor: 'f.nome',
    territorio: 't.nome',
    valor_estimado: 'o.valor_estimado',
    probabilidade: 'o.probabilidade',
    status: 'o.status',
    data_prevista: 'o.data_prevista',
    criado_em: 'o.criado_em',
    atualizado_em: 'o.atualizado_em',
  },
};

const parseNumber = (v: string | null, fb?: number) => (v ? Number(v) : fb);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const view = (searchParams.get('view') || '').toLowerCase();
    if (!view) return Response.json({ success: false, message: 'Parâmetro view é obrigatório' }, { status: 400 });

    // Common filters
    const de = searchParams.get('de') || undefined;
    const ate = searchParams.get('ate') || undefined;
    const q = searchParams.get('q') || undefined;
    const responsavel_id = searchParams.get('responsavel_id') || undefined; // usuarioid

    // Specific filters
    const status = searchParams.get('status') || undefined;
    const origem = searchParams.get('origem') || undefined;
    const tipo = searchParams.get('tipo') || undefined;
    const canal = searchParams.get('canal') || undefined;

    // Pagination
    const page = Math.max(1, parseNumber(searchParams.get('page'), 1) || 1);
    const pageSize = Math.max(1, Math.min(1000, parseNumber(searchParams.get('pageSize'), 20) || 20));
    const offset = (page - 1) * pageSize;

    // Sorting
    const orderByParam = (searchParams.get('order_by') || '').toLowerCase();
    const orderDirParam = (searchParams.get('order_dir') || 'desc').toLowerCase();
    const whitelist = ORDER_BY_WHITELIST[view] || {};
    const orderBy = whitelist[orderByParam] || undefined;
    const orderDir = orderDirParam === 'asc' ? 'ASC' : 'DESC';

    const conditions: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const push = (expr: string, val: unknown) => {
      conditions.push(`${expr} $${i}`);
      params.push(val);
      i += 1;
    };

    let selectSql = '';
    let baseSql = '';
    const groupBy = '';
    let whereDateCol = '';

    if (view === 'oportunidades') {
      selectSql = `SELECT
        o.id AS oportunidade,
        l.nome AS lead,
        l.empresa AS lead_empresa,
        cli.nome_fantasia AS cliente,
        f.nome AS vendedor,
        t.nome AS territorio,
        fp.nome AS fase,
        fp.ordem AS ordem_fase,
        fp.probabilidade_padrao AS probabilidade_fase,
        o.valor_estimado,
        o.probabilidade,
        o.data_prevista,
        o.status,
        mp.nome AS motivo_perda,
        o.descricao,
        o.criado_em,
        o.atualizado_em`;
      baseSql = `FROM crm.oportunidades o
        LEFT JOIN crm.leads l ON l.id = o.lead_id
        LEFT JOIN entidades.clientes cli ON cli.id = o.cliente_id
        LEFT JOIN comercial.vendedores v ON v.id = o.vendedor_id
        LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
        LEFT JOIN comercial.territorios t ON t.id = o.territorio_id
        LEFT JOIN crm.fases_pipeline fp ON fp.id = o.fase_pipeline_id
        LEFT JOIN crm.motivos_perda mp ON mp.id = o.motivo_perda_id`;
      whereDateCol = 'o.data_prevista';
      if (status) push('LOWER(o.status) =', status.toLowerCase());
      if (responsavel_id) push('v.funcionario_id =', responsavel_id);
      if (q) {
        conditions.push(`(l.nome ILIKE '%' || $${i} || '%' OR l.empresa ILIKE '%' || $${i} || '%' OR cli.nome_fantasia ILIKE '%' || $${i} || '%' OR f.nome ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'leads') {
      selectSql = `SELECT
        l.id AS lead,
        l.nome,
        l.empresa,
        l.email,
        l.telefone,
        ol.nome AS origem,
        f.nome AS responsavel,
        l.status,
        l.tag,
        l.descricao,
        l.criado_em,
        l.atualizado_em`;
      baseSql = `FROM crm.leads l
        LEFT JOIN crm.origens_lead ol ON ol.id = l.origem_id
        LEFT JOIN comercial.vendedores v ON v.id = l.responsavel_id
        LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id`;
      if (status) push('LOWER(l.status) =', status.toLowerCase());
      if (origem) push('LOWER(ol.nome) =', origem.toLowerCase());
      if (responsavel_id) push('v.funcionario_id =', responsavel_id);
      if (q) {
        conditions.push(`(l.nome ILIKE '%' || $${i} || '%' OR l.empresa ILIKE '%' || $${i} || '%' OR l.email ILIKE '%' || $${i} || '%' OR f.nome ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'atividades') {
      selectSql = `SELECT
        a.id AS atividade,
        l.nome AS lead,
        o.id AS oportunidade,
        f.nome AS responsavel,
        a.tipo,
        a.descricao,
        a.data_prevista,
        a.data_conclusao,
        a.status,
        a.criado_em,
        a.atualizado_em`;
      baseSql = `FROM crm.atividades a
        LEFT JOIN crm.leads l ON l.id = a.lead_id
        LEFT JOIN crm.oportunidades o ON o.id = a.oportunidade_id
        LEFT JOIN comercial.vendedores v ON v.id = a.responsavel_id
        LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id`;
      whereDateCol = 'a.data_prevista';
      if (status) push('LOWER(a.status) =', status.toLowerCase());
      if (tipo) push('LOWER(a.tipo) =', tipo.toLowerCase());
      if (responsavel_id) push('v.funcionario_id =', responsavel_id);
      if (q) {
        conditions.push(`(a.descricao ILIKE '%' || $${i} || '%' OR l.nome ILIKE '%' || $${i} || '%' OR f.nome ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'interacoes') {
      selectSql = `SELECT
        i.id AS interacao,
        l.nome AS lead,
        o.id AS oportunidade,
        f.nome AS responsavel,
        i.canal,
        i.conteudo,
        i.data_interacao,
        i.criado_em,
        i.atualizado_em`;
      baseSql = `FROM crm.interacoes i
        LEFT JOIN crm.leads l ON l.id = i.lead_id
        LEFT JOIN crm.oportunidades o ON o.id = i.oportunidade_id
        LEFT JOIN comercial.vendedores v ON v.id = i.responsavel_id
        LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id`;
      whereDateCol = 'i.data_interacao';
      if (canal) push('LOWER(i.canal) =', canal.toLowerCase());
      if (responsavel_id) push('v.funcionario_id =', responsavel_id);
      if (q) {
        conditions.push(`(i.conteudo ILIKE '%' || $${i} || '%' OR l.nome ILIKE '%' || $${i} || '%' OR f.nome ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'oportunidades_produtos') {
      selectSql = `SELECT
        o.id AS oportunidade,
        l.nome AS lead,
        l.empresa AS empresa_lead,
        f.nome AS vendedor,
        t.nome AS territorio,
        fp.nome AS fase,
        fp.ordem AS ordem_fase,
        fp.probabilidade_padrao AS probabilidade_fase,
        pr.nome AS produto,
        op.quantidade,
        op.preco,
        op.subtotal,
        o.valor_estimado,
        o.status,
        mp.nome AS motivo_perda,
        o.data_prevista,
        o.descricao,
        o.criado_em,
        o.atualizado_em,
        op.id AS item_id`;
      baseSql = `FROM crm.oportunidades_produtos op
        LEFT JOIN crm.oportunidades o ON o.id = op.oportunidade_id
        LEFT JOIN crm.leads l ON l.id = o.lead_id
        LEFT JOIN comercial.vendedores v ON v.id = o.vendedor_id
        LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
        LEFT JOIN comercial.territorios t ON t.id = o.territorio_id
        LEFT JOIN crm.fases_pipeline fp ON fp.id = o.fase_pipeline_id
        LEFT JOIN produtos.produto pr ON pr.id = op.produto_id
        LEFT JOIN crm.motivos_perda mp ON mp.id = o.motivo_perda_id`;
      whereDateCol = 'o.data_prevista';
      if (status) push('LOWER(o.status) =', status.toLowerCase());
      if (responsavel_id) push('v.funcionario_id =', responsavel_id);
      if (q) {
        conditions.push(`(l.nome ILIKE '%' || $${i} || '%' OR l.empresa ILIKE '%' || $${i} || '%' OR f.nome ILIKE '%' || $${i} || '%' OR pr.nome ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'pipeline') {
      selectSql = `SELECT
        p.nome AS pipeline,
        fp.nome AS fase,
        fp.ordem AS ordem_fase,
        fp.probabilidade_padrao AS probabilidade_fase,
        o.id AS oportunidade,
        l.nome AS lead,
        l.empresa AS empresa_lead,
        f.nome AS vendedor,
        t.nome AS territorio,
        o.valor_estimado,
        o.probabilidade,
        o.data_prevista,
        o.status,
        mp.nome AS motivo_perda,
        o.descricao,
        o.criado_em,
        o.atualizado_em,
        fp.id AS fase_id`;
      baseSql = `FROM crm.fases_pipeline fp
        LEFT JOIN crm.pipelines p ON p.id = fp.pipeline_id
        LEFT JOIN crm.oportunidades o ON o.fase_pipeline_id = fp.id
        LEFT JOIN crm.leads l ON l.id = o.lead_id
        LEFT JOIN comercial.vendedores v ON v.id = o.vendedor_id
        LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
        LEFT JOIN comercial.territorios t ON t.id = o.territorio_id
        LEFT JOIN crm.motivos_perda mp ON mp.id = o.motivo_perda_id`;
      whereDateCol = 'o.data_prevista';
      if (status) push('LOWER(o.status) =', status.toLowerCase());
      if (responsavel_id) push('v.funcionario_id =', responsavel_id);
      if (q) {
        conditions.push(`(p.nome ILIKE '%' || $${i} || '%' OR fp.nome ILIKE '%' || $${i} || '%' OR l.nome ILIKE '%' || $${i} || '%' OR f.nome ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 });
    }

    if (de && whereDateCol) push(`${whereDateCol} >=`, de);
    if (ate && whereDateCol) push(`${whereDateCol} <=`, ate);

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Default ordering when not provided
    let orderClause = '';
    if (ORDER_BY_WHITELIST[view] && Object.keys(ORDER_BY_WHITELIST[view]).length) {
      if (orderBy) orderClause = `ORDER BY ${orderBy} ${orderDir}`;
      else {
        if (view === 'oportunidades') orderClause = 'ORDER BY o.id DESC';
        else if (view === 'leads') orderClause = 'ORDER BY l.id ASC';
        else if (view === 'atividades') orderClause = 'ORDER BY a.id ASC';
        else if (view === 'interacoes') orderClause = 'ORDER BY i.id ASC';
        else if (view === 'oportunidades_produtos') orderClause = 'ORDER BY o.id ASC, op.id ASC';
        else if (view === 'pipeline') orderClause = 'ORDER BY p.id ASC, fp.ordem ASC, o.id ASC';
      }
    }

    const limitOffset = `LIMIT $${i}::int OFFSET $${i + 1}::int`;
    const paramsWithPage = [...params, pageSize, offset];

    const listSql = `${selectSql}
                     ${baseSql}
                     ${whereClause}
                     ${groupBy}
                     ${orderClause}
                     ${limitOffset}`.replace(/\s+$/m, '').trim();

    let rows = await runQuery<Record<string, unknown>>(listSql, paramsWithPage);

    // Aggregate for oportunidades_produtos: group products by oportunidade
    if (view === 'oportunidades_produtos') {
      type OportunidadeAgregada = {
        oportunidade: unknown
        lead: unknown
        empresa_lead: unknown
        vendedor: unknown
        territorio: unknown
        fase: unknown
        ordem_fase: unknown
        probabilidade_fase: unknown
        valor_estimado: unknown
        status: unknown
        motivo_perda: unknown
        data_prevista: unknown
        descricao: unknown
        criado_em: unknown
        atualizado_em: unknown
        produtos: Array<{
          produto: unknown
          quantidade: unknown
          preco: unknown
          subtotal: unknown
        }>
      }
      const oportunidadesMap = new Map<number, OportunidadeAgregada>()

      for (const row of rows) {
        const oportunidadeKey = Number(row.oportunidade)

        if (!oportunidadesMap.has(oportunidadeKey)) {
          oportunidadesMap.set(oportunidadeKey, {
            oportunidade: row.oportunidade,
            lead: row.lead,
            empresa_lead: row.empresa_lead,
            vendedor: row.vendedor,
            territorio: row.territorio,
            fase: row.fase,
            ordem_fase: row.ordem_fase,
            probabilidade_fase: row.probabilidade_fase,
            valor_estimado: row.valor_estimado,
            status: row.status,
            motivo_perda: row.motivo_perda,
            data_prevista: row.data_prevista,
            descricao: row.descricao,
            criado_em: row.criado_em,
            atualizado_em: row.atualizado_em,
            produtos: []
          })
        }

        if (row.item_id) {
          oportunidadesMap.get(oportunidadeKey)!.produtos.push({
            produto: row.produto,
            quantidade: row.quantidade,
            preco: row.preco,
            subtotal: row.subtotal,
          })
        }
      }

      rows = Array.from(oportunidadesMap.values())
    }

    // Aggregate for pipeline: group oportunidades by fase
    if (view === 'pipeline') {
      type FaseAgregada = {
        pipeline: unknown
        fase: unknown
        ordem_fase: unknown
        probabilidade_fase: unknown
        oportunidades: Array<{
          oportunidade: unknown
          lead: unknown
          empresa_lead: unknown
          vendedor: unknown
          territorio: unknown
          valor_estimado: unknown
          probabilidade: unknown
          data_prevista: unknown
          status: unknown
          motivo_perda: unknown
          descricao: unknown
          criado_em: unknown
          atualizado_em: unknown
        }>
      }
      const fasesMap = new Map<number, FaseAgregada>()

      for (const row of rows) {
        const faseKey = Number(row.fase_id)

        if (!fasesMap.has(faseKey)) {
          fasesMap.set(faseKey, {
            pipeline: row.pipeline,
            fase: row.fase,
            ordem_fase: row.ordem_fase,
            probabilidade_fase: row.probabilidade_fase,
            oportunidades: []
          })
        }

        if (row.oportunidade) {
          fasesMap.get(faseKey)!.oportunidades.push({
            oportunidade: row.oportunidade,
            lead: row.lead,
            empresa_lead: row.empresa_lead,
            vendedor: row.vendedor,
            territorio: row.territorio,
            valor_estimado: row.valor_estimado,
            probabilidade: row.probabilidade,
            data_prevista: row.data_prevista,
            status: row.status,
            motivo_perda: row.motivo_perda,
            descricao: row.descricao,
            criado_em: row.criado_em,
            atualizado_em: row.atualizado_em,
          })
        }
      }

      rows = Array.from(fasesMap.values())
    }

    const totalSql = view === 'oportunidades_produtos'
      ? `SELECT COUNT(DISTINCT o.id)::int AS total FROM crm.oportunidades_produtos op LEFT JOIN crm.oportunidades o ON o.id = op.oportunidade_id ${whereClause.replace(/op\./g, 'op.').replace(/o\./g, 'o.')}`
      : view === 'pipeline'
      ? `SELECT COUNT(DISTINCT fp.id)::int AS total FROM crm.fases_pipeline fp LEFT JOIN crm.pipelines p ON p.id = fp.pipeline_id LEFT JOIN crm.oportunidades o ON o.fase_pipeline_id = fp.id ${whereClause.replace(/fp\./g, 'fp.').replace(/o\./g, 'o.')}`
      : `SELECT COUNT(*)::int AS total ${baseSql} ${whereClause}`;
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
    console.error('📇 API /api/modulos/crm error:', error);
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

