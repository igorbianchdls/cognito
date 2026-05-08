import { useEffect, useState } from 'react'
import type { ChatGptToolResult } from '@/products/chatgpt-app/web/src/types/toolResult'

type JsonRpcMessage = {
  jsonrpc?: string
  id?: string | number
  method?: string
  params?: unknown
  result?: unknown
  error?: unknown
}

type ToolCallResult = {
  content?: unknown[]
  structuredContent?: unknown
  isError?: boolean
}

let rpcId = 0

function isJsonRpcMessage(value: unknown): value is JsonRpcMessage {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

export function useChatGptToolResult() {
  const [toolInput, setToolInput] = useState<unknown>(null)
  const [toolResult, setToolResult] = useState<ChatGptToolResult | null>(null)

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== window.parent) return
      const message = event.data
      if (!isJsonRpcMessage(message) || message.jsonrpc !== '2.0') return

      if (message.method === 'ui/notifications/tool-input') {
        setToolInput(message.params ?? null)
      }

      if (message.method === 'ui/notifications/tool-result') {
        setToolResult((message.params ?? null) as ChatGptToolResult | null)
      }
    }

    window.addEventListener('message', onMessage, { passive: true })
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return {
    toolInput,
    toolResult,
    structuredContent: toolResult?.structuredContent ?? null,
    isError: Boolean(toolResult?.isError),
  }
}

export function callChatGptTool(name: string, args: Record<string, unknown> = {}) {
  const id = `cognito-widget-${++rpcId}`

  window.parent.postMessage(
    {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    },
    '*',
  )
}

export function sendChatGptMessage(text: string) {
  window.parent.postMessage(
    {
      jsonrpc: '2.0',
      method: 'ui/message',
      params: {
        role: 'user',
        content: [{ type: 'text', text }],
      },
    },
    '*',
  )
}

export function updateModelContext(text: string) {
  const id = `cognito-context-${++rpcId}`

  window.parent.postMessage(
    {
      jsonrpc: '2.0',
      id,
      method: 'ui/update-model-context',
      params: {
        content: [{ type: 'text', text }],
      },
    },
    '*',
  )
}

export type { ToolCallResult }

