import { useEffect, useState } from 'react'
import type { McpAppToolResult } from '@/products/mcp-apps/web/src/types/toolResult'

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
    CognitoMcpApp?: {
      callTool: (name: string, args?: Record<string, unknown>) => Promise<ToolCallResult | null>
      renderToolResult: (result: ToolCallResult | unknown) => void
    }
    CognitoChatGptApp?: Window['CognitoMcpApp']
  }
}

let rpcId = 0
const pendingRequests = new Map<string, {
  resolve: (value: ToolCallResult | null) => void
  reject: (reason?: unknown) => void
}>()

function isJsonRpcMessage(value: unknown): value is JsonRpcMessage {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

export function useMcpAppToolResult() {
  const [toolInput, setToolInput] = useState<unknown>(() => window.openai?.toolInput ?? null)
  const [toolResult, setToolResult] = useState<McpAppToolResult | null>(() => {
    const toolOutput = window.openai?.toolOutput
    return toolOutput ? { structuredContent: toolOutput } : null
  })

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== window.parent) return
      const message = event.data
      if (!isJsonRpcMessage(message) || message.jsonrpc !== '2.0') return

      if (message.id !== undefined) {
        const pending = pendingRequests.get(String(message.id))
        if (!pending) return
        pendingRequests.delete(String(message.id))
        if (message.error) {
          pending.reject(message.error)
          return
        }
        pending.resolve((message.result ?? null) as ToolCallResult | null)
        return
      }

      if (message.method === 'ui/notifications/tool-input') {
        setToolInput(message.params ?? null)
      }

      if (message.method === 'ui/notifications/tool-result') {
        setToolResult((message.params ?? null) as McpAppToolResult | null)
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
    initializeMcpAppsBridge()
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

function rpcNotify(method: string, params: Record<string, unknown> = {}) {
  window.parent.postMessage({ jsonrpc: '2.0', method, params }, '*')
}

function rpcRequest(method: string, params: Record<string, unknown> = {}) {
  const id = `cognito-widget-${++rpcId}`

  const promise = new Promise<ToolCallResult | null>((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject })
  })

  window.parent.postMessage({ jsonrpc: '2.0', id, method, params }, '*')
  return promise
}

async function initializeMcpAppsBridge() {
  try {
    await rpcRequest('ui/initialize', {
      appInfo: {
        name: 'cognito-widget',
        version: '0.2.0',
      },
      appCapabilities: {},
      protocolVersion: '2026-01-26',
    })
    rpcNotify('ui/notifications/initialized')
  } catch {
    // ChatGPT compatibility globals do not require the MCP Apps init handshake.
  }
}

export function callMcpAppTool(name: string, args: Record<string, unknown> = {}) {
  if (window.openai?.callTool) {
    return window.openai.callTool(name, args)
  }

  return rpcRequest('tools/call', { name, arguments: args })
}

export function installCognitoWidgetRuntime() {
  const runtime = {
    callTool: callMcpAppTool,
    renderToolResult(result: ToolCallResult | unknown) {
      const output = result && typeof result === 'object' && 'structuredContent' in result
        ? (result as ToolCallResult).structuredContent
        : result

      window.dispatchEvent(new CustomEvent('openai:set_globals', {
        detail: {
          globals: {
            toolOutput: output,
          },
        },
      }))
    },
  }

  window.CognitoMcpApp = runtime
  window.CognitoChatGptApp = window.CognitoMcpApp
}

export function sendMcpAppMessage(text: string) {
  rpcNotify('ui/message', {
    role: 'user',
    content: [{ type: 'text', text }],
  })
}

export function updateModelContext(text: string) {
  return rpcRequest('ui/update-model-context', {
    content: [{ type: 'text', text }],
  })
}

export type { ToolCallResult }
