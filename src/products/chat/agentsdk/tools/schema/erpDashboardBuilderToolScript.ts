import { DASHBOARD_BUILDER_TOOL_DESCRIPTION } from '@/products/chat/shared/tools/dashboardBuilderContract'

export const AGENTSDK_ERP_MCP_DASHBOARD_BUILDER_TOOL_SCRIPT = `tool('dashboard_builder',${JSON.stringify(DASHBOARD_BUILDER_TOOL_DESCRIPTION)}, {
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
