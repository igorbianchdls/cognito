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
  'Use the data tools to fetch or mutate dashboard data before rendering UI.',
  'Use dashboard_render_list only after dashboard_list has returned dashboard records.',
  'Use dashboard_render_preview only after dashboard_read has returned a dashboard record.',
  'Use dashboard_embed_preview when the user asks to open a full dashboard preview by id in one step.',
  'Prefer concise dashboard summaries and include Cognito links when available.',
  'Do not expose internal implementation details or raw source unless the user asks for them.',
].join('\n')

export function getCognitoChatGptAppMetadata() {
  return {
    ...COGNITO_CHATGPT_APP_METADATA,
    instructions: COGNITO_CHATGPT_APP_INSTRUCTIONS,
  }
}
