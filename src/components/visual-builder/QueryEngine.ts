"use client";

import type { QuerySpec, ChartDataPoint } from "./LiquidParser";
import type { GlobalFilters } from "@/stores/visualBuilderStore";

type DateRange = { de?: string; ate?: string };

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function deriveRange(filters: GlobalFilters): DateRange {
  const t = filters?.dateRange?.type;
  if (!t) return {};
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  const startOfPrevMonth = new Date(endOfPrevMonth.getFullYear(), endOfPrevMonth.getMonth(), 1);
  const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  switch (t) {
    case 'today': return { de: toYmd(today), ate: toYmd(today) };
    case 'yesterday': { const y = addDays(today, -1); return { de: toYmd(y), ate: toYmd(y) }; }
    case 'last_7_days': return { de: toYmd(addDays(today, -6)), ate: toYmd(today) };
    case 'last_14_days': return { de: toYmd(addDays(today, -13)), ate: toYmd(today) };
    case 'last_30_days': return { de: toYmd(addDays(today, -29)), ate: toYmd(today) };
    case 'last_90_days': return { de: toYmd(addDays(today, -89)), ate: toYmd(today) };
    case 'current_month': return { de: toYmd(startOfMonth), ate: toYmd(today) };
    case 'last_month': return { de: toYmd(startOfPrevMonth), ate: toYmd(endOfPrevMonth) };
    case 'custom':
      return { de: (filters.dateRange.startDate || undefined), ate: (filters.dateRange.endDate || undefined) };
    default:
      return {};
  }
}

// Phase 1: compile QuerySpec (Excel-like) to existing financeiro endpoints
export const QueryEngine = {
  async resolve(spec: QuerySpec, filters: GlobalFilters): Promise<ChartDataPoint[]> {
    // Supported via endpoints: top-despesas (pagamento_efetuado) and top-receitas / top-receitas-centro-lucro (conta_a_receber)
    const schema = (spec.schema || '').toLowerCase();
    const table = (spec.table || '').toLowerCase();
    const rawDim = String(spec.dimension || '').trim();
    const mapDim = (d: string): string => {
      const s = d.toLowerCase();
      // Allow fully qualified names like clientes.nome_fantasia
      if (s.includes('cliente')) return 'cliente';
      if (s.includes('centro_custo') || s.includes('centros_custo')) return 'centro_custo';
      if (s.includes('categoria')) return 'categoria';
      if (s.includes('departamento')) return 'departamento';
      if (s.includes('centro_lucro') || s.includes('centros_lucro')) return 'centro_lucro';
      if (s.includes('filial')) return 'filial';
      if (s.includes('projeto')) return 'projeto';
      if (s.includes('fornecedor')) return 'fornecedor';
      return s;
    };
    const dim = rawDim ? mapDim(rawDim) : '';
    const lim = typeof spec.limit === 'number' && spec.limit > 0 ? spec.limit : 5;

    // Determine date range: override from spec.rangeRaw/from/to if provided
    const fallback = deriveRange(filters);
    let de = fallback.de;
    let ate = fallback.ate;
    if (spec.from || spec.to) {
      de = spec.from || de;
      ate = spec.to || ate;
    } else if (spec.rangeRaw) {
      const r = spec.rangeRaw;
      if (/(^last\s+\d+\s+days$)|(^this\s+month$)|(^last\s+month$)/i.test(r)) {
        const s = r.trim().toLowerCase();
        const now = new Date();
        const add = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
        const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        if (s.startsWith('last ') && s.endsWith(' days')) {
          const n = parseInt(s.split(' ')[1] || '30', 10) || 30;
          de = ymd(add(now, -(n-1)));
          ate = ymd(now);
        } else if (s === 'this month') {
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          de = ymd(start); ate = ymd(now);
        } else if (s === 'last month') {
          const endPrev = new Date(now.getFullYear(), now.getMonth(), 0);
          const startPrev = new Date(endPrev.getFullYear(), endPrev.getMonth(), 1);
          de = ymd(startPrev); ate = ymd(endPrev);
        }
      } else if (r.includes('..')) {
        const [a,b] = r.split('..').map(s => s.trim());
        de = a === '${de}' ? fallback.de : (a || de);
        ate = b === '${ate}' ? fallback.ate : (b || ate);
      }
    }

    let url: string | null = null;
    // Determine intent from filters/timeDimension or explicit table
    const filterRaw = (spec.filterRaw || '').toLowerCase();
    const timeDim = (spec.dateColumn || '').toLowerCase();
    const isReceber = filterRaw.includes('conta_a_receber') || (schema === 'financeiro' && table === 'contas_receber') || timeDim === 'data_vencimento';
    const isPagarReal = filterRaw.includes('pagamento_efetuado') || (schema === 'financeiro' && table === 'contas_pagar') || timeDim === 'data_lancamento';

    if (isPagarReal) {
      // Despesas (pagamento realizado)
      const allowed = ['centro_custo', 'categoria', 'departamento', 'projeto', 'filial', 'fornecedor', 'centro_lucro'];
      const mappedDim = dim && allowed.includes(dim) ? dim : 'categoria';
      url = `/api/modulos/financeiro?view=top-despesas&dim=${encodeURIComponent(mappedDim)}${de ? `&de=${encodeURIComponent(de)}` : ''}${ate ? `&ate=${encodeURIComponent(ate)}` : ''}&limit=${lim}`;
    } else if (isReceber) {
      // Receitas (a receber por vencimento)
      if (dim === 'centro_lucro') {
        url = `/api/modulos/financeiro?view=top-receitas-centro-lucro${de ? `&de=${encodeURIComponent(de!)}` : ''}${ate ? `&ate=${encodeURIComponent(ate!)}` : ''}&limit=${lim}`;
      } else {
        const mapped = dim || 'cliente';
        url = `/api/modulos/financeiro?view=top-receitas&dim=${encodeURIComponent(mapped)}${de ? `&de=${encodeURIComponent(de!)}` : ''}${ate ? `&ate=${encodeURIComponent(ate!)}` : ''}&limit=${lim}`;
      }
    } else if (schema === 'financeiro') {
      // Fallback by table when filters didn't indicate
      if (table === 'contas_pagar') {
        const mappedDim = dim || 'categoria';
        url = `/api/modulos/financeiro?view=top-despesas&dim=${encodeURIComponent(mappedDim)}${de ? `&de=${encodeURIComponent(de)}` : ''}${ate ? `&ate=${encodeURIComponent(ate)}` : ''}&limit=${lim}`;
      } else if (table === 'contas_receber') {
        const mapped = dim || 'cliente';
        url = (mapped === 'centro_lucro')
          ? `/api/modulos/financeiro?view=top-receitas-centro-lucro${de ? `&de=${encodeURIComponent(de!)}` : ''}${ate ? `&ate=${encodeURIComponent(ate!)}` : ''}&limit=${lim}`
          : `/api/modulos/financeiro?view=top-receitas&dim=${encodeURIComponent(mapped)}${de ? `&de=${encodeURIComponent(de!)}` : ''}${ate ? `&ate=${encodeURIComponent(ate!)}` : ''}&limit=${lim}`;
      }
    }

    if (!url) throw new Error('Unsupported query for current engine.');

    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as { rows?: Array<{ label?: string; total?: number }> };
      const rows = Array.isArray(json?.rows) ? json.rows : [];
      return rows.map((r, i) => {
        const label = String(r.label || `Item ${i+1}`);
        const value = Number(r.total || 0);
        return { x: label, y: value, label, value } as ChartDataPoint;
      });
    } catch (e) {
      // graceful fallback: empty
      return [];
    }
  }
};
