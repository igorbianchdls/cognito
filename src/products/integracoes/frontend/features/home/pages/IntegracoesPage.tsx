'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, ChevronDown, Database, LockKeyhole, MoreHorizontal, Search, ShieldCheck, Star, Zap } from 'lucide-react'

import PageContainer from '@/components/layout/PageContainer'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
    countLabel: '500+ integrações',
    surfaceClassName: 'border-[#E9E2FF] bg-[#FBF9FF]',
    iconWrapClassName: 'bg-[#EEE8FF] ring-1 ring-[#DDD2FF]',
    iconClassName: 'text-[#6A50F0]',
    badgeClassName: 'bg-[#EEE8FF] text-[#6A50F0]',
  },
  'data-connectors': {
    icon: Database,
    title: 'Dados (analisar)',
    subtitle: 'Conecte fontes de dados para centralizar informações e gerar insights nos seus dashboards.',
    countLabel: '700+ conectores',
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
  kind,
  tkStatus,
  busySlug,
  onAction,
}: {
  toolkit: ToolkitDefinition
  kind: IntegrationKind
  tkStatus: ToolkitStatusMap
  busySlug: string | null
  onAction: (toolkit: ToolkitDefinition) => void
}) {
  const connected = isToolkitConnected(toolkit.slug, tkStatus)
  const isBusy = kind === 'mcp' && busySlug === toolkit.slug

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
        onClick={() => onAction(toolkit)}
        disabled={isBusy}
        className="shrink-0 rounded-[12px] border border-[#DCDDF5] bg-white px-4 py-2 text-[13px] font-semibold text-[#5C47D6] transition hover:border-[#CBCBF0] hover:bg-[#F8F7FF] disabled:opacity-60"
      >
        {isBusy ? 'Abrindo...' : connected ? 'Gerenciar' : kind === 'mcp' ? 'Conectar' : 'Configurar'}
      </button>
    </div>
  )
}

