import type { ErpCapability } from '@/products/erp/shared/professionalContracts'
import type { z } from 'zod4'

export type AiToolRisk = 'read' | 'write-low' | 'write-medium' | 'write-critical'
export type AiExecutionSource = 'cli' | 'mcp' | 'web' | 'automation'

export type AiPrincipal = {
  tenantId: number
  tenantName: string
  tenantSlug: string | null
  userId: number
  clerkUserId: string
  clerkOrganizationId: string
  role: string
  capabilities: ErpCapability[]
  scopes: string[]
  clientId: string
  connectionId: number | null
  writeEnabled: boolean
}

export type AiToolExecutionContext = {
  principal: AiPrincipal
  source: AiExecutionSource
  correlationId: string
}

export type AiToolAnnotations = {
  readOnlyHint: boolean
  destructiveHint: boolean
  idempotentHint: boolean
  openWorldHint: boolean
}

export type AiToolDefinition<TInput extends Record<string, unknown> = Record<string, unknown>> = {
  name: string
  version: string
  title: string
  description: string
  capability: ErpCapability
  risk: AiToolRisk
  inputSchema: z.ZodType<TInput>
  outputSchema?: z.ZodType
  annotations: AiToolAnnotations
  execute: (context: AiToolExecutionContext, input: TInput) => Promise<unknown>
}

export function defineAiTool<TInput extends Record<string, unknown>>(
  definition: AiToolDefinition<TInput>,
): AiToolDefinition<TInput> {
  return definition
}
