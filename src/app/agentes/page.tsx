"use client"

import Link from "next/link"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"
import { Button } from "@/components/ui/button"

export default function AgentsIndexPage() {
  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarShadcn />
      <SidebarInset className="min-h-screen flex flex-col overflow-auto bg-white">
        <div className="px-6 md:px-10 py-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Agentes</h1>
              <p className="text-sm text-muted-foreground">Crie e gerencie agentes de IA</p>
            </div>
            <Link href="/agentes/novo">
              <Button>Novo agente</Button>
            </Link>
          </div>
        </div>
        <div className="flex-1 p-6 md:p-10">
          <div className="text-sm text-muted-foreground">Nenhum agente salvo ainda.</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

