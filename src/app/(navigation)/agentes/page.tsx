"use client"

import Link from "next/link"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"
import { Button } from "@/components/ui/button"
import NexusHeader from "@/components/nexus/NexusHeader"
import NexusPageContainer from "@/components/nexus/NexusPageContainer"

export default function AgentsIndexPage() {
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
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-1">Agentes</h1>
                      <p className="text-gray-600 text-lg">Crie e gerencie agentes de IA</p>
                    </div>
                    <Link href="/agentes/novo">
                      <Button className="bg-black text-white hover:bg-gray-800">Novo agente</Button>
                    </Link>
                  </div>
                  <div className="text-sm text-muted-foreground">Nenhum agente salvo ainda.</div>
                </div>
              </NexusPageContainer>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
