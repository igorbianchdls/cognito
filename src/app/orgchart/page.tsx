"use client"

import * as React from "react"
import { useState } from "react"
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import EmployeeCard from '@/components/orgchart/EmployeeCard'
import { Employee, orgData, categoryColors } from '@/data/orgData'

type FilterTab = 'all' | 'vendas' | 'operacional' | 'marketing' | 'trafego-pago' | 'comercial' | 'financeiro' | 'supply-chain' | 'contabil' | 'juridico' | 'business-intelligence'

export default function OrgChartPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  // Função para coletar todos os agentes recursivamente
  const collectAllAgents = (employee: Employee): Employee[] => {
    const agents = [employee]
    if (employee.subordinates) {
      employee.subordinates.forEach(subordinate => {
        agents.push(...collectAllAgents(subordinate))
      })
    }
    return agents
  }

  const allAgents = collectAllAgents(orgData)

  const filteredAgents = allAgents.filter(agent => {
    if (activeTab === 'all') return true
    
    // Mapear categorias para filtros
    const categoryMapping: Record<string, string[]> = {
      'vendas': ['Vendas', 'Tráfego Pago', 'Marketing', 'Comercial'],
      'operacional': ['Operacional', 'Financeiro', 'Supply Chain', 'Contábil', 'Jurídico', 'Business Intelligence'],
      'marketing': ['Marketing'],
      'trafego-pago': ['Tráfego Pago'], 
      'comercial': ['Comercial'],
      'financeiro': ['Financeiro'],
      'supply-chain': ['Supply Chain'],
      'contabil': ['Contábil'],
      'juridico': ['Jurídico'],
      'business-intelligence': ['Business Intelligence']
    }
    
    return categoryMapping[activeTab]?.includes(agent.category) || false
  })

  // Agrupar por categoria
  const groupedAgents = filteredAgents.reduce((groups, agent) => {
    const category = agent.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(agent)
    return groups
  }, {} as Record<string, Employee[]>)

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

  const AgentSection = ({ 
    category, 
    agents 
  }: { 
    category: string;
    agents: Employee[]
  }) => {
    if (agents.length === 0) return null

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {category}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {agents.length} agente{agents.length !== 1 ? 's' : ''} especializado{agents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => setSelectedEmployee(agent)}
              className="cursor-pointer"
            >
              <EmployeeCard
                employee={agent}
                level={0}
                isHighlighted={selectedEmployee?.id === agent.id}
                onClick={() => {}}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12" style={{backgroundColor: 'white'}}>
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Creatto
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Organograma</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4" style={{backgroundColor: 'white'}}>
          <div className="mx-auto w-full max-w-7xl px-2">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-foreground mb-6">
                Organograma
              </h1>
              
              {/* Tabs */}
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <TabButton tab="all" label="Todos os Agentes" />
                <TabButton tab="vendas" label="Vendas" />
                <TabButton tab="operacional" label="Operacional" />
                <TabButton tab="marketing" label="Marketing" />
                <TabButton tab="trafego-pago" label="Tráfego Pago" />
                <TabButton tab="comercial" label="Comercial" />
                <TabButton tab="financeiro" label="Financeiro" />
                <TabButton tab="supply-chain" label="Supply Chain" />
                <TabButton tab="contabil" label="Contábil" />
                <TabButton tab="juridico" label="Jurídico" />
                <TabButton tab="business-intelligence" label="Business Intelligence" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-12">
              {Object.entries(groupedAgents)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, agents]) => (
                <AgentSection 
                  key={category}
                  category={category} 
                  agents={agents} 
                />
              ))}
            </div>
          </div>
        </div>

        {/* Side Panel for Employee Details */}
        {selectedEmployee && (
          <div className="w-80 border-l border-border bg-muted/30 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Detalhes</h3>
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedEmployee(null)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${selectedEmployee.iconColor} flex items-center justify-center text-white font-semibold text-lg`}>
                  {selectedEmployee.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-card-foreground">{selectedEmployee.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.description}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Categoria
                  </label>
                  <p className="text-sm">{selectedEmployee.category}</p>
                </div>
                
                {selectedEmployee.capabilities && selectedEmployee.capabilities.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Capacidades
                    </label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedEmployee.capabilities.map((capability, index) => (
                        <span key={index} className="text-xs px-2 py-0.5 bg-muted rounded border">
                          {capability}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedEmployee.subordinates && selectedEmployee.subordinates.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Agentes Gerenciados
                    </label>
                    <p className="text-sm">{selectedEmployee.subordinates.length}</p>
                    <div className="mt-2 space-y-1">
                      {selectedEmployee.subordinates.map(sub => (
                        <div key={sub.id} className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className={`w-4 h-4 rounded bg-gradient-to-br ${sub.iconColor} flex items-center justify-center text-white text-xs`}>
                            {sub.icon}
                          </span>
                          {sub.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}