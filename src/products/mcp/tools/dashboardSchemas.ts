import { MCP_DASHBOARD_TOOL_NAMES } from '@/products/mcp/shared/toolNames'

export type McpToolInputSchema = {
  type: 'object'
  properties: Record<string, unknown>
  required?: readonly string[]
  additionalProperties?: boolean
}

export type McpToolDefinition = {
  name: string
  description: string
  inputSchema: McpToolInputSchema
}

const metadataProperty = {
  type: 'object',
  additionalProperties: true,
  description: 'Metadados opcionais persistidos no dashboard.',
} as const

const artifactIdProperty = {
  type: 'string',
  description: 'UUID do dashboard/artifact persistido.',
} as const

const expectedVersionProperty = {
  type: 'integer',
  description: 'Versao draft atual esperada. Obrigatorio para evitar overwrite concorrente.',
} as const

const sourceProperty = {
  type: 'string',
  description: 'Source TSX completo do dashboard.',
} as const

export const DASHBOARD_LIST_SCHEMA = {
  type: 'object',
  properties: {
    limit: {
      type: 'integer',
      description: 'Quantidade maxima de dashboards retornados. Default: 100. Maximo aplicado pelo backend: 200.',
    },
  },
  additionalProperties: true,
} as const satisfies McpToolInputSchema

export const DASHBOARD_READ_SCHEMA = {
  type: 'object',
  properties: {
    artifact_id: artifactIdProperty,
    kind: {
      type: 'string',
      enum: ['draft', 'published'],
      description: 'Versao logica a ler. Default: draft.',
    },
    version: {
      type: 'integer',
      description: 'Versao numerica especifica. Se omitida, le a mais recente do kind.',
    },
  },
  required: ['artifact_id'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

export const DASHBOARD_CREATE_SCHEMA = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'Titulo do dashboard.',
    },
    source: sourceProperty,
    workspace_id: {
      type: 'string',
      description: 'Workspace opcional dono do dashboard.',
    },
    slug: {
      type: 'string',
      description: 'Slug opcional estavel do dashboard.',
    },
    metadata: metadataProperty,
    change_summary: {
      type: 'string',
      description: 'Resumo curto opcional da criacao.',
    },
  },
  required: ['title', 'source'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

export const DASHBOARD_PATCH_SCHEMA = {
  type: 'object',
  properties: {
    artifact_id: artifactIdProperty,
    expected_version: expectedVersionProperty,
    operation: {
      type: 'object',
      description: 'Operacao de patch a aplicar no source atual.',
      properties: {
        type: {
          type: 'string',
          enum: ['replace_text', 'replace_full_source'],
          description: 'Tipo da operacao.',
        },
        old_string: {
          type: 'string',
          description: 'Trecho atual a localizar quando type=replace_text.',
        },
        new_string: {
          type: 'string',
          description: 'Trecho novo a gravar quando type=replace_text.',
        },
        replace_all: {
          type: 'boolean',
          description: 'Se true, substitui todas as ocorrencias em replace_text.',
        },
        source: {
          type: 'string',
          description: 'Source TSX completo quando type=replace_full_source.',
        },
        change_summary: {
          type: 'string',
          description: 'Resumo curto opcional da mudanca.',
        },
      },
      required: ['type'],
      additionalProperties: true,
    },
  },
  required: ['artifact_id', 'expected_version', 'operation'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

export const DASHBOARD_UPDATE_FULL_SCHEMA = {
  type: 'object',
  properties: {
    artifact_id: artifactIdProperty,
    expected_version: expectedVersionProperty,
    title: {
      type: 'string',
      description: 'Novo titulo opcional.',
    },
    source: sourceProperty,
    slug: {
      type: 'string',
      description: 'Novo slug opcional.',
    },
    metadata: metadataProperty,
    change_summary: {
      type: 'string',
      description: 'Resumo curto opcional da mudanca.',
    },
  },
  required: ['artifact_id', 'expected_version', 'source'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

export const DASHBOARD_GET_CONTRACT_SCHEMA = {
  type: 'object',
  properties: {
    include_example: {
      type: 'boolean',
      description: 'Se true, inclui exemplo minimo de source TSX.',
    },
  },
  additionalProperties: true,
} as const satisfies McpToolInputSchema

export const DASHBOARD_QUERY_PREVIEW_SCHEMA = {
  type: 'object',
  properties: {
    artifact_id: artifactIdProperty,
    component_id: {
      type: 'string',
      description: 'ID do componente do dashboard que possui dataQuery.query.',
    },
    sample_limit: {
      type: 'integer',
      description: 'Quantidade maxima de linhas de amostra. Default: 5. Maximo: 20.',
    },
    include_profile: {
      type: 'boolean',
      description: 'Se true, retorna perfil agregado das colunas. Default: true.',
    },
  },
  required: ['artifact_id', 'component_id'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

export const DASHBOARD_MCP_TOOL_DEFINITIONS = [
  {
    name: MCP_DASHBOARD_TOOL_NAMES.dashboardList,
    description: 'Lista dashboards persistidos no Cognito com metadados, versoes e URL.',
    inputSchema: DASHBOARD_LIST_SCHEMA,
  },
  {
    name: MCP_DASHBOARD_TOOL_NAMES.dashboardRead,
    description: 'Le um dashboard persistido e retorna source TSX, versao, metadados e URL. Use antes de editar.',
    inputSchema: DASHBOARD_READ_SCHEMA,
  },
  {
    name: MCP_DASHBOARD_TOOL_NAMES.dashboardCreate,
    description: 'Cria um dashboard novo a partir de source TSX completo e titulo.',
    inputSchema: DASHBOARD_CREATE_SCHEMA,
  },
  {
    name: MCP_DASHBOARD_TOOL_NAMES.dashboardPatch,
    description: 'Aplica patch versionado em um dashboard existente usando expected_version.',
    inputSchema: DASHBOARD_PATCH_SCHEMA,
  },
  {
    name: MCP_DASHBOARD_TOOL_NAMES.dashboardUpdateFull,
    description: 'Substitui completamente o source TSX de um dashboard existente, criando nova versao draft.',
    inputSchema: DASHBOARD_UPDATE_FULL_SCHEMA,
  },
  {
    name: MCP_DASHBOARD_TOOL_NAMES.dashboardGetContract,
    description: 'Retorna o contrato de autoria para criar dashboards TSX compativeis com o renderer do Cognito.',
    inputSchema: DASHBOARD_GET_CONTRACT_SCHEMA,
  },
  {
    name: MCP_DASHBOARD_TOOL_NAMES.dashboardQueryPreview,
    description: 'Le uma amostra limitada e perfil agregado de um componente dataQuery do dashboard para debug/agente.',
    inputSchema: DASHBOARD_QUERY_PREVIEW_SCHEMA,
  },
] as const satisfies readonly McpToolDefinition[]
