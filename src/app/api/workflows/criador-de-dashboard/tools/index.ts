import { tool } from 'ai';
import { z } from 'zod';
import { runQuery } from '@/lib/postgres';

// Types
export type Visibility = 'private' | 'org' | 'public';

// Queries (single file)
async function listDashboardsQuery(params: { q?: string; visibility?: Visibility; limit?: number; offset?: number }) {
  const { q, visibility, limit = 20, offset = 0 } = params || {};
  const sqlParams: unknown[] = [];
  const where: string[] = ['tenant_id = 1'];
  if (visibility) { sqlParams.push(visibility); where.push(`visibility = $${sqlParams.length}`); }
  if (q && q.trim()) { sqlParams.push(`%${q.trim()}%`); const i = sqlParams.length; where.push(`(title ILIKE $${i} OR COALESCE(description,'') ILIKE $${i})`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const itemsSql = `
    SELECT id, title, description, visibility, version, created_at, updated_at
    FROM apps.dashboards
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT $${sqlParams.length + 1} OFFSET $${sqlParams.length + 2}
  `;
  const items = await runQuery<{
    id: string; title: string; description: string | null; visibility: string; version: number; created_at: string; updated_at: string
  }>(itemsSql, [...sqlParams, limit, offset]);

  const countSql = `SELECT COUNT(*)::int AS count FROM apps.dashboards ${whereSql}`;
  const countRows = await runQuery<{ count: number }>(countSql, sqlParams);
  const count = countRows?.[0]?.count ?? items.length;
  return { items, count };
}

async function getDashboardByIdQuery(id: string) {
  const rows = await runQuery<{
    id: string; title: string; description: string | null; sourcecode: string; visibility: string; version: number; created_at: string; updated_at: string
  }>(
    `SELECT id, title, description, sourcecode, visibility, version, created_at, updated_at
     FROM apps.dashboards
     WHERE id = $1 AND tenant_id = 1
     LIMIT 1`,
    [id]
  );
  return rows?.[0] || null;
}

// (atualização de dashboard removida)

// Tools (single file)
const VisibilityEnum = z.enum(['private', 'org', 'public']);

// (criação de dashboard removida)

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

export const getDashboard = tool({
  description: 'Obtém um dashboard pelo ID, incluindo title/description/sourcecode/visibility/version.',
  inputSchema: z.object({ id: z.string().min(1, 'id é obrigatório') }),
  execute: async ({ id }) => {
    const item = await getDashboardByIdQuery(id);
    if (!item) return { success: false as const, error: 'Dashboard não encontrado' };
    return { success: true as const, item };
  }
});

// Tool: artifact — create/update artifact preview (sem persistência)
const ArtifactCreateSchema = z.object({
  command: z.literal('create'),
  id: z.string().min(1, 'id é obrigatório'),
  title: z.string().min(1, 'title é obrigatório'),
  type: z.string().min(1, 'type é obrigatório'),
  content: z.string().min(1, 'content é obrigatório'),
}).strict();

const ArtifactUpdateSchema = z.object({
  command: z.literal('update'),
  id: z.string().min(1, 'id é obrigatório'),
  old_str: z.string().min(1, 'old_str é obrigatório'),
  new_str: z.string().min(1, 'new_str é obrigatório'),
}).strict();

const ArtifactInputSchema = z.discriminatedUnion('command', [ArtifactCreateSchema, ArtifactUpdateSchema]);

export const artifact = tool({
  description: 'Gerencia artifacts em modo preview. create: id/title/type/content. update: id/old_str/new_str (sem alterar conteúdo).',
  inputSchema: ArtifactInputSchema,
  execute: async (input) => {
    if (input.command === 'create') {
      const { id, title, type, content } = input;
      return {
        success: true as const,
        command: 'create' as const,
        artifact: { id, title, type, content },
      };
    }
    // update
    const { id, old_str, new_str } = input;
    return {
      success: true as const,
      command: 'update' as const,
      artifact: { id },
      change: { old_str, new_str },
    };
  },
});

// (tool updateDashboard removida)

// (tool createDashboard removida)

// (tool apply_patch removida)
