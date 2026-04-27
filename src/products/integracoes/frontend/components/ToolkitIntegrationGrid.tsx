'use client'

import { Switch } from '@/components/ui/switch'
import {
  renderIntegrationLogo,
  toolkitHasIcon,
} from '@/products/integracoes/shared/iconMaps'
import type { ToolkitDefinition, ToolkitStatusMap } from '@/products/integracoes/shared/types'

type ToolkitIntegrationGridProps = {
  toolkits: ToolkitDefinition[]
  tkStatus: ToolkitStatusMap
  busySlug: string | null
  onIntegrate: (slug: string) => void
  onDisconnectUnsupported: () => void
  priorityOrder?: readonly string[]
  preserveOrder?: boolean
}

export default function ToolkitIntegrationGrid({
  toolkits,
  tkStatus,
  busySlug,
  onIntegrate,
  onDisconnectUnsupported,
  priorityOrder = [],
  preserveOrder = false,
}: ToolkitIntegrationGridProps) {
  const priorityIndex = new Map<string, number>(
    priorityOrder.map((slug, index) => [String(slug).toUpperCase(), index]),
  )
  const ordered = preserveOrder ? toolkits : [...toolkits].sort((a, b) => {
    const aPriority = priorityIndex.get(String(a.slug).toUpperCase())
    const bPriority = priorityIndex.get(String(b.slug).toUpperCase())
    const aPinned = aPriority !== undefined
    const bPinned = bPriority !== undefined
    if (aPinned && bPinned && aPriority !== bPriority) return aPriority - bPriority
    if (aPinned !== bPinned) return aPinned ? -1 : 1

    const aHas = toolkitHasIcon(a.slug)
    const bHas = toolkitHasIcon(b.slug)
    if (aHas !== bHas) return aHas ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {ordered.map((toolkit) => {
        const lowerSlug = toolkit.slug.toLowerCase()
        const isOn = Boolean(tkStatus[toolkit.slug] ?? tkStatus[lowerSlug])

        return (
          <div
            key={toolkit.slug}
            className="border rounded p-4 bg-white"
            style={{ boxShadow: 'var(--shadow-3)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 min-w-0">
                {renderIntegrationLogo(toolkit.slug, toolkit.name)}
                <div className="min-w-0">
                  <div className="font-medium truncate">{toolkit.name}</div>
                  <div className="text-xs text-gray-500 truncate">{toolkit.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`text-xs px-2 py-0.5 rounded ${isOn ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {isOn ? 'Integrado' : 'Não conectado'}
                </div>
                <Switch
                  checked={isOn}
                  onCheckedChange={(checked) => {
                    const current = Boolean(tkStatus[toolkit.slug] ?? tkStatus[lowerSlug])
                    if (checked && !current) {
                      onIntegrate(toolkit.slug)
                      return
                    }

                    if (!checked && current) {
                      onDisconnectUnsupported()
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => onIntegrate(toolkit.slug)}
                disabled={busySlug === toolkit.slug}
                className="px-3 py-1.5 rounded bg-gray-100 text-gray-700 text-sm disabled:opacity-50"
              >
                {busySlug === toolkit.slug ? 'Abrindo…' : isOn ? 'Reintegrar' : 'Integrar'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
