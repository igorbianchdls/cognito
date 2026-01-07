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
    // Supported: financeiro.contas_pagar (top despesas por dimensão), financeiro.contas_receber (top receitas por cliente)
    const schema = (spec.schema || '').toLowerCase();
    const table = (spec.table || '').toLowerCase();
    const dim = (spec.dimension || '').toLowerCase();
    const lim = typeof spec.limit === 'number' && spec.limit > 0 ? spec.limit : 5;
    const { de, ate } = deriveRange(filters);

    let url: string | null = null;
    if (schema === 'financeiro' && table === 'contas_pagar') {
      // Map known dims → top-despesas
      const allowed = ['centro_custo', 'categoria', 'departamento', 'projeto', 'filial'];
      if (!dim || !allowed.includes(dim)) throw new Error(`Dimensão inválida para contas_pagar: ${dim || '(vazio)'}`);
      url = `/api/modulos/financeiro?view=top-despesas&dim=${encodeURIComponent(dim)}${de ? `&de=${encodeURIComponent(de)}` : ''}${ate ? `&ate=${encodeURIComponent(ate)}` : ''}&page=1&pageSize=${lim}`;
    } else if (schema === 'financeiro' && table === 'contas_receber') {
      // Only cliente supported as dim (Top Receitas)
      const allowed = ['cliente'];
      if (!dim || !allowed.includes(dim)) throw new Error(`Dimensão inválida para contas_receber: ${dim || '(vazio)'}`);
      url = `/api/modulos/financeiro?view=top-receitas&dim=${encodeURIComponent(dim)}${de ? `&de=${encodeURIComponent(de)}` : ''}${ate ? `&ate=${encodeURIComponent(ate)}` : ''}&page=1&pageSize=${lim}`;
    }

    if (!url) throw new Error('Consulta não suportada neste estágio.');

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

