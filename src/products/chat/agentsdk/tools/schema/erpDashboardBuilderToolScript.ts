export const AGENTSDK_ERP_MCP_DASHBOARD_BUILDER_TOOL_SCRIPT = `tool('dashboard_builder','Constrói dashboards JSONR de forma incremental e previsível, reduzindo erro de estrutura versus escrever o arquivo inteiro. Fluxo recomendado: 1) create_dashboard para inicializar Theme+Header e estado; 2) add_widgets_batch para blocos iniciais; 3) add_widget para ajustes pontuais/substituições; 4) get_dashboard para retornar árvore final + parser_state. Regras: widgets com mesmo container entram na mesma row; sem container, usa principal. Estado pode ser stateful (chat_id + dashboard_name no backend) ou stateless (enviando parser_state a cada chamada). Tipos suportados: kpi, chart, filtro, insights.', {
  action: z.enum(['create_dashboard','add_widget','add_widgets_batch','get_dashboard']),
  dashboard_name: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  theme: z.string().optional(),
  widget_id: z.string().optional(),
  widget_type: z.enum(['kpi','chart','filtro','insights']).optional(),
  container: z.string().optional(),
  payload: z.any().optional(),
  widgets: z.array(z.any()).optional(),
  parser_state: z.any().optional(),
}, async (args) => callDashboardBuilder(args))`;
