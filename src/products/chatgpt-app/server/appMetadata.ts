export const COGNITO_CHATGPT_APP_VERSION = '0.1.1'

export const COGNITO_CHATGPT_APP_METADATA = {
  name: 'cognito-dashboards',
  title: 'Cognito Dashboards',
  version: COGNITO_CHATGPT_APP_VERSION,
  description:
    'Create, inspect, and manage Cognito artifacts with structured tools and an embedded visual UI.',
  connectorDescription:
    'Use this app when the user wants to list, inspect, create, or update Cognito dashboards, slides, or reports.',
  publisher: 'Cognito',
  categories: ['dashboards', 'analytics', 'business-intelligence'],
} as const

export const COGNITO_CHATGPT_APP_INSTRUCTIONS = [
  'Use dashboards to list or search Cognito dashboards.',
  'Use open_artifact with { "kind": "dashboard", "id": "..." } when the user asks to open a full dashboard as an interactive app.',
  'Use artifact_authoring to create or edit dashboard, slide, and report TSX source.',
  'Use erp for read-only operational ERP records, ecommerce for ecommerce metrics, marketing for paid media metrics, and sql only for read-only ad-hoc SELECT/WITH analysis.',
  'Prefer concise dashboard summaries and include Cognito links when available.',
  'Do not expose internal implementation details or raw source unless the user asks for them.',
].join('\n')

export function getCognitoChatGptAppMetadata() {
  return {
    ...COGNITO_CHATGPT_APP_METADATA,
    instructions: COGNITO_CHATGPT_APP_INSTRUCTIONS,
  }
}
