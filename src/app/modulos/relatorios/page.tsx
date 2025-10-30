"use client"

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import PageHeader from '@/components/modulos/PageHeader'

export default function ModulosRelatoriosPage() {
  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="min-h-screen flex flex-col bg-gray-50">
        <div className="bg-white border-b">
          <PageHeader title="Relatórios" subtitle="Central de relatórios gerenciais" />
        </div>
        <div className="flex-1 p-6">
          <div className="rounded-lg border bg-white p-6 text-sm text-gray-600">
            <p>Bem-vindo à área de Relatórios. Em breve você poderá criar e visualizar relatórios gerenciais aqui.</p>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

