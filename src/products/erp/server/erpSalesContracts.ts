import { runQuery, withTransaction, type SQLClient } from "@/lib/postgres";
import {
  contractSchema,
  assertCommercialReplay,
  nextCommercialCycle,
  previousCommercialDay,
  contractDueDate,
} from "@/products/erp/shared/commercialContracts";
import { lineTotal, sumMoney } from "@/products/erp/shared/erpMoney";
import { ErpDomainError } from "@/products/erp/shared/erpErrors";
import {
  erpDateSchema,
  erpIdempotencyKeySchema,
} from "@/products/erp/shared/erpTransport";

type Actor = { tenantId: number; actorId: number };
const day = (value: unknown) =>
  value instanceof Date
    ? value.toISOString().slice(0, 10)
    : String(value).slice(0, 10);
export async function createSalesContract(
  client: SQLClient,
  input: Actor & { values: Record<string, unknown>; idempotencyKey: string },
) {
  const parsed = contractSchema.safeParse(input.values);
  if (!parsed.success)
    throw new ErpDomainError(
      "VALIDATION_ERROR",
      parsed.error.issues[0].message,
      422,
    );
  const v = parsed.data,
    key = erpIdempotencyKeySchema.parse(input.idempotencyKey);
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
    `erp:contract:${input.tenantId}:${key}`,
  ]);
  const existing = await client.query(
    "SELECT id::text,status,metadata FROM erp.contratos_vendas WHERE tenant_id=$1 AND chave_idempotencia=$2",
    [input.tenantId, key],
  );
  if (existing.rows[0]) {
    assertCommercialReplay(
      (existing.rows[0].metadata as Record<string, unknown>)?.commercialRequest,
      v,
    );
    return { id: existing.rows[0].id, status: existing.rows[0].status };
  }
  const customer = await client.query(
    "SELECT nome,documento,email,logradouro,numero,cidade,uf FROM erp.entidades WHERE tenant_id=$1 AND id=$2 AND eh_cliente AND ativo AND excluido_em IS NULL",
    [input.tenantId, v.cliente_id],
  );
  if (!customer.rows[0])
    throw new ErpDomainError(
      "INVALID_REFERENCE",
      "Cliente ativo não encontrado.",
    );
  const item = await client.query(
    `SELECT id FROM erp.${v.servico_id ? "servicos" : "produtos"} WHERE tenant_id=$1 AND id=$2 AND ativo AND excluido_em IS NULL`,
    [input.tenantId, v.servico_id || v.produto_id],
  );
  if (!item.rows[0])
    throw new ErpDomainError("INVALID_REFERENCE", "Item ativo não encontrado.");
  const total = lineTotal(v.quantidade, v.valor_unitario);
  if (total <= 0)
    throw new ErpDomainError(
      "INVALID_AMOUNT",
      "O contrato precisa ter valor positivo.",
    );
  const result = await client.query(
    `INSERT INTO erp.contratos_vendas (tenant_id,cliente_id,numero,descricao,data_inicio,data_fim,periodicidade,dia_vencimento,proxima_geracao_em,status,chave_idempotencia,metadata,criado_por,atualizado_por)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$5,'rascunho',$9,$10::jsonb,$11,$11) RETURNING id`,
    [
      input.tenantId,
      v.cliente_id,
      v.numero || `CTR-${crypto.randomUUID()}`,
      v.descricao,
      v.data_inicio,
      v.data_fim || null,
      v.periodicidade,
      v.dia_vencimento,
      key,
      JSON.stringify({ commercialRequest: v }),
      input.actorId,
    ],
  );
  const id = result.rows[0].id;
  const version = await client.query(
    `INSERT INTO erp.contratos_vendas_versoes(tenant_id,contrato_id,numero,vigencia_inicio,vigencia_fim,periodicidade,dia_vencimento,motivo,cliente_snapshot,criado_por)
    VALUES($1,$2,1,$3,$4,$5,$6,'Criação do contrato',$7::jsonb,$8) RETURNING id`,
    [
      input.tenantId,
      id,
      v.data_inicio,
      v.data_fim || null,
      v.periodicidade,
      v.dia_vencimento,
      JSON.stringify(customer.rows[0]),
      input.actorId,
    ],
  );
  await client.query(
    `INSERT INTO erp.contratos_vendas_itens(tenant_id,contrato_id,contrato_versao_id,item_logico,produto_id,servico_id,descricao,quantidade,valor_unitario,total,criado_por,atualizado_por)
    VALUES($1,$2,$3,'1',$4,$5,$6,$7,$8,$9,$10,$10)`,
    [
      input.tenantId,
      id,
      version.rows[0].id,
      v.produto_id || null,
      v.servico_id || null,
      v.item_descricao || v.descricao,
      v.quantidade,
      v.valor_unitario,
      total,
      input.actorId,
    ],
  );
  await client.query(
    "UPDATE erp.contratos_vendas_versoes SET status='efetivada',efetivada_em=now() WHERE tenant_id=$1 AND id=$2",
    [input.tenantId, version.rows[0].id],
  );
  await client.query(
    "UPDATE erp.contratos_vendas SET status='ativo',atualizado_por=$3 WHERE tenant_id=$1 AND id=$2",
    [input.tenantId, id, input.actorId],
  );
  return { id: String(id), status: "ativo" };
}

