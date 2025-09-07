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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react'

interface MetricData {
  variation: string
  users: number
  metricValue: string | number
  metricPerUser: string | number
  uplift: string
  probability: number
  isBaseline?: boolean
}

interface MetricSection {
  id: string
  name: string
  icon: React.ReactNode
  isPrimary?: boolean
  columns: {
    users: string
    metricValue: string
    metricPerUser: string
  }
  data: MetricData[]
}

const metricsData: MetricSection[] = [
  {
    id: 'purchases',
    name: 'Compras',
    icon: <Clock className="w-4 h-4" />,
    isPrimary: true,
    columns: {
      users: 'Usuários',
      metricValue: 'Compras',
      metricPerUser: 'Compras / Usuário'
    },
    data: [
      {
        variation: 'Variação 1',
        users: 23489,
        metricValue: 1619,
        metricPerUser: '0.0689',
        uplift: '+0.4%',
        probability: 55
      },
      {
        variation: 'Grupo de Controle',
        users: 212968,
        metricValue: 14618,
        metricPerUser: '0.0686',
        uplift: 'Base',
        probability: 45,
        isBaseline: true
      }
    ]
  },
  {
    id: 'revenue',
    name: 'Receita',
    icon: <DollarSign className="w-4 h-4" />,
    columns: {
      users: 'Usuários',
      metricValue: 'Receita',
      metricPerUser: 'Receita / Usuário'
    },
    data: [
      {
        variation: 'Variação 1',
        users: 23489,
        metricValue: '$115,373',
        metricPerUser: '$4.91',
        uplift: '-0.8%',
        probability: 35
      },
      {
        variation: 'Grupo de Controle',
        users: 212968,
        metricValue: '$1.05M',
        metricPerUser: '$4.95',
        uplift: 'Base',
        probability: 65,
        isBaseline: true
      }
    ]
  },
  {
    id: 'add-to-cart',
    name: 'Adicionar ao Carrinho',
    icon: <ShoppingCart className="w-4 h-4" />,
    columns: {
      users: 'Usuários',
      metricValue: 'Adicionar ao Carrinho',
      metricPerUser: 'Adicionar ao Carrinho / Usuários'
    },
    data: [
      {
        variation: 'Variação 1',
        users: 23489,
        metricValue: 10077,
        metricPerUser: '0.429',
        uplift: '+0.2%',
        probability: 62
      },
      {
        variation: 'Grupo de Controle',
        users: 212968,
        metricValue: 9140,
        metricPerUser: '0.428',
        uplift: 'Base',
        probability: 38,
        isBaseline: true
      }
    ]
  },
  {
    id: 'aov',
    name: 'AOV',
    icon: <TrendingUp className="w-4 h-4" />,
    columns: {
      users: 'Usuários',
      metricValue: 'Receita',
      metricPerUser: 'Ticket Médio'
    },
    data: [
      {
        variation: 'Variação 1',
        users: 23489,
        metricValue: '$115,373',
        metricPerUser: '$71.26',
        uplift: '-1.2%',
        probability: 24
      },
      {
        variation: 'Grupo de Controle',
        users: 212968,
        metricValue: '$1.05M',
        metricPerUser: '$72.15',
        uplift: 'Base',
        probability: 76,
        isBaseline: true
      }
    ]
  }
]

interface ExperimentResultsPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ExperimentResultsPage({ params }: ExperimentResultsPageProps) {
  const { id } = await params
  
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2).replace('.00', '') + 'M'
    }
    if (num >= 1000) {
      return num.toLocaleString()
    }
    return num.toString()
  }

  const getUpliftColor = (uplift: string) => {
    if (uplift === 'Base') return 'text-muted-foreground'
    if (uplift.startsWith('+')) return 'text-green-600'
    if (uplift.startsWith('-')) return 'text-red-600'
    return 'text-muted-foreground'
  }

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
                    <BreadcrumbLink href="/experiments" className="text-sidebar-foreground">
                      Experimentos
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href={`/experiments/${id}`} className="text-sidebar-foreground">
                      Melhorias na página inicial
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-sidebar-foreground">
                      Resultados
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col p-6 bg-white">
          <div className="space-y-6">
            {/* Header with Controls */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-foreground">Performance das Variações</h1>
              
              <div className="flex items-center gap-4">
                <Select defaultValue="all-metrics">
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Escolher Métricas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-metrics">Escolher Métricas</SelectItem>
                    <SelectItem value="purchases">Compras</SelectItem>
                    <SelectItem value="revenue">Receita</SelectItem>
                    <SelectItem value="add-to-cart">Adicionar ao Carrinho</SelectItem>
                    <SelectItem value="aov">AOV</SelectItem>
                  </SelectContent>
                </Select>

                <Select defaultValue="all-audience">
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Segmentação de Audiência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-audience">Segmentação de Audiência</SelectItem>
                    <SelectItem value="desktop">Desktop</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                  </SelectContent>
                </Select>

                <Select defaultValue="excluded">
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Outliers Excluídos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excluded">Outliers Excluídos</SelectItem>
                    <SelectItem value="included">Outliers Incluídos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Metrics Sections */}
            <div className="space-y-8">
              {metricsData.map((metric) => (
                <Card key={metric.id} className="bg-transparent border-transparent shadow-none">
                  <CardContent className="p-0">
                    <div className="space-y-4">
                      {/* Section Header */}
                      <div className="flex items-center gap-3">
                        {metric.icon}
                        <h2 className="text-lg font-semibold text-foreground">{metric.name}</h2>
                        {metric.isPrimary && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                            Métrica Principal
                          </Badge>
                        )}
                      </div>

                      {/* Metrics Table */}
                      <div className="border rounded-lg bg-background">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="font-medium">Variação ↑</TableHead>
                              <TableHead className="font-medium">{metric.columns.users}</TableHead>
                              <TableHead className="font-medium">{metric.columns.metricValue}</TableHead>
                              <TableHead className="font-medium">{metric.columns.metricPerUser}</TableHead>
                              <TableHead className="font-medium">Aumento</TableHead>
                              <TableHead className="font-medium">Probabilidade de ser Melhor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {metric.data.map((row, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{row.variation}</TableCell>
                                <TableCell>{formatNumber(row.users)}</TableCell>
                                <TableCell>{typeof row.metricValue === 'number' ? formatNumber(row.metricValue) : row.metricValue}</TableCell>
                                <TableCell>{row.metricPerUser}</TableCell>
                                <TableCell>
                                  <span className={getUpliftColor(row.uplift)}>
                                    {row.uplift}
                                  </span>
                                </TableCell>
                                <TableCell>{row.probability}%</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}