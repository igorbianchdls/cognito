import { z } from 'zod'
import { tool } from 'ai'

export const analiseTerritorio = tool({
  description: 'Analisa território',
  inputSchema: z.object({
    territorio: z.string().optional(),
  }),
  execute: async () => {
    return {
      success: true,
      message: 'OK',
      data: {
        summary: [],
        topVendedores: [],
        topProdutos: []
      }
    }
  },
})
