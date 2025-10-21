'use client'

import { useState, useCallback } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from "@/components/ui/separator"
import { Button } from '@/components/ui/button'
import { Plus, Settings } from 'lucide-react'
import DraggableChatContainer from '@/components/multiagentes/DraggableChatContainer'

interface ChatContainer {
  id: string
  title: string
  agentType: string
  position: { x: number; y: number }
  size: { width: number; height: number }
}

const AGENT_TYPES = [
  { id: 'geral', name: 'Chat Geral', color: '#3B82F6' },
  { id: 'analista', name: 'Analista', color: '#10B981' },
  { id: 'criativo', name: 'Criativo', color: '#F59E0B' },
  { id: 'tecnico', name: 'Técnico', color: '#8B5CF6' },
  { id: 'marketing', name: 'Marketing', color: '#EF4444' },
]

export default function MultiAgentesPage() {
  const [containers, setContainers] = useState<ChatContainer[]>([
    {
      id: 'chat-1',
      title: 'Chat Geral',
      agentType: 'geral',
      position: { x: 50, y: 50 },
      size: { width: 400, height: 500 }
    }
  ])
  
  const [activeContainer, setActiveContainer] = useState<ChatContainer | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const container = containers.find(c => c.id === event.active.id)
    setActiveContainer(container || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event
    
    if (delta.x === 0 && delta.y === 0) return

    setContainers(prev => prev.map(container => 
      container.id === active.id 
        ? { 
            ...container, 
            position: { 
              x: Math.max(0, container.position.x + delta.x),
              y: Math.max(0, container.position.y + delta.y)
            }
          }
        : container
    ))
    
    setActiveContainer(null)
  }

  const addNewChat = useCallback(() => {
    const newId = `chat-${Date.now()}`
    const randomAgent = AGENT_TYPES[Math.floor(Math.random() * AGENT_TYPES.length)]
    
    const newContainer: ChatContainer = {
      id: newId,
      title: `${randomAgent.name} ${containers.length + 1}`,
      agentType: randomAgent.id,
      position: { 
        x: 100 + (containers.length * 50), 
        y: 100 + (containers.length * 50) 
      },
      size: { width: 400, height: 500 }
    }
    
    setContainers(prev => [...prev, newContainer])
  }, [containers.length])

  const removeChat = useCallback((id: string) => {
    setContainers(prev => prev.filter(c => c.id !== id))
  }, [])

  const updateContainer = useCallback((id: string, updates: Partial<ChatContainer>) => {
    setContainers(prev => prev.map(container => 
      container.id === id ? { ...container, ...updates } : container
    ))
  }, [])

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarShadcn />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between w-full px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <h1 className="text-lg font-semibold text-gray-900">Multi Agentes</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={addNewChat}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Chat
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-gray-50 overflow-hidden">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Containers */}
            <div className="relative w-full h-full">
              {containers.map((container) => (
                <DraggableChatContainer
                  key={container.id}
                  container={container}
                  onRemove={removeChat}
                  onUpdate={updateContainer}
                />
              ))}
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeContainer ? (
                <div 
                  className="bg-white border-2 border-blue-500 rounded-lg shadow-lg opacity-90"
                  style={{ 
                    width: activeContainer.size.width, 
                    height: activeContainer.size.height 
                  }}
                >
                  <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-medium text-gray-900">{activeContainer.title}</h3>
                  </div>
                  <div className="p-4 text-gray-500">Movendo...</div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* Empty State */}
          {containers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum chat ativo</h3>
                <p className="text-gray-600 mb-4">Adicione um novo chat para começar</p>
                <Button onClick={addNewChat}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Chat
                </Button>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}