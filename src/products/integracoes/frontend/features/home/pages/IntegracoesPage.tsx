'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Database, LockKeyhole, MoreHorizontal, Search, ShieldCheck } from 'lucide-react'

import PageContainer from '@/components/layout/PageContainer'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ConnectionStatusPanel from '@/products/integracoes/frontend/features/connections/components/ConnectionStatusPanel'
import useIntegrationConnections from '@/products/integracoes/frontend/features/connections/hooks/useIntegrationConnections'
import ConnectionConfigurationModal from '@/products/integracoes/frontend/features/configuration/components/ConnectionConfigurationModal'
import ProviderSetupModal from '@/products/integracoes/frontend/features/home/components/ProviderSetupModal'
import useCurrentIntegrationTenant from '@/products/integracoes/frontend/hooks/useCurrentIntegrationTenant'
import {
  fetchIntegrationProviders,
  type IntegrationConnectionWithUi,
} from '@/products/integracoes/frontend/services/integracoesApi'
import { renderIntegrationLogo, toolkitHasIcon } from '@/products/integracoes/shared/iconMaps'
import {
  DATA_CONNECTOR_TOP_PRIORITY_ORDER,
} from '@/products/integracoes/shared/catalogPresentation'
import { getIntegrationProvider, INTEGRATION_PROVIDER_TOOLKITS } from '@/products/integracoes/shared/providers/providerCatalog'
import type { IntegrationProvider } from '@/products/integracoes/shared/providers/providerTypes'
import type { ToolkitDefinition, ToolkitStatusMap } from '@/products/integracoes/shared/types'

type CatalogCategory = 'all' | 'erp' | 'crm' | 'analytics' | 'communication' | 'data' | 'productivity' | 'marketing' | 'support' | 'other'
type SortMode = 'popular' | 'name' | 'connected'

const CATEGORY_TABS: Array<{ value: CatalogCategory; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'erp', label: 'ERP' },
  { value: 'crm', label: 'CRM' },
  { value: 'analytics', label: 'Analytics' },
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
  'CONTA_AZUL',
  'OMIE',
  'BLING',
  'RD_STATION_CRM',
])

