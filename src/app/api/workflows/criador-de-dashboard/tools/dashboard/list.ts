import { tool } from 'ai';
import { z } from 'zod';
import { runQuery } from '@/lib/postgres';

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
    const params: unknown[] = [];
    const where: string[] = ['tenant_id = 1'];
    if (visibility) {
      params.push(visibility);
      where.push(`visibility = $${params.length}`);
    }
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      const idx = params.length;
      where.push(`(title ILIKE $${idx} OR COALESCE(description,'') ILIKE $${idx})`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // Items query
    const itemsSql = `
      SELECT id, title, description, visibility, version, created_at, updated_at
      FROM apps.dashboards
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const items = await runQuery<{
      id: string; title: string; description: string | null; visibility: string; version: number; created_at: string; updated_at: string
    }>(itemsSql, [...params, limit ?? 20, offset ?? 0]);

    // Count query
    const countSql = `SELECT COUNT(*)::int AS count FROM apps.dashboards ${whereSql}`;
    const countRows = await runQuery<{ count: number }>(countSql, params);
    const count = countRows?.[0]?.count ?? items.length;

    return { success: true as const, items, count };
  }
});

