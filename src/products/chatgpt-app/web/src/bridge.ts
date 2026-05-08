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

declare global {
  interface Window {
    openai?: {
      toolInput?: unknown
      toolOutput?: unknown
      callTool?: (name: string, args?: Record<string, unknown>) => Promise<ToolCallResult>
    }
  }
}

let rpcId = 0

function isJsonRpcMessage(value: unknown): value is JsonRpcMessage {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

export function useChatGptToolResult() {
  const [toolInput, setToolInput] = useState<unknown>(() => window.openai?.toolInput ?? null)
  const [toolResult, setToolResult] = useState<ChatGptToolResult | null>(() => {
    const toolOutput = window.openai?.toolOutput
    return toolOutput ? { structuredContent: toolOutput } : null
  })

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

    function onOpenAiGlobals(event: Event) {
      const customEvent = event as CustomEvent<{ globals?: { toolInput?: unknown; toolOutput?: unknown } }>
      const globals = customEvent.detail?.globals
      if (globals?.toolInput !== undefined) setToolInput(globals.toolInput)
      if (globals?.toolOutput !== undefined) {
        setToolResult({ structuredContent: globals.toolOutput })
      }
    }

    window.addEventListener('message', onMessage, { passive: true })
    window.addEventListener('openai:set_globals', onOpenAiGlobals, { passive: true })
    return () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('openai:set_globals', onOpenAiGlobals)
    }
  }, [])

  return {
    toolInput,
    toolResult,
    structuredContent: toolResult?.structuredContent ?? null,
    isError: Boolean(toolResult?.isError),
  }
}

export function callChatGptTool(name: string, args: Record<string, unknown> = {}) {
  if (window.openai?.callTool) {
    return window.openai.callTool(name, args)
  }

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

  return Promise.resolve(null)
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
