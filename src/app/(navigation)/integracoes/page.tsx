"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import NexusShell from '@/components/navigation/nexus/NexusShell'
import { IntegrationCard } from "@/components/navigation/integrations/IntegrationCard"
import type { Integration } from "@/components/navigation/integrations/IntegrationCard"
import { Icon, addCollection } from '@iconify/react'
import { icons as simpleIcons } from '@iconify-json/simple-icons'
import {
  SiGmail,
  SiGoogledrive,
  SiGooglecalendar,
  SiGoogledocs,
  SiWhatsapp,
  SiNotion,
  SiGooglesheets,
  SiGoogleslides,
  SiGoogleanalytics,
  SiGoogleads,
  SiMeta,
  SiSlack,
  SiShopify,
  SiHubspot,
  SiFacebook,
  SiInstagram,
  SiAirtable,
  SiSalesforce,
  SiMailchimp,
  SiCalendly,
  SiCaldotcom,
  SiCanva,
  SiClickup,
  SiClickhouse,
  SiCoda,
  SiDatabricks,
  SiDiscord,
  SiDropbox,
  SiElevenlabs,
  SiFigma,
  SiGithub,
  SiJira,
  SiLinear,
  SiMetabase,
  SiMixpanel,
  SiPosthog,
  SiSendgrid,
  SiSentry,
  SiSnowflake,
  SiStripe,
  SiSupabase,
  SiTelegram,
  SiTiktok,
  SiTrello,
  SiTypeform,
  SiVercel,
  SiX,
  SiYoutube,
  SiZendesk,
  SiZoom,
} from '@icons-pack/react-simple-icons'

