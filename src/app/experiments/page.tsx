'use client'

import { useState } from 'react'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, ChevronDown, TestTube, BarChart3, Users, Zap } from 'lucide-react'
import Link from 'next/link'

// Mock data para os experimentos
const experimentsData = [
  {
    id: '1',
    name: 'Copy of Landing page improvements',
    type: 'A/B Test',
    status: 'Não Iniciado',
    modified: '15 Ago, 2024',
    description: 'Landing page experiment for Adler Bragon Insurance, testing a discounted rate to see if a visitor buys two policies at the same time.'
  },
  {
    id: '2', 
    name: 'Landing page improvements',
    type: 'A/B Test',
    status: 'Não Iniciado',
    modified: '14 Ago, 2024',
    description: 'Landing page experiment for Adler Bragon Insurance, testing a discounted rate to see if a visitor buys two policies at the same time.'
  },
  {
    id: '3',
    name: "Trisha's Personalization Campaign", 
    type: 'Personalization Campaign',
    status: 'Não Iniciado',
    modified: '12 Ago, 2024',
    description: 'Personalization campaign targeting different user segments.'
  },
  {
    id: '4',
    name: 'Product page experiment',
    type: 'A/B Test', 
    status: 'Não Iniciado',
    modified: '15 Abr, 2024',
    description: 'Testing different product page layouts and CTAs.'
  },
  {
    id: '5',
    name: 'Hello, world!',
    type: 'A/B Test',
    status: 'Pausado', 
    modified: '12 Abr, 2022',
    description: 'A simple experiment to target the new page - Attic and Button Home Page'
  }
]

export default function ExperimentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Active')
  const [activeTab, setActiveTab] = useState('overview')

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Não Iniciado':
        return 'secondary'
      case 'Pausado':
        return 'outline'
      case 'Executando':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const experimentTypes = [
    {
      id: 'ab-test',
      name: 'Teste A/B', 
      description: 'Teste múltiplas variações umas contra as outras para encontrar a melhor experiência.',
      icon: <TestTube className="w-5 h-5 text-blue-600" />
    },
    {
      id: 'multivariate',
      name: 'Teste Multivariado',
      description: 'Teste múltiplas seções de uma página ao mesmo tempo.',
      icon: <BarChart3 className="w-5 h-5 text-green-600" />  
    },
    {
      id: 'personalization',
      name: 'Campanha de Personalização',
      description: 'Segmente múltiplas audiências com diferentes experiências personalizadas.',
      icon: <Users className="w-5 h-5 text-purple-600" />
    },
    {
      id: 'bandit',
      name: 'Bandit Multi-Braços',
      description: 'Use aprendizado de máquina para alocar dinamicamente o tráfego para a variação de melhor desempenho.',
      icon: <Zap className="w-5 h-5 text-orange-600" />
    }
  ]

  return (
    <SidebarProvider defaultOpen={true}>
      <SidebarShadcn />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-border bg-white">
          <div className="flex items-center justify-between w-full px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-sidebar-foreground">
                      Experiments
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col p-6 bg-white">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">Experimentos</h1>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-[400px] grid-cols-2">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="exclusion-groups">Grupos de Exclusão</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Filters */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Filtrar por nome, chave ou descrição"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Ativo</SelectItem>
                          <SelectItem value="All">Todos</SelectItem>
                          <SelectItem value="Paused">Pausado</SelectItem>
                          <SelectItem value="Completed">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Create New Experiment Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="gap-2">
                        Criar Novo Experimento...
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80" align="end">
                      {experimentTypes.map((type) => (
                        <DropdownMenuItem key={type.id} className="p-4 cursor-pointer">
                          <div className="flex items-start gap-3">
                            {type.icon}
                            <div className="space-y-1">
                              <p className="font-medium text-sm">{type.name}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {type.description}
                              </p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Experiments Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Modificado</TableHead>
                        <TableHead>Resultados</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {experimentsData.map((experiment) => (
                        <TableRow key={experiment.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-foreground">
                                {experiment.name}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {experiment.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{experiment.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(experiment.status)}>
                              {experiment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {experiment.modified}
                          </TableCell>
                          <TableCell>
                            <Link href={`/experiments/${experiment.id}/results`}>
                              <Button 
                                variant="link" 
                                className="p-0 h-auto text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Resultados
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="exclusion-groups">
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Conteúdo dos Grupos de Exclusão será implementado aqui.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}