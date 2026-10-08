import { runQuery, withTransaction, type SQLClient } from "@/lib/postgres";
import { ErpDomainError } from "@/products/erp/shared/erpErrors";

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
     WHERE empresa_id = $1 AND modulo IN ($2, 'todos') AND reaberto_em IS NULL
       AND $3::date BETWEEN periodo_inicio AND periodo_fim LIMIT 1`,
    [input.tenantId, input.module, input.date],
  );
  if (result.rows[0])
    throw new ErpDomainError(
      "PERIOD_CLOSED",
      `O período esta fechado para o módulo ${input.module}.`,
      409,
    );
}

export async function listErpPeriodClosures(tenantId: number) {
  return runQuery<Record<string, unknown>>(
    `SELECT id::text, modulo, periodo_inicio, periodo_fim, motivo, fechado_em, reaberto_em, motivo_reabertura
     FROM erp.fechamentos_periodos WHERE empresa_id = $1 ORDER BY periodo_fim DESC, id DESC LIMIT 200`,
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
       WHERE empresa_id = $1 AND (modulo = 'todos' OR $2 = 'todos' OR modulo = $2)
       AND reaberto_em IS NULL AND daterange(periodo_inicio, periodo_fim, '[]') && daterange($3::date, $4::date, '[]') LIMIT 1`,
      [input.tenantId, input.modulo, input.periodo_inicio, input.periodo_fim],
    );
    if (overlap.rows[0])
      throw new ErpDomainError(
        "PERIOD_OVERLAP",
        "Já existe um fechamento ativo que alcanca esse período.",
        409,
      );
    const result = await client.query(
      `INSERT INTO erp.fechamentos_periodos
         (empresa_id, modulo, periodo_inicio, periodo_fim, motivo, criado_por)
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
    // Aviso (não bloqueia): transações do extrato ainda não conciliadas no período fechado.
    const pending = input.modulo === 'financeiro' || input.modulo === 'todos'
      ? Number((await client.query(
        `SELECT count(*)::int AS n FROM erp.transacoes_bancarias
         WHERE empresa_id = $1 AND status = 'pendente' AND excluido_em IS NULL AND data_transacao BETWEEN $2::date AND $3::date`,
        [input.tenantId, input.periodo_inicio, input.periodo_fim])).rows[0].n)
      : 0;
    return { ...result.rows[0], ...(pending ? { aviso: `${pending} transação(ões) do extrato bancário deste período ainda não foram conciliadas.`, transacoes_pendentes: pending } : {}) };
  });
}

export async function reopenErpPeriod(input: {
  tenantId: number;
  actorId: number;
  id: number;
  reason: string;
}) {
  const result = await runQuery<Record<string, unknown>>(
    `UPDATE erp.fechamentos_periodos SET reaberto_em = now(), reaberto_por = $3, motivo_reabertura = $4
     WHERE empresa_id = $1 AND id = $2 AND reaberto_em IS NULL RETURNING id::text, modulo, reaberto_em`,
    [input.tenantId, input.id, input.actorId, input.reason],
  );
  if (!result[0])
    throw new ErpDomainError(
      "PERIOD_CLOSURE_NOT_FOUND",
      "Fechamento ativo não encontrado.",
      404,
    );
  return result[0];
}
