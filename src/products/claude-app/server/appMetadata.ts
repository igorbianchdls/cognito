export const COGNITO_CLAUDE_APP_VERSION = '0.1.0'

export const COGNITO_CLAUDE_APP_METADATA = {
  name: 'cognito-dashboards-claude',
  title: 'Cognito Dashboards',
  version: COGNITO_CLAUDE_APP_VERSION,
  description:
    'Create, inspect, and manage Cognito dashboards with MCP Apps-compatible interactive UI.',
  publisher: 'Cognito',
  categories: ['dashboards', 'analytics', 'business-intelligence'],
} as const

export const COGNITO_CLAUDE_APP_INSTRUCTIONS = [
  'Use dashboards to list or search Cognito dashboards.',
  'Use open_dashboard with only { "id": "..." } when the user asks to open a full dashboard as an interactive app.',
  'Use dashboard_authoring to create dashboards or edit dashboard TSX source.',
  'Use erp for read-only operational ERP records, ecommerce for ecommerce metrics, marketing for paid media metrics, and sql only for read-only ad-hoc SELECT/WITH analysis.',
  'Prefer concise dashboard summaries and include Cognito links when available.',
  'Do not expose internal implementation details or raw source unless the user asks for them.',
].join('\n')

export function getCognitoClaudeAppMetadata() {
  return {
    ...COGNITO_CLAUDE_APP_METADATA,
    instructions: COGNITO_CLAUDE_APP_INSTRUCTIONS,
  }
}
