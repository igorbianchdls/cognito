export const COGNITO_CHATGPT_APP_VERSION = '0.1.0'

export const COGNITO_CHATGPT_APP_METADATA = {
  name: 'cognito-dashboards',
  title: 'Cognito Dashboards',
  version: COGNITO_CHATGPT_APP_VERSION,
  description:
    'Create, inspect, and manage Cognito dashboards with structured dashboard tools and an embedded visual UI.',
  connectorDescription:
    'Use this app when the user wants to list, inspect, create, or update Cognito dashboards.',
  publisher: 'Cognito',
  categories: ['dashboards', 'analytics', 'business-intelligence'],
} as const

export const COGNITO_CHATGPT_APP_INSTRUCTIONS = [
  'Use dashboards to list or search Cognito dashboards.',
  'Use open_dashboard with only { "id": "..." } when the user asks to open a full dashboard as an interactive app.',
  'Use erp for read-only operational ERP records, ecommerce for ecommerce metrics, and marketing for paid media metrics.',
  'Prefer concise dashboard summaries and include Cognito links when available.',
  'Do not expose internal implementation details or raw source unless the user asks for them.',
].join('\n')

export function getCognitoChatGptAppMetadata() {
  return {
    ...COGNITO_CHATGPT_APP_METADATA,
    instructions: COGNITO_CHATGPT_APP_INSTRUCTIONS,
  }
}
