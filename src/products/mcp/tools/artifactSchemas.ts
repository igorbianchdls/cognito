import { MCP_ARTIFACT_TOOL_NAMES } from '@/products/mcp/shared/toolNames'
import type { McpToolDefinition, McpToolInputSchema } from '@/products/mcp/tools/dashboardSchemas'

export const ARTIFACT_AUTHORING_SCHEMA = {
  type: 'object',
  properties: {
    kind: {
      type: 'string',
      enum: ['dashboard', 'report', 'slide'],
      description: 'Tipo de artifact a criar ou editar.',
    },
    action: {
      type: 'string',
      enum: ['get_contract', 'create', 'patch', 'update_full', 'query_preview'],
      description: 'Acao de autoria.',
    },
    id: {
      type: 'string',
      description: 'ID do artifact para patch ou update_full.',
    },
    artifact_id: {
      type: 'string',
      description: 'Alias de id.',
    },
    title: {
      type: 'string',
      description: 'Titulo do artifact ao criar ou renomear.',
    },
    source: {
      type: 'string',
      description: 'Source TSX completo para create ou update_full.',
    },
    expected_version: {
      type: 'integer',
      description: 'Versao draft esperada. Se omitida em patch/update_full, o backend usa a draft atual.',
    },
    operation: {
      type: 'object',
      description: 'Operacao de patch. Use type=replace_text com old_string/new_string ou type=replace_full_source com source.',
      additionalProperties: true,
    },
    metadata: {
      type: 'object',
      description: 'Metadados opcionais persistidos no artifact.',
      additionalProperties: true,
    },
    change_summary: {
      type: 'string',
      description: 'Resumo curto opcional da mudanca.',
    },
    include_example: {
      type: 'boolean',
      description: 'Quando action=get_contract, inclui exemplo de source TSX.',
    },
    component_id: {
      type: 'string',
      description: 'Quando action=query_preview, ID do componente do dashboard que possui dataQuery.query.',
    },
    sample_limit: {
      type: 'integer',
      description: 'Quando action=query_preview, quantidade maxima de linhas de amostra. Default: 5. Maximo: 20.',
    },
    include_profile: {
      type: 'boolean',
      description: 'Quando action=query_preview, retorna perfil agregado das colunas. Default: true.',
    },
  },
  required: ['kind', 'action'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

export const ARTIFACT_AUTHORING_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    tool: { type: 'string' },
    kind: { type: 'string', enum: ['dashboard', 'report', 'slide'] },
    action: { type: 'string' },
    contract: {
      type: 'object',
      additionalProperties: true,
    },
    artifact: {
      type: 'object',
      additionalProperties: true,
    },
    preview: {
      type: 'object',
      additionalProperties: true,
    },
  },
  required: ['ok', 'tool', 'kind', 'action'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

export const ARTIFACT_MCP_TOOL_DEFINITIONS = [
  {
    name: MCP_ARTIFACT_TOOL_NAMES.artifactAuthoring,
    description:
      'Cria, edita e inspeciona artifacts Cognito usando TSX declarativo versionado. Use kind=dashboard, report ou slide; action=get_contract, create, patch, update_full ou query_preview.',
    inputSchema: ARTIFACT_AUTHORING_SCHEMA,
  },
] as const satisfies readonly McpToolDefinition[]
