"use client";

import { z } from "zod";

// Minimal catalog for MVP: Card, Metric, Button + actions

export const actions = {
  export_report: { description: "Export dashboard to PDF" },
  refresh_data: { description: "Refresh all metrics" },
} as const;

const ActionEnum = z.enum(Object.keys(actions) as [keyof typeof actions, ...Array<keyof typeof actions>]);

export const catalog = {
  components: {
    Card: {
      props: z.object({
        title: z.string(),
      }).strict(),
      hasChildren: true,
    },
    Metric: {
      props: z.object({
        label: z.string(),
        valuePath: z.string(),
        format: z.enum(["currency", "percent", "number"]).default("number"),
      }).strict(),
      hasChildren: false,
    },
    Button: {
      props: z.object({
        label: z.string(),
        action: z.object({ type: ActionEnum }).strict(),
      }).strict(),
      hasChildren: false,
    },
  },
  actions,
} as const;

// Runtime validation helpers (no separate parser in MVP)
export function validateElement(el: any): { success: true; value: any } | { success: false; error: string } {
  if (!el || typeof el !== "object") return { success: false, error: "Element must be an object" };
  const type = String((el as any).type || "");
  if (!type) return { success: false, error: "Element missing 'type'" };
  const entry = (catalog as any).components?.[type];
  if (!entry) return { success: false, error: `Unknown component type '${type}'` };
  try {
    const parsedProps = entry.props.parse((el as any).props || {});
    const children = (el as any).children;
    if (entry.hasChildren && children && !Array.isArray(children)) {
      return { success: false, error: `Component '${type}' expects children array` };
    }
    if (!entry.hasChildren && children && Array.isArray(children) && children.length > 0) {
      return { success: false, error: `Component '${type}' does not accept children` };
    }
    return { success: true, value: { type, props: parsedProps, ...(children ? { children } : {}) } };
  } catch (e: any) {
    const msg = e?.message ? String(e.message) : "Invalid props";
    return { success: false, error: `${type}: ${msg}` };
  }
}

