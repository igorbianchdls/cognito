"use client"

import { useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"
import BuilderHeader from "@/components/workflows/builder/BuilderHeader"
import BuilderCanvas from "@/components/workflows/builder/BuilderCanvas"

export default function NewWorkflowPage() {
  const [name, setName] = useState("Novo workflow")

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarShadcn />
      <SidebarInset className="h-screen flex flex-col bg-white">
        <BuilderHeader name={name} onRename={setName} />
        <div className="flex-1 overflow-auto">
          <BuilderCanvas />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

