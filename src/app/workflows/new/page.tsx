"use client"

import { useMemo, useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"
import BuilderHeader from "@/components/workflows/builder/BuilderHeader"
import BuilderCanvas from "@/components/workflows/builder/BuilderCanvas"
import PropertiesPanel from "@/components/workflows/builder/PropertiesPanel"
import ConnectorsPanel from "@/components/workflows/builder/ConnectorsPanel"
import type { Step } from "@/app/workflows/builder/types"
// Removed resizable panels: right properties panel is always visible

export default function NewWorkflowPage() {
  const [name, setName] = useState("Novo workflow")
  const [steps, setSteps] = useState<Step[]>([
    { id: 's1', type: 'trigger', text: 'New website form submission' },
    { id: 's2', type: 'action', text: 'Add a new app to your Zap' },
    { id: 's3', type: 'action', text: 'Add a new record' },
    { id: 's4', type: 'branch' },
  ])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Properties panel is always open
  const selectedStep = useMemo(() => steps.find(s => s.id === selectedId) || null, [steps, selectedId])

  const updateStep = (id: string, patch: Partial<Step>) => {
    setSteps(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)))
  }

  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id))
    setSelectedId(prev => (prev === id ? null : prev))
  }

  // No toggle shortcuts: panel remains open

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarShadcn />
      <SidebarInset className="h-screen flex flex-col bg-white builder-scope">
        <BuilderHeader
          name={name}
          onRename={setName}
        />
        <div className="flex-1 overflow-hidden flex">
          {/* Left: Connectors (UI only) */}
          <div className="w-96 border-r bg-white hidden md:block">
            <ConnectorsPanel />
          </div>
          {/* Center + Right (fixed right panel) */}
          <div className="flex-1 overflow-hidden flex">
            <div className="flex-1 h-full overflow-auto custom-scrollbar">
              <BuilderCanvas
                steps={steps}
                setSteps={setSteps}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                onNodeSelect={(id) => setSelectedId(id)}
                onBackgroundClick={() => setSelectedId(null)}
              />
            </div>
            <div className="w-96 h-full overflow-auto border-l bg-white custom-scrollbar">
              <PropertiesPanel
                step={selectedStep}
                onChange={(patch) => selectedStep && updateStep(selectedStep.id, patch)}
                onDelete={() => selectedStep && removeStep(selectedStep.id)}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
