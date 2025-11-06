import { tool } from 'ai'
import { z } from 'zod'

export const echoTool = tool({
  description: 'AgentBuilder: ecoa a mensagem e metadados',
  inputSchema: z.object({
    message: z.string().describe('Mensagem a ecoar'),
    meta: z.record(z.any()).optional().describe('Metadados opcionais')
  }),
  execute: async ({ message, meta }) => {
    const timestamp = new Date().toISOString()
    return {
      success: true,
      message,
      data: { meta: meta ?? null, timestamp }
    }
  }
})

export const sumTool = tool({
  description: 'AgentBuilder: soma números fornecidos',
  inputSchema: z.object({
    numbers: z.array(z.number()).describe('Lista de números para somar')
  }),
  execute: async ({ numbers }) => {
    const sum = numbers.reduce((acc, n) => acc + (Number.isFinite(n) ? n : 0), 0)
    return {
      success: true,
      message: `sum=${sum}`,
      data: { sum, count: numbers.length }
    }
  }
})

export const pickFieldsTool = tool({
  description: 'AgentBuilder: extrai campos específicos de um objeto',
  inputSchema: z.object({
    object: z.record(z.any()).describe('Objeto fonte'),
    fields: z.array(z.string()).describe('Campos a extrair')
  }),
  execute: async ({ object, fields }) => {
    const out: Record<string, unknown> = {}
    for (const f of fields) out[f] = Object.prototype.hasOwnProperty.call(object, f) ? object[f] : undefined
    return {
      success: true,
      message: `picked ${fields.length} field(s)`,
      data: out
    }
  }
})

