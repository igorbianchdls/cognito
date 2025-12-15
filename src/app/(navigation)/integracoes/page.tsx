"use client"

import * as React from "react"
import { useState } from "react"
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import NexusHeader from '@/components/nexus/NexusHeader'
import NexusPageContainer from '@/components/nexus/NexusPageContainer'
import { IntegrationCard } from "@/components/integrations/IntegrationCard"
import {
  integrations,
  getCategoryTitle,
  getCategoryDescription,
  type Integration
} from "@/data/integrations"

type FilterTab = 'all' | 'connected' | 'disconnected'

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [integrationsState, setIntegrationsState] = useState(integrations)

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
    <SidebarProvider defaultOpen={true}>
      <SidebarShadcn borderless headerBorderless />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden" style={{ backgroundColor: '#fdfdfd' }}>
          <div className="flex flex-col h-full w-full">
            <NexusHeader viewMode={'dashboard'} onChangeViewMode={() => {}} borderless size="sm" showBreadcrumb={false} />
            <div className="flex-1 min-h-0 pl-2 pr-2 pt-0 pb-2" data-page="nexus">
              <NexusPageContainer className="h-full">
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
              </NexusPageContainer>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
