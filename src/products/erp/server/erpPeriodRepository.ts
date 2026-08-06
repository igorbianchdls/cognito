import { runQuery, withTransaction, type SQLClient } from "@/lib/postgres";
import { ErpDomainError } from "@/products/erp/server/erpApi";

type PeriodModule = "financeiro" | "estoque" | "vendas" | "compras" | "todos";

export async function assertErpPeriodOpen(
  client: Pick<SQLClient, "query">,
  input: {
    tenantId: number;
    module: Exclude<PeriodModule, "todos">;
    date: string;
  },
) {
  const result = await client.query(
    `SELECT id FROM erp.fechamentos_periodos
     WHERE tenant_id = $1 AND modulo IN ($2, 'todos') AND reaberto_em IS NULL
       AND $3::date BETWEEN periodo_inicio AND periodo_fim LIMIT 1`,
    [input.tenantId, input.module, input.date],
  );
  if (result.rows[0])
    throw new ErpDomainError(
      "PERIOD_CLOSED",
      `O periodo esta fechado para o modulo ${input.module}.`,
      409,
    );
}

export async function listErpPeriodClosures(tenantId: number) {
  return runQuery<Record<string, unknown>>(
    `SELECT id::text, modulo, periodo_inicio, periodo_fim, motivo, fechado_em, reaberto_em
     FROM erp.fechamentos_periodos WHERE tenant_id = $1 ORDER BY periodo_fim DESC, id DESC LIMIT 200`,
    [tenantId],
  );
}

export async function closeErpPeriod(input: {
  tenantId: number;
  actorId: number;
  modulo: PeriodModule;
  periodo_inicio: string;
  periodo_fim: string;
  motivo?: string | null;
}) {
  return withTransaction(async (client) => {
    await client.query(
      `SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`,
      [`erp:fechamento:${input.tenantId}:${input.modulo}`],
    );
    const overlap = await client.query(
      `SELECT id FROM erp.fechamentos_periodos
       WHERE tenant_id = $1 AND (modulo = 'todos' OR $2 = 'todos' OR modulo = $2)
       AND reaberto_em IS NULL AND daterange(periodo_inicio, periodo_fim, '[]') && daterange($3::date, $4::date, '[]') LIMIT 1`,
      [input.tenantId, input.modulo, input.periodo_inicio, input.periodo_fim],
    );
    if (overlap.rows[0])
      throw new ErpDomainError(
        "PERIOD_OVERLAP",
        "Ja existe um fechamento ativo que alcanca esse periodo.",
        409,
      );
    const result = await client.query(
      `INSERT INTO erp.fechamentos_periodos
         (tenant_id, modulo, periodo_inicio, periodo_fim, motivo, criado_por)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id::text, modulo, periodo_inicio, periodo_fim, fechado_em`,
      [
        input.tenantId,
        input.modulo,
        input.periodo_inicio,
        input.periodo_fim,
        input.motivo || null,
        input.actorId,
      ],
    );
    return result.rows[0];
  });
}

export async function reopenErpPeriod(input: {
  tenantId: number;
  actorId: number;
  id: number;
}) {
  const result = await runQuery<Record<string, unknown>>(
    `UPDATE erp.fechamentos_periodos SET reaberto_em = now(), reaberto_por = $3
     WHERE tenant_id = $1 AND id = $2 AND reaberto_em IS NULL RETURNING id::text, modulo, reaberto_em`,
    [input.tenantId, input.id, input.actorId],
  );
  if (!result[0])
    throw new ErpDomainError(
      "PERIOD_CLOSURE_NOT_FOUND",
      "Fechamento ativo nao encontrado.",
      404,
    );
  return result[0];
}
