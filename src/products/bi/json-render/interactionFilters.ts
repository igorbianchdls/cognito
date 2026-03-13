type AnyRecord = Record<string, any>;

function splitTableSegments(table: string | undefined): string[] {
  if (typeof table !== "string") return [];
  return table
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function buildScopedFilterStorePath(table: string | undefined, field: string | undefined): string {
  const normalizedField = typeof field === "string" ? field.trim() : "";
  if (!normalizedField) return "";
  const tableSegments = splitTableSegments(table);
  if (tableSegments.length >= 2) {
    return ["filters", "__scoped", ...tableSegments, normalizedField].join(".");
  }
  return `filters.${normalizedField}`;
}

export function resolveInteractionFilterField(
  interaction: AnyRecord | undefined,
  inferredField = "",
): string {
  const explicitField = typeof interaction?.field === "string" ? interaction.field.trim() : "";
  if (explicitField) return explicitField;
  const legacyField = typeof interaction?.filterField === "string" ? interaction.filterField.trim() : "";
  if (legacyField) return legacyField;
  return inferredField;
}

export function resolveInteractionFilterStorePath(
  interaction: AnyRecord | undefined,
  field: string,
): string {
  const explicitStorePath = typeof interaction?.storePath === "string" ? interaction.storePath.trim() : "";
  if (explicitStorePath) return explicitStorePath;
  const table = typeof interaction?.table === "string" ? interaction.table.trim() : "";
  return buildScopedFilterStorePath(table, field);
}