const PRODUCTIVITY_SLUGS = new Set([
  'GOOGLEDRIVE',
  'GOOGLEDOCS',
  'GOOGLESLIDES',
  'NOTION',
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
  const provider = getIntegrationProvider(key)
  if (provider?.domain === 'erp') return 'erp'
  if (provider?.domain === 'crm') return 'crm'
  if (provider?.domain === 'analytics') return 'analytics'
  if (provider?.domain === 'ecommerce') return 'marketing'
  if (provider?.domain === 'social') return 'marketing'
  if (provider?.domain === 'advertising') return 'marketing'
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

function isDataConnectionActive(connection?: IntegrationConnectionWithUi | null) {
  return Boolean(connection && ['connected', 'syncing', 'warning'].includes(connection.status))
}

function connectionNeedsReconnect(connection?: IntegrationConnectionWithUi | null) {
  const oauthError = connection?.metadata?.oauthRefreshError
  const source = connection?.metadata?.lastAuthErrorSource
  const hasProviderAuthError = typeof oauthError === 'string'
    && oauthError.trim().length > 0
    && (source === 'provider_oauth' || source === 'provider_api' || source == null)
  return Boolean(connection?.status === 'pending_auth' || hasProviderAuthError)
}

function isOAuthInConfiguration(provider?: IntegrationProvider | null, readinessLoaded = true) {
  if (!provider || provider.authType !== 'oauth2' || !provider.supportsOAuthCallback) return false
  if (!readinessLoaded) return true
  return provider.oauthReadiness?.ready !== true
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

function CatalogCard({
  toolkit,
  busySlug,
  dataConnection,
  provider,
  readinessLoaded,
  onAction,
}: {
  toolkit: ToolkitDefinition
  busySlug: string | null
  dataConnection?: IntegrationConnectionWithUi | null
  provider?: IntegrationProvider | null
  readinessLoaded: boolean
  onAction: (toolkit: ToolkitDefinition) => void
}) {
  const hasDataConnection = Boolean(dataConnection)
  const dataConnectionActive = isDataConnectionActive(dataConnection)
  const needsReconnect = connectionNeedsReconnect(dataConnection)
  const oauthInConfiguration = !hasDataConnection && isOAuthInConfiguration(provider, readinessLoaded)
  const connected = dataConnectionActive && !needsReconnect
  const category = CATEGORY_TABS.find((tab) => tab.value === categorizeToolkit(toolkit.slug))?.label ?? 'Outros'
  const statusLabel = oauthInConfiguration
    ? 'Em configuração'
    : needsReconnect
      ? 'Reautenticar'
      : dataConnection?.uiStatus?.label || (connected ? 'Conectado' : hasDataConnection ? 'Pendente' : 'Não conectado')
  const helperText = needsReconnect
    ? 'A autorização expirou ou foi recusada. Abra para reconectar.'
    : hasDataConnection && !dataConnectionActive
      ? dataConnection?.uiStatus?.description || 'Conexão salva aguardando autorização.'
    : connected
      ? dataConnection?.uiStatus?.description || 'Conexão pronta. Configure data warehouse, Otto IA e sincronização quando quiser.'
      : oauthInConfiguration
        ? provider?.oauthReadiness?.message || 'OAuth em configuração. Este conector ficará disponível em breve.'
        : 'Conecte sua conta para trazer os dados principais automaticamente.'
  const isBusy = busySlug === toolkit.slug || busySlug === dataConnection?.id
  const buttonLabel = oauthInConfiguration ? 'Em configuração' : isBusy ? 'Abrindo...' : hasDataConnection ? 'Configurar' : 'Conectar'
  const statusVariant = connected ? 'default' : hasDataConnection || oauthInConfiguration ? 'secondary' : 'outline'

  return (
    <Card className="h-full min-h-[252px] gap-0 rounded-xl py-0 shadow-[0_12px_30px_rgba(23,32,58,0.06)]">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-muted ring-1 ring-border">
            {renderIntegrationLogo(toolkit.slug, toolkit.name)}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant}>{statusLabel}</Badge>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={`Mais opções para ${toolkit.name}`}
              className="size-9 shrink-0 bg-background"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-5 min-h-[104px] flex-1">
          <div className="text-[19px] font-semibold tracking-[-0.03em] text-foreground">{toolkit.name}</div>
          <div className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{toolkit.description}</div>
          <Badge variant="secondary" className="mt-4">
            {category}
          </Badge>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4 border-t pt-4">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Conexão
            </div>
            <div className="mt-1 text-[13px] leading-5 text-muted-foreground">{helperText}</div>
          </div>
          <Button
            type="button"
            onClick={() => onAction(toolkit)}
            disabled={isBusy || oauthInConfiguration}
            variant={connected || oauthInConfiguration ? 'outline' : 'default'}
            className="h-10 shrink-0"
          >
            {buttonLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function IntegracoesPage() {
  const tenantId = useCurrentIntegrationTenant()
  const [activeCategory, setActiveCategory] = useState<CatalogCategory>('all')
  const [search, setSearch] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('popular')
  const [selectedDataConnector, setSelectedDataConnector] = useState<ToolkitDefinition | null>(null)
  const [isDataConnectorModalOpen, setIsDataConnectorModalOpen] = useState(false)
  const [isConnectionConfigurationOpen, setIsConnectionConfigurationOpen] = useState(false)
  const [providersByToolkit, setProvidersByToolkit] = useState<Map<string, IntegrationProvider>>(new Map())
  const [providerReadinessLoaded, setProviderReadinessLoaded] = useState(false)

  const {
    busyId: integrationBusyId,
    connections,
    connectionsByToolkit,
    error: integrationError,
    loading: integrationLoading,
    selectedConnection,
    createConnection,
    loadConnectionDetail,
    reconnectConnection,
    refreshConnections,
    syncConnection,
    setError: setIntegrationError,
  } = useIntegrationConnections(tenantId)
  const connectionStatusMap = useMemo(
    () => Object.fromEntries(Array.from(connectionsByToolkit.keys()).map((slug) => [slug, true])),
    [connectionsByToolkit],
  )
  const dataConnectorSamples = useMemo(() => {
    const map = new Map<string, ToolkitDefinition>()
    for (const tk of INTEGRATION_PROVIDER_TOOLKITS) {
      map.set(String(tk.slug).toUpperCase(), tk)
    }
    return Array.from(map.values())
  }, [])

  useEffect(() => {
    let active = true
    setProviderReadinessLoaded(false)
    void fetchIntegrationProviders()
      .then((providers) => {
        if (!active) return
        const map = new Map<string, IntegrationProvider>()
        for (const provider of providers) {
          map.set(provider.toolkitSlug.toUpperCase(), provider)
          map.set(provider.slug.toUpperCase(), provider)
        }
        setProvidersByToolkit(map)
        setProviderReadinessLoaded(true)
      })
      .catch((error) => {
        if (!active) return
        setProviderReadinessLoaded(true)
        setIntegrationError(error instanceof Error ? error.message : 'Erro ao carregar readiness de integrações.')
      })
    return () => {
      active = false
    }
  }, [setIntegrationError])

  const catalogToolkits = useMemo(() => {
    const source = dataConnectorSamples
    const priority = DATA_CONNECTOR_TOP_PRIORITY_ORDER
    const statusMap = connectionStatusMap
    const query = search.trim().toLowerCase()

    const filtered = source.filter((toolkit) => {
      if (activeCategory !== 'all' && categorizeToolkit(toolkit.slug) !== activeCategory) return false
      if (!query) return true
      const haystack = `${toolkit.name} ${toolkit.description} ${toolkit.slug}`.toLowerCase()
      return haystack.includes(query)
    })

    return sortByPriority(filtered, priority, statusMap, sortMode)
  }, [activeCategory, connectionStatusMap, dataConnectorSamples, search, sortMode])

  const openDataConnectorModal = (toolkit: ToolkitDefinition) => {
    const existingConnection = connectionsByToolkit.get(String(toolkit.slug).toUpperCase())
    if (existingConnection) {
      void loadConnectionDetail(existingConnection.id).then(() => setIsConnectionConfigurationOpen(true))
      return
    }
    const provider = providersByToolkit.get(String(toolkit.slug).toUpperCase()) || getIntegrationProvider(toolkit.slug)
    if (isOAuthInConfiguration(provider, providerReadinessLoaded)) {
      setIntegrationError(`${toolkit.name} ainda esta em configuracao OAuth.`)
      return
    }

    setSelectedDataConnector(toolkit)
    setIsDataConnectorModalOpen(true)
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
                    <h1 className="integracoes-page-title mb-2 text-2xl font-semibold tracking-normal text-[#16203A]">
                      Conexões
                    </h1>
                    <p className="mb-8 text-[18px] leading-7 text-[#647089]">
                      Conecte seus apps uma vez e configure data warehouse, Otto IA e sincronização depois.
                    </p>

                    {integrationError && <div className="text-sm text-red-600 mb-3">{integrationError}</div>}

                    <ConnectionStatusPanel connections={connections} loading={integrationLoading} />

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
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar integração..."
                            className="h-11 bg-white pl-10"
                          />
                        </label>

                        <Select
                            value={sortMode}
                            onValueChange={(value) => setSortMode(value as SortMode)}
                          >
                          <SelectTrigger className="h-11 min-w-[168px] bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(SORT_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">Apps disponíveis</h2>
                        <p className="text-sm text-gray-600 mt-1">
                          Escolha um app, conecte a conta e configure o que fazer com os dados depois.
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {tenantId
                            ? `Workspace tenant ${tenantId}. Recursos e frequência são aplicados automaticamente e podem ser ajustados em Configurar.`
                            : 'Carregando workspace...'}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {catalogToolkits.length} apps
                      </Badge>
                    </div>
                    <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                      {catalogToolkits.map((toolkit) => (
                        <CatalogCard
                          key={toolkit.slug}
                          toolkit={toolkit}
                          busySlug={integrationBusyId}
                          dataConnection={connectionsByToolkit.get(String(toolkit.slug).toUpperCase())}
                          provider={providersByToolkit.get(String(toolkit.slug).toUpperCase()) || getIntegrationProvider(toolkit.slug)}
                          readinessLoaded={providerReadinessLoaded}
                          onAction={openDataConnectorModal}
                        />
                      ))}
                    </div>

                    {catalogToolkits.length === 0 && (
                      <Card className="mb-6 rounded-xl border-dashed bg-white py-0 text-center">
                        <CardContent className="px-6 py-10">
                        <div className="mx-auto max-w-[36rem]">
                          <div className="text-[22px] font-semibold tracking-[-0.03em] text-[#1C2541]">Nenhuma integração encontrada</div>
                          <p className="mt-3 text-[15px] leading-6 text-[#68758C]">
                            Ajuste a busca ou troque a categoria para encontrar uma ferramenta compatível com o seu fluxo.
                          </p>
                        </div>
                        </CardContent>
                      </Card>
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
                          <Button
                            type="button"
                            variant="secondary"
                            className="h-11 bg-white text-[#17203A] hover:bg-[#F3F5FA]"
                          >
                            Sugerir integração
                          </Button>
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
        <ProviderSetupModal
          connector={selectedDataConnector}
          open={isDataConnectorModalOpen}
          busy={Boolean(integrationBusyId)}
          error={integrationError}
          providerOverride={selectedDataConnector
            ? providersByToolkit.get(String(selectedDataConnector.slug).toUpperCase()) || null
            : null}
          readinessLoaded={providerReadinessLoaded}
          onOpenChange={(open) => {
            setIsDataConnectorModalOpen(open)
            if (!open) setSelectedDataConnector(null)
          }}
          onCreate={async (params) => {
            const connection = await createConnection(params)
            setIsDataConnectorModalOpen(false)
            setSelectedDataConnector(null)
            await loadConnectionDetail(connection.id)
            setIsConnectionConfigurationOpen(true)
          }}
        />
        <ConnectionConfigurationModal
          connection={selectedConnection}
          open={isConnectionConfigurationOpen}
          busy={Boolean(integrationBusyId)}
          onOpenChange={setIsConnectionConfigurationOpen}
          onSaved={async (configuration) => {
            await refreshConnections()
            await loadConnectionDetail(configuration.connection.id)
          }}
          onSync={async (connection, configuration) => {
            await syncConnection(connection.id, configuration?.pipeline
              ? {
                pipelineId: configuration.pipeline.id,
                destinationId: configuration.destination?.id,
                resources: configuration.pipeline.selectedResources,
              }
              : undefined)
          }}
          onReconnect={(connection) => {
            void reconnectConnection(connection.id)
          }}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
