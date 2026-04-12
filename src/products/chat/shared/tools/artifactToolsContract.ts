export const ARTIFACT_READ_TOOL_DESCRIPTION =
  'Lê um dashboard persistido no banco de dados a partir do artifact_id. Use para inspecionar a versão draft ou published atual antes de editar. Retorna source TSX, versão, título, status e metadados do dashboard.'

export const ARTIFACT_WRITE_TOOL_DESCRIPTION =
  'Cria um dashboard novo no banco de dados ou sobrescreve completamente o draft de um dashboard existente. Para criar, envie source e title sem artifact_id. Para sobrescrever dashboard existente, envie artifact_id + expected_version + source completo. O conteúdo persistido é versionado em artifacts.dashboard_sources.'

export const ARTIFACT_PATCH_TOOL_DESCRIPTION =
  'Edita incrementalmente um dashboard persistido no banco de dados. Requer artifact_id e expected_version. Operações suportadas: replace_text (troca textual precisa) e replace_full_source (substitui o source inteiro). Sempre cria uma nova versão draft.'

export const ARTIFACT_READ_TOOL_PARAMETERS = {
  type: 'object',
  properties: {
    artifact_id: {
      type: 'string',
      description: 'UUID do dashboard/artifact persistido.',
    },
    kind: {
      type: 'string',
      enum: ['draft', 'published'],
      description: 'Qual versão lógica ler. Default: draft.',
    },
    version: {
      type: 'integer',
      description: 'Versão específica opcional. Se omitida, lê a versão mais recente do kind solicitado.',
    },
  },
  required: ['artifact_id'],
  additionalProperties: true,
} as const

export const ARTIFACT_WRITE_TOOL_PARAMETERS = {
  type: 'object',
  properties: {
    artifact_id: {
      type: 'string',
      description: 'UUID do dashboard existente. Omitir para criar um dashboard novo.',
    },
    expected_version: {
      type: 'integer',
      description: 'Obrigatório quando artifact_id for informado. Serve para evitar overwrite concorrente do draft.',
    },
    title: {
      type: 'string',
      description: 'Título do dashboard. Obrigatório na criação; opcional em update completo.',
    },
    source: {
      type: 'string',
      description: 'Source TSX completo do dashboard. Sempre obrigatório.',
    },
    workspace_id: {
      type: 'string',
      description: 'Workspace opcional dono do dashboard.',
    },
    slug: {
      type: 'string',
      description: 'Slug opcional estável do dashboard dentro do workspace.',
    },
    metadata: {
      type: 'object',
      additionalProperties: true,
      description: 'Metadados opcionais persistidos no registro principal do dashboard.',
    },
    change_summary: {
      type: 'string',
      description: 'Resumo curto opcional da mudança/versionamento.',
    },
  },
  required: ['source'],
  additionalProperties: true,
} as const

export const ARTIFACT_PATCH_TOOL_PARAMETERS = {
  type: 'object',
  properties: {
    artifact_id: {
      type: 'string',
      description: 'UUID do dashboard persistido.',
    },
    expected_version: {
      type: 'integer',
      description: 'Versão draft atual esperada. Obrigatório para detectar conflito de concorrência.',
    },
    operation: {
      type: 'object',
      description: 'Operação de patch a aplicar no source atual.',
      properties: {
        type: {
          type: 'string',
          enum: ['replace_text', 'replace_full_source'],
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
          description: 'Se true, substitui todas as ocorrências em replace_text. Default: false.',
        },
        source: {
          type: 'string',
          description: 'Source TSX completo quando type=replace_full_source.',
        },
        change_summary: {
          type: 'string',
          description: 'Resumo curto opcional da mudança.',
        },
      },
      required: ['type'],
      additionalProperties: true,
    },
  },
  required: ['artifact_id', 'expected_version', 'operation'],
  additionalProperties: true,
} as const
