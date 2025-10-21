'use client'

import { useState, FormEvent } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Bot, User } from 'lucide-react'

interface ChatInterfaceProps {
  agentType: string
  containerId: string
}

const AGENT_CONFIGS = {
  geral: {
    name: 'Assistente Geral',
    systemPrompt: 'Você é um assistente geral prestativo e amigável.',
    color: '#3B82F6'
  },
  analista: {
    name: 'Analista de Dados',
    systemPrompt: 'Você é um analista de dados especializado em insights e métricas de negócio.',
    color: '#10B981'
  },
  criativo: {
    name: 'Assistente Criativo',
    systemPrompt: 'Você é um assistente criativo especializado em design, conteúdo e ideias inovadoras.',
    color: '#F59E0B'
  },
  tecnico: {
    name: 'Especialista Técnico',
    systemPrompt: 'Você é um especialista técnico em programação, desenvolvimento e arquitetura de sistemas.',
    color: '#8B5CF6'
  },
  marketing: {
    name: 'Especialista em Marketing',
    systemPrompt: 'Você é um especialista em marketing digital, estratégias e campanhas.',
    color: '#EF4444'
  }
}

export default function ChatInterface({ agentType, containerId }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const config = AGENT_CONFIGS[agentType as keyof typeof AGENT_CONFIGS] || AGENT_CONFIGS.geral

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { 
        systemPrompt: config.systemPrompt,
        agentType,
        containerId
      }
    }),
    onError: (error) => {
      console.error('Chat error:', error)
    }
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (input.trim() && status === 'ready') {
      sendMessage({ text: input })
      setInput('')
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-center">
            <div className="space-y-2">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: config.color + '20' }}
              >
                <Bot className="w-6 h-6" style={{ color: config.color }} />
              </div>
              <p className="text-sm text-gray-600">
                Olá! Sou o <span className="font-medium">{config.name}</span>
              </p>
              <p className="text-xs text-gray-500">Como posso ajudar você hoje?</p>
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex items-start gap-2 max-w-[80%]">
              {message.role === 'assistant' && (
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                  style={{ backgroundColor: config.color + '20' }}
                >
                  <Bot className="w-3 h-3" style={{ color: config.color }} />
                </div>
              )}
              
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.parts?.map((part, index) => {
                  if (part.type === 'text') {
                    return <span key={index}>{part.text}</span>
                  }
                  return null
                })}
              </div>
              
              {message.role === 'user' && (
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>
        ))}

        {status !== 'ready' && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: config.color + '20' }}
              >
                <Bot className="w-3 h-3" style={{ color: config.color }} />
              </div>
              <div className="bg-gray-100 rounded-lg px-3 py-2">
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-gray-50 p-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 min-h-[36px] max-h-20 resize-none text-sm"
            rows={1}
            disabled={status !== 'ready'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || status !== 'ready'}
            className="h-9 px-3"
            style={{ backgroundColor: config.color }}
          >
            <Send className="h-3 w-3" />
          </Button>
        </form>
      </div>
    </div>
  )
}