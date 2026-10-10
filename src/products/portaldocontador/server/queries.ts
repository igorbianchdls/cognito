import { runQuery, runWithErpReadSnapshot } from "@/lib/postgres";
import type { ErpAccessContext } from "@/products/erp/server/erpAccess";
import { erpReadService } from "@/products/erp/server/erpReadService";
import { dreReportRecords } from "@/products/erp/server/erpDreReport";
import { listProfessionalReport } from "@/products/erp/server/erpProfessionalRepository";
import { requirePortalCapability } from "./access";
import type {
  PortalColumn,
  PortalQuery,
  PortalTable,
} from "../shared/contracts";

function table(
  records: Record<string, unknown>[],
  columns: PortalColumn[],
  q: PortalQuery,
): PortalTable {
  const filtered = q.query
    ? records.filter((r) =>
        Object.values(r).some((v) =>
          String(v ?? "")
            .toLocaleLowerCase("pt-BR")
            .includes(q.query.toLocaleLowerCase("pt-BR")),
        ),
      )
    : records;
  return {
    columns,
    records: filtered.slice((q.page - 1) * q.pageSize, q.page * q.pageSize),
    total: filtered.length,
    page: q.page,
    pageSize: q.pageSize,
  };
}
async function sqlTable(
  s: ErpAccessContext,
  q: PortalQuery,
  sql: string,
  columns: PortalColumn[],
  order: string,
): Promise<PortalTable> {
  return runWithErpReadSnapshot(async () => {
    const keys = columns.map((c) => "r." + c.key).join(",");
    const filtered = `WITH r AS (${sql}) SELECT * FROM r WHERE $4='' OR strpos(lower(concat_ws(' ',${keys})),lower($4))>0`;
    const params = [s.tenantId, q.from, q.to, q.query];
    const [count] = await runQuery<{ total: string }>(
      `SELECT count(*)::text AS total FROM (${filtered}) records`,
      params,
    );
    const records = await runQuery<Record<string, unknown>>(
      `${filtered} ORDER BY ${order} LIMIT $5 OFFSET $6`,
      [...params, q.pageSize, (q.page - 1) * q.pageSize],
    );
    return {
      columns,
      records,
      total: Number(count.total),
      page: q.page,
      pageSize: q.pageSize,
    };
  });
}
export async function portalFinancial(
  s: ErpAccessContext,
  q: PortalQuery,
): Promise<PortalTable> {
  requirePortalCapability(s, "erp.financeiro.visualizar");
  if (q.side === "movimentacoes") {
    return sqlTable(
      s,
      q,
      `SELECT id::text,data_pagamento AS data,tipo,valor_liquido::float8 AS valor,
      CASE WHEN estornado_em IS NOT NULL THEN 'Estornado' WHEN estorno_de_pagamento_id IS NOT NULL THEN 'Estorno' ELSE 'Efetivado' END AS status,id::text AS documento
      FROM erp.pagamentos WHERE empresa_id=$1 AND excluido_em IS NULL AND data_pagamento BETWEEN $2::date AND $3::date`,
      [
        { key: "data", label: "Data", format: "date" },
        { key: "tipo", label: "Tipo" },
        { key: "valor", label: "Valor líquido", format: "currency" },
        { key: "status", label: "Situação" },
        { key: "documento", label: "Documento" },
      ],
      "data DESC,id DESC",
    );
  }
  const data = await runWithErpReadSnapshot(async () => {
    // O serviço ERP usa páginas mínimas de 10. Adapte o recorte para cumprir
    // também os tamanhos menores aceitos pelo contrato público do portal.
    const size = Math.max(10, q.pageSize),
      offset = (q.page - 1) * q.pageSize;
    const firstPage = Math.floor(offset / size) + 1,
      within = offset % size;
    const input = {
      page: firstPage,
      pageSize: size,
      query: q.query,
      filters: {
        vencimento_inicio: q.from,
        vencimento_fim: q.to,
        tipo_lancamento: "efetivo",
      },
      sort: "vencimento",
    };
    const entity = q.side === "pagar" ? "contas-a-pagar" : "contas-a-receber";
    const first = await erpReadService.page(s.tenantId, entity, input);
    const records: Record<string, unknown>[] = first.records.slice(
      within,
      within + q.pageSize,
    );
    if (records.length < q.pageSize && offset + records.length < first.total) {
      const next = await erpReadService.page(s.tenantId, entity, {
        ...input,
        page: firstPage + 1,
      });
      records.push(...next.records.slice(0, q.pageSize - records.length));
    }
    return { ...first, records, page: q.page, pageSize: q.pageSize };
  });
  return {
    ...data,
    columns: [
      { key: "descricao", label: "Descrição" },
      {
        key: q.side === "pagar" ? "fornecedor" : "cliente",
        label: q.side === "pagar" ? "Fornecedor" : "Cliente",
      },
      { key: "vencimento", label: "Vencimento", format: "date" },
      { key: "valor", label: "Valor", format: "currency" },
      { key: "saldo", label: "Saldo", format: "currency" },
      { key: "status", label: "Situação" },
    ],
    note: "Período pela data de vencimento. Valores efetivos, com saldo calculado pelo ERP.",
  };
}
export async function portalDocuments(
  s: ErpAccessContext,
  q: PortalQuery,
): Promise<PortalTable> {
  let sql = `SELECT 'arquivo:'||id AS id,nome,mime_type,tamanho_bytes::float8 AS tamanho,(criado_em AT TIME ZONE current_setting('app.erp_time_zone'))::date AS data,documento AS origem FROM erp.portal_documentos(empresa_id => $1)
    WHERE (criado_em AT TIME ZONE current_setting('app.erp_time_zone'))::date BETWEEN $2::date AND $3::date`;
  if (s.capabilities.includes("erp.vendas.visualizar"))
    sql += ` UNION ALL SELECT id,nome,mime_type,tamanho,data,origem FROM (
    SELECT DISTINCT ON(n.id) 'nfse:'||n.id AS id,p.nome,'application/pdf'::text AS mime_type,a.tamanho_bytes::float8 AS tamanho,n.data_competencia AS data,
      CASE WHEN n.modo_operacao='simulacao' THEN 'NFS-e · SIMULAÇÃO SEM VALIDADE FISCAL' ELSE 'NFS-e' END AS origem
      FROM erp.notas_fiscais n JOIN erp.notas_fiscais_pdfs p ON p.empresa_id=n.empresa_id AND p.nota_fiscal_id=n.id
      LEFT JOIN erp.arquivos a ON a.empresa_id=p.empresa_id AND a.id=p.arquivo_id
      WHERE n.empresa_id=$1 AND n.tipo='nfse' AND n.excluido_em IS NULL AND n.data_competencia BETWEEN $2::date AND $3::date ORDER BY n.id,p.versao DESC,p.layout_versao DESC) pdfs`;
  return {
    ...(await sqlTable(
      s,
      q,
      sql,
      [
        { key: "nome", label: "Documento" },
        { key: "origem", label: "Origem" },
        { key: "data", label: "Data", format: "date" },
        { key: "tamanho", label: "Tamanho", format: "bytes" },
      ],
      "data DESC,id DESC",
    )),
    note: "Anexos pelo dia de envio; PDFs de NFS-e pela competência. Downloads autorizados por empresa e módulo.",
  };
}
export async function portalReports(
  s: ErpAccessContext,
  q: PortalQuery,
): Promise<PortalTable> {
  requirePortalCapability(
    s,
    "erp.financeiro.visualizar",
    "erp.relatorios.visualizar",
  );
  if (q.report !== "fluxo-de-caixa") {
    const result = await dreReportRecords(s.tenantId, {
      inicio: q.from,
      fim: q.to,
      visao: q.report === "dre-caixa" ? "caixa" : "competencia",
    });
    return {
      ...table(
        result.records,
        [
          { key: "linha", label: "DRE gerencial" },
          { key: "valor", label: "Valor", format: "currency" },
          {
            key: "periodo_anterior",
            label: "Período anterior",
            format: "currency",
          },
          { key: "percentual_receita_liquida", label: "% da receita líquida" },
        ],
        q,
      ),
      note: "DRE gerencial. Critério de caixa ou competência conforme a opção selecionada.",
    };
  }
  const rows = await listProfessionalReport({
    tenantId: s.tenantId,
    report: q.report,
    from: q.from,
    to: q.to,
  });
  const columns: PortalColumn[] = Object.keys(
    rows[0] || { data: null, entradas: null, saidas: null, saldo: null },
  ).map((key) => ({
    key,
    label: key.replaceAll("_", " "),
    format:
      key === "data"
        ? "date"
        : /entrada|saida|saldo|valor|receb|pagam/.test(key)
          ? "currency"
          : undefined,
  }));
  return table(rows, columns, q);
}
export async function portalPending(
  s: ErpAccessContext,
  q: PortalQuery,
): Promise<PortalTable> {
  requirePortalCapability(s, "erp.financeiro.visualizar");
  // These are calculated work items; no invented deadlines or persistent completion state.
  const sql = `SELECT 'pagar:'||id AS id,'Sem categoria' AS pendencia,descricao,data_competencia AS data,valor_total::float8 AS valor,'Contas a pagar' AS origem
      FROM erp.contas_pagar WHERE empresa_id=$1 AND categoria_id IS NULL AND excluido_em IS NULL AND status<>'cancelado' AND tipo_lancamento='efetivo' AND data_competencia BETWEEN $2::date AND $3::date
      UNION ALL SELECT 'receber:'||id,'Sem categoria',descricao,data_competencia,valor_total::float8,'Contas a receber' FROM erp.contas_receber WHERE empresa_id=$1 AND categoria_id IS NULL AND excluido_em IS NULL AND status<>'cancelado' AND tipo_lancamento='efetivo' AND data_competencia BETWEEN $2::date AND $3::date
      UNION ALL SELECT 'banco:'||id,'Conciliação pendente',descricao,data_transacao,valor::float8,'Extrato bancário' FROM erp.transacoes_bancarias WHERE empresa_id=$1 AND status IN ('pendente','parcial') AND excluido_em IS NULL AND data_transacao BETWEEN $2::date AND $3::date`;
  return {
    ...(await sqlTable(
      s,
      q,
      sql,
      [
        { key: "pendencia", label: "Pendência" },
        { key: "descricao", label: "Descrição" },
        { key: "origem", label: "Origem" },
        { key: "data", label: "Data", format: "date" },
        { key: "valor", label: "Valor", format: "currency" },
      ],
      "data,id",
    )),
    note: "Pendências calculadas pelos dados atuais do ERP. O período usa competência dos títulos e data das transações bancárias.",
  };
}
