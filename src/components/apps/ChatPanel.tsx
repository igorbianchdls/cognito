'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, FormEvent } from 'react'
import type { DroppedWidget } from '@/types/widget'
import CanvasWidgets from '../tools/appsChat/CanvasWidgets'
import { widgetActions } from '@/stores/widgetStore'

interface ChatPanelProps {
  droppedWidgets: DroppedWidget[]
  onEditWidget: (widgetId: string, changes: Partial<DroppedWidget>) => void
}

interface JsonWidget {
  i: string
  name?: string
  type?: string
  position?: { x: number; y: number }
  size?: { w: number; h: number }
  style?: { color?: string }
  icon?: string
  description?: string
  id?: string
}

interface ActionData {
  action: 'update' | 'move' | 'resize' | 'delete' | 'add'
  widgetId?: string
  changes?: Partial<DroppedWidget>
}

interface ActionFormat {
  action?: string
  widgetId?: string
  changes?: Partial<DroppedWidget>
  actions?: ActionData[]
}

interface LegacyFormat {
  widgets: JsonWidget[]
  meta?: {
    title?: string
    created?: string
    totalWidgets?: number
  }
}

// Function to remove JSON tags from display text
const removeJsonTags = (text: string) => {
  return text.replace(/<json>[\s\S]*?<\/json>/g, '')
}

// Function to parse and apply JSON from AI messages
const parseAndApplyJson = (text: string) => {
  const jsonRegex = /<json>([\s\S]*?)<\/json>/g
  const matches = [...text.matchAll(jsonRegex)]
  
  console.log(`🔍 JSON matches found: ${matches.length}`)
  
  matches.forEach((match, matchIndex) => {
    try {
      const jsonString = match[1].trim()
      console.log(`🗂️ Match ${matchIndex} - Raw JSON string:`, jsonString)
      
      const parsed = JSON.parse(jsonString)
      console.log(`✅ Match ${matchIndex} - Parsed JSON:`, parsed)
      
      // Check if it's the new action format
      if (parsed.action || parsed.actions) {
        console.log('🎯 Detected action format - using incremental updates')
        handleActionFormat(parsed)
      }
      // Fallback to old format (complete widgets array)
      else if (parsed && parsed.widgets && Array.isArray(parsed.widgets)) {
        console.log('📊 Detected legacy format - using complete replacement')
        handleLegacyFormat(parsed)
      } else {
        console.warn('⚠️ JSON format not recognized:', parsed)
      }
    } catch (error) {
      console.error('❌ Error parsing JSON from AI response:', error)
    }
  })
  
  if (matches.length === 0) {
    console.log('ℹ️ No <json> tags found in AI response')
  }
}

// Handle new action-based format
const handleActionFormat = (parsed: ActionFormat) => {
  if (parsed.actions && Array.isArray(parsed.actions)) {
    // Multiple actions
    console.log(`🔄 Processing ${parsed.actions.length} actions`)
    parsed.actions.forEach((actionData: ActionData, index: number) => {
      executeAction(actionData, index)
    })
  } else if (parsed.action) {
    // Single action
    console.log('🔄 Processing single action')
    executeAction(parsed as ActionData, 0)
  }
}

// Execute a single action
const executeAction = (actionData: ActionData, index: number) => {
  const { action, widgetId, changes } = actionData
  console.log(`⚡ Action ${index}: ${action} on widget ${widgetId}`, changes)
  
  // Map property names for backward compatibility
  const mappedChanges = changes ? { ...changes } : {}
  if ('height' in mappedChanges) {
    mappedChanges.h = mappedChanges.height as number
    delete mappedChanges.height
  }
  if ('width' in mappedChanges) {
    mappedChanges.w = mappedChanges.width as number
    delete mappedChanges.width
  }
  
  console.log(`🔄 Mapped changes:`, mappedChanges)
  
  switch (action) {
    case 'update':
    case 'move':
    case 'resize':
      if (widgetId && mappedChanges) {
        widgetActions.editWidget(widgetId, mappedChanges)
        console.log(`✅ Applied ${action} to widget ${widgetId}:`, mappedChanges)
      } else {
        console.error(`❌ Missing widgetId or changes for ${action}:`, actionData)
      }
      break
      
    case 'delete':
      if (widgetId) {
        widgetActions.removeWidget(widgetId)
        console.log(`✅ Deleted widget ${widgetId}`)
      } else {
        console.error('❌ Missing widgetId for delete:', actionData)
      }
      break
      
    case 'add':
      if (mappedChanges) {
        // Transform to DroppedWidget format
        const newWidget: DroppedWidget = {
          id: mappedChanges.id || mappedChanges.i || `widget-${Date.now()}`,
          i: mappedChanges.i || `widget-${Date.now()}`,
          name: mappedChanges.name || 'New Widget',
          type: mappedChanges.type || 'chart',
          icon: mappedChanges.icon || '📊',
          description: mappedChanges.description || '',
          defaultWidth: mappedChanges.w || 2,
          defaultHeight: mappedChanges.h || 2,
          x: mappedChanges.x || 0,
          y: mappedChanges.y || 0,
          w: mappedChanges.w || 2,
          h: mappedChanges.h || 2,
          color: mappedChanges.color || '#3B82F6'
        }
        widgetActions.addWidget(newWidget)
        console.log('✅ Added new widget:', newWidget)
      } else {
        console.error('❌ Missing widget data for add:', actionData)
      }
      break
      
    default:
      console.warn(`⚠️ Unknown action type: ${action}`)
  }
}

