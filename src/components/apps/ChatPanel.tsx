'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, FormEvent } from 'react'
import type { DroppedWidget } from '@/types/widget'
import CanvasWidgets from '../tools/appsChat/CanvasWidgets'

interface ChatPanelProps {
  droppedWidgets: DroppedWidget[]
}

export default function ChatPanel({ droppedWidgets }: ChatPanelProps) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/appschat',
      body: { widgets: droppedWidgets }
    }),
    onFinish: ({ message }) => {
      console.log('✅ Mensagem finalizada:', message)
    },
    onError: (error) => {
      console.error('❌ Erro no chat:', error)
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
      sendMessage({ text: input })
      setInput('')
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
        <p className="text-sm text-gray-600 mt-1">
          Ask questions about your data and widgets
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
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
                    return <span key={index}>{part.text}</span>
                  }
                  
                  if (part.type === 'tool-getCanvasWidgets') {
                    const widgetTool = part as {
                      state: string
                      output: {
                        widgets: Array<{
                          id: string
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
      <div className="p-4 border-t border-gray-200">
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