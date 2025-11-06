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

// === Simple demo tools for Agent Builder ===

export const getWeather = tool({
  description: 'AgentBuilder: retorna clima sintético para uma localização',
  inputSchema: z.object({
    location: z.string().min(1).describe('Cidade ou local para consultar clima'),
  }),
  execute: async ({ location }) => {
    // Temperatura sintética baseada em hash simples do nome
    let hash = 0
    for (let i = 0; i < location.length; i++) hash = (hash * 31 + location.charCodeAt(i)) | 0
    const base = Math.abs(hash % 35) // 0..34
    const temperature = Math.round(base - 5) // -5..29

    return {
      success: true,
      message: `Weather for ${location}`,
      data: { location, temperature },
    }
  },
})

export const getTime = tool({
  description: 'AgentBuilder: retorna horário local de um timezone (ou UTC)',
  inputSchema: z.object({
    location: z.string().optional().describe('Rótulo amigável do local (opcional)'),
    timezone: z.string().optional().describe('Time zone IANA, ex: America/Sao_Paulo'),
  }),
  execute: async ({ location, timezone }) => {
    const tz = timezone && timezone.trim() ? timezone.trim() : 'UTC'
    const now = new Date()
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    })
    const parts = fmt.formatToParts(now)
    const get = (type: string) => parts.find(p => p.type === type)?.value || '00'
    const local = `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`

    return {
      success: true,
      message: `Local time for ${location || tz}`,
      data: { location: location || tz, timezone: tz, localTimeISO: local },
    }
  },
})
