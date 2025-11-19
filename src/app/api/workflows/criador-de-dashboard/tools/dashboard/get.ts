import { tool } from 'ai';
import { z } from 'zod';
import { getDashboardByIdQuery } from './queries';

export const getDashboard = tool({
  description: 'Obtém um dashboard pelo ID, incluindo title/description/sourcecode/visibility/version.',
  inputSchema: z.object({ id: z.string().min(1, 'id é obrigatório') }),
  execute: async ({ id }) => {
    const item = await getDashboardByIdQuery(id);
    if (!item) {
      return { success: false as const, error: 'Dashboard não encontrado' };
    }
    return { success: true as const, item };
  }
});