export async function getSalesContract(tenantId: number, id: number) {
  const records = await runQuery(
    "SELECT id::text,numero,descricao,status,versao,proxima_geracao_em,cliente_snapshot FROM erp.contratos_vendas WHERE tenant_id=$1 AND id=$2 AND excluido_em IS NULL",
    [tenantId, id],
  );
  if (!records[0])
    throw new ErpDomainError("NOT_FOUND", "Contrato não encontrado.", 404);
  const versions = await runQuery(
    `SELECT v.*, (SELECT coalesce(jsonb_agg(i ORDER BY i.id),'[]') FROM erp.contratos_vendas_itens i WHERE i.tenant_id=v.tenant_id AND i.contrato_versao_id=v.id) AS itens FROM erp.contratos_vendas_versoes v WHERE tenant_id=$1 AND contrato_id=$2 ORDER BY numero DESC`,
    [tenantId, id],
  );
  const cycles = await runQuery(
    "SELECT id::text,contrato_versao_id::text,periodo_inicio,periodo_fim,status,venda_id::text FROM erp.contratos_vendas_geracoes WHERE tenant_id=$1 AND contrato_id=$2 ORDER BY periodo_inicio DESC LIMIT 100",
    [tenantId, id],
  );
  return { record: records[0], versions, cycles };
}

