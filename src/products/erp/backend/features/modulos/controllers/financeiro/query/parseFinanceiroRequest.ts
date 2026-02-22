type OrderWhitelist = Record<string, string>;

export type ParsedFinanceiroRequest = {
  view: string;
  de?: string;
  ate?: string;
  status?: string;
  cliente_id?: string;
  fornecedor_id?: string;
  valor_min?: number;
  valor_max?: number;
  conta_id?: string;
  categoria_id?: string;
  tipo?: string;
  page: number;
  pageSize: number;
  offset: number;
  orderBy?: string;
  orderDir: 'ASC' | 'DESC';
};

const parseNumber = (v: string | null, fallback?: number) => (v ? Number(v) : fallback);

export function parseFinanceiroRequest(
  searchParams: URLSearchParams,
  orderWhitelistByView: Record<string, OrderWhitelist>,
): ParsedFinanceiroRequest {
  const view = (searchParams.get('view') || '').toLowerCase();

  const de = searchParams.get('de') || undefined;
  const ate = searchParams.get('ate') || undefined;
  const status = searchParams.get('status') || undefined;
  const cliente_id = searchParams.get('cliente_id') || undefined;
  const fornecedor_id = searchParams.get('fornecedor_id') || undefined;
  const valor_min = parseNumber(searchParams.get('valor_min'));
  const valor_max = parseNumber(searchParams.get('valor_max'));
  const conta_id = searchParams.get('conta_id') || undefined;
  const categoria_id = searchParams.get('categoria_id') || undefined;
  const tipo = searchParams.get('tipo') || undefined;

  const page = Math.max(1, parseNumber(searchParams.get('page'), 1) || 1);
  const pageSize = Math.max(1, Math.min(1000, parseNumber(searchParams.get('pageSize'), 1000) || 1000));
  const offset = (page - 1) * pageSize;

  const orderByParam = (searchParams.get('order_by') || '').toLowerCase();
  const orderDirParam = (searchParams.get('order_dir') || 'desc').toLowerCase();
  const orderWhitelist = orderWhitelistByView[view] || {};
  const orderBy = orderWhitelist[orderByParam] || undefined;
  const orderDir = orderDirParam === 'asc' ? 'ASC' : 'DESC';

  return {
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
  };
}
