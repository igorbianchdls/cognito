'use client'

import { useMemo, useState } from 'react'

import PageContainer from '@/components/layout/PageContainer'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import ToolkitIntegrationGrid from '@/products/integracoes/frontend/components/ToolkitIntegrationGrid'
import useIntegracoesComposio from '@/products/integracoes/frontend/hooks/useIntegracoesComposio'
import { renderIntegrationLogo, toolkitHasIcon } from '@/products/integracoes/shared/iconMaps'
import { DATA_CONNECTOR_EXTRA_TOOLKITS } from '@/products/integracoes/shared/dataConnectorExtras'
import { TOOLKITS } from '@/products/integracoes/shared/toolkits'
import type { FilterTab, ToolkitDefinition } from '@/products/integracoes/shared/types'

type IntegrationKind = 'mcp' | 'data-connectors'

const KIND_META: Record<IntegrationKind, { title: string; subtitle: string; countLabel: string }> = {
  mcp: {
    title: 'MCP (Ferramentas e Ações)',
    subtitle: 'Ações sob demanda para agentes: email, docs, tarefas, mensagens, CRM e automações.',
    countLabel: '200+ integrações',
  },
  'data-connectors': {
    title: 'Conectores de Dados (Dashboards)',
    subtitle: 'Conectores para sincronização contínua/periódica de dados usados em dashboards e BI.',
    countLabel: '600+ conectores',
  },
}

function SegmentButton({
  active,
  title,
  subtitle,
  countLabel,
  onClick,
}: {
  active: boolean
  title: string
  subtitle: string
  countLabel: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full rounded-xl border p-4 text-left transition-colors',
        active ? 'border-black bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <div className="mt-1 text-xs text-gray-600">{subtitle}</div>
        </div>
        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-700">
          {countLabel}
        </span>
      </div>
    </button>
  )
}

function DataConnectorGrid({ connectors }: { connectors: ToolkitDefinition[] }) {
  const ordered = [...connectors].sort((a, b) => {
    const aHas = toolkitHasIcon(a.slug)
    const bHas = toolkitHasIcon(b.slug)
    if (aHas === bHas) return a.name.localeCompare(b.name)
    return aHas ? -1 : 1
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {ordered.map((connector) => (
        <div key={connector.slug} className="border rounded p-4 bg-white" style={{ boxShadow: 'var(--shadow-3)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {renderIntegrationLogo(connector.slug, connector.name)}
              <div className="min-w-0">
                <div className="font-medium truncate">{connector.name}</div>
                <div className="text-xs text-gray-500 truncate">{connector.description}</div>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
              Em breve
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-gray-500">Sincronização contínua/periódica para BI</span>
            <button
              type="button"
              disabled
              className="px-3 py-1.5 rounded bg-gray-100 text-gray-500 text-sm disabled:opacity-80"
            >
              Solicitar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function IntegracoesPage() {
  const [activeKind, setActiveKind] = useState<IntegrationKind>('mcp')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  const {
    busySlug,
    error,
    tkStatus,
    userItems,
    selectedUserId,
    setError,
    setSelectedUserId,
    loadUsers,
    handleIntegrate,
  } = useIntegracoesComposio()
  const mcpToolkits = TOOLKITS
  const dataConnectorSamples = useMemo(() => {
    const map = new Map<string, ToolkitDefinition>()
    for (const tk of [...TOOLKITS, ...DATA_CONNECTOR_EXTRA_TOOLKITS]) {
      map.set(String(tk.slug).toUpperCase(), tk)
    }
    return Array.from(map.values())
  }, [])

  const filteredMcpToolkits = useMemo(() => {
    if (activeTab === 'all') return mcpToolkits
    return mcpToolkits.filter((toolkit) => {
      const lowerSlug = toolkit.slug.toLowerCase()
      const isConnected = Boolean(tkStatus[toolkit.slug] ?? tkStatus[lowerSlug])
      return activeTab === 'connected' ? isConnected : !isConnected
    })
  }, [activeTab, mcpToolkits, tkStatus])

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden">
          <div className="flex-1">
            <PageContainer className="bg-white">
              <div className="h-full overflow-auto">
                <div className="px-14 py-6">
                  <div className="mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">Integrações</h1>
                    <p className="text-gray-600 text-lg mb-8">
                      Separe integrações por uso: ações de agente (MCP) e conectores de dados para dashboards/BI.
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
                      <SegmentButton
                        active={activeKind === 'mcp'}
                        title={KIND_META.mcp.title}
                        subtitle={KIND_META.mcp.subtitle}
                        countLabel={KIND_META.mcp.countLabel}
                        onClick={() => setActiveKind('mcp')}
                      />
                      <SegmentButton
                        active={activeKind === 'data-connectors'}
                        title={KIND_META['data-connectors'].title}
                        subtitle={KIND_META['data-connectors'].subtitle}
                        countLabel={KIND_META['data-connectors'].countLabel}
                        onClick={() => setActiveKind('data-connectors')}
                      />
                    </div>

                    {activeKind === 'mcp' && (
                      <div className="mb-6 flex items-center gap-2">
                        <label className="text-sm text-gray-700">Usuário:</label>
                        <select
                          value={selectedUserId}
                          onChange={(event) => setSelectedUserId(event.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          {userItems.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.label} ({user.id})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => loadUsers()}
                          className="px-2 py-1 text-sm border rounded"
                        >
                          Atualizar
                        </button>
                      </div>
                    )}

                    {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

                    {activeKind === 'mcp' ? (
                      <>
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <h2 className="text-xl font-semibold text-gray-900">MCP (Ações)</h2>
                            <p className="text-sm text-gray-600 mt-1">
                              Ferramentas acionadas pelo agente sob demanda (email, docs, tarefas, CRM, mensagens).
                            </p>
                          </div>
                        </div>

                        <ToolkitIntegrationGrid
                          toolkits={filteredMcpToolkits}
                          tkStatus={tkStatus}
                          busySlug={busySlug}
                          onIntegrate={handleIntegrate}
                          onDisconnectUnsupported={() =>
                            setError('Desconectar ainda não implementado')
                          }
                        />
                      </>
                    ) : (
                      <>
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <h2 className="text-xl font-semibold text-gray-900">Conectores de Dados (Dashboards)</h2>
                            <p className="text-sm text-gray-600 mt-1">
                              Conectores para sincronização contínua/periódica e ingestão de dados em BI/dashboard.
                            </p>
                          </div>
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                            600+ conectores
                          </span>
                        </div>
                        <DataConnectorGrid connectors={dataConnectorSamples} />
                      </>
                    )}

                    {activeKind === 'mcp' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setActiveTab('all')}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            activeTab === 'all'
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          Todas as Aplicações
                        </button>
                        <button
                          onClick={() => setActiveTab('connected')}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            activeTab === 'connected'
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          Conectadas
                        </button>
                        <button
                          onClick={() => setActiveTab('disconnected')}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            activeTab === 'disconnected'
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          Desconectadas
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </PageContainer>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
