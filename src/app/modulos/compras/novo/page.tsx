"use client"

import * as React from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import NexusPageContainer from '@/components/navigation/nexus/NexusPageContainer'
import PageHeader from '@/components/modulos/PageHeader'
import NovaCompraForm from '@/components/modulos/compras/NovaCompraForm'

export default function NovaCompraPage() {
  return (
    <SidebarProvider>
      <SidebarShadcn borderless headerBorderless />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden" style={{ backgroundColor: '#fdfdfd' }}>
          <div className="flex flex-col h-full w-full">
            
            <div className="flex-1 min-h-0 pl-2 pr-2 pt-0 pb-2 overflow-auto" data-page="nexus">
              <NexusPageContainer className="h-full" style={{ overflow: 'auto' }}>
                <div className="mb-3">
                  <PageHeader title="Nova Compra" subtitle="Preencha as informações para cadastrar a compra" />
                </div>
                <NovaCompraForm />
              </NexusPageContainer>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
