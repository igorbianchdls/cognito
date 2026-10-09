import { listPortalCompanies, requirePortalCapability } from "../server/access";
import {
  portalFinancial,
  portalDocuments,
  portalReports,
  portalPending,
} from "../server/queries";
import { portalCsv, PORTAL_EXPORT_LIMIT } from "../server/csv";
import { portalQuerySchema, type PortalTable } from "../shared/contracts";
import { loadDashboard } from "@/products/erp/server/dashboards/dashboardService";
import { dashboardToday } from "@/products/erp/shared/dashboardContracts";
import { attachmentDownload } from "@/products/erp/server/erpAttachments";
import { getServiceInvoicePdf } from "@/products/erp/server/fiscal/serviceInvoiceRepository";
import { ErpDomainError } from "@/products/erp/shared/erpErrors";
import { portalResponse, withPortalCompany, portalId } from "./http";
import { runWithErpReadSnapshot } from "@/lib/postgres";

export const companiesGET = () =>
  portalResponse(async () => {
    const { companies } = await listPortalCompanies();
    return Response.json({ companies });
  });
const sources = {
  financeiro: portalFinancial,
  documentos: portalDocuments,
  relatorios: portalReports,
  pendencias: portalPending,
};
export const resourceGET = withPortalCompany(
  async (request, { company, session }, params) => {
    const search = new URL(request.url).searchParams;
    for (const key of search.keys())
      if (search.getAll(key).length > 1)
        throw new ErpDomainError("VALIDATION_ERROR", "Filtro repetido.", 422);
    const today = dashboardToday(new Date(), session.timeZone);
    const q = portalQuerySchema.parse({
      from: today.slice(0, 7) + "-01",
      to: today,
      ...Object.fromEntries(search),
    });
    if (params.recurso === "resumo") {
      const dashboard = await loadDashboard(session, "visao-geral", {
        from: q.from,
        to: q.to,
        compare: true,
        includeForecast: false,
      });
      // ERP drilldown destinations remain inside the accountant product.
      return Response.json({
        company,
        filters: q,
        dashboard: {
          ...dashboard,
          metrics: dashboard.metrics.map((m) => ({ ...m, href: undefined })),
          lists: dashboard.lists.map((l) => ({
            ...l,
            href: undefined,
            rows: l.rows.map((r) => ({ ...r, href: undefined })),
          })),
        },
      });
    }
    if (params.recurso === "exportar") {
      return runWithErpReadSnapshot(async () => {
        const collect = sources[q.source];
        const first = await collect(session, { ...q, page: 1, pageSize: 100 });
        if (first.total > PORTAL_EXPORT_LIMIT)
          throw new ErpDomainError(
            "EXPORT_LIMIT",
            "A exportação aceita até 5.000 registros. Reduza o período ou refine a busca.",
            422,
          );
        const records = [...first.records];
        for (let page = 2; records.length < first.total; page++) {
          const next = await collect(session, { ...q, page, pageSize: 100 });
          if (!next.records.length || next.total !== first.total)
            throw new ErpDomainError(
              "EXPORT_CHANGED",
              "Os dados mudaram durante a exportação. Tente novamente.",
              409,
            );
          records.push(...next.records);
        }
        const columns = [
          { key: "empresa", label: "Empresa" },
          { key: "periodo_inicio", label: "Início do período" },
          { key: "periodo_fim", label: "Fim do período" },
          ...first.columns,
        ];
        return new Response(
          portalCsv(
            columns,
            records.map((r) => ({
              ...r,
              empresa: company.name,
              periodo_inicio: q.from,
              periodo_fim: q.to,
            })),
          ),
          {
            headers: {
              "Content-Type": "text/csv; charset=utf-8",
              "Content-Disposition": `attachment; filename="contador-${q.source}-${company.id}-${q.from}-${q.to}.csv"`,
            },
          },
        );
      });
    }
    const query = sources[params.recurso as keyof typeof sources];
    if (!query)
      throw new ErpDomainError("NOT_FOUND", "Área não encontrada.", 404);
    const result: PortalTable = await query(session, q);
    return Response.json({ company, filters: q, table: result });
  },
);
export const downloadGET = withPortalCompany(
  async (_request, { session }, params) => {
    const match = /^(arquivo|nfse):([1-9]\d*)$/.exec(params.arquivoId);
    if (!match)
      throw new ErpDomainError("NOT_FOUND", "Documento não encontrado.", 404);
    const id = portalId(match[2]);
    let name: string, bytes: Uint8Array, mime: string;
    if (match[1] === "nfse") {
      requirePortalCapability(session, "erp.vendas.visualizar");
      const pdf = await getServiceInvoicePdf(session.tenantId, id);
      name = pdf.name;
      bytes = pdf.bytes;
      mime = "application/pdf";
    } else {
      const file = await attachmentDownload(session.tenantId, id);
      const response = await fetch(file.url, {
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok)
        throw new ErpDomainError(
          "FILE_UNAVAILABLE",
          "O arquivo não está disponível no momento.",
          502,
        );
      const length = Number(response.headers.get("content-length") || 0);
      if (length > 10 * 1024 * 1024) {
        await response.body?.cancel();
        throw new ErpDomainError(
          "FILE_UNAVAILABLE",
          "Arquivo acima do limite de download.",
          422,
        );
      }
      const reader = response.body!.getReader(),
        chunks: Uint8Array[] = [];
      let size = 0;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.length;
          if (size > 10 * 1024 * 1024) {
            await reader.cancel();
            throw new ErpDomainError(
              "FILE_UNAVAILABLE",
              "Arquivo acima do limite de download.",
              422,
            );
          }
          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }
      bytes = Buffer.concat(chunks);
      name = file.nome;
      mime = file.mime_type;
    }
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
      },
    });
  },
);
