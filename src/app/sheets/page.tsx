'use client';

import { useState } from 'react';
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
import AGGridSheet from '@/components/sheets/AGGridSheet'
import RightPanel from '@/components/sheets/RightPanel'
import TableHeader, { FilterState, SortState } from '@/components/sheets/TableHeader'
import CollapseButton from '@/components/sheets/CollapseButton'

export default function SheetsPage() {
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [filters, setFilters] = useState<FilterState[]>([]);
  const [sorting, setSorting] = useState<SortState[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const toggleRightPanel = () => {
    setIsRightPanelCollapsed(!isRightPanelCollapsed);
  };

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
                  <BreadcrumbPage>Planilhas</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col" style={{backgroundColor: 'white'}}>
          <div className="flex-1 min-w-0 flex flex-col">
        {/* TableHeader - Ocupando 100% da largura */}
        <TableHeader 
          onFiltersChange={setFilters}
          onSortChange={setSorting}
          onViewChange={setView}
        />
        
        {/* Área inferior: AG Grid + RightPanel lado a lado */}
        <div className="flex-1 min-h-0 flex">
          {/* AG Grid - Área central */}
          <div className="flex-1 min-w-0 relative">
            <AGGridSheet 
              filters={filters}
              sorting={sorting}
            />
            
            {/* Collapse Button - Visível apenas em md+ */}
            <div className="hidden md:block">
              <CollapseButton 
                isCollapsed={isRightPanelCollapsed}
                onToggle={toggleRightPanel}
              />
            </div>
          </div>
          
          {/* Painel Direito com Tabs - Oculto em telas pequenas */}
          <div className={`
            hidden md:block border-l border-gray-200 bg-white
            transition-all duration-300 ease-in-out overflow-hidden
            ${isRightPanelCollapsed ? 'w-0 border-l-0' : 'w-80'}
          `}>
            <div className={`
              w-80 h-full
              transition-opacity duration-300 ease-in-out
              ${isRightPanelCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
            `}>
              <RightPanel />
            </div>
          </div>
        </div>
        </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}