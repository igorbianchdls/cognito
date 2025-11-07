import { NextRequest } from 'next/server';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Safeguard: whitelist order by columns per view
const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  'ordens-servico': {
    id: 'id',
    ativo: 'ativo',
    tipo: 'tipo',
    prioridade: 'prioridade',
    status: 'status',
    tecnico: 'tecnico',
    data_abertura: 'data_abertura',
    data_conclusao: 'data_conclusao',
  },
  'preventivas': {
    id: 'id',
    ativo: 'ativo',
    periodicidade: 'periodicidade',
    ultima_execucao: 'ultima_execucao',
    proxima_execucao: 'proxima_execucao',
    status: 'status',
    tecnico_responsavel: 'tecnico_responsavel',
  },
  'corretivas': {
    id: 'id',
    ativo: 'ativo',
    problema: 'problema',
    prioridade: 'prioridade',
    data_abertura: 'data_abertura',
    tempo_parada: 'tempo_parada',
    status: 'status',
  },
  'ativos': {
    id: 'id',
    nome: 'nome',
    categoria: 'categoria',
    local: 'local',
    marca_modelo: 'marca_modelo',
    status_operacional: 'status_operacional',
    ultima_manutencao: 'ultima_manutencao',
  },
  'tecnicos': {
    id: 'id',
    nome: 'nome',
    especialidade: 'especialidade',
    os_abertas: 'os_abertas',
    os_concluidas_mes: 'os_concluidas_mes',
    disponibilidade: 'disponibilidade',
    contato: 'contato',
  },
  'pecas': {
    id: 'id',
    codigo: 'codigo',
    descricao: 'descricao',
    quantidade: 'quantidade',
    estoque_minimo: 'estoque_minimo',
    localizacao: 'localizacao',
    ultima_entrada: 'ultima_entrada',
  },
  'historico': {
    id: 'id',
    data: 'data',
    ativo: 'ativo',
    tipo_manutencao: 'tipo_manutencao',
    tecnico: 'tecnico',
    duracao: 'duracao',
    custo: 'custo',
    pecas_utilizadas: 'pecas_utilizadas',
  },
  'indicadores': {
    id: 'id',
    metrica: 'metrica',
    valor: 'valor',
    periodo: 'periodo',
    meta: 'meta',
    status: 'status',
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
    const ativo_id = searchParams.get('ativo_id') || undefined;
    const tecnico_id = searchParams.get('tecnico_id') || undefined;
    const prioridade = searchParams.get('prioridade') || undefined;
    const categoria = searchParams.get('categoria') || undefined;

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

    // Mock data - retornar arrays vazios por enquanto
    let rows: unknown[] = [];
    const total = 0;

    // Validar views permitidas
    const validViews = [
      'ordens-servico',
      'preventivas',
      'corretivas',
      'ativos',
      'tecnicos',
      'pecas',
      'historico',
      'indicadores',
    ];

    if (!validViews.includes(view)) {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 });
    }

    // Future: aqui você pode adicionar consultas SQL reais quando tiver as tabelas
    // Por enquanto retorna vazio
    switch (view) {
      case 'ordens-servico':
        // rows = await runQuery('SELECT ...')
        rows = [];
        break;
      case 'preventivas':
        rows = [];
        break;
      case 'corretivas':
        rows = [];
        break;
      case 'ativos':
        rows = [];
        break;
      case 'tecnicos':
        rows = [];
        break;
      case 'pecas':
        rows = [];
        break;
      case 'historico':
        rows = [];
        break;
      case 'indicadores':
        rows = [];
        break;
      default:
        rows = [];
    }

    return Response.json({
      success: true,
      view,
      page,
      pageSize,
      total,
      rows,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('📊 API /api/modulos/manutencao error:', error);
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
