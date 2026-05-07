import { ArtifactToolError } from '@/products/artifacts/backend/dashboardArtifactsService'
import {
  callCognitoMcpTool,
  getCognitoMcpInitializeResult,
  listCognitoMcpTools,
  type CognitoMcpServerContext,
} from '@/products/mcp/server/cognitoMcpServer'
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

  const message = error instanceof Error ? error.message : 'Erro interno no servidor MCP'
  return jsonRpcError(id, JSON_RPC_ERRORS.internalError, message)
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
          getCognitoMcpInitializeResult(
            typeof params.protocolVersion === 'string' ? params.protocolVersion : undefined,
          ),
        )

      case 'ping':
        return jsonRpcResult(id, {})

      case 'tools/list':
        return jsonRpcResult(id, listCognitoMcpTools())

      case 'tools/call': {
        const name = typeof params.name === 'string' ? params.name : ''
        if (!name) {
          return jsonRpcError(id, JSON_RPC_ERRORS.invalidParams, 'params.name e obrigatorio')
        }

        return jsonRpcResult(
          id,
          await callCognitoMcpTool(name, params.arguments, context),
        )
      }

      default:
        return jsonRpcError(id, JSON_RPC_ERRORS.methodNotFound, `Metodo MCP nao suportado: ${message.method}`)
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

export async function handleMcpHttpRequest(req: Request, context: CognitoMcpServerContext = {}) {
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
