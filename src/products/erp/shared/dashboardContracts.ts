import { DEFAULT_ERP_TIME_ZONE, normalizeTimeZone } from './businessDate'
import { z } from 'zod'
import { erpDateSchema } from './erpTransport'
import type { ErpCapability } from './professionalContracts'

export const DASHBOARD_IDS = [
  'visao-geral',
  'financeiro',
  'vendas',
  'compras',
  'estoque',
  'resultados',
  'servicos',
] as const
export type DashboardId = (typeof DASHBOARD_IDS)[number]
export const DASHBOARDS: Record<
  DashboardId,
  { title: string; description: string; capabilities: ErpCapability[] }
> = {
  'visao-geral': {
    title: 'Visão geral',
    description: 'Os números e as pendências que precisam da sua atenção.',
    capabilities: [],
  },
  financeiro: {
    title: 'Financeiro',
    description: 'Compromissos, recebimentos e o caminho do seu caixa.',
    capabilities: ['erp.financeiro.visualizar'],
  },
  vendas: {
    title: 'Vendas',
    description: 'Evolução comercial, clientes e oportunidades.',
    capabilities: ['erp.vendas.visualizar'],
  },
  compras: {
    title: 'Compras',
    description: 'Fornecedores, pedidos e recebimentos.',
    capabilities: ['erp.compras.visualizar'],
  },
  estoque: {
    title: 'Estoque',
    description: 'Disponibilidade, valor e movimentação dos produtos.',
    capabilities: ['erp.estoque.visualizar'],
  },
  resultados: {
    title: 'Resultados',
    description: 'Entradas e saídas realizadas, pelo critério de caixa.',
    capabilities: ['erp.financeiro.visualizar', 'erp.relatorios.visualizar'],
  },
  servicos: {
    title: 'Serviços e contratos',
    description: 'Atendimentos em andamento e contratos recorrentes.',
    capabilities: ['erp.vendas.visualizar'],
  },
}
export const dashboardFilterSchema = z
  .object({
    from: erpDateSchema,
    to: erpDateSchema,
    compare: z.boolean().default(true),
    includeForecast: z.boolean().default(false),
  })
  .strict()
  .refine((v) => v.from <= v.to, 'Informe um período em ordem.')
  .refine(
    (v) => (Date.parse(v.to) - Date.parse(v.from)) / 86400000 < 366,
    'O período deve ter até 366 dias.',
  )
export type DashboardFilters = z.infer<typeof dashboardFilterSchema>
export type DashboardPeriod = { from: string; to: string }
export type DashboardFormat = 'currency' | 'number' | 'percent'
export type DashboardMetric = {
  key: string
  label: string
  value: number
  format: DashboardFormat
  description: string
  scope: 'periodo' | 'atual'
  previous?: number
  variation?: number | null
  href?: string
  tone?: 'neutral' | 'success' | 'warning' | 'danger'
}
export type DashboardChart = {
  key: string
  title: string
  description: string
  kind: 'line' | 'bar'
  format: DashboardFormat
  series: { key: string; label: string; color: string }[]
  records: { label: string; [key: string]: string | number }[]
}
export type DashboardRow = {
  id: string
  label: string
  detail: string
  value: number
  format?: DashboardFormat
  href?: string
  date?: string
  status?: string
}
export type DashboardList = {
  key: string
  title: string
  description: string
  rows: DashboardRow[]
  href?: string
}
export type DashboardContent = {
  metrics: DashboardMetric[]
  charts: DashboardChart[]
  lists: DashboardList[]
  notes: string[]
}
export type DashboardResponse = DashboardContent & {
  id: DashboardId
  title: string
  description: string
  period: DashboardPeriod
  previousPeriod: DashboardPeriod | null
  reference: string
  timezone: string
  generatedAt: string
  availableDashboards: DashboardId[]
}

export const DASHBOARD_SOURCES = [
  'vendas',
  'orcamentos',
  'compras',
  'pagar',
  'receber',
  'contas',
  'estoque',
  'movimentos',
  'pagamentos',
  'ordens',
  'contratos',
] as const
export const dashboardRecordsSchema = z
  .object({
    source: z.enum(DASHBOARD_SOURCES),
    from: erpDateSchema.optional(),
    to: erpDateSchema.optional(),
    includeForecast: z.boolean().default(false),
    status: z
      .enum([
        'confirmada',
        'parcialmente_recebida',
        'concluida',
        'abertas',
        'vencido',
        'previsao',
        'reposicao',
        'reservas',
        'produtos',
        'entrada',
        'saida',
        'mensal',
        'receber',
        'pagar',
      ])
      .optional(),
    id: z
      .string()
      .regex(/^\d+$/)
      .refine((v) => Number.isSafeInteger(Number(v)) && Number(v) > 0, 'Identificador inválido.')
      .optional(),
    dimension: z
      .enum([
        'cliente',
        'vendedor',
        'produto',
        'servico',
        'fornecedor',
        'categoria',
        'centro',
        'local',
      ])
      .optional(),
    dimensionId: z
      .string()
      .regex(/^(\d+|sem)$/)
      .refine(
        (v) => v === 'sem' || (Number.isSafeInteger(Number(v)) && Number(v) > 0),
        'Identificador inválido.',
      )
      .optional(),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine((v) => Boolean(v.from) === Boolean(v.to), 'Informe as duas datas.')
  .refine(
    (v) =>
      !v.from ||
      !v.to ||
      (v.from <= v.to && (Date.parse(v.to) - Date.parse(v.from)) / 86400000 < 366),
    'Informe um período válido de até 366 dias.',
  )
  .refine(
    (v) => Boolean(v.dimension) === Boolean(v.dimensionId),
    'Informe a dimensão e seu identificador.',
  )
export type DashboardRecordsFilters = z.infer<typeof dashboardRecordsSchema>
export type DashboardRecord = {
  id: string
  label: string
  detail: string
  date: string | null
  status: string
  value: number
}
export type DashboardRecordsResponse = {
  title: string
  criterion: string
  reference: string
  records: DashboardRecord[]
  total: number
  totalValue: number
  format: DashboardFormat
  filters: DashboardRecordsFilters
}

export function dashboardToday(now = new Date(), timeZone: string = DEFAULT_ERP_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: normalizeTimeZone(timeZone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) => parts.find((p) => p.type === type)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}
export function previousDashboardPeriod(period: DashboardPeriod): DashboardPeriod {
  const start = new Date(period.from + 'T12:00:00Z'),
    end = new Date(period.to + 'T12:00:00Z')
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0, 12))
  if (
    start.getUTCDate() === 1 &&
    start.getUTCMonth() === end.getUTCMonth() &&
    start.getUTCFullYear() === end.getUTCFullYear() &&
    end.getUTCDate() === last.getUTCDate()
  ) {
    return {
      from: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 1, 1, 12))
        .toISOString()
        .slice(0, 10),
      to: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 0, 12))
        .toISOString()
        .slice(0, 10),
    }
  }
  const days = (end.getTime() - start.getTime()) / 86400000 + 1
  return {
    from: new Date(start.getTime() - days * 86400000).toISOString().slice(0, 10),
    to: new Date(start.getTime() - 86400000).toISOString().slice(0, 10),
  }
}
