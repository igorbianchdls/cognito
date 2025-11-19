import { tool } from 'ai';
import { z } from 'zod';
import { updateDashboardByIdQuery } from './queries';

const VisibilityEnum = z.enum(['private', 'org', 'public']);

export const updateDashboard = tool({
  description: 'Atualiza campos de um dashboard (title, description, sourcecode, visibility, version).',
  inputSchema: z.object({
    id: z.string().min(1),
    title: z.string().optional(),
    description: z.string().nullable().optional(),
    sourcecode: z.string().optional(),
    visibility: VisibilityEnum.optional(),
    version: z.number().int().positive().optional(),
  }),
  execute: async ({ id, title, description, sourcecode, visibility, version }) => {
    try {
      const item = await updateDashboardByIdQuery(id, { title, description: description ?? undefined, sourcecode, visibility, version });
      if (!item) {
        return { success: false as const, error: 'Falha ao atualizar' };
      }
      return { success: true as const, item };
    } catch (e) {
      return { success: false as const, error: (e as Error).message || 'Erro ao atualizar' };
    }
  }
});

