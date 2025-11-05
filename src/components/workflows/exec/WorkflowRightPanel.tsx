"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Graph } from '@/types/agentes/builder'
import WorkflowRunChatPanel from './WorkflowRunChatPanel'
import { useState } from 'react'

export default function WorkflowRightPanel({
  propertiesSlot,
  graph,
  triggerRun,
  className,
}: {
  propertiesSlot: React.ReactNode
  graph: Graph
  triggerRun?: number
  className?: string
}) {
  const [tab, setTab] = useState<'props' | 'exec'>('props')
  return (
    <div className={className}>
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'props' | 'exec')} className="flex-1 flex flex-col h-full">
        <div className="px-4 pt-2">
          <TabsList variant="underline">
            <TabsTrigger value="props">Propriedades</TabsTrigger>
            <TabsTrigger value="exec">Execução</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="props" className="flex-1 overflow-auto">
          {propertiesSlot}
        </TabsContent>
        <TabsContent value="exec" className="flex-1 overflow-auto">
          <WorkflowRunChatPanel graph={graph} autoSend={triggerRun ? 'olá agente' : undefined} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

