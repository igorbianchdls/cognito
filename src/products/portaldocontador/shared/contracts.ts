import { z } from "zod";
import { erpDateSchema } from "@/products/erp/shared/erpTransport";
import type { ErpCapability } from "@/products/erp/shared/professionalContracts";

export const PORTAL_READ_CAPABILITIES: readonly ErpCapability[] = [
  "erp.financeiro.visualizar",
  "erp.relatorios.visualizar",
  "erp.vendas.visualizar",
  "erp.compras.visualizar",
  "erp.cadastros.visualizar",
];
export const PORTAL_SECTIONS = [
  "resumo",
  "financeiro",
  "documentos",
  "relatorios",
  "pendencias",
] as const;
export type PortalSection = (typeof PORTAL_SECTIONS)[number];
export const portalQuerySchema = z
  .object({
    from: erpDateSchema,
    to: erpDateSchema,
    page: z.coerce.number().int().min(1).max(10000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    query: z.string().trim().max(200).default(""),
    side: z.enum(["pagar", "receber", "movimentacoes"]).default("pagar"),
    report: z
      .enum(["fluxo-de-caixa", "dre-caixa", "dre-competencia"])
      .default("fluxo-de-caixa"),
    source: z
      .enum(["financeiro", "documentos", "relatorios", "pendencias"])
      .default("financeiro"),
  })
  .strict()
  .refine(
    (v) =>
      v.from <= v.to &&
      (Date.parse(v.to) - Date.parse(v.from)) / 86400000 < 366,
    "Selecione um período válido de até 366 dias.",
  );
export type PortalQuery = z.infer<typeof portalQuerySchema>;
export const portalInvitationSchema = z
  .object({
    companyId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
  })
  .strict();
export const portalRevokeSchema = z
  .object({
    companyId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    invitationId: z.coerce
      .number()
      .int()
      .positive()
      .max(Number.MAX_SAFE_INTEGER),
  })
  .strict();
export type PortalCompany = {
  id: number;
  name: string;
  organizationId: string;
  timeZone: string;
  capabilities: ErpCapability[];
};
export type PortalColumn = {
  key: string;
  label: string;
  format?: "currency" | "date" | "bytes";
};
export type PortalTable = {
  columns: PortalColumn[];
  records: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
  note?: string;
};
export type PortalInvitation = {
  id: number;
  email: string;
  status: string;
  expiresAt: string | null;
  syncPending: boolean;
};