function CatalogCard({
  toolkit,
  kind,
  tkStatus,
  busySlug,
  onAction,
}: {
  toolkit: ToolkitDefinition
  kind: IntegrationKind
  tkStatus: ToolkitStatusMap
  busySlug: string | null
  onAction: (toolkit: ToolkitDefinition) => void
}) {
  const connected = isToolkitConnected(toolkit.slug, tkStatus)
  const category = CATEGORY_TABS.find((tab) => tab.value === categorizeToolkit(toolkit.slug))?.label ?? 'Outros'
  const statusLabel = connected ? 'Conectado' : kind === 'mcp' ? 'Pronto para automação' : 'Pronto para sincronizar'
  const helperText = connected
    ? kind === 'mcp'
      ? 'Disponível para ações do agente neste workspace.'
      : 'Sincronização de dados pronta para uso em dashboards.'
    : kind === 'mcp'
      ? 'Conecte para liberar ações do agente e fluxos operacionais.'
      : 'Conecte para alimentar relatórios e análises contínuas.'
  const isBusy = kind === 'mcp' && busySlug === toolkit.slug
  const buttonLabel = isBusy ? 'Abrindo...' : connected ? 'Gerenciar' : kind === 'mcp' ? 'Conectar' : 'Configurar'

  return (
    <article className="flex h-full min-h-[252px] flex-col rounded-[22px] border border-[#E6EAF4] bg-white p-5 shadow-[0_12px_30px_rgba(23,32,58,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-[#F7F8FC] ring-1 ring-[#E8ECF4]">
          {renderIntegrationLogo(toolkit.slug, toolkit.name)}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={[
              'inline-flex rounded-full px-3 py-1 text-[11px] font-semibold',
              connected ? 'bg-[#EBFFF5] text-[#108A55]' : 'bg-[#F2F4FA] text-[#66748D]',
            ].join(' ')}
          >
            {statusLabel}
          </span>
          <button
            type="button"
            aria-label={`Mais opções para ${toolkit.name}`}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] border border-[#E7EAF2] text-[#7B879B] transition hover:bg-[#F7F8FC]"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 min-h-[104px] flex-1">
        <div className="text-[19px] font-semibold tracking-[-0.03em] text-[#1A2340]">{toolkit.name}</div>
        <div className="mt-2 line-clamp-3 text-[14px] leading-6 text-[#5F6D85]">{toolkit.description}</div>
        <div className="mt-4 inline-flex rounded-full bg-[#F5F7FC] px-3 py-1 text-[12px] font-medium text-[#68758C]">
          {category}
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4 border-t border-[#EEF1F6] pt-4">
        <div className="min-w-0">
          <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#A0AAC0]">
            {kind === 'mcp' ? 'Automação' : 'Dados'}
          </div>
          <div className="mt-1 text-[13px] leading-5 text-[#66748D]">{helperText}</div>
        </div>
        <button
          type="button"
          onClick={() => onAction(toolkit)}
          disabled={isBusy}
          className={[
            'shrink-0 rounded-[14px] px-4 py-2.5 text-[14px] font-semibold transition disabled:opacity-60',
            connected
              ? 'border border-[#DCE3F0] bg-white text-[#3A4760] hover:bg-[#F7F8FC]'
              : 'bg-[#17203A] text-white hover:bg-[#0F172C]',
          ].join(' ')}
        >
          {buttonLabel}
        </button>
      </div>
    </article>
  )
}

function DataConnectorSetupModal({
  connector,
  open,
  onOpenChange,
}: {
  connector: ToolkitDefinition | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!connector) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[640px] overflow-hidden rounded-[28px] border border-[#E7EAF2] bg-white p-0 shadow-[0_32px_80px_rgba(20,29,48,0.24)]">
        <DialogHeader className="border-b border-[#EEF1F6] px-7 py-6 text-left">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-[#F7F8FC] ring-1 ring-[#E8ECF4]">
              {renderIntegrationLogo(connector.slug, connector.name)}
            </div>
            <div className="min-w-0">
              <div className="inline-flex rounded-full bg-[#EEF4FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#2F6FE4]">
                Conector de dados
              </div>
              <DialogTitle className="mt-3 text-[28px] font-semibold tracking-[-0.04em] text-[#17203A]">
                {connector.name}
              </DialogTitle>
              <DialogDescription className="mt-2 text-[15px] leading-7 text-[#66748D]">
                A conexão será concluída em um fluxo externo seguro para autenticar a fonte, configurar a sincronização e
                definir o destino dos dados.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-7 py-6">
          <div className="rounded-[22px] border border-[#E7EAF2] bg-[#FAFBFD] p-5">
            <div className="text-[14px] font-semibold text-[#24304A]">O que acontece em seguida</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[16px] border border-[#E4E8F0] bg-white p-4">
                <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9AA6BC]">Etapa 1</div>
                <div className="mt-2 text-[14px] font-semibold text-[#1E2942]">Autenticar a fonte</div>
                <div className="mt-2 text-[13px] leading-6 text-[#66748D]">Validar credenciais e permissões de acesso.</div>
              </div>
              <div className="rounded-[16px] border border-[#E4E8F0] bg-white p-4">
                <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9AA6BC]">Etapa 2</div>
                <div className="mt-2 text-[14px] font-semibold text-[#1E2942]">Configurar a sincronização</div>
                <div className="mt-2 text-[13px] leading-6 text-[#66748D]">Escolher frequência, escopo e tabelas iniciais.</div>
              </div>
              <div className="rounded-[16px] border border-[#E4E8F0] bg-white p-4">
                <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9AA6BC]">Etapa 3</div>
                <div className="mt-2 text-[14px] font-semibold text-[#1E2942]">Definir o destino</div>
                <div className="mt-2 text-[13px] leading-6 text-[#66748D]">Selecionar onde os dados ficarão disponíveis.</div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[18px] border border-dashed border-[#D8DEEB] bg-white px-4 py-3 text-[13px] leading-6 text-[#6B7790]">
            Este fluxo foi preparado para abrir a configuração externa da conexão sem expor detalhes técnicos na interface do usuário.
          </div>
        </div>

        <DialogFooter className="border-t border-[#EEF1F6] px-7 py-5 sm:justify-between sm:space-x-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-11 items-center justify-center rounded-[14px] border border-[#DCE3F0] bg-white px-5 text-[14px] font-semibold text-[#334155] transition hover:bg-[#F7F8FC]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[#17203A] px-5 text-[14px] font-semibold text-white transition hover:bg-[#0F172C]"
          >
            Continuar conexão
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function IntegracoesPage() {
  const [activeKind, setActiveKind] = useState<IntegrationKind>('mcp')
  const [activeCategory, setActiveCategory] = useState<CatalogCategory>('all')
  const [search, setSearch] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('popular')
  const [selectedDataConnector, setSelectedDataConnector] = useState<ToolkitDefinition | null>(null)
  const [isDataConnectorModalOpen, setIsDataConnectorModalOpen] = useState(false)

  const {
    busySlug,
    error,
    tkStatus,
    userItems,
    selectedUserId,
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

  const openDataConnectorModal = (toolkit: ToolkitDefinition) => {
    setSelectedDataConnector(toolkit)
    setIsDataConnectorModalOpen(true)
  }

  const handleMcpAction = (toolkit: ToolkitDefinition) => {
    handleIntegrate(toolkit.slug)
  }

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden">
          <div className="flex-1">
            <PageContainer className="bg-white">
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
                        <div className="flex items-center border-b border-[#EDF1F6] px-6 py-6 xl:border-b-0 xl:border-r">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 place-items-center rounded-[12px] bg-[#F4F0FF] text-[#5B49E6]">
                              <Star className="h-4 w-4" />
                            </div>
                            <div className="text-[24px] font-semibold leading-none tracking-[-0.03em] text-[#1B2440]">Recomendadas para você</div>
                          </div>
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
                              kind={activeKind}
                              tkStatus={tkStatus}
                              busySlug={busySlug}
                              onAction={activeKind === 'mcp' ? handleMcpAction : openDataConnectorModal}
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
                        <TabsList variant="underline" className="flex min-w-0 flex-wrap justify-start gap-3 bg-transparent p-0">
                          {CATEGORY_TABS.map((tab) => (
                            <TabsTrigger
                              key={tab.value}
                              value={tab.value}
                              variant="underline"
                              className="px-1.5 pb-3 pt-0 text-[14px] font-medium"
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

                        <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                          {catalogToolkits.map((toolkit) => (
                            <CatalogCard
                              key={toolkit.slug}
                              toolkit={toolkit}
                              kind="mcp"
                              tkStatus={tkStatus}
                              busySlug={busySlug}
                              onAction={handleMcpAction}
                            />
                          ))}
                        </div>
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
                        <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                          {catalogToolkits.map((toolkit) => (
                            <CatalogCard
                              key={toolkit.slug}
                              toolkit={toolkit}
                              kind="data-connectors"
                              tkStatus={tkStatus}
                              busySlug={null}
                              onAction={openDataConnectorModal}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {catalogToolkits.length === 0 && (
                      <section className="mb-6 rounded-[24px] border border-dashed border-[#D9DFEB] bg-white px-6 py-10 text-center">
                        <div className="mx-auto max-w-[36rem]">
                          <div className="text-[22px] font-semibold tracking-[-0.03em] text-[#1C2541]">Nenhuma integração encontrada</div>
                          <p className="mt-3 text-[15px] leading-6 text-[#68758C]">
                            Ajuste a busca ou troque a categoria para encontrar uma ferramenta compatível com o seu fluxo.
                          </p>
                        </div>
                      </section>
                    )}

                    <section className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
                      <div className="rounded-[28px] bg-[#17203A] px-7 py-7 text-white shadow-[0_18px_45px_rgba(23,32,58,0.18)]">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-[28px] font-semibold tracking-[-0.03em]">Não encontrou a integração que precisa?</div>
                            <p className="mt-3 max-w-[36rem] text-[15px] leading-7 text-[#C7D1E5]">
                              Podemos priorizar novos conectores conforme o seu stack. Envie a ferramenta, o caso de uso e o tipo de dado ou automação que você quer liberar.
                            </p>
                          </div>
                          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-white/10 text-white ring-1 ring-white/15">
                            <ArrowRight className="h-5 w-5" />
                          </div>
                        </div>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                          <button
                            type="button"
                            className="inline-flex h-11 items-center justify-center rounded-[14px] bg-white px-5 text-[14px] font-semibold text-[#17203A] transition hover:bg-[#F3F5FA]"
                          >
                            Sugerir integração
                          </button>
                          <div className="text-[13px] text-[#AEB9CF]">
                            Resposta prioritária para integrações com impacto em operação, dados ou atendimento.
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-[#E6EAF4] bg-white px-7 py-7 shadow-[0_14px_36px_rgba(23,32,58,0.06)]">
                        <div className="flex items-center gap-3">
                          <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#ECF8F1] text-[#178654]">
                            <ShieldCheck className="h-5 w-5" />
                          </div>
                          <div className="text-[24px] font-semibold tracking-[-0.03em] text-[#1B2440]">Segurança e controle</div>
                        </div>

                        <div className="mt-5 space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-[#F5F7FC] text-[#66748D]">
                              <LockKeyhole className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-[15px] font-semibold text-[#202A3D]">Autorização por provedor</div>
                              <div className="mt-1 text-[14px] leading-6 text-[#66748D]">
                                Cada conexão respeita o fluxo de autenticação do provedor e pode ser revisada por usuário.
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-[#F5F7FC] text-[#66748D]">
                              <Database className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-[15px] font-semibold text-[#202A3D]">Separação entre agir e analisar</div>
                              <div className="mt-1 text-[14px] leading-6 text-[#66748D]">
                                Ferramentas operacionais e conectores de dados seguem fluxos distintos para reduzir risco e manter governança.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </PageContainer>
          </div>
        </div>
        <DataConnectorSetupModal
          connector={selectedDataConnector}
          open={isDataConnectorModalOpen}
          onOpenChange={(open) => {
            setIsDataConnectorModalOpen(open)
            if (!open) setSelectedDataConnector(null)
          }}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
