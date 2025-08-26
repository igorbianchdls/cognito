'use client'

import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import { X, Minus, Square, GripHorizontal } from 'lucide-react'
import ChatInterface from './ChatInterface'

interface ChatContainer {
  id: string
  title: string
  agentType: string
  position: { x: number; y: number }
  size: { width: number; height: number }
}

interface DraggableChatContainerProps {
  container: ChatContainer
  onRemove: (id: string) => void
  onUpdate: (id: string, updates: Partial<ChatContainer>) => void
}

const AGENT_COLORS = {
  geral: '#3B82F6',
  analista: '#10B981',
  criativo: '#F59E0B',
  tecnico: '#8B5CF6',
  marketing: '#EF4444',
}

export default function DraggableChatContainer({ 
  container, 
  onRemove, 
  onUpdate 
}: DraggableChatContainerProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: container.id })

  const style = {
    position: 'absolute' as const,
    left: container.position.x,
    top: container.position.y,
    width: container.size.width,
    height: isMinimized ? 'auto' : container.size.height,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 1000 : 1,
  }

  const agentColor = AGENT_COLORS[container.agentType as keyof typeof AGENT_COLORS] || '#6B7280'

  const handleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const handleClose = () => {
    onRemove(container.id)
  }

  const handleResize = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = container.size.width
    const startHeight = container.size.height

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(300, startWidth + (e.clientX - startX))
      const newHeight = Math.max(200, startHeight + (e.clientY - startY))
      
      onUpdate(container.id, {
        size: { width: newWidth, height: newHeight }
      })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden ${
        isDragging ? 'opacity-50' : ''
      } ${isResizing ? 'select-none' : ''}`}
    >
      {/* Header Bar */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b cursor-move"
        style={{ backgroundColor: agentColor + '10', borderBottomColor: agentColor + '20' }}
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="h-4 w-4 text-gray-400" />
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: agentColor }}
          />
          <span className="text-sm font-medium text-gray-900">
            {container.title}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-200"
            onClick={handleMinimize}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
            onClick={handleClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Chat Content */}
      {!isMinimized && (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-hidden">
            <ChatInterface
              agentType={container.agentType}
              containerId={container.id}
            />
          </div>
          
          {/* Resize Handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize"
            onMouseDown={handleResize}
          >
            <div className="absolute bottom-1 right-1 w-0 h-0 border-l-2 border-b-2 border-gray-400" />
            <div className="absolute bottom-2 right-2 w-0 h-0 border-l-2 border-b-2 border-gray-300" />
          </div>
        </div>
      )}
    </div>
  )
}