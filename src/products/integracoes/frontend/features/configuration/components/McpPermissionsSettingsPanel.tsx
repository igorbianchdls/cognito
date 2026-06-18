'use client'

import { Bot } from 'lucide-react'

import { Switch } from '@/components/ui/switch'
import {
  applyMcpPermissionPreset,
  MCP_PERMISSION_PRESETS,
  type McpPermissionPreset,
  type McpPermissionPresetState,
} from '@/products/integracoes/frontend/features/configuration/lib/mcpPermissionPresets'

type McpPermissionsSettings = McpPermissionPresetState & {
  preset: McpPermissionPreset
}

type PermissionKey = 'readResources' | 'liveReadResources' | 'writeResources' | 'destructiveResources'

type McpPermissionsSettingsPanelProps = {
  value: McpPermissionsSettings
  onChange: (value: McpPermissionsSettings) => void
}

const PERMISSION_SECTIONS: Array<{ key: PermissionKey; label: string; description: string }> = [
  {
    key: 'readResources',
    label: 'Leitura do warehouse',
    description: 'Permite consultar dados sincronizados no BigQuery.',
  },
  {
    key: 'liveReadResources',
    label: 'Leitura live',
    description: 'Permite consultar a API do provider quando houver adapter live.',
  },
  {
    key: 'writeResources',
    label: 'Ações de escrita',
    description: 'Permite criar ou atualizar registros quando houver adapter de ação.',
  },
  {
    key: 'destructiveResources',
    label: 'Ações sensíveis',
    description: 'Permite cancelar, excluir, estornar ou executar ações destrutivas.',
  },
]

function wildcard(enabled: boolean) {
  return enabled ? ['*'] : []
}

export default function McpPermissionsSettingsPanel({
  value,
  onChange,
}: McpPermissionsSettingsPanelProps) {
  function applyPreset(preset: McpPermissionPreset) {
    onChange({
      preset,
      ...applyMcpPermissionPreset(preset, ['*']),
    })
  }

  function togglePermission(key: PermissionKey, checked: boolean) {
    onChange({
      ...value,
      enabled: checked ? true : value.enabled,
      preset: value.preset === 'blocked' && checked ? 'read_only' : value.preset,
      [key]: wildcard(checked),
    })
  }

  return (
    <section className="rounded-[16px] border border-[#E6EAF4] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#F1EEFF] text-[#5B49E6]">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[16px] font-semibold text-[#1B2440]">Permissões MCP</div>
            <div className="mt-1 text-[13px] leading-5 text-[#66748D]">
              Controla o que o plugin pode consultar ou executar nessa conexão.
            </div>
          </div>
        </div>
        <Switch
          checked={value.enabled}
          onCheckedChange={(checked) => onChange({ ...value, enabled: checked })}
          aria-label="Ativar permissões MCP"
        />
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {MCP_PERMISSION_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => applyPreset(preset.value)}
            className={[
              'min-h-[84px] rounded-[12px] border px-3 py-3 text-left transition',
              value.preset === preset.value
                ? 'border-[#5B49E6] bg-[#F6F4FF] text-[#261B74]'
                : 'border-[#E7EAF2] bg-white text-[#33405A] hover:bg-[#F7F8FC]',
            ].join(' ')}
          >
            <div className="text-[13px] font-semibold">{preset.label}</div>
            <div className="mt-1 text-[12px] leading-4 text-[#66748D]">{preset.description}</div>
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {PERMISSION_SECTIONS.map((section) => (
          <div key={section.key} className="flex items-start justify-between gap-4 rounded-[12px] border border-[#E7EAF2] p-3">
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-[#33405A]">
                {section.label}
              </div>
              <div className="mt-1 text-[12px] leading-4 text-[#66748D]">
                {section.description}
              </div>
            </div>
            <Switch
              checked={value[section.key].includes('*')}
              disabled={!value.enabled}
              onCheckedChange={(checked) => togglePermission(section.key, checked)}
              aria-label={section.label}
            />
          </div>
        ))}
      </div>

      <label className="mt-4 flex items-center gap-2 text-[13px] font-medium text-[#33405A]">
        <input
          type="checkbox"
          checked={value.requireConfirmation}
          disabled={!value.enabled}
          onChange={(event) => onChange({ ...value, requireConfirmation: event.target.checked })}
          className="h-4 w-4 accent-[#17203A]"
        />
        Exigir confirmação antes de ações MCP
      </label>
    </section>
  )
}
