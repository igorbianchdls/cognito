'use client'

import { useMemo, useState } from 'react'

import PageContainer from '@/components/layout/PageContainer'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import {
  IntegrationCard,
  type Integration,
} from '@/components/navigation/integrations/IntegrationCard'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import ToolkitIntegrationGrid from '@/products/integracoes/frontend/components/ToolkitIntegrationGrid'
import useIntegracoesComposio from '@/products/integracoes/frontend/hooks/useIntegracoesComposio'
import { TOOLKITS } from '@/products/integracoes/shared/toolkits'
import type { FilterTab, IntegrationCategory } from '@/products/integracoes/shared/types'

const CATEGORY_TITLE: Record<IntegrationCategory, string> = {
  advertising: 'Publicidade e Marketing',
  analytics: 'Analytics e Rastreamento',
  ecommerce: 'Plataformas de E-commerce',
  financial: 'Financeiro e Contabilidade',
  crm: 'CRM e Marketing',
  database: 'Bancos de Dados e Armazenamento',
}

const CATEGORY_DESCRIPTION: Record<IntegrationCategory, string> = {
  advertising:
    'Conecte suas plataformas de publicidade para analisar performance de campanhas e ROI',
  analytics:
    'Integre ferramentas de analytics para rastrear comportamento do usuário e performance do site',
  ecommerce:
    'Sincronize dados da sua loja online para análise abrangente de vendas e estoque',
  financial:
    'Importe dados financeiros para rastrear receita, gastos e performance do negócio',
  crm: 'Conecte sistemas de CRM para gestão de relacionamento com clientes e automação de marketing',
  database: 'Integre bancos de dados e data warehouses para análise abrangente de dados',
}

function TabButton({
  activeTab,
  onChange,
  tab,
  label,
}: {
  activeTab: FilterTab
  onChange: (tab: FilterTab) => void
  tab: FilterTab
  label: string
}) {
  return (
    <button
      onClick={() => onChange(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        activeTab === tab
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {label}
    </button>
  )
}

function IntegrationSection({
  category,
  integrations,
  onToggle,
}: {
  category: 'advertising' | 'analytics' | 'ecommerce' | 'financial' | 'crm'
  integrations: Integration[]
  onToggle: (id: string, connected: boolean) => void
}) {
  if (!integrations.length) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{CATEGORY_TITLE[category]}</h2>
        <p className="text-sm text-muted-foreground mt-1">{CATEGORY_DESCRIPTION[category]}</p>
      </div>
      <div className="space-y-4">
        {integrations.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} onToggle={onToggle} />
        ))}
      </div>
    </div>
  )
}

export default function IntegracoesPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [integrationsState, setIntegrationsState] = useState<Integration[]>([])

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

  const handleToggle = (id: string, connected: boolean) => {
    setIntegrationsState((prev) =>
      prev.map((integration) =>
        integration.id === id ? { ...integration, connected } : integration,
      ),
    )
  }

  const filteredIntegrations = useMemo(() => {
    return integrationsState.filter((integration) => {
      if (activeTab === 'connected') return integration.connected
      if (activeTab === 'disconnected') return !integration.connected
      return true
    })
  }, [activeTab, integrationsState])

  const advertisingIntegrations = filteredIntegrations.filter(
    (integration) => integration.category === 'advertising',
  )
  const analyticsIntegrations = filteredIntegrations.filter(
    (integration) => integration.category === 'analytics',
  )
  const ecommerceIntegrations = filteredIntegrations.filter(
    (integration) => integration.category === 'ecommerce',
  )
  const crmIntegrations = filteredIntegrations.filter(
    (integration) => integration.category === 'crm',
  )
  const financialIntegrations = filteredIntegrations.filter(
    (integration) => integration.category === 'financial',
  )

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
                      Conecte facilmente seu número de telefone com seus aplicativos favoritos para
                      automatizar fluxos de trabalho e se manter atualizado sobre chamadas e mensagens.
                    </p>

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

                    {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

                    <ToolkitIntegrationGrid
                      toolkits={TOOLKITS}
                      tkStatus={tkStatus}
                      busySlug={busySlug}
                      onIntegrate={handleIntegrate}
                      onDisconnectUnsupported={() =>
                        setError('Desconectar ainda não implementado')
                      }
                    />

                    <div className="flex items-center space-x-2">
                      <TabButton
                        activeTab={activeTab}
                        onChange={setActiveTab}
                        tab="all"
                        label="Todas as Aplicações"
                      />
                      <TabButton
                        activeTab={activeTab}
                        onChange={setActiveTab}
                        tab="connected"
                        label="Conectadas"
                      />
                      <TabButton
                        activeTab={activeTab}
                        onChange={setActiveTab}
                        tab="disconnected"
                        label="Desconectadas"
                      />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <IntegrationSection
                      category="advertising"
                      integrations={advertisingIntegrations}
                      onToggle={handleToggle}
                    />
                    <IntegrationSection
                      category="analytics"
                      integrations={analyticsIntegrations}
                      onToggle={handleToggle}
                    />
                    <IntegrationSection
                      category="ecommerce"
                      integrations={ecommerceIntegrations}
                      onToggle={handleToggle}
                    />
                    <IntegrationSection
                      category="crm"
                      integrations={crmIntegrations}
                      onToggle={handleToggle}
                    />
                    <IntegrationSection
                      category="financial"
                      integrations={financialIntegrations}
                      onToggle={handleToggle}
                    />
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
