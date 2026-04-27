'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Database, Search, Star, Zap } from 'lucide-react'

import PageContainer from '@/components/layout/PageContainer'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import type { ToolkitDefinition, ToolkitStatusMap } from '@/products/integracoes/shared/types'

type IntegrationKind = 'mcp' | 'data-connectors'
type CatalogCategory = 'all' | 'communication' | 'data' | 'productivity' | 'marketing' | 'support' | 'other'
type SortMode = 'popular' | 'name' | 'connected'

const CATEGORY_TABS: Array<{ value: CatalogCategory; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'communication', label: 'Comunicação' },
  { value: 'data', label: 'Dados & Relatórios' },
  { value: 'productivity', label: 'Produtividade' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'support', label: 'Suporte' },
  { value: 'other', label: 'Outros' },
]

const SORT_LABELS: Record<SortMode, string> = {
  popular: 'Mais usadas',
  name: 'Nome (A-Z)',
  connected: 'Conectadas primeiro',
}

const COMMUNICATION_SLUGS = new Set([
  'GMAIL',
  'WHATSAPP',
  'SLACK',
  'TELEGRAM',
  'DISCORD',
  'OUTLOOK',
  'MICROSOFT_TEAMS',
  'GOOGLECALENDAR',
  'ZOOM',
  'SENDGRID',
  'SENDLANE',
])

const DATA_SLUGS = new Set([
  'GOOGLESHEETS',
  'GOOGLE_ANALYTICS',
  'CLICKHOUSE',
  'DATABRICKS',
  'METABASE',
  'MICROSOFT_CLARITY',
  'MIXPANEL',
  'POSTHOG',
  'SNOWFLAKE',
  'SUPABASE',
  'POSTGRESQL',
  'MYSQL',
  'MARIADB',
  'MONGODB',
  'REDIS',
  'ELASTICSEARCH',
  'OPENSEARCH',
  'APACHE_KAFKA',
  'APACHE_AIRFLOW',
  'APACHE_SPARK',
  'APACHE_DRUID',
  'BIGQUERY',
  'AMAZON_REDSHIFT',
  'AMAZON_RDS',
  'AMAZON_S3',
  'GOOGLE_CLOUD_STORAGE',
  'MICROSOFT_SQL_SERVER',
  'SQLITE',
  'ORACLE',
  'DUCKDB',
  'TRINO',
  'PRESTO',
  'DBT',
  'AIRBYTE',
  'POWER_BI',
  'TABLEAU',
  'LOOKER',
  'DATADOG',
])

const PRODUCTIVITY_SLUGS = new Set([
  'GOOGLEDRIVE',
  'GOOGLEDOCS',
  'GOOGLESLIDES',
  'NOTION',
  'AIRTABLE',
  'CALENDLY',
  'CAL',
  'CANVA',
  'CLICKUP',
  'CODA',
  'DROPBOX',
  'FIGMA',
  'GITHUB',
  'JIRA',
  'JOTFORM',
  'LINEAR',
  'MONDAY',
  'ONE_DRIVE',
  'TALLY',
  'TRELLO',
  'TYPEFORM',
  'VERCEL',
])

const MARKETING_SLUGS = new Set([
  'ACTIVE_CAMPAIGN',
  'FACEBOOK',
  'GOOGLEADS',
  'HUBSPOT',
  'INSTAGRAM',
  'LINKEDIN',
  'MAILCHIMP',
  'METAADS',
  'REMOVE_BG',
  'SHOPIFY',
  'TIKTOK',
  'TWITTER',
  'YOUTUBE',
  'AMAZON',
])

const SUPPORT_SLUGS = new Set([
  'INTERCOM',
  'SALESFORCE_SERVICE_CLOUD',
  'SERVICENOW',
  'ZENDESK',
])

function categorizeToolkit(slug: string): CatalogCategory {
  const key = String(slug).toUpperCase()
  if (COMMUNICATION_SLUGS.has(key)) return 'communication'
  if (DATA_SLUGS.has(key)) return 'data'
  if (PRODUCTIVITY_SLUGS.has(key)) return 'productivity'
  if (MARKETING_SLUGS.has(key)) return 'marketing'
  if (SUPPORT_SLUGS.has(key)) return 'support'
  return 'other'
}

