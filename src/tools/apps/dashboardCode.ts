import { tool } from 'ai';
import { z } from 'zod';

export const getDashboardCode = tool({
  description: 'Obtém informações do dashboard builder atual',
  inputSchema: z.object({}),
  execute: async () => {
    return {
      success: true,
      summary: 'Dashboard analysis ready'
    };
  }
});