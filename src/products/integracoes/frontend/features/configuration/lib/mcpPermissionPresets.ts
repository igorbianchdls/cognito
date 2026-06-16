export type McpPermissionPreset = 'blocked' | 'read_only' | 'actions_with_confirmation'

export type McpPermissionPresetState = {
  enabled: boolean
  readResources: string[]
  liveReadResources: string[]
  writeResources: string[]
  destructiveResources: string[]
  requireConfirmation: boolean
}

export const MCP_PERMISSION_PRESETS: Array<{
  value: McpPermissionPreset
  label: string
  description: string
}> = [
  {
    value: 'blocked',
    label: 'Bloqueado',
    description: 'O plugin MCP não pode ler nem executar ações nesta conexão.',
  },
  {
    value: 'read_only',
    label: 'Somente leitura',
    description: 'Permite consultar os dados já autorizados sem executar ações no app.',
  },
  {
    value: 'actions_with_confirmation',
    label: 'Ações com confirmação',
    description: 'Permite leitura e ações não destrutivas, sempre pedindo confirmação.',
  },
]

export function applyMcpPermissionPreset(
  preset: McpPermissionPreset,
  resources: string[],
): McpPermissionPresetState {
  if (preset === 'read_only') {
    return {
      enabled: true,
      readResources: resources,
      liveReadResources: [],
      writeResources: [],
      destructiveResources: [],
      requireConfirmation: true,
    }
  }

  if (preset === 'actions_with_confirmation') {
    return {
      enabled: true,
      readResources: resources,
      liveReadResources: resources,
      writeResources: resources,
      destructiveResources: [],
      requireConfirmation: true,
    }
  }

  return {
    enabled: false,
    readResources: [],
    liveReadResources: [],
    writeResources: [],
    destructiveResources: [],
    requireConfirmation: true,
  }
}

export function normalizeMcpPermissionPreset(value: unknown): McpPermissionPreset {
  if (value === 'read_only' || value === 'actions_with_confirmation' || value === 'blocked') return value
  return 'blocked'
}