function isToolkitConnected(slug: string, tkStatus: ToolkitStatusMap) {
  const lowerSlug = slug.toLowerCase()
  return Boolean(tkStatus[slug] ?? tkStatus[lowerSlug])
}

function sortByPriority(
  items: ToolkitDefinition[],
  priorityOrder: readonly string[],
  tkStatus: ToolkitStatusMap,
  sortMode: SortMode = 'popular',
) {
  const priorityIndex = new Map<string, number>(
    priorityOrder.map((slug, index) => [String(slug).toUpperCase(), index]),
  )

  return [...items].sort((a, b) => {
    if (sortMode === 'connected') {
      const aConnected = isToolkitConnected(a.slug, tkStatus)
      const bConnected = isToolkitConnected(b.slug, tkStatus)
      if (aConnected !== bConnected) return aConnected ? -1 : 1
    }

    if (sortMode === 'name') return a.name.localeCompare(b.name)

    const aPriority = priorityIndex.get(String(a.slug).toUpperCase())
    const bPriority = priorityIndex.get(String(b.slug).toUpperCase())
    const aPinned = aPriority !== undefined
    const bPinned = bPriority !== undefined
    if (aPinned && bPinned && aPriority !== bPriority) return aPriority - bPriority
    if (aPinned !== bPinned) return aPinned ? -1 : 1

    const aConnected = isToolkitConnected(a.slug, tkStatus)
    const bConnected = isToolkitConnected(b.slug, tkStatus)
    if (aConnected !== bConnected) return aConnected ? 1 : -1

    const aHas = toolkitHasIcon(a.slug)
    const bHas = toolkitHasIcon(b.slug)
    if (aHas !== bHas) return aHas ? -1 : 1

    return a.name.localeCompare(b.name)
  })
}

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