type FilterTab = 'all' | 'connected' | 'disconnected'

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  // Fallback: no static integrations
  const [integrationsState, setIntegrationsState] = useState<Integration[]>([])
  // Composio toolkits (minimal)
  const [busySlug, setBusySlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tkStatus, setTkStatus] = useState<Record<string, boolean>>({})
  const [userItems, setUserItems] = useState<Array<{ id: string; label: string }>>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")

  const handleToggle = (id: string, connected: boolean) => {
    setIntegrationsState(prev => 
      prev.map(integration => 
        integration.id === id 
          ? { ...integration, connected }
          : integration
      )
    )
  }

  const filteredIntegrations = integrationsState.filter(integration => {
    if (activeTab === 'connected') return integration.connected
    if (activeTab === 'disconnected') return !integration.connected
    return true
  })

  // Registrar coleção local do Simple Icons (Iconify)
  addCollection(simpleIcons as any)

  // Mapa de slugs -> chave do Simple Icons
  const ICON_KEY_BY_SLUG: Record<string, string> = React.useMemo(() => ({
    GMAIL: 'gmail',
    GOOGLEDRIVE: 'googledrive',
    GOOGLECALENDAR: 'googlecalendar',
    GOOGLEDOCS: 'googledocs',
    WHATSAPP: 'whatsapp',
    NOTION: 'notion',
    GOOGLESHEETS: 'googlesheets',
    GOOGLESLIDES: 'googleslides',
    GOOGLE_ANALYTICS: 'googleanalytics',
    GOOGLEADS: 'googleads',
    METAADS: 'meta',
    SLACK: 'slack',
    SHOPIFY: 'shopify',
    HUBSPOT: 'hubspot',
    FACEBOOK: 'facebook',
    INSTAGRAM: 'instagram',
    AIRTABLE: 'airtable',
    SALESFORCE: 'salesforce',
    SALESFORCE_SERVICE_CLOUD: 'salesforce',
    MAILCHIMP: 'mailchimp',
    CALENDLY: 'calendly',
    CAL: 'caldotcom',
    CANVA: 'canva',
    CLICKUP: 'clickup',
    CLICKHOUSE: 'clickhouse',
    CODA: 'coda',
    DATABRICKS: 'databricks',
    DISCORD: 'discord',
    DOCUSIGN: 'docusign',
    DROPBOX: 'dropbox',
    DYNAMICS365: 'microsoftdynamics365',
    ELEVENLABS: 'elevenlabs',
    FIGMA: 'figma',
    GITHUB: 'github',
    GONG: 'gong',
    JIRA: 'jira',
    JOTFORM: 'jotform',
    KOMMO: 'kommo',
    LINKEDIN: 'linkedin',
    LINEAR: 'linear',
    METABASE: 'metabase',
    MICROSOFT_CLARITY: 'microsoftclarity',
    MICROSOFT_TEAMS: 'microsoftteams',
    MIXPANEL: 'mixpanel',
    MONDAY: 'mondaydotcom',
    NETSUITE: 'netsuite',
    ONE_DRIVE: 'microsoftonedrive',
    OUTLOOK: 'microsoftoutlook',
    PIPEDRIVE: 'pipedrive',
    POSTHOG: 'posthog',
    REMOVE_BG: 'removebg',
    SENDGRID: 'sendgrid',
    SENDLANE: 'sendlane',
    SENTRY: 'sentry',
    SERVICENOW: 'servicenow',
    SNOWFLAKE: 'snowflake',
    STRIPE: 'stripe',
    SUPABASE: 'supabase',
    TALLY: 'tally',
    TELEGRAM: 'telegram',
    TIKTOK: 'tiktok',
    TRELLO: 'trello',
    TWITTER: 'x',
    TYPEFORM: 'typeform',
    VERCEL: 'vercel',
    YOUTUBE: 'youtube',
    ZENDESK: 'zendesk',
    ZOOM: 'zoom',
    // extras
    ACTIVE_CAMPAIGN: 'activecampaign',
  }), [])

  // Ícones com cor (Simple Icons React) disponíveis neste pacote
  const SIMPLE_ICON_BY_SLUG: Record<string, React.ComponentType<any>> = React.useMemo(() => ({
    GMAIL: SiGmail,
    GOOGLEDRIVE: SiGoogledrive,
    GOOGLECALENDAR: SiGooglecalendar,
    GOOGLEDOCS: SiGoogledocs,
    WHATSAPP: SiWhatsapp,
    NOTION: SiNotion,
    GOOGLESHEETS: SiGooglesheets,
    GOOGLESLIDES: SiGoogleslides,
    GOOGLE_ANALYTICS: SiGoogleanalytics,
    GOOGLEADS: SiGoogleads,
    METAADS: SiMeta,
    SLACK: SiSlack,
    SHOPIFY: SiShopify,
    HUBSPOT: SiHubspot,
    FACEBOOK: SiFacebook,
    INSTAGRAM: SiInstagram,
    AIRTABLE: SiAirtable,
    SALESFORCE: SiSalesforce,
    MAILCHIMP: SiMailchimp,
    CALENDLY: SiCalendly,
    CAL: SiCaldotcom,
    CANVA: SiCanva,
    CLICKUP: SiClickup,
    CLICKHOUSE: SiClickhouse,
    CODA: SiCoda,
    DATABRICKS: SiDatabricks,
    DISCORD: SiDiscord,
    DROPBOX: SiDropbox,
    ELEVENLABS: SiElevenlabs,
    FIGMA: SiFigma,
    GITHUB: SiGithub,
    JIRA: SiJira,
    LINEAR: SiLinear,
    METABASE: SiMetabase,
    MIXPANEL: SiMixpanel,
    POSTHOG: SiPosthog,
    SENDGRID: SiSendgrid,
    SENTRY: SiSentry,
    SNOWFLAKE: SiSnowflake,
    STRIPE: SiStripe,
    SUPABASE: SiSupabase,
    TELEGRAM: SiTelegram,
    TIKTOK: SiTiktok,
    TRELLO: SiTrello,
    TYPEFORM: SiTypeform,
    VERCEL: SiVercel,
    TWITTER: SiX,
    YOUTUBE: SiYoutube,
    ZENDESK: SiZendesk,
    ZOOM: SiZoom,
  }), [])

  const hasIcon = (key: string | undefined) => {
    if (!key) return false
    const dict = (simpleIcons as any).icons || {}
    return Boolean(dict[key])
  }

  const renderLogo = (slug: string, name: string) => {
    const key = (slug || '').toUpperCase()
    const SimpleComp = SIMPLE_ICON_BY_SLUG[key]
    if (SimpleComp) {
      return <SimpleComp size={32} color="default" title={`${name} logo`} />
    }
    const iconKey = ICON_KEY_BY_SLUG[key]
    if (hasIcon(iconKey)) {
      return (
        <Icon
          icon={`simple-icons:${iconKey}`}
          width={32}
          height={32}
          aria-label={`${name} logo`}
          className="shrink-0"
        />
      )
    }
    const initials = (name || '?').trim().slice(0, 2).toUpperCase()
    return (
      <div className="h-8 w-8 rounded-md bg-gray-100 text-gray-700 text-xs grid place-items-center shrink-0">
        {initials}
      </div>
    )
  }

  const TOOLKITS = React.useMemo(() => ([
    { slug: 'gmail', name: 'Gmail', description: 'Enviar e ler emails' },
    { slug: 'GOOGLEDRIVE', name: 'Google Drive', description: 'Arquivos e pastas' },
    { slug: 'GOOGLECALENDAR', name: 'Google Calendar', description: 'Agenda e eventos' },
    { slug: 'GOOGLEDOCS', name: 'Google Docs', description: 'Documentos do Google' },
    { slug: 'WHATSAPP', name: 'WhatsApp', description: 'Mensageria e notificações' },
    { slug: 'NOTION', name: 'Notion', description: 'Blocos e páginas de notas' },
    { slug: 'GOOGLESHEETS', name: 'Google Sheets', description: 'Planilhas do Google' },
    { slug: 'GOOGLESLIDES', name: 'Google Slides', description: 'Apresentações do Google' },
    { slug: 'GOOGLE_ANALYTICS', name: 'Google Analytics', description: 'Métricas e análises' },
    { slug: 'GOOGLEADS', name: 'Google Ads', description: 'Anúncios e campanhas' },
    { slug: 'METAADS', name: 'Meta Ads', description: 'Anúncios no ecossistema Meta' },
    { slug: 'SLACK', name: 'Slack', description: 'Mensageria e canais' },
    { slug: 'SHOPIFY', name: 'Shopify', description: 'Loja e catálogo' },
    { slug: 'HUBSPOT', name: 'HubSpot', description: 'CRM e automação de marketing' },
    { slug: 'FACEBOOK', name: 'Facebook', description: 'Páginas e posts' },
    { slug: 'INSTAGRAM', name: 'Instagram', description: 'Posts e mídia social' },
    { slug: 'ACTIVE_CAMPAIGN', name: 'ActiveCampaign', description: 'Email marketing e automação' },
    { slug: 'AIRTABLE', name: 'Airtable', description: 'Bases e automações' },
    { slug: 'SALESFORCE', name: 'Salesforce', description: 'CRM' },
    { slug: 'SALESFORCE_SERVICE_CLOUD', name: 'Salesforce Service Cloud', description: 'Atendimento e serviços' },
    // --- Adicionados ---
    { slug: 'MAILCHIMP', name: 'Mailchimp', description: 'Email marketing e automação' },
    { slug: 'CALENDLY', name: 'Calendly', description: 'Agendamento de reuniões' },
    { slug: 'CAL', name: 'Cal.com', description: 'Agendamento e calendários' },
    { slug: 'CANVA', name: 'Canva', description: 'Design e criação de artes' },
    { slug: 'CLICKUP', name: 'ClickUp', description: 'Gestão de projetos e tarefas' },
    { slug: 'CLICKHOUSE', name: 'ClickHouse', description: 'Banco de dados analítico' },
    { slug: 'CODA', name: 'Coda', description: 'Documentos e automações' },
    { slug: 'DATABRICKS', name: 'Databricks', description: 'Lakehouse e engenharia de dados' },
    { slug: 'DISCORD', name: 'Discord', description: 'Canais e mensagens' },
    { slug: 'DOCUSIGN', name: 'DocuSign', description: 'Assinaturas eletrônicas' },
    { slug: 'DROPBOX', name: 'Dropbox', description: 'Arquivos e armazenamento' },
    { slug: 'DYNAMICS365', name: 'Dynamics 365', description: 'CRM/ERP Microsoft' },
    { slug: 'ELEVENLABS', name: 'ElevenLabs', description: 'Geração de voz e áudio' },
    { slug: 'FIGMA', name: 'Figma', description: 'Design colaborativo e prototipagem' },
    { slug: 'GITHUB', name: 'GitHub', description: 'Repositórios e issues' },
    { slug: 'GONG', name: 'Gong', description: 'Inteligência de conversas de vendas' },
    { slug: 'JIRA', name: 'Jira', description: 'Gestão de projetos e issues' },
    { slug: 'JOTFORM', name: 'Jotform', description: 'Formulários e coletas' },
    { slug: 'KOMMO', name: 'Kommo', description: 'CRM e automações' },
    { slug: 'LINKEDIN', name: 'LinkedIn', description: 'Rede profissional e páginas' },
    { slug: 'LINEAR', name: 'Linear', description: 'Issues e planejamento' },
    { slug: 'METABASE', name: 'Metabase', description: 'BI e dashboards' },
    { slug: 'MICROSOFT_CLARITY', name: 'Microsoft Clarity', description: 'Mapas de calor e sessões' },
    { slug: 'MICROSOFT_TEAMS', name: 'Microsoft Teams', description: 'Canais e reuniões' },
    { slug: 'MIXPANEL', name: 'Mixpanel', description: 'Analytics de produto' },
    { slug: 'MONDAY', name: 'Monday.com', description: 'Projetos e workflows' },
    { slug: 'NETSUITE', name: 'NetSuite', description: 'ERP da Oracle' },
    { slug: 'ONE_DRIVE', name: 'OneDrive', description: 'Arquivos e armazenamento' },
    { slug: 'OUTLOOK', name: 'Outlook', description: 'Email e calendário' },
    { slug: 'PIPEDRIVE', name: 'Pipedrive', description: 'CRM de vendas' },
    { slug: 'POSTHOG', name: 'PostHog', description: 'Product analytics e feature flags' },
    { slug: 'REMOVE_BG', name: 'Remove.bg', description: 'Remoção de fundo de imagens' },
    { slug: 'SENDGRID', name: 'SendGrid', description: 'Envio de emails transacionais' },
    { slug: 'SENDLANE', name: 'Sendlane', description: 'Email marketing e automação' },
    { slug: 'SENTRY', name: 'Sentry', description: 'Monitoramento de erros' },
    { slug: 'SERVICENOW', name: 'ServiceNow', description: 'ITSM e workflows' },
    { slug: 'SNOWFLAKE', name: 'Snowflake', description: 'Data warehouse' },
    { slug: 'STRIPE', name: 'Stripe', description: 'Pagamentos e faturamento' },
    { slug: 'SUPABASE', name: 'Supabase', description: 'Banco de dados e auth' },
    { slug: 'TALLY', name: 'Tally', description: 'Formulários (tally.so)' },
    { slug: 'TELEGRAM', name: 'Telegram', description: 'Mensageria e bots' },
    { slug: 'TIKTOK', name: 'TikTok', description: 'Conteúdo e anúncios' },
    { slug: 'TRELLO', name: 'Trello', description: 'Quadros e cartões' },
    { slug: 'TWITTER', name: 'Twitter (X)', description: 'Posts e integrações' },
    { slug: 'TYPEFORM', name: 'Typeform', description: 'Formulários e respostas' },
    { slug: 'VERCEL', name: 'Vercel', description: 'Deploy e projetos' },
    { slug: 'YOUTUBE', name: 'YouTube', description: 'Canais e vídeos' },
    { slug: 'ZENDESK', name: 'Zendesk', description: 'Suporte e tickets' },
    { slug: 'ZOOM', name: 'Zoom', description: 'Reuniões e gravações' },
  ]), [])

  const fetchStatus = async (slug?: string) => {
    try {
      const parts: string[] = []
      if (slug) parts.push(`toolkit=${encodeURIComponent(slug)}`)
      if (selectedUserId) parts.push(`userId=${encodeURIComponent(selectedUserId)}`)
      const qs = parts.length ? `?${parts.join('&')}` : ''
      const res = await fetch(`/api/integracoes/status${qs}`, { cache: 'no-store' })
      const data = await res.json().catch(()=> ({}))
      if (!res.ok || data?.ok === false) throw new Error(data?.error || 'Falha ao consultar status')
      if (slug && typeof data?.connected === 'boolean') {
        setTkStatus(s => ({ ...s, [slug]: Boolean(data.connected) }))
      } else if (!slug && Array.isArray(data?.items)) {
        const map: Record<string, boolean> = {}
        for (const it of data.items) {
          const key = (it.slug || '').toLowerCase()
          if (!key) continue
          const connected = Boolean(it?.connection?.connectedAccount?.id || it?.connection?.isActive)
          map[key] = connected
        }
        setTkStatus(s => ({ ...s, ...map }))
      }
    } catch (e:any) {
      setError(e?.message || String(e))
    }
  }

  useEffect(() => { fetchStatus(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [selectedUserId])

  const loadUsers = async (q?: string) => {
    try {
      const qs = q ? `?q=${encodeURIComponent(q)}` : ''
      const res = await fetch(`/api/integracoes/users${qs}`, { cache: 'no-store' })
      const data = await res.json().catch(()=> ({}))
      if (!res.ok || data?.ok === false) throw new Error(data?.error || 'Falha ao listar usuários')
      setUserItems(Array.isArray(data.items) ? data.items : [])
      if (!selectedUserId && Array.isArray(data.items) && data.items.length) setSelectedUserId(data.items[0].id)
    } catch (e:any) {
      setError(e?.message || String(e))
    }
  }

  useEffect(() => { loadUsers(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [])

  const handleIntegrate = async (slug: string) => {
    if (!selectedUserId) { setError('Selecione um usuário'); return }
    setBusySlug(slug); setError(null)
    try {
      const res = await fetch('/api/integracoes/authorize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toolkit: slug, userId: selectedUserId }) })
      const data = await res.json().catch(()=> ({}))
      if (!res.ok || data?.ok === false) throw new Error(data?.error || 'Falha ao iniciar autorização')
      const url = (data.redirectUrl || '').toString()
      if (!url) throw new Error('Redirect URL vazio')
      window.location.href = url
    } catch (e:any) {
      setError(e?.message || String(e))
    } finally { setBusySlug(null) }
  }

  const advertisingIntegrations = filteredIntegrations.filter(i => i.category === 'advertising')
  const analyticsIntegrations = filteredIntegrations.filter(i => i.category === 'analytics')
  const ecommerceIntegrations = filteredIntegrations.filter(i => i.category === 'ecommerce')
  const crmIntegrations = filteredIntegrations.filter(i => i.category === 'crm')
  const financialIntegrations = filteredIntegrations.filter(i => i.category === 'financial')

  const TabButton = ({ tab, label }: { tab: FilterTab; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        activeTab === tab
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {label}
    </button>
  )

  const getCategoryTitle = (category: 'advertising' | 'analytics' | 'ecommerce' | 'financial' | 'crm' | 'database') => {
    const map: Record<typeof category, string> = {
      advertising: 'Publicidade e Marketing',
      analytics: 'Analytics e Rastreamento',
      ecommerce: 'Plataformas de E-commerce',
      financial: 'Financeiro e Contabilidade',
      crm: 'CRM e Marketing',
      database: 'Bancos de Dados e Armazenamento',
    }
    return map[category] || ''
  }

  const getCategoryDescription = (category: 'advertising' | 'analytics' | 'ecommerce' | 'financial' | 'crm' | 'database') => {
    const map: Record<typeof category, string> = {
      advertising: 'Conecte suas plataformas de publicidade para analisar performance de campanhas e ROI',
      analytics: 'Integre ferramentas de analytics para rastrear comportamento do usuário e performance do site',
      ecommerce: 'Sincronize dados da sua loja online para análise abrangente de vendas e estoque',
      financial: 'Importe dados financeiros para rastrear receita, gastos e performance do negócio',
      crm: 'Conecte sistemas de CRM para gestão de relacionamento com clientes e automação de marketing',
      database: 'Integre bancos de dados e data warehouses para análise abrangente de dados',
    }
    return map[category] || ''
  }

  const IntegrationSection = ({ 
    category, 
    integrations: categoryIntegrations 
  }: { 
    category: 'advertising' | 'analytics' | 'ecommerce' | 'financial' | 'crm';
    integrations: Integration[]
  }) => {
    if (categoryIntegrations.length === 0) return null

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {getCategoryTitle(category)}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {getCategoryDescription(category)}
          </p>
        </div>
        <div className="space-y-4">
          {categoryIntegrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <NexusShell outerBg="#fdfdfd">
      <div className="mx-auto w-full max-w-5xl p-8">
                  {/* Header */}
                  <div className="mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">
                      Integrações
                    </h1>
                    <p className="text-gray-600 text-lg mb-8">
                      Conecte facilmente seu número de telefone com seus aplicativos favoritos para automatizar fluxos de trabalho e se manter atualizado sobre chamadas e mensagens.
                    </p>
                    {/* Select de usuários (não autenticado) */}
                    <div className="mb-6 flex items-center gap-2">
                      <label className="text-sm text-gray-700">Usuário:</label>
                      <select value={selectedUserId} onChange={(e)=> setSelectedUserId(e.target.value)} className="border rounded px-2 py-1 text-sm">
                        {userItems.map(u => (
                          <option key={u.id} value={u.id}>{u.label} ({u.id})</option>
                        ))}
                      </select>
                      <button onClick={() => loadUsers()} className="px-2 py-1 text-sm border rounded">Atualizar</button>
                    </div>
                    {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
                    {/* Composio minimal section */}
                    {(() => {
                      const hasAnyIconForSlug = (slug: string) => {
                        const key = (slug || '').toUpperCase()
                        const SimpleComp = SIMPLE_ICON_BY_SLUG[key]
                        if (SimpleComp) return true
                        const iconKey = ICON_KEY_BY_SLUG[key]
                        return hasIcon(iconKey)
                      }
                      const withIcon = TOOLKITS.filter(t => hasAnyIconForSlug(t.slug))
                      const withoutIcon = TOOLKITS.filter(t => !hasAnyIconForSlug(t.slug))
                      const ordered = [...withIcon, ...withoutIcon]
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                          {ordered.map(t => (
                          <div key={t.slug} className="border rounded p-4 bg-white">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3 min-w-0">
                                {renderLogo(t.slug, t.name)}
                                <div className="min-w-0">
                                  <div className="font-medium truncate">{t.name}</div>
                                  <div className="text-xs text-gray-500 truncate">{t.description}</div>
                                </div>
                              </div>
                              {(() => { const k = t.slug; const kl = (k||'').toLowerCase(); const isOn = Boolean(tkStatus[k] ?? tkStatus[kl]); return (
                                <div className={`text-xs px-2 py-0.5 rounded ${isOn ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                  {isOn ? 'Integrado' : 'Não conectado'}
                                </div>
                              )})()}
                            </div>
                            <div className="flex items-center gap-2">
                              {(() => { const k = t.slug; const kl = (k||'').toLowerCase(); const isOn = Boolean(tkStatus[k] ?? tkStatus[kl]); return (
                                <button onClick={() => handleIntegrate(t.slug)} disabled={busySlug === t.slug} className="px-3 py-1.5 rounded bg-black text-white text-sm disabled:opacity-50">
                                  {busySlug === t.slug ? 'Abrindo…' : isOn ? 'Reintegrar' : 'Integrar'}
                                </button>
                              )})()}
                              <button onClick={() => fetchStatus(t.slug)} className="px-3 py-1.5 rounded border text-sm">Checar status</button>
                            </div>
                          </div>
                          ))}
                        </div>
                      )
                    })()}
                    {/* Tabs */}
                    <div className="flex items-center space-x-2">
                      <TabButton tab="all" label="Todas as Aplicações" />
                      <TabButton tab="connected" label="Conectadas" />
                      <TabButton tab="disconnected" label="Desconectadas" />
                    </div>
                  </div>
                  {/* Content */}
                  <div className="space-y-8">
                    <IntegrationSection
                      category="advertising"
                      integrations={advertisingIntegrations}
                    />
                    <IntegrationSection
                      category="analytics"
                      integrations={analyticsIntegrations}
                    />
                    <IntegrationSection
                      category="ecommerce"
                      integrations={ecommerceIntegrations}
                    />
                    <IntegrationSection
                      category="crm"
                      integrations={crmIntegrations}
                    />
                    <IntegrationSection
                      category="financial"
                      integrations={financialIntegrations}
                    />
                  </div>
      </div>
    </NexusShell>
  )
}
