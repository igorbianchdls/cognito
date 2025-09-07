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
    status: 'Not Started',
    modified: 'Aug 15, 2024',
    description: 'Landing page experiment for Adler Bragon Insurance, testing a discounted rate to see if a visitor buys two policies at the same time.'
  },
  {
    id: '2', 
    name: 'Landing page improvements',
    type: 'A/B Test',
    status: 'Not Started',
    modified: 'Aug 14, 2024',
    description: 'Landing page experiment for Adler Bragon Insurance, testing a discounted rate to see if a visitor buys two policies at the same time.'
  },
  {
    id: '3',
    name: "Trisha's Personalization Campaign", 
    type: 'Personalization Campaign',
    status: 'Not Started',
    modified: 'Aug 12, 2024',
    description: 'Personalization campaign targeting different user segments.'
  },
  {
    id: '4',
    name: 'Product page experiment',
    type: 'A/B Test', 
    status: 'Not Started',
    modified: 'Apr 15, 2024',
    description: 'Testing different product page layouts and CTAs.'
  },
  {
    id: '5',
    name: 'Hello, world!',
    type: 'A/B Test',
    status: 'Paused', 
    modified: 'Apr 12, 2022',
    description: 'A simple experiment to target the new page - Attic and Button Home Page'
  }
]

export default function ExperimentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Active')
  const [activeTab, setActiveTab] = useState('overview')

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Not Started':
        return 'secondary'
      case 'Paused':
        return 'outline'
      case 'Running':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const experimentTypes = [
    {
      id: 'ab-test',
      name: 'A/B Test', 
      description: 'Test multiple variations against each other to find the best experience.',
      icon: <TestTube className="w-5 h-5 text-blue-600" />
    },
    {
      id: 'multivariate',
      name: 'Multivariate Test',
      description: 'Test multiple sections of a page at once.',
      icon: <BarChart3 className="w-5 h-5 text-green-600" />  
    },
    {
      id: 'personalization',
      name: 'Personalization Campaign',
      description: 'Target multiple audiences with different personalized experiences.',
      icon: <Users className="w-5 h-5 text-purple-600" />
    },
    {
      id: 'bandit',
      name: 'Multi-Armed Bandit',
      description: 'Use machine learning to dynamically allocate traffic to the best-performing variation.',
      icon: <Zap className="w-5 h-5 text-orange-600" />
    }
  ]

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarShadcn />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-border" style={{backgroundColor: 'hsl(0 0% 98%)'}}>
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

        <div className="flex flex-1 flex-col p-6" style={{backgroundColor: 'hsl(0 0% 98%)'}}>
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">Experiments</h1>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-[400px] grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="exclusion-groups">Exclusion Groups</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Filters */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Filter by name, key, or description"
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
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="All">All</SelectItem>
                          <SelectItem value="Paused">Paused</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Create New Experiment Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="gap-2">
                        Create New Experiment...
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
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Modified</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {experimentsData.map((experiment) => (
                        <TableRow key={experiment.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <Link href={`/experiments/${experiment.id}/results`}>
                                <Button 
                                  variant="link" 
                                  className="p-0 h-auto text-blue-600 hover:text-blue-800 font-medium text-left justify-start"
                                >
                                  {experiment.name}
                                </Button>
                              </Link>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="exclusion-groups">
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Exclusion Groups content will be implemented here.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}