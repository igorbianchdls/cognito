"use client"

import * as React from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import ConnectorTile from "./ConnectorTile"
import type { Provider } from "./types"

export default function ProviderRow({
  provider,
  expanded,
  onToggle,
  onConnectorClick,
}: {
  provider: Provider
  expanded: boolean
  onToggle: () => void
  onConnectorClick?: (id: string) => void
}) {
  return (
    <div className="border-b border-gray-100 last:border-none">
      <button
        className="w-full flex items-center justify-between px-2 py-2 hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-sm text-gray-800 font-medium" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.28px' }}>
            {provider.name}
          </span>
        </div>
        {typeof provider.count === 'number' ? (
          <span className="text-xs text-gray-500">{provider.count}</span>
        ) : null}
      </button>

      {expanded ? (
        <div className="px-2 pb-3">
          <div className="grid grid-cols-2 gap-3">
            {provider.connectors.map((c) => (
              <ConnectorTile
                key={c.id}
                icon={c.icon}
                label={c.label}
                hint={c.hint}
                onClick={() => onConnectorClick?.(c.id)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

