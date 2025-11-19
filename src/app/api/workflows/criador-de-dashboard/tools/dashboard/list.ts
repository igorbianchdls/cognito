import { tool } from 'ai';
import { z } from 'zod';
import { listDashboardsQuery } from './queries';

const VisibilityEnum = z.enum(['private', 'org', 'public']);

export const listDashboards = tool({
  description: 'Lista dashboards disponíveis com filtros opcionais (q, visibility) e paginação.',
  inputSchema: z.object({
    q: z.string().trim().min(1).optional().describe('Busca por título/descrição (ILIKE)'),
    visibility: VisibilityEnum.optional().describe('Filtrar por visibilidade'),
    limit: z.number().int().positive().max(100).default(20).describe('Limite de itens por página (máx 100)'),
    offset: z.number().int().nonnegative().default(0).describe('Deslocamento para paginação')
  }),
  execute: async ({ q, visibility, limit, offset }) => {
    const { items, count } = await listDashboardsQuery({ q, visibility, limit, offset });
    return { success: true as const, items, count };
  }
});
