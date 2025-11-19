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

async function updateDashboardByIdQuery(id: string, payload: { title?: string; description?: string | null; sourcecode?: string; visibility?: Visibility; version?: number }) {
  const fields: Record<string, unknown> = {};
  (['title', 'description', 'sourcecode', 'visibility', 'version'] as const).forEach((k) => { if (payload[k] !== undefined) fields[k] = payload[k] as unknown; });
  if (Object.keys(fields).length === 0) throw new Error('Nada para atualizar');
  const setParts: string[] = []; const params: unknown[] = []; let idx = 1;
  if (fields.title !== undefined) { setParts.push(`title = $${idx++}`); params.push(fields.title); }
  if (fields.description !== undefined) { setParts.push(`description = $${idx++}`); params.push(fields.description ?? null); }
  if (fields.sourcecode !== undefined) { setParts.push(`sourcecode = $${idx++}`); params.push(fields.sourcecode); }
  if (fields.visibility !== undefined) { setParts.push(`visibility = $${idx++}`); params.push(fields.visibility); }
  if (fields.version !== undefined) { setParts.push(`version = $${idx++}`); params.push(Number(fields.version)); }
  setParts.push('updated_at = NOW()'); params.push(id);
  const sql = `
    UPDATE apps.dashboards SET ${setParts.join(', ')}
    WHERE id = $${idx} AND tenant_id = 1
    RETURNING id, title, description, sourcecode, visibility, version, created_at, updated_at
  `;
  const rows = await runQuery<{
    id: string; title: string; description: string | null; sourcecode: string; visibility: string; version: number; created_at: string; updated_at: string
  }>(sql, params);
  return rows?.[0] || null;
}

// Tools (single file)
const VisibilityEnum = z.enum(['private', 'org', 'public']);

// Create (insert) — returns created row
async function createDashboardQuery(payload: {
  title: string;
  description: string | null;
  sourcecode: string;
  visibility: Visibility;
  version: number;
}) {
  const rows = await runQuery<{
    id: string; title: string; description: string | null; sourcecode: string; visibility: string; version: number; created_at: string; updated_at: string
  }>(
    `INSERT INTO apps.dashboards (tenant_id, title, description, sourcecode, visibility, version)
     VALUES (1, $1, $2, $3, $4, $5)
     RETURNING id, title, description, sourcecode, visibility, version, created_at, updated_at`,
    [payload.title, payload.description, payload.sourcecode, payload.visibility, Number(payload.version)]
  );
  return rows?.[0] || null;
}

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
      if (!item) return { success: false as const, error: 'Falha ao atualizar' };
      return { success: true as const, item };
    } catch (e) {
      return { success: false as const, error: (e as Error).message || 'Erro ao atualizar' };
    }
  }
});

export const createDashboard = tool({
  description: 'Cria um novo dashboard (title, sourcecode, description?, visibility?, version?).',
  inputSchema: z.object({
    title: z.string().trim().min(1, 'title é obrigatório'),
    sourcecode: z.string().min(1, 'sourcecode é obrigatório'),
    description: z.string().nullable().optional(),
    visibility: VisibilityEnum.default('private').optional(),
    version: z.number().int().positive().default(1).optional(),
  }),
  execute: async ({ title, sourcecode, description, visibility = 'private', version = 1 }) => {
    try {
      // Sanitização básica
      const desc = (description === '' ? null : description ?? null);
      const code = sourcecode;
      // Limite de tamanho (1MB)
      if (code && code.length > 1_000_000) {
        return { success: false as const, error: 'sourcecode excede o limite de 1MB' };
      }
      const item = await createDashboardQuery({ title, sourcecode: code, description: desc, visibility, version });
      if (!item) return { success: false as const, error: 'Falha ao criar dashboard' };
      return { success: true as const, item };
    } catch (e) {
      return { success: false as const, error: (e as Error).message || 'Erro ao criar dashboard' };
    }
  }
});
