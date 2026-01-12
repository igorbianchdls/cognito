"use client"

import * as React from "react"
import { useState } from "react"
import NexusShell from '@/components/navigation/nexus/NexusShell'
import { IntegrationCard } from "@/components/navigation/integrations/IntegrationCard"
import type { Integration } from "@/components/navigation/integrations/IntegrationCard"

type FilterTab = 'all' | 'connected' | 'disconnected'

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  // Fallback: no static integrations
  const [integrationsState, setIntegrationsState] = useState<Integration[]>([])

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
      </div>
    </NexusShell>
  )
}