// Handle legacy format (complete widgets array)
const handleLegacyFormat = (parsed: LegacyFormat) => {
  console.log(`📊 Found ${parsed.widgets.length} widgets in JSON`)
  
  // Transform JSON widgets to DroppedWidget format
  const newWidgets: DroppedWidget[] = parsed.widgets.map((widget: JsonWidget, index: number) => {
    const transformedWidget = {
      id: widget.id || widget.i,
      i: widget.i || `widget-${Date.now()}-${index}`,
      name: widget.name || 'Unnamed Widget',
      type: widget.type || 'chart',
      icon: widget.icon || '📊',
      description: widget.description || '',
      defaultWidth: widget.size?.w || 2,
      defaultHeight: widget.size?.h || 2,
      x: widget.position?.x || 0,
      y: widget.position?.y || 0,
      w: widget.size?.w || 2,
      h: widget.size?.h || 2,
      color: widget.style?.color || '#3B82F6'
    }
    console.log(`🔄 Transformed widget ${index}:`, transformedWidget)
    return transformedWidget
  })
  
  // Apply changes to canvas
  console.log(`🚀 Applying ${newWidgets.length} widgets to canvas...`)
  widgetActions.setWidgets(newWidgets)
  console.log('✅ JSON automatically applied to canvas:', newWidgets.length, 'widgets')
}

export default function ChatPanel({ droppedWidgets, onEditWidget }: ChatPanelProps) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/appschat',
      body: { widgets: droppedWidgets, onEditWidget }
    }),
    onFinish: ({ message }) => {
      console.log('✅ Mensagem finalizada:', message)
      console.log('🤖 IA Response COMPLETA:', message)
      
      // Parse JSON immediately when message is finished
      message.parts?.forEach((part, index) => {
        if (part.type === 'text') {
          console.log(`📝 Part ${index} - Full text:`, part.text)
          console.log(`🔍 Checking for <json> tags in:`, part.text)
          parseAndApplyJson(part.text)
        }
      })
    },
    onError: (error) => {
      console.error('❌ Erro no chat:', error)
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
  })

  const [input, setInput] = useState('')
  
  console.log('🔍 Chat state:', { messagesCount: messages.length, status })
  console.log('📦 Widgets enviados para API:', droppedWidgets)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      console.log('🚀 Enviando mensagem:', input)
      console.log('📡 Status atual:', status)
      console.log('📡 Widgets count sendo enviados:', droppedWidgets.length)
      console.log('📡 onEditWidget callback disponível:', typeof onEditWidget === 'function')
      
      try {
        sendMessage({ text: input })
        setInput('')
        console.log('✅ Mensagem enviada com sucesso')
      } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error)
      }
    } else {
      console.warn('⚠️ Tentativa de enviar mensagem vazia')
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Custom Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
            transition: background-color 0.2s ease;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:active {
            background: #64748b;
          }
          /* For Firefox */
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 #f1f5f9;
          }
        `
      }} />
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
        <p className="text-sm text-gray-600 mt-1">
          Ask questions about your data and widgets
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 text-sm ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div>
                {message.parts?.map((part, index) => {
                  if (part.type === 'text') {
                    const cleanText = removeJsonTags(part.text)
                    return <span key={index}>{cleanText}</span>
                  }
                  
                  if (part.type === 'tool-getCanvasWidgets') {
                    const widgetTool = part as {
                      state: string
                      output: {
                        widgets: Array<{
                          id: string
                          widgetId: string
                          name: string
                          type: string
                          position: { x: number; y: number }
                          size: { width: number; height: number }
                          description: string
                          icon: string
                        }>
                        totalWidgets: number
                        summary: string
                        success: boolean
                      }
                    }
                    if (widgetTool.state === 'output-available') {
                      return (
                        <CanvasWidgets
                          key={index}
                          widgets={widgetTool.output.widgets}
                          totalWidgets={widgetTool.output.totalWidgets}
                          summary={widgetTool.output.summary}
                          success={widgetTool.output.success}
                        />
                      )
                    }
                    if (widgetTool.state === 'input-available') {
                      return (
                        <div key={index} className="mt-2 p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
                          🔍 Checking canvas widgets...
                        </div>
                      )
                    }
                  }
                  
                  return null
                })}
              </div>
            </div>
          </div>
        ))}
        
        {status !== 'ready' && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={status !== 'ready'}
          />
          <button
            type="submit"
            disabled={!input.trim() || status !== 'ready'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}