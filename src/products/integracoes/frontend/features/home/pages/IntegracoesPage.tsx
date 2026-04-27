'use client'

import { useMemo, useState } from 'react'
import { Database, Zap } from 'lucide-react'

import PageContainer from '@/components/layout/PageContainer'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import ToolkitIntegrationGrid from '@/products/integracoes/frontend/components/ToolkitIntegrationGrid'
import useIntegracoesComposio from '@/products/integracoes/frontend/hooks/useIntegracoesComposio'
import { renderIntegrationLogo, toolkitHasIcon } from '@/products/integracoes/shared/iconMaps'
import {
  applyToolkitDescriptionOverrides,
  DATA_CONNECTOR_TOP_PRIORITY_ORDER,
  MCP_DESCRIPTION_OVERRIDES,
  MCP_TOP_PRIORITY_ORDER,
} from '@/products/integracoes/shared/catalogPresentation'
import { DATA_CONNECTOR_EXTRA_TOOLKITS } from '@/products/integracoes/shared/dataConnectorExtras'
import { TOOLKITS } from '@/products/integracoes/shared/toolkits'
import type { FilterTab, ToolkitDefinition, ToolkitStatusMap } from '@/products/integracoes/shared/types'

type IntegrationKind = 'mcp' | 'data-connectors'

const KIND_META: Record<
  IntegrationKind,
  {
    icon: typeof Zap
    title: string
    subtitle: string
    countLabel: string
    surfaceClassName: string
    iconWrapClassName: string
    iconClassName: string
    badgeClassName: string
  }
> = {
  mcp: {
    icon: Zap,
    title: 'Automação (agir)',
    subtitle: 'Conecte ferramentas de comunicação e produtividade para automatizar tarefas e processos.',
    countLabel: '12 integrações',
    surfaceClassName: 'border-[#E9E2FF] bg-[#FBF9FF]',
    iconWrapClassName: 'bg-[#EEE8FF] ring-1 ring-[#DDD2FF]',
    iconClassName: 'text-[#6A50F0]',
    badgeClassName: 'bg-[#EEE8FF] text-[#6A50F0]',
  },
  'data-connectors': {
    icon: Database,
    title: 'Dados (analisar)',
    subtitle: 'Conecte fontes de dados para centralizar informações e gerar insights nos seus dashboards.',
    countLabel: '18 integrações',
    surfaceClassName: 'border-[#D9E9FF] bg-[#F7FBFF]',
    iconWrapClassName: 'bg-[#EEF6FF] ring-1 ring-[#D8E8FF]',
    iconClassName: 'text-[#2383E2]',
    badgeClassName: 'bg-[#E6F1FF] text-[#2383E2]',
  },
}

function SegmentButton({
  active,
  kind,
  title,
  subtitle,
  countLabel,
  onClick,
}: {
  active: boolean
  kind: IntegrationKind
  title: string
  subtitle: string
  countLabel: string
  onClick: () => void
}) {
  const meta = KIND_META[kind]
  const Icon = meta.icon

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full rounded-[24px] border px-6 py-6 text-left transition-all',
        meta.surfaceClassName,
        active
          ? 'shadow-[0_18px_40px_rgba(42,58,92,0.10)]'
          : 'opacity-90 hover:opacity-100 hover:shadow-[0_14px_30px_rgba(42,58,92,0.08)]',
      ].join(' ')}
    >
      <div className="flex items-start gap-5">
        <div className={['grid h-16 w-16 shrink-0 place-items-center rounded-[18px]', meta.iconWrapClassName].join(' ')}>
          <Icon className={['h-8 w-8', meta.iconClassName].join(' ')} />
        </div>
        <div className="min-w-0">
          <div className="text-[18px] font-semibold tracking-[-0.02em] text-[#172033]">{title}</div>
          <div className="mt-2 max-w-[56ch] text-[14px] leading-6 text-[#536179]">{subtitle}</div>
          <span className={['mt-4 inline-flex rounded-full px-3 py-1 text-[12px] font-semibold', meta.badgeClassName].join(' ')}>
            {countLabel}
          </span>
        </div>
      </div>
    </button>
  )
}

function DataConnectorGrid({
  connectors,
  tkStatus,
}: {
  connectors: ToolkitDefinition[]
  tkStatus: ToolkitStatusMap
}) {
  const topPriorityIndex = new Map<string, number>(
    DATA_CONNECTOR_TOP_PRIORITY_ORDER.map((slug, index) => [slug, index]),
  )
  const ordered = [...connectors].sort((a, b) => {
    const aPriority = topPriorityIndex.get(String(a.slug).toUpperCase())
    const bPriority = topPriorityIndex.get(String(b.slug).toUpperCase())
    const aPinned = aPriority !== undefined
    const bPinned = bPriority !== undefined
    if (aPinned && bPinned && aPriority !== bPriority) return aPriority - bPriority
    if (aPinned !== bPinned) return aPinned ? -1 : 1

    const aHas = toolkitHasIcon(a.slug)
    const bHas = toolkitHasIcon(b.slug)
    if (aHas === bHas) return a.name.localeCompare(b.name)
    return aHas ? -1 : 1
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {ordered.map((connector) => (
        <div key={connector.slug} className="border rounded p-4 bg-white" style={{ boxShadow: 'var(--shadow-3)' }}>
          {(() => {
            const lowerSlug = connector.slug.toLowerCase()
            const isConnected = Boolean(tkStatus[connector.slug] ?? tkStatus[lowerSlug])
            return (
              <>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {renderIntegrationLogo(connector.slug, connector.name)}
              <div className="min-w-0">
                <div className="font-medium truncate">{connector.name}</div>
                <div className="text-xs text-gray-500 truncate">{connector.description}</div>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${
                isConnected
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {isConnected ? 'Conectado' : 'Disponível'}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {isConnected ? 'Sincronização ativa para BI' : 'Pronto para sincronização contínua/periódica'}
            </span>
            <button
              type="button"
              className={`px-3 py-1.5 rounded text-sm ${
                isConnected
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-black text-white'
              }`}
            >
              {isConnected ? 'Configurar' : 'Conectar'}
            </button>
          </div>
              </>
            )
          })()}
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
  const mcpToolkits = useMemo(
    () => applyToolkitDescriptionOverrides(TOOLKITS, MCP_DESCRIPTION_OVERRIDES),
    [],
  )
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
            <PageContainer className="bg-[#F7F8FC]">
              <div className="h-full overflow-auto">
                <div className="px-8 py-8 lg:px-12">
                  <div className="mb-10">
                    <h1 className="mb-2 text-[42px] font-semibold tracking-[-0.04em] text-[#16203A]">Integrações</h1>
                    <p className="mb-8 text-[18px] leading-7 text-[#647089]">
                      Conecte suas ferramentas e automatize seu negócio.
                    </p>

                    <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
                      <SegmentButton
                        active={activeKind === 'mcp'}
                        kind="mcp"
                        title={KIND_META.mcp.title}
                        subtitle={KIND_META.mcp.subtitle}
                        countLabel={KIND_META.mcp.countLabel}
                        onClick={() => setActiveKind('mcp')}
                      />
                      <SegmentButton
                        active={activeKind === 'data-connectors'}
                        kind="data-connectors"
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
                          priorityOrder={MCP_TOP_PRIORITY_ORDER}
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
                        <DataConnectorGrid connectors={dataConnectorSamples} tkStatus={tkStatus} />
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
