"use client"

import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import ProviderRow from "./connector/ProviderRow"
import ConnectorTile from "./connector/ConnectorTile"
import { catalog, flatAllConnectors } from "./connector/data"
import type { Provider } from "./connector/types"

const STORAGE_KEY = 'workflows_connectors_expanded'

export default function ConnectorsPanel({ onConnectorClick }: { onConnectorClick?: (id: string) => void }) {
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // Persist expanded providers
  useEffect(() => {
    try {
      const str = localStorage.getItem(STORAGE_KEY)
      if (str) setExpanded(JSON.parse(str))
    } catch {}
  }, [])
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(expanded)) } catch {}
  }, [expanded])

  const providers: Provider[] = useMemo(() => catalog.providers, [])
  const actionBlocks = catalog.actionBlocks
  const actionProvider: Provider = useMemo(() => ({
    id: 'action-blocks',
    name: 'Action Blocks',
    count: actionBlocks.length,
    connectors: actionBlocks,
  }), [actionBlocks])

  const results = useMemo(() => {
    if (!query.trim()) return [] as ReturnType<typeof flatAllConnectors>
    const q = query.trim().toLowerCase()
    return flatAllConnectors().filter((c) =>
      c.label.toLowerCase().includes(q) ||
      (c.hint && c.hint.toLowerCase().includes(q)) ||
      (c.tags?.some(t => t.toLowerCase().includes(q)))
    )
  }, [query])

  return (
    <aside className="h-full w-full bg-white flex flex-col">
      <div className="p-3 sticky top-0 bg-white z-10">
        <div className="text-xs font-medium text-gray-500 mb-2" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.28px' }}>Connectors</div>
        <Input placeholder="Search connectors..." className="h-8" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <Separator />
      <div className="p-2 flex-1 overflow-auto sidebar-scrollbar">
        {/* Results mode */}
        {query.trim() ? (
          <div className="px-1 pb-3">
            <div className="text-xs text-gray-500 mb-2" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.28px' }}>
              Results ({results.length})
            </div>
            {results.length ? (
              <div className="grid grid-cols-2 gap-3">
                {results.map((c) => (
                  <ConnectorTile key={c.id} icon={c.icon} label={c.label} hint={c.provider} onClick={() => onConnectorClick?.(c.id)} />
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500">No connectors found</div>
            )}
          </div>
        ) : (
          <>
            {/* Collapsible Action Blocks as a provider */}
            <div className="px-1">
              <ProviderRow
                provider={actionProvider}
                expanded={expanded['action-blocks'] ?? true}
                onToggle={() => setExpanded((prev) => ({ ...prev, ['action-blocks']: !(prev['action-blocks'] ?? true) }))}
                onConnectorClick={onConnectorClick}
              />
            </div>

            {/* Providers list */}
            <div className="px-1">
              {providers.map((p) => (
                <ProviderRow
                  key={p.id}
                  provider={p}
                  expanded={!!expanded[p.id]}
                  onToggle={() => setExpanded((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                  onConnectorClick={onConnectorClick}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
