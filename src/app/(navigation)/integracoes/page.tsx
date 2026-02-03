"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import NexusShell from '@/components/navigation/nexus/NexusShell'
import { IntegrationCard } from "@/components/navigation/integrations/IntegrationCard"
import type { Integration } from "@/components/navigation/integrations/IntegrationCard"

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

  // --- Composio minimal UI helpers ---
  const TOOLKITS = React.useMemo(() => ([
    { slug: 'gmail', name: 'Gmail', description: 'Enviar e ler emails' },
    // Composio toolkit slug para Google Drive confirmado como "GOOGLEDRIVE"
    { slug: 'GOOGLEDRIVE', name: 'Google Drive', description: 'Arquivos e pastas' },
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {TOOLKITS.map(t => (
                        <div key={t.slug} className="border rounded p-4 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="font-medium">{t.name}</div>
                              <div className="text-xs text-gray-500">{t.description}</div>
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
