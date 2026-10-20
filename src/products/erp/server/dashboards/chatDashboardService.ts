import { chatDashboardSchema, resolveChatDashboardPeriod, type ChatDashboardInput } from '../../shared/chatDashboard'
import { loadDashboard, type DashboardAccess } from './dashboardService'
import { loadDashboardRecords } from './drilldownQueries'

export async function loadChatDashboard(session: DashboardAccess, raw: ChatDashboardInput) {
  const input = chatDashboardSchema.parse(raw)
  if (input.detalhes) return {
    kind: 'registros' as const, panel: input.detalhes.painel,
    ...await loadDashboardRecords(session, input.detalhes.painel, { ...input.detalhes.filtros, pageSize: 5 }),
  }
  const filters = resolveChatDashboardPeriod(input, session.timeZone)
  return {
    kind: 'dashboard' as const,
    ...await loadDashboard(session, 'visao-geral', filters, true),
    query: { periodo: input.periodo, comparar: input.comparar, incluir_previsoes: input.incluir_previsoes,
      ...(input.periodo === 'personalizado' ? { inicio: filters.from, fim: filters.to } : {}) },
  }
}
