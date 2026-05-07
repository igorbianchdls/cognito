export const MCP_DASHBOARD_TOOL_NAMES = {
  dashboardList: 'dashboard_list',
  dashboardRead: 'dashboard_read',
  dashboardCreate: 'dashboard_create',
  dashboardPatch: 'dashboard_patch',
  dashboardUpdateFull: 'dashboard_update_full',
  dashboardGetContract: 'dashboard_get_contract',
} as const

export type McpDashboardToolName =
  (typeof MCP_DASHBOARD_TOOL_NAMES)[keyof typeof MCP_DASHBOARD_TOOL_NAMES]

export const MCP_DASHBOARD_TOOL_NAME_SET = new Set<string>(
  Object.values(MCP_DASHBOARD_TOOL_NAMES),
)