export async function reviseSalesContract(
  input: Actor & {
    id: number;
    expectedVersion: number;
    inicio: string;
    motivo: string;
    itens: Array<{ id: string; quantidade: number; valor_unitario: number }>;
  },
) {
  return withTransaction(async (client) => {
    const header = (
      await client.query(
        "SELECT * FROM erp.contratos_vendas WHERE tenant_id=$1 AND id=$2 AND excluido_em IS NULL FOR UPDATE",
        [input.tenantId, input.id],
      )
    ).rows[0];
    if (!header || Number(header.versao) !== input.expectedVersion)
      throw new ErpDomainError(
        "VERSION_CONFLICT",
        "Contrato alterado; atualize antes de salvar.",
        409,
        undefined,
        "refresh",
      );
    if (header.status !== "ativo")
      throw new ErpDomainError(
        "INVALID_STATE",
        "Somente contratos ativos podem receber novas condições.",
      );
    const old = (
      await client.query(
        "SELECT * FROM erp.contratos_vendas_versoes WHERE tenant_id=$1 AND contrato_id=$2 AND status='efetivada' ORDER BY numero DESC LIMIT 1 FOR UPDATE",
        [input.tenantId, input.id],
      )
    ).rows[0];
    if (
      !old ||
      input.inicio <= day(old.vigencia_inicio) ||
      input.inicio !== day(header.proxima_geracao_em)
    )
      throw new ErpDomainError(
        "INVALID_PERIOD",
        "Inicie a nova versão na próxima geração, depois do início da versão atual.",
      );
    const items = (
      await client.query(
        "SELECT * FROM erp.contratos_vendas_itens WHERE tenant_id=$1 AND contrato_versao_id=$2 ORDER BY id",
        [input.tenantId, old.id],
      )
    ).rows;
    if (
      input.itens.length !== items.length ||
      new Set(input.itens.map((i) => i.id)).size !== items.length ||
      input.itens.some(
        (i) => !items.some((oldItem) => String(oldItem.id) === i.id),
      )
    )
      throw new ErpDomainError(
        "INVALID_REFERENCE",
        "Recarregue os itens da versão atual.",
      );
    await client.query(
      "UPDATE erp.contratos_vendas_versoes SET vigencia_fim=$3 WHERE tenant_id=$1 AND id=$2",
      [input.tenantId, old.id, previousCommercialDay(input.inicio)],
    );
    const version = (
      await client.query(
        `INSERT INTO erp.contratos_vendas_versoes(tenant_id,contrato_id,numero,vigencia_inicio,vigencia_fim,periodicidade,dia_vencimento,regra_vencimento,dias_apos_periodo,fim_mes,categoria_id,centro_custo_id,conta_financeira_id,metodo_pagamento_id,motivo,cliente_snapshot,criado_por)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17) RETURNING id`,
        [
          input.tenantId,
          input.id,
          Number(old.numero) + 1,
          input.inicio,
          old.vigencia_fim,
          old.periodicidade,
          old.dia_vencimento,
          old.regra_vencimento,
          old.dias_apos_periodo,
          old.fim_mes,
          old.categoria_id,
          old.centro_custo_id,
          old.conta_financeira_id,
          old.metodo_pagamento_id,
          input.motivo,
          JSON.stringify(old.cliente_snapshot),
          input.actorId,
        ],
      )
    ).rows[0];
    for (const item of items) {
      const change = input.itens.find((i) => i.id === String(item.id))!;
      const total = lineTotal(
        change.quantidade,
        change.valor_unitario,
        String(item.desconto),
      );
      await client.query(
        `INSERT INTO erp.contratos_vendas_itens(tenant_id,contrato_id,contrato_versao_id,item_logico,produto_id,servico_id,descricao,quantidade,valor_unitario,desconto,total,criado_por,atualizado_por) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)`,
        [
          input.tenantId,
          input.id,
          version.id,
          item.item_logico,
          item.produto_id,
          item.servico_id,
          item.descricao,
          change.quantidade,
          change.valor_unitario,
          item.desconto,
          total,
          input.actorId,
        ],
      );
    }
    if (
      sumMoney(
        input.itens.map((i) =>
          lineTotal(
            i.quantidade,
            i.valor_unitario,
            String(
              items.find((oldItem) => String(oldItem.id) === i.id)!.desconto,
            ),
          ),
        ),
      ) <= 0
    )
      throw new ErpDomainError(
        "INVALID_AMOUNT",
        "O contrato precisa ter valor positivo.",
      );
    await client.query(
      "UPDATE erp.contratos_vendas_versoes SET status='efetivada',efetivada_em=now() WHERE tenant_id=$1 AND id=$2",
      [input.tenantId, version.id],
    );
    await client.query(
      "UPDATE erp.contratos_vendas SET versao=versao+1,atualizado_por=$3 WHERE tenant_id=$1 AND id=$2",
      [input.tenantId, input.id, input.actorId],
    );
    return { id: String(input.id), versionId: String(version.id) };
  });
}

