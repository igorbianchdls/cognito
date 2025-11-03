"use client"

import { useMemo, useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"
import BuilderHeader from "@/components/workflows/builder/BuilderHeader"
import BuilderCanvas from "@/components/workflows/builder/BuilderCanvas"
import PropertiesPanel from "@/components/workflows/builder/PropertiesPanel"
import ConnectorsPanel from "@/components/workflows/builder/ConnectorsPanel"
import type { Step } from "@/app/workflows/builder/types"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

export default function NewWorkflowPage() {
  const [name, setName] = useState("Novo workflow")
  const [steps, setSteps] = useState<Step[]>([
    { id: 's1', type: 'trigger', text: 'New website form submission' },
    { id: 's2', type: 'action', text: 'Add a new app to your Zap' },
    { id: 's3', type: 'action', text: 'Add a new record' },
    { id: 's4', type: 'branch' },
  ])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [autoOpen, setAutoOpen] = useState(true)
  const selectedStep = useMemo(() => steps.find(s => s.id === selectedId) || null, [steps, selectedId])

  const updateStep = (id: string, patch: Partial<Step>) => {
    setSteps(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)))
  }

  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id))
    setSelectedId(prev => (prev === id ? null : prev))
  }

  // Atalhos: P para alternar painel; Esc para fechar
  if (typeof window !== 'undefined') {
    const w = window as Window & { __wf_panel_keys__?: boolean }
    if (!w.__wf_panel_keys__) {
      w.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'p') {
          e.preventDefault()
          setIsPanelOpen((v) => !v)
        }
        if (e.key === 'Escape') {
          setIsPanelOpen(false)
        }
      })
      w.__wf_panel_keys__ = true
    }
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarShadcn />
      <SidebarInset className="h-screen flex flex-col bg-white">
        <BuilderHeader
          name={name}
          onRename={setName}
          isPanelOpen={isPanelOpen}
          onTogglePanel={() => setIsPanelOpen(v => !v)}
          autoOpen={autoOpen}
          onToggleAutoOpen={() => setAutoOpen(v => !v)}
        />
        <div className="flex-1 overflow-hidden flex">
          {/* Left: Connectors (UI only) */}
          <div className="w-80 border-r bg-white hidden md:block">
            <ConnectorsPanel />
          </div>
          {/* Center + Right */}
          <div className="flex-1 overflow-hidden">
          {isPanelOpen && selectedStep ? (
            <PanelGroup direction="horizontal">
              <Panel minSize={40} defaultSize={66}>
                <div className="h-full overflow-auto custom-scrollbar">
                  <BuilderCanvas
                    steps={steps}
                    setSteps={setSteps}
                    selectedId={selectedId}
                    setSelectedId={setSelectedId}
                    onNodeSelect={(id) => {
                      setSelectedId(id)
                      if (autoOpen) setIsPanelOpen(true)
                    }}
                    onBackgroundClick={() => setSelectedId(null)}
                  />
                </div>
              </Panel>
              <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize" />
              <Panel minSize={24} defaultSize={34}>
                <div className="h-full overflow-auto border-l bg-white custom-scrollbar">
                  <PropertiesPanel
                    step={selectedStep}
                    onChange={(patch) => selectedStep && updateStep(selectedStep.id, patch)}
                    onDelete={() => selectedStep && removeStep(selectedStep.id)}
                    onClose={() => setIsPanelOpen(false)}
                  />
                </div>
              </Panel>
            </PanelGroup>
          ) : (
            <div className="h-full overflow-auto custom-scrollbar">
              <BuilderCanvas
                steps={steps}
                setSteps={setSteps}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                onNodeSelect={(id) => {
                  setSelectedId(id)
                  if (autoOpen) setIsPanelOpen(true)
                }}
                onBackgroundClick={() => setSelectedId(null)}
              />
            </div>
          )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
