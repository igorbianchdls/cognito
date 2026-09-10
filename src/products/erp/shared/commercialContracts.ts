import { z } from "zod";
import { erpDateSchema, erpMoneySchema } from "./erpTransport";
import { ErpDomainError } from "./erpErrors";

export const contractSchema = z
  .object({
    cliente_id: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    numero: z.string().trim().max(60).optional().default(""),
    descricao: z.string().trim().min(1).max(500),
    produto_id: z
      .union([z.coerce.number().int().positive(), z.literal(""), z.null()])
      .optional(),
    servico_id: z
      .union([z.coerce.number().int().positive(), z.literal(""), z.null()])
      .optional(),
    item_descricao: z.string().trim().max(500).optional(),
    quantidade: z.coerce.number().positive(),
    valor_unitario: erpMoneySchema,
    data_inicio: erpDateSchema,
    data_fim: z.union([erpDateSchema, z.literal(""), z.null()]).optional(),
    periodicidade: z.enum([
      "semanal",
      "quinzenal",
      "mensal",
      "bimestral",
      "trimestral",
      "semestral",
      "anual",
    ]),
    dia_vencimento: z.preprocess(
      (v) => (v === "" || v == null ? 1 : v),
      z.coerce.number().int().min(1).max(31),
    ),
  })
  .strict()
  .refine(
    (v) => Number(Boolean(v.produto_id)) + Number(Boolean(v.servico_id)) === 1,
    "Escolha um serviço ou produto.",
  )
  .refine(
    (v) => !v.data_fim || v.data_fim >= v.data_inicio,
    "Fim anterior ao início do contrato.",
  );

export function canonicalRequest(value: unknown): string {
  if (Array.isArray(value))
    return "[" + value.map(canonicalRequest).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => JSON.stringify(k) + ":" + canonicalRequest(v))
        .join(",") +
      "}"
    );
  return JSON.stringify(value) ?? "null";
}
export function assertCommercialReplay(stored: unknown, request: unknown) {
  if (!stored || canonicalRequest(stored) !== canonicalRequest(request))
    throw new ErpDomainError(
      "IDEMPOTENCY_CONFLICT",
      "Esta identificação já foi usada com outro conteúdo. Confira o documento existente.",
      409,
      undefined,
      "verify",
    );
}

// Same month clipping as PostgreSQL date + interval, including leap years.
export function nextCommercialCycle(
  start: string,
  periodicity: string,
): string {
  erpDateSchema.parse(start);
  const date = new Date(start + "T12:00:00Z");
  if (periodicity === "semanal" || periodicity === "quinzenal")
    date.setUTCDate(date.getUTCDate() + (periodicity === "semanal" ? 7 : 15));
  else {
    const months: Record<string, number> = {
      mensal: 1,
      bimestral: 2,
      trimestral: 3,
      semestral: 6,
      anual: 12,
    };
    if (!months[periodicity])
      throw new ErpDomainError("VALIDATION_ERROR", "Periodicidade inválida.");
    const day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + months[periodicity]);
    date.setUTCDate(
      Math.min(
        day,
        new Date(
          Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
        ).getUTCDate(),
      ),
    );
  }
  return date.toISOString().slice(0, 10);
}
export function previousCommercialDay(day: string): string {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
export function contractDueDate(
  start: string,
  end: string,
  version: Record<string, unknown>,
): string {
  const d = new Date(
    (version.regra_vencimento === "dias_apos_periodo" ? end : start) +
      "T12:00:00Z",
  );
  if (version.regra_vencimento === "dias_apos_periodo")
    d.setUTCDate(d.getUTCDate() + Number(version.dias_apos_periodo));
  else {
    const day = Number(version.dia_vencimento);
    const last = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
    ).getUTCDate();
    d.setUTCDate(version.fim_mes === "proximo_mes" ? day : Math.min(day, last));
    if (d.toISOString().slice(0, 10) < start) {
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() + 1);
      d.setUTCDate(
        Math.min(
          day,
          new Date(
            Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
          ).getUTCDate(),
        ),
      );
    }
  }
  return d.toISOString().slice(0, 10);
}