export async function generateContractSales(input: Actor & { until?: string }) {
  const parsedUntil = erpDateSchema.safeParse(
    input.until || new Date().toISOString().slice(0, 10),
  );
  if (!parsedUntil.success)
    throw new ErpDomainError("VALIDATION_ERROR", "Data limite inválida.");
  const until = parsedUntil.data;
  return withTransaction(async (client) => {
    const contracts = await client.query(
      `SELECT * FROM erp.contratos_vendas WHERE tenant_id=$1 AND status='ativo' AND excluido_em IS NULL AND proxima_geracao_em<=$2::date AND (data_fim IS NULL OR proxima_geracao_em<=data_fim) ORDER BY proxima_geracao_em,id LIMIT 100 FOR UPDATE SKIP LOCKED`,
      [input.tenantId, until],
    );
    const generated: Array<{ contractId: string; saleId: string }> = [];
    const skipped: Array<{ contractId: string; reason: string }> = [];
    for (const c of contracts.rows) {
      const start = day(c.proxima_geracao_em);
      const versions = await client.query(
        "SELECT * FROM erp.contratos_vendas_versoes WHERE tenant_id=$1 AND contrato_id=$2 AND status='efetivada' AND vigencia_inicio<=$3::date AND (vigencia_fim IS NULL OR vigencia_fim>=$3::date) ORDER BY numero DESC LIMIT 1",
        [input.tenantId, c.id, start],
      );
      const v = versions.rows[0];
      if (!v) {
        skipped.push({
          contractId: String(c.id),
          reason: "Sem versão efetivada para o período.",
        });
        continue;
      }
      const next = nextCommercialCycle(start, String(v.periodicidade)),
        end = previousCommercialDay(next);
      if (v.vigencia_fim && end > day(v.vigencia_fim)) {
        skipped.push({
          contractId: String(c.id),
          reason: "O ciclo completo ultrapassa a vigência; revise o contrato.",
        });
        continue;
      }
      const key = `contrato:${c.id}:${start}`;
      const existing = await client.query(
        "SELECT venda_id FROM erp.contratos_vendas_geracoes WHERE tenant_id=$1 AND contrato_id=$2 AND periodo_inicio=$3",
        [input.tenantId, c.id, start],
      );
      if (existing.rows[0]) {
        skipped.push({
          contractId: String(c.id),
          reason: "Ciclo já registrado.",
        });
        continue;
      }
      const items = await client.query(
        "SELECT * FROM erp.contratos_vendas_itens WHERE tenant_id=$1 AND contrato_versao_id=$2 ORDER BY id",
        [input.tenantId, v.id],
      );
      const total = sumMoney(items.rows.map((i) => String(i.total)));
      const due = contractDueDate(start, end, v);
      const sale = await client.query(
        `INSERT INTO erp.vendas(tenant_id,cliente_id,numero,data_venda,data_competencia,status,situacao,origem,categoria_id,centro_custo_id,conta_financeira_id,metodo_pagamento_id,subtotal,total,condicao_pagamento,chave_idempotencia,criado_por,atualizado_por)
        VALUES($1,$2,$3,$4,$4,'rascunho','em_aberto','contrato',$5,$6,$7,$8,$9,$9,$10::jsonb,$11,$12,$12) RETURNING id`,
        [
          input.tenantId,
          c.cliente_id,
          `CTR-${c.id}-${start.replaceAll("-", "")}`,
          start,
          v.categoria_id,
          v.centro_custo_id,
          v.conta_financeira_id,
          v.metodo_pagamento_id,
          total,
          JSON.stringify({
            parcelas: [
              { numero_parcela: 1, data_vencimento: due, valor: total },
            ],
          }),
          key,
          input.actorId,
        ],
      );
      const saleId = sale.rows[0].id;
      for (const i of items.rows)
        await client.query(
          `INSERT INTO erp.vendas_itens(tenant_id,venda_id,produto_id,servico_id,descricao,quantidade,valor_unitario,desconto,total,criado_por,atualizado_por) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)`,
          [
            input.tenantId,
            saleId,
            i.produto_id,
            i.servico_id,
            i.descricao,
            i.quantidade,
            i.valor_unitario,
            i.desconto,
            i.total,
            input.actorId,
          ],
        );
      await client.query(
        `INSERT INTO erp.vendas_recebimentos_previstos(tenant_id,venda_id,numero_parcela,data_vencimento,valor,conta_financeira_id,metodo_pagamento_id,criado_por,atualizado_por) VALUES($1,$2,1,$3,$4,$5,$6,$7,$7)`,
        [
          input.tenantId,
          saleId,
          due,
          total,
          v.conta_financeira_id,
          v.metodo_pagamento_id,
          input.actorId,
        ],
      );
      const cycle = await client.query(
        `INSERT INTO erp.contratos_vendas_geracoes(tenant_id,contrato_id,contrato_versao_id,competencia,periodo_inicio,periodo_fim,venda_id,status,chave_idempotencia,processado_em,criado_por) VALUES($1,$2,$3,$4,$4,$5,$6,'concluida',$7,now(),$8) RETURNING id`,
        [input.tenantId, c.id, v.id, start, end, saleId, key, input.actorId],
      );
      await client.query(
        `INSERT INTO erp.contratos_vendas_geracoes_tentativas(tenant_id,geracao_id,numero,status,fim,execucao_id) VALUES($1,$2,1,'sucesso',now(),$3)`,
        [input.tenantId, cycle.rows[0].id, key],
      );
      await client.query(
        "UPDATE erp.contratos_vendas SET proxima_geracao_em=$3,atualizado_por=$4 WHERE tenant_id=$1 AND id=$2",
        [input.tenantId, c.id, next, input.actorId],
      );
      generated.push({ contractId: String(c.id), saleId: String(saleId) });
    }
    return { generated, total: generated.length, skipped };
  });
}
