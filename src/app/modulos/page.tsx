'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'

export default function ModulosHomePage() {
  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-2xl font-semibold mb-2">Módulos</h1>
          <p className="text-muted-foreground">Selecione “Financeiro” no menu lateral</p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

