import { runQuery } from '@/lib/postgres';

export type Visibility = 'private' | 'org' | 'public';

export interface ListParams {
  q?: string;
  visibility?: Visibility;
  limit?: number;
  offset?: number;
}

export async function listDashboardsQuery({ q, visibility, limit = 20, offset = 0 }: ListParams) {
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

  const itemsSql = `
    SELECT id, title, description, visibility, version, created_at, updated_at
    FROM apps.dashboards
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  const items = await runQuery<{
    id: string; title: string; description: string | null; visibility: string; version: number; created_at: string; updated_at: string
  }>(itemsSql, [...params, limit, offset]);

  const countSql = `SELECT COUNT(*)::int AS count FROM apps.dashboards ${whereSql}`;
  const countRows = await runQuery<{ count: number }>(countSql, params);
  const count = countRows?.[0]?.count ?? items.length;

  return { items, count };
}

export async function getDashboardByIdQuery(id: string) {
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

export interface UpdatePayload {
  title?: string;
  description?: string | null;
  sourcecode?: string;
  visibility?: Visibility;
  version?: number;
}

export async function updateDashboardByIdQuery(id: string, payload: UpdatePayload) {
  const fields: Record<string, unknown> = {};
  (['title', 'description', 'sourcecode', 'visibility', 'version'] as const).forEach((k) => {
    if (payload[k] !== undefined) fields[k] = payload[k] as unknown;
  });
  if (Object.keys(fields).length === 0) {
    throw new Error('Nada para atualizar');
  }

  const setParts: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (fields.title !== undefined) { setParts.push(`title = $${idx++}`); params.push(fields.title); }
  if (fields.description !== undefined) { setParts.push(`description = $${idx++}`); params.push(fields.description ?? null); }
  if (fields.sourcecode !== undefined) { setParts.push(`sourcecode = $${idx++}`); params.push(fields.sourcecode); }
  if (fields.visibility !== undefined) { setParts.push(`visibility = $${idx++}`); params.push(fields.visibility); }
  if (fields.version !== undefined) { setParts.push(`version = $${idx++}`); params.push(Number(fields.version)); }
  setParts.push('updated_at = NOW()');
  params.push(id);

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

