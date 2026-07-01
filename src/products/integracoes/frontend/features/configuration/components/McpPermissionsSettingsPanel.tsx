'use client'

import { Bot } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import type {
  McpPermissionPreset,
  McpPermissionPresetState,
} from '@/products/integracoes/frontend/features/configuration/lib/mcpPermissionPresets'

type McpPermissionsSettings = McpPermissionPresetState & {
  preset: McpPermissionPreset
}

type McpPermissionsSettingsPanelProps = {
  value: McpPermissionsSettings
  resources?: string[]
  onChange: (value: McpPermissionsSettings) => void
}

function wildcard(enabled: boolean) {
  return enabled ? ['*'] : []
}

export default function McpPermissionsSettingsPanel({
  value,
  onChange,
}: McpPermissionsSettingsPanelProps) {
  function setEnabled(enabled: boolean) {
    onChange({
      ...value,
      preset: enabled ? 'actions_with_confirmation' : 'blocked',
      enabled,
      readResources: wildcard(enabled),
      liveReadResources: wildcard(enabled),
      writeResources: wildcard(enabled),
      destructiveResources: wildcard(enabled),
      requireConfirmation: enabled ? value.requireConfirmation : true,
    })
  }

  return (
    <Card className="rounded-lg bg-white py-0 shadow-none">
      <CardContent className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#F1EEFF] text-[#5B49E6]">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[16px] font-semibold text-[#1B2440]">Acesso da IA</div>
            <div className="mt-1 text-[13px] leading-5 text-[#66748D]">
              Permite consultar dados e executar ações nesta conexão. A confirmação continua protegendo alterações reais.
            </div>
          </div>
        </div>
        <Switch
          checked={value.enabled}
          onCheckedChange={setEnabled}
          aria-label="Permitir acesso da IA"
        />
      </div>

      <label className="mt-4 flex items-center gap-2 text-[13px] font-medium text-[#33405A]">
        <Checkbox
          checked={value.requireConfirmation}
          disabled={!value.enabled}
          onCheckedChange={(checked) => onChange({ ...value, requireConfirmation: checked === true })}
        />
        Exigir confirmação antes de ações MCP
      </label>
      </CardContent>
    </Card>
  )
}
