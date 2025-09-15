import { tool } from 'ai';
import { z } from 'zod';

export const gerarGrafico = tool({
  description: 'Gera gráfico visual (versão básica)',
  inputSchema: z.object({
    tipo: z.enum(['bar', 'line', 'pie']).describe('Tipo do gráfico'),
    x: z.string().describe('Coluna X'),
    y: z.string().describe('Coluna Y')
  }),
  execute: async ({ tipo, x, y }) => {
    // APENAS MOCK - sem SQL, sem BigQuery, sem generative UI
    return {
      success: true,
      message: `✅ Gráfico ${tipo} criado: ${y} por ${x}`
    }
  }
});