function RecommendationCard({
  toolkit,
  tkStatus,
  busySlug,
  onIntegrate,
}: {
  toolkit: ToolkitDefinition
  tkStatus: ToolkitStatusMap
  busySlug: string | null
  onIntegrate: (slug: string) => void
}) {
  const connected = isToolkitConnected(toolkit.slug, tkStatus)

  return (
    <div className="flex min-w-0 items-center gap-4 px-5 py-5">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-white ring-1 ring-[#ECEFFC]">
        {renderIntegrationLogo(toolkit.slug, toolkit.name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[16px] font-semibold tracking-[-0.02em] text-[#202A3D]">{toolkit.name}</div>
        <div className="mt-1 text-[13px] leading-5 text-[#6B7790]">{toolkit.description}</div>
      </div>
      <button
        type="button"
        onClick={() => onIntegrate(toolkit.slug)}
        disabled={busySlug === toolkit.slug}
        className="shrink-0 rounded-[12px] border border-[#DCDDF5] bg-white px-4 py-2 text-[13px] font-semibold text-[#5C47D6] transition hover:border-[#CBCBF0] hover:bg-[#F8F7FF] disabled:opacity-60"
      >
        {busySlug === toolkit.slug ? 'Abrindo...' : connected ? 'Gerenciar' : 'Conectar'}
      </button>
    </div>
  )
}

function DataConnectorGrid({
  connectors,
  tkStatus,
  preserveOrder = false,
}: {
  connectors: ToolkitDefinition[]
  tkStatus: ToolkitStatusMap
  preserveOrder?: boolean
}) {
  const topPriorityIndex = new Map<string, number>(
    DATA_CONNECTOR_TOP_PRIORITY_ORDER.map((slug, index) => [slug, index]),
  )
  const ordered = preserveOrder ? connectors : [...connectors].sort((a, b) => {
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
  const [activeCategory, setActiveCategory] = useState<CatalogCategory>('all')
  const [search, setSearch] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('popular')

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

  const recommendationToolkits = useMemo(() => {
    const source = activeKind === 'mcp' ? mcpToolkits : dataConnectorSamples
    const priority = activeKind === 'mcp' ? MCP_TOP_PRIORITY_ORDER : DATA_CONNECTOR_TOP_PRIORITY_ORDER
    return sortByPriority(source, priority, tkStatus).slice(0, 3)
  }, [activeKind, dataConnectorSamples, mcpToolkits, tkStatus])

  const catalogToolkits = useMemo(() => {
    const source = activeKind === 'mcp' ? mcpToolkits : dataConnectorSamples
    const priority = activeKind === 'mcp' ? MCP_TOP_PRIORITY_ORDER : DATA_CONNECTOR_TOP_PRIORITY_ORDER
    const query = search.trim().toLowerCase()

    const filtered = source.filter((toolkit) => {
      if (activeCategory !== 'all' && categorizeToolkit(toolkit.slug) !== activeCategory) return false
      if (!query) return true
      const haystack = `${toolkit.name} ${toolkit.description} ${toolkit.slug}`.toLowerCase()
      return haystack.includes(query)
    })

    return sortByPriority(filtered, priority, tkStatus, sortMode)
  }, [activeCategory, activeKind, dataConnectorSamples, mcpToolkits, search, sortMode, tkStatus])

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

                    <section className="mb-6 overflow-hidden rounded-[24px] border border-[#E6EAF4] bg-white">
                      <div className="grid gap-0 xl:grid-cols-[360px_repeat(3,minmax(0,1fr))]">
                        <div className="border-b border-[#EDF1F6] px-6 py-6 xl:border-b-0 xl:border-r">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 place-items-center rounded-[12px] bg-[#F4F0FF] text-[#5B49E6]">
                              <Star className="h-4 w-4" />
                            </div>
                            <div className="text-[28px] font-semibold tracking-[-0.03em] text-[#1B2440]">Recomendadas para você</div>
                          </div>
                          <p className="mt-3 max-w-[28ch] text-[15px] leading-6 text-[#66748D]">
                            Integrações que podem gerar mais impacto no seu negócio.
                          </p>
                        </div>

                        {recommendationToolkits.map((toolkit, index) => (
                          <div
                            key={toolkit.slug}
                            className={[
                              'border-[#EDF1F6]',
                              index < recommendationToolkits.length - 1 ? 'border-b px-2 xl:border-b-0 xl:border-r' : 'px-2',
                            ].join(' ')}
                          >
                            <RecommendationCard
                              toolkit={toolkit}
                              tkStatus={tkStatus}
                              busySlug={busySlug}
                              onIntegrate={handleIntegrate}
                            />
                          </div>
                        ))}
                      </div>
                    </section>

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

                    <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as CatalogCategory)} className="min-w-0">
                        <TabsList variant="underline" className="flex min-w-0 flex-wrap justify-start gap-2 bg-transparent p-0">
                          {CATEGORY_TABS.map((tab) => (
                            <TabsTrigger
                              key={tab.value}
                              value={tab.value}
                              variant="underline"
                              className="pb-3 pt-0 text-[14px] font-medium"
                              activeColor="#5B49E6"
                              inactiveColor="#647089"
                              activeBorderColor="#5B49E6"
                            >
                              {tab.label}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <label className="relative min-w-[280px]">
                          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#97A2B8]" />
                          <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar integração..."
                            className="h-11 w-full rounded-[12px] border border-[#E1E6F0] bg-white pl-11 pr-4 text-[14px] text-[#1E2942] outline-none transition placeholder:text-[#9AA6BC] focus:border-[#B3BDED]"
                          />
                        </label>

                        <label className="relative min-w-[168px]">
                          <select
                            value={sortMode}
                            onChange={(event) => setSortMode(event.target.value as SortMode)}
                            className="h-11 w-full appearance-none rounded-[12px] border border-[#E1E6F0] bg-white px-4 pr-10 text-[14px] font-medium text-[#2A3550] outline-none transition focus:border-[#B3BDED]"
                          >
                            {Object.entries(SORT_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#95A1B8]" />
                        </label>
                      </div>
                    </div>

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
                          toolkits={catalogToolkits}
                          tkStatus={tkStatus}
                          busySlug={busySlug}
                          onIntegrate={handleIntegrate}
                          preserveOrder
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
                            {catalogToolkits.length} conectores
                          </span>
                        </div>
                        <DataConnectorGrid connectors={catalogToolkits} tkStatus={tkStatus} preserveOrder />
                      </>
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
