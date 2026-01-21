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
    Header: {
      props: z.object({
        title: z.string(),
        subtitle: z.string().optional(),
        align: z.enum(["left","center","right"]).optional(),
        backgroundColor: z.string().optional(),
        textColor: z.string().optional(),
        subtitleColor: z.string().optional(),
        padding: z.union([z.number(), z.string()]).optional(),
        margin: z.union([z.number(), z.string()]).optional(),
        borderColor: z.string().optional(),
        borderWidth: z.number().optional(),
        borderRadius: z.number().optional(),
        width: z.union([z.number(), z.string()]).optional(),
        height: z.union([z.number(), z.string()]).optional(),
      }).strict(),
      hasChildren: true,
    },
    Div: {
      props: z.object({
        direction: z.enum(["row","column"]).optional(),
        gap: z.union([z.number(), z.string()]).optional(),
        wrap: z.boolean().optional(),
        justify: z.enum(["start","center","end","between","around","evenly"]).optional(),
        align: z.enum(["start","center","end","stretch"]).optional(),
        padding: z.union([z.number(), z.string()]).optional(),
        margin: z.union([z.number(), z.string()]).optional(),
        backgroundColor: z.string().optional(),
        borderColor: z.string().optional(),
        borderWidth: z.number().optional(),
        borderRadius: z.number().optional(),
        width: z.union([z.number(), z.string()]).optional(),
        height: z.union([z.number(), z.string()]).optional(),
      }).strict(),
      hasChildren: true,
    },
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
    Kpi: {
      props: z.object({
        label: z.string(),
        valuePath: z.string(),
        format: z.enum(["currency", "percent", "number"]).default("number"),
        unit: z.string().optional(),
        deltaPath: z.string().optional(),
        trend: z.enum(["up", "down", "flat"]).optional(),
      }).strict(),
      hasChildren: false,
    },
    BarChart: {
      props: z.object({
        title: z.string().optional(),
        dataPath: z.string(),
        xKey: z.string(),
        yKey: z.string(),
        format: z.enum(["currency", "percent", "number"]).default("number"),
        height: z.number().optional(),
        colorScheme: z.union([z.string(), z.array(z.string())]).optional(),
        nivo: z.object({
          padding: z.number().optional(),
          groupMode: z.enum(["grouped","stacked"]).optional(),
          gridX: z.boolean().optional(),
          gridY: z.boolean().optional(),
          enableLabel: z.boolean().optional(),
          labelSkipWidth: z.number().optional(),
          labelSkipHeight: z.number().optional(),
          labelTextColor: z.string().optional(),
          axisBottom: z.object({
            tickRotation: z.number().optional(),
            legend: z.string().optional(),
            legendOffset: z.number().optional(),
          }).partial().optional(),
          axisLeft: z.object({
            legend: z.string().optional(),
            legendOffset: z.number().optional(),
          }).partial().optional(),
          margin: z.object({ top: z.number().optional(), right: z.number().optional(), bottom: z.number().optional(), left: z.number().optional() }).partial().optional(),
          animate: z.boolean().optional(),
          motionConfig: z.string().optional(),
        }).partial().optional(),
      }).strict(),
      hasChildren: false,
    },
    LineChart: {
      props: z.object({
        title: z.string().optional(),
        dataPath: z.string(),
        xKey: z.string(),
        yKey: z.string(),
        format: z.enum(["currency", "percent", "number"]).default("number"),
        height: z.number().optional(),
        colorScheme: z.union([z.string(), z.array(z.string())]).optional(),
        nivo: z.object({
          gridX: z.boolean().optional(),
          gridY: z.boolean().optional(),
          curve: z.string().optional(),
          area: z.boolean().optional(),
          pointSize: z.number().optional(),
          axisBottom: z.object({
            tickRotation: z.number().optional(),
            legend: z.string().optional(),
            legendOffset: z.number().optional(),
          }).partial().optional(),
          axisLeft: z.object({
            legend: z.string().optional(),
            legendOffset: z.number().optional(),
          }).partial().optional(),
          margin: z.object({ top: z.number().optional(), right: z.number().optional(), bottom: z.number().optional(), left: z.number().optional() }).partial().optional(),
          animate: z.boolean().optional(),
          motionConfig: z.string().optional(),
        }).partial().optional(),
      }).strict(),
      hasChildren: false,
    },
    PieChart: {
      props: z.object({
        title: z.string().optional(),
        dataPath: z.string(),
        xKey: z.string(),
        yKey: z.string(),
        format: z.enum(["currency", "percent", "number"]).default("number"),
        height: z.number().optional(),
        colorScheme: z.union([z.string(), z.array(z.string())]).optional(),
        nivo: z.object({
          innerRadius: z.number().optional(),
          padAngle: z.number().optional(),
          cornerRadius: z.number().optional(),
          activeInnerRadiusOffset: z.number().optional(),
          activeOuterRadiusOffset: z.number().optional(),
          enableArcLabels: z.boolean().optional(),
          arcLabelsSkipAngle: z.number().optional(),
          arcLabelsTextColor: z.string().optional(),
          margin: z.object({ top: z.number().optional(), right: z.number().optional(), bottom: z.number().optional(), left: z.number().optional() }).partial().optional(),
          animate: z.boolean().optional(),
          motionConfig: z.string().optional(),
        }).partial().optional(),
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
