'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import PageHeader from '@/components/modulos/PageHeader'

export default function ModulosEmpresaPage() {
  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="h-screen flex flex-col">
        <PageHeader title="Empresa" subtitle="Gerencie informações da sua empresa" />
        <div className="px-4 pb-6 md:px-6 md:pb-8 text-sm text-muted-foreground">
          Em breve: visão geral, dados cadastrais, filiais, documentos e configurações.
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

