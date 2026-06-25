import { ArtifactToolError } from '@/products/artifacts/dashboard/persistence/dashboardArtifactsService'
import {
  getCognitoChatGptAppMetadata,
  COGNITO_CHATGPT_APP_VERSION,
} from '@/products/chatgpt-app/server/appMetadata'
import {
  listCognitoChatGptAppResources,
  readCognitoChatGptAppResource,
} from '@/products/chatgpt-app/server/appResources'
import {
  callCognitoChatGptAppTool,
  listCognitoChatGptAppTools,
} from '@/products/chatgpt-app/server/appTools'
import { COGNITO_MCP_PROTOCOL_VERSION, type CognitoMcpServerContext } from '@/products/mcp/server/cognitoMcpServer'
import { McpDashboardToolInputError } from '@/products/mcp/tools/dashboardTools'

type JsonRpcId = string | number | null

type JsonRpcRequest = {
  jsonrpc?: string
  id?: JsonRpcId
  method?: string
  params?: unknown
}

type JsonRecord = Record<string, unknown>

const JSON_RPC_VERSION = '2.0'

const JSON_RPC_ERRORS = {
  parseError: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
  internalError: -32603,
} as const

export const COGNITO_CHATGPT_APP_SERVER_INFO = {
  name: 'cognito-chatgpt-app',
  version: COGNITO_CHATGPT_APP_VERSION,
} as const

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonRecord
}

function asJsonRpcRequest(value: unknown): JsonRpcRequest {
  return asRecord(value) as JsonRpcRequest
}

function isNotification(message: JsonRpcRequest) {
  return message.id === undefined
}

function jsonRpcResult(id: JsonRpcId, result: unknown) {
  return {
    jsonrpc: JSON_RPC_VERSION,
    id,
    result,
  }
}

function jsonRpcError(id: JsonRpcId, code: number, message: string, data?: unknown) {
  return {
    jsonrpc: JSON_RPC_VERSION,
    id,
    error: {
      code,
      message,
      ...(data === undefined ? {} : { data }),
    },
  }
}

function errorFromCaught(id: JsonRpcId, error: unknown) {
  if (error instanceof ArtifactToolError) {
    return jsonRpcError(id, JSON_RPC_ERRORS.invalidParams, error.message, {
      code: error.code,
      status: error.status,
      details: error.details,
    })
  }

  if (error instanceof McpDashboardToolInputError) {
    return jsonRpcError(id, JSON_RPC_ERRORS.invalidParams, error.message, {
      code: error.code,
      status: error.status,
      details: error.details,
    })
  }

  const message = error instanceof Error ? error.message : 'Erro interno no servidor ChatGPT App'
  return jsonRpcError(id, JSON_RPC_ERRORS.internalError, message)
}

export function getCognitoChatGptAppInitializeResult(requestedProtocolVersion?: string) {
  const metadata = getCognitoChatGptAppMetadata()

  return {
    protocolVersion: requestedProtocolVersion || COGNITO_MCP_PROTOCOL_VERSION,
    capabilities: {
      tools: {
        listChanged: false,
      },
      resources: {
        listChanged: false,
      },
    },
    serverInfo: COGNITO_CHATGPT_APP_SERVER_INFO,
    instructions: metadata.instructions,
    _meta: {
      app: metadata,
    },
  }
}

async function handleJsonRpcMessage(
  message: JsonRpcRequest,
  context: CognitoMcpServerContext,
) {
  const id = message.id ?? null

  if (message.jsonrpc !== JSON_RPC_VERSION || typeof message.method !== 'string') {
    return isNotification(message)
      ? null
      : jsonRpcError(id, JSON_RPC_ERRORS.invalidRequest, 'Requisicao JSON-RPC invalida')
  }

  if (isNotification(message)) {
    return null
  }

  try {
    const params = asRecord(message.params)

    switch (message.method) {
      case 'initialize':
        return jsonRpcResult(
          id,
          getCognitoChatGptAppInitializeResult(
            typeof params.protocolVersion === 'string' ? params.protocolVersion : undefined,
          ),
        )

      case 'ping':
        return jsonRpcResult(id, {})

      case 'tools/list':
        return jsonRpcResult(id, listCognitoChatGptAppTools())

      case 'tools/call': {
        const name = typeof params.name === 'string' ? params.name : ''
        if (!name) {
          return jsonRpcError(id, JSON_RPC_ERRORS.invalidParams, 'params.name e obrigatorio')
        }

        return jsonRpcResult(
          id,
          await callCognitoChatGptAppTool(name, params.arguments, context),
        )
      }

      case 'resources/list':
        return jsonRpcResult(id, listCognitoChatGptAppResources())

      case 'resources/read': {
        const uri = typeof params.uri === 'string' ? params.uri : ''
        if (!uri) {
          return jsonRpcError(id, JSON_RPC_ERRORS.invalidParams, 'params.uri e obrigatorio')
        }

        const resource = readCognitoChatGptAppResource(uri)
        if (!resource) {
          return jsonRpcError(id, JSON_RPC_ERRORS.invalidParams, `Resource nao encontrado: ${uri}`)
        }

        return jsonRpcResult(id, resource)
      }

      default:
        return jsonRpcError(id, JSON_RPC_ERRORS.methodNotFound, `Metodo ChatGPT App MCP nao suportado: ${message.method}`)
    }
  } catch (error) {
    return errorFromCaught(id, error)
  }
}

async function readJsonRpcPayload(req: Request) {
  try {
    return await req.json()
  } catch {
    return null
  }
}

export async function handleChatGptAppMcpHttpRequest(
  req: Request,
  context: CognitoMcpServerContext = {},
) {
  const payload = await readJsonRpcPayload(req)
  if (!payload) {
    return Response.json(
      jsonRpcError(null, JSON_RPC_ERRORS.parseError, 'JSON invalido'),
      { status: 400 },
    )
  }

  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return Response.json(
        jsonRpcError(null, JSON_RPC_ERRORS.invalidRequest, 'Batch JSON-RPC vazio'),
        { status: 400 },
      )
    }

    const responses = (
      await Promise.all(payload.map((message) => handleJsonRpcMessage(asJsonRpcRequest(message), context)))
    ).filter(Boolean)

    if (responses.length === 0) return new Response(null, { status: 202 })
    return Response.json(responses)
  }

  const response = await handleJsonRpcMessage(asJsonRpcRequest(payload), context)
  if (!response) return new Response(null, { status: 202 })
  return Response.json(response)
}

