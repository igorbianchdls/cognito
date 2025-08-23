"use client"

import * as React from "react"
import { useState } from "react"
import Sidebar from "@/components/navigation/Sidebar"
import MobileHeader from "@/components/navigation/MobileHeader"
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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

  const salesIntegrations = filteredIntegrations.filter(i => i.category === 'sales')
  const communicationIntegrations = filteredIntegrations.filter(i => i.category === 'communication')

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
    category: 'sales' | 'communication';
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    <div className="flex flex-col md:flex-row h-screen" style={{backgroundColor: '#FBFBFB'}}>
      <MobileHeader onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-6">
            Integrations
          </h1>
          
          {/* Tabs */}
          <div className="flex items-center space-x-2">
            <TabButton tab="all" label="All Applications" />
            <TabButton tab="connected" label="Connected" />
            <TabButton tab="disconnected" label="Disconnected" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-12">
          <IntegrationSection 
            category="sales" 
            integrations={salesIntegrations} 
          />
          <IntegrationSection 
            category="communication" 
            integrations={communicationIntegrations} 
          />
        </div>
        </div>
      </div>
    </div>
  )
}