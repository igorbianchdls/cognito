import { ErpDomainError } from "@/products/erp/shared/erpErrors";
import type { PortalColumn } from "../shared/contracts";
export const PORTAL_EXPORT_LIMIT = 5000;
function csvCell(value: unknown) {
  let text =
    value == null
      ? ""
      : typeof value === "number"
        ? String(value).replace(".", ",")
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
  // Prefix textual spreadsheet formulas; numeric amounts remain numeric.
  if (typeof value === "string" && /^[\s]*[=+\-@\t\r]/.test(text))
    text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function portalCsv(
  columns: PortalColumn[],
  records: Record<string, unknown>[],
) {
  if (records.length > PORTAL_EXPORT_LIMIT)
    throw new ErpDomainError(
      "EXPORT_LIMIT",
      "A exportação aceita até 5.000 registros. Reduza o período ou refine a busca.",
      422,
    );
  return (
    "\uFEFF" +
    [
      columns.map((c) => csvCell(c.label)).join(";"),
      ...records.map((r) =>
        columns
          .map((c) => {
            const value = r[c.key];
            // Decimal retornado pelo PostgreSQL em coluna monetária é um número,
            // enquanto o conteúdo livre continua sendo tratado como texto.
            return csvCell(
              c.format === "currency" &&
                typeof value === "string" &&
                /^-?\d+(\.\d+)?$/.test(value) &&
                Number.isFinite(Number(value))
                ? Number(value)
                : value,
            );
          })
          .join(";"),
      ),
    ].join("\r\n") +
    "\r\n"
  );
}
