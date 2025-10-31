'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import PageHeader from '@/components/modulos/PageHeader'

export default function ModulosProdutosPage() {
  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="h-screen flex flex-col">
        <PageHeader title="Produtos" subtitle="Catálogo de produtos e variações" />
        <div className="px-4 pb-6 md:px-6 md:pb-8 text-sm text-muted-foreground">
          Em breve: listagem de produtos, categorias, atributos e variações.
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

