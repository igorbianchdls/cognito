import { z } from 'zod'
import { DASHBOARD_IDS, dashboardFilterSchema, dashboardRecordsSchema, dashboardToday } from './dashboardContracts'
import { erpDateSchema } from './erpTransport'

export const chatDashboardFields = {
  periodo: z.enum(['ultimos_7_dias', 'ultimos_30_dias', 'este_mes', 'mes_passado', 'personalizado']).default('ultimos_30_dias'),
  inicio: erpDateSchema.optional(),
  fim: erpDateSchema.optional(),
  comparar: z.boolean().default(true),
  incluir_previsoes: z.boolean().default(false),
  detalhes: z.object({ painel: z.enum(DASHBOARD_IDS), filtros: dashboardRecordsSchema }).strict().optional(),
}
export const chatDashboardSchema = z.object(chatDashboardFields).strict().superRefine((input, ctx) => {
  if (input.detalhes) return
  if (input.periodo === 'personalizado') {
    if (!input.inicio || !input.fim) ctx.addIssue({ code: 'custom', path: ['inicio'], message: 'Informe inicio e fim para o período personalizado.' })
    else if (!dashboardFilterSchema.safeParse({ from: input.inicio, to: input.fim }).success)
      ctx.addIssue({ code: 'custom', path: ['fim'], message: 'Informe um período válido de até 366 dias.' })
  } else if (input.inicio || input.fim) ctx.addIssue({ code: 'custom', path: ['periodo'], message: 'Datas explícitas exigem periodo personalizado.' })
})
export type ChatDashboardInput = z.infer<typeof chatDashboardSchema>

export function resolveChatDashboardPeriod(input: ChatDashboardInput, timeZone?: string, now = new Date()) {
  const reference = dashboardToday(now, timeZone), date = new Date(reference + 'T12:00:00Z')
  const iso = (value: Date) => value.toISOString().slice(0, 10)
  let from = reference, to = reference
  if (input.periodo === 'personalizado') { from = input.inicio!; to = input.fim! }
  else if (input.periodo === 'este_mes') from = reference.slice(0, 8) + '01'
  else if (input.periodo === 'mes_passado') {
    from = iso(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1, 12)))
    to = iso(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 0, 12)))
  } else from = iso(new Date(date.getTime() - (input.periodo === 'ultimos_7_dias' ? 6 : 29) * 86400000))
  return dashboardFilterSchema.parse({ from, to, compare: input.comparar, includeForecast: input.incluir_previsoes })
}
