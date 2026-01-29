"use client";

import { z } from "zod";

// Minimal catalog for MVP: Card, Metric, Button + actions

export const actions = {
  export_report: { description: "Export dashboard to PDF" },
  refresh_data: { description: "Refresh all metrics" },
} as const;

const ActionEnum = z.enum(Object.keys(actions) as [keyof typeof actions, ...Array<keyof typeof actions>]);

const TitleStyleSchema = z.object({
  fontFamily: z.string().optional(),
  fontWeight: z.union([z.string(), z.number()]).optional(),
  fontSize: z.union([z.number(), z.string()]).optional(),
  color: z.string().optional(),
  letterSpacing: z.union([z.number(), z.string()]).optional(),
  textTransform: z.enum(["none","uppercase","lowercase","capitalize"]).optional(),
  padding: z.union([z.number(), z.string()]).optional(),
  margin: z.union([z.number(), z.string()]).optional(),
  textAlign: z.enum(["left","center","right"]).optional(),
}).partial();

const NivoTextSchema = z.object({
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  fill: z.string().optional(),
}).partial();

const NivoThemeSchema = z.object({
  textColor: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  axis: z.object({
    ticks: z.object({ text: NivoTextSchema }).partial(),
    legend: z.object({ text: NivoTextSchema }).partial(),
  }).partial(),
  labels: z.object({ text: NivoTextSchema }).partial(),
}).partial();

export const catalog = {
  components: {
    Theme: {
      props: z.object({
        name: z.enum(["black","light","blue"]),
      }).strict(),
      hasChildren: true,
    },
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
        borderTopWidth: z.number().optional(),
        borderRightWidth: z.number().optional(),
        borderBottomWidth: z.number().optional(),
        borderLeftWidth: z.number().optional(),
        borderRadius: z.number().optional(),
        width: z.union([z.number(), z.string()]).optional(),
        height: z.union([z.number(), z.string()]).optional(),
        // Optional position for all header controls (datePicker + slicers)
        controlsPosition: z.enum(["left","right","below"]).optional(),
        datePicker: z.object({
          visible: z.boolean().optional(),
          mode: z.enum(["range","single"]).optional(),
          position: z.enum(["left","right","below"]).optional(),
          storePath: z.string().optional(),
          format: z.string().optional(),
          presets: z.array(z.enum(["today","week","month"]).optional()).optional(),
          actionOnChange: z.object({ type: z.string() }).partial().optional(),
          style: z.object({
            padding: z.union([z.number(), z.string()]).optional(),
            margin: z.union([z.number(), z.string()]).optional(),
            fontFamily: z.string().optional(),
            fontSize: z.union([z.number(), z.string()]).optional(),
            color: z.string().optional(),
          }).partial().optional(),
        }).partial().optional(),
        // Slicers (dropdown/list/multi)
        slicers: z.array(z.union([
          z.object({
            label: z.string().optional(),
            storePath: z.string(),
            type: z.enum(["dropdown","multi","list"]).default("dropdown"),
            placeholder: z.string().optional(),
            clearable: z.boolean().optional(),
            width: z.union([z.number(), z.string()]).optional(),
            source: z.union([
              z.object({
                type: z.literal('static'),
                options: z.array(z.object({ value: z.union([z.number(), z.string()]), label: z.string() })).default([])
              }).strict(),
              z.object({
                type: z.literal('api'),
                url: z.string(),
                method: z.enum(['GET','POST']).optional(),
                valueField: z.string().optional(),
                labelField: z.string().optional(),
                params: z.record(z.any()).optional(),
              }).strict()
            ]).optional(),
            actionOnChange: z.object({ type: z.string() }).partial().optional(),
          }).strict(),
          z.object({
            label: z.string().optional(),
            type: z.literal('range'),
            storeMinPath: z.string(),
            storeMaxPath: z.string(),
            prefix: z.string().optional(),
            suffix: z.string().optional(),
            step: z.number().optional(),
            decimals: z.number().optional(),
            placeholderMin: z.string().optional(),
            placeholderMax: z.string().optional(),
            width: z.union([z.number(), z.string()]).optional(),
            clearable: z.boolean().optional(),
            actionOnChange: z.object({ type: z.string() }).partial().optional(),
          }).strict()
        ])).optional(),
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
        childGrow: z.boolean().optional(),
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
        titleStyle: TitleStyleSchema.optional(),
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
        valuePath: z.string().optional(),
        dataQuery: z.object({
          model: z.string(),
          dimension: z.string().optional(),
          measure: z.string(),
          filters: z.record(z.any()).optional(),
          orderBy: z.object({ field: z.string().optional(), dir: z.enum(["asc","desc"]).optional() }).partial().optional(),
          limit: z.number().optional(),
        }).strict().optional(),
        valueKey: z.string().optional(),
        format: z.enum(["currency", "percent", "number"]).default("number"),
        labelStyle: TitleStyleSchema.optional(),
        valueStyle: TitleStyleSchema.optional(),
        containerStyle: z.object({
          backgroundColor: z.string().optional(),
          borderColor: z.string().optional(),
          borderStyle: z.string().optional(),
          borderWidth: z.union([z.number(), z.string()]).optional(),
          borderRadius: z.union([z.number(), z.string()]).optional(),
          boxShadow: z.string().optional(),
          padding: z.union([z.number(), z.string()]).optional(),
          margin: z.union([z.number(), z.string()]).optional(),
        }).partial().optional(),
        borderless: z.boolean().optional(),
        unit: z.string().optional(),
        deltaPath: z.string().optional(),
        trend: z.enum(["up", "down", "flat"]).optional(),
      }).strict().refine((p) => !!(p.valuePath || p.dataQuery), { message: 'Kpi requires either valuePath or dataQuery' }),
      hasChildren: false,
    },
    KPI: {
      props: z.object({
        title: z.string(),
        dataQuery: z.object({
          model: z.string(),
          measure: z.string(),
          filters: z.record(z.any()).optional(),
          orderBy: z.object({ field: z.string().optional(), dir: z.enum(["asc","desc"]).optional() }).partial().optional(),
          limit: z.number().optional(),
        }).strict(),
        valueKey: z.string().optional(),
        format: z.enum(["currency", "percent", "number"]).default("number"),
        titleStyle: TitleStyleSchema.optional(),
        valueStyle: TitleStyleSchema.optional(),
        containerStyle: z.object({
          backgroundColor: z.string().optional(),
          borderColor: z.string().optional(),
          borderStyle: z.string().optional(),
          borderWidth: z.union([z.number(), z.string()]).optional(),
          borderRadius: z.union([z.number(), z.string()]).optional(),
          boxShadow: z.string().optional(),
          padding: z.union([z.number(), z.string()]).optional(),
          margin: z.union([z.number(), z.string()]).optional(),
        }).partial().optional(),
        borderless: z.boolean().optional(),
        unit: z.string().optional(),
      }).strict(),
      hasChildren: false,
    },
    BarChart: {
      props: z.object({
        title: z.string().optional(),
        titleStyle: TitleStyleSchema.optional(),
        dataQuery: z.object({
          model: z.string(),
          dimension: z.string().optional(),
          dimensionExpr: z.string().optional(),
          time: z.object({
            column: z.string(),
            granularity: z.enum(["day","month","year"]).default("month"),
            format: z.string().optional(),
            alias: z.string().optional(),
          }).strict().optional(),
          measure: z.string(),
          filters: z.record(z.any()).optional(),
          orderBy: z.object({ field: z.string().optional(), dir: z.enum(["asc","desc"]).optional() }).partial().optional(),
          limit: z.number().optional(),
        }).strict(),
        containerStyle: z.object({
          backgroundColor: z.string().optional(),
          borderColor: z.string().optional(),
          borderStyle: z.string().optional(),
          borderWidth: z.union([z.number(), z.string()]).optional(),
          borderRadius: z.union([z.number(), z.string()]).optional(),
          boxShadow: z.string().optional(),
          padding: z.union([z.number(), z.string()]).optional(),
          margin: z.union([z.number(), z.string()]).optional(),
        }).partial().optional(),
        borderless: z.boolean().optional(),
        // xKey/yKey removed — server returns { label, value }
        fr: z.number().optional(),
        format: z.enum(["currency", "percent", "number"]).default("number"),
        height: z.number().optional(),
        colorScheme: z.union([z.string(), z.array(z.string())]).optional(),
        nivo: z.object({
          layout: z.enum(["vertical","horizontal"]).optional(),
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
          theme: NivoThemeSchema.optional(),
        }).partial().optional(),
      }).strict(),
      hasChildren: false,
    },
    LineChart: {
      props: z.object({
        title: z.string().optional(),
        titleStyle: TitleStyleSchema.optional(),
        dataQuery: z.object({
          model: z.string(),
          dimension: z.string().optional(),
          dimensionExpr: z.string().optional(),
          time: z.object({
            column: z.string(),
            granularity: z.enum(["day","month","year"]).default("month"),
            format: z.string().optional(),
            alias: z.string().optional(),
          }).strict().optional(),
          measure: z.string(),
          filters: z.record(z.any()).optional(),
          orderBy: z.object({ field: z.string().optional(), dir: z.enum(["asc","desc"]).optional() }).partial().optional(),
          limit: z.number().optional(),
        }).strict(),
        containerStyle: z.object({
          backgroundColor: z.string().optional(),
          borderColor: z.string().optional(),
          borderStyle: z.string().optional(),
          borderWidth: z.union([z.number(), z.string()]).optional(),
          borderRadius: z.union([z.number(), z.string()]).optional(),
          boxShadow: z.string().optional(),
          padding: z.union([z.number(), z.string()]).optional(),
          margin: z.union([z.number(), z.string()]).optional(),
        }).partial().optional(),
        borderless: z.boolean().optional(),
        // xKey/yKey removed — server returns { label, value }
        fr: z.number().optional(),
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
          theme: NivoThemeSchema.optional(),
        }).partial().optional(),
      }).strict(),
      hasChildren: false,
    },
    PieChart: {
      props: z.object({
        title: z.string().optional(),
        titleStyle: TitleStyleSchema.optional(),
        dataQuery: z.object({
          model: z.string(),
          dimension: z.string().optional(),
          dimensionExpr: z.string().optional(),
          time: z.object({
            column: z.string(),
            granularity: z.enum(["day","month","year"]).default("month"),
            format: z.string().optional(),
            alias: z.string().optional(),
          }).strict().optional(),
          measure: z.string(),
          filters: z.record(z.any()).optional(),
          orderBy: z.object({ field: z.string().optional(), dir: z.enum(["asc","desc"]).optional() }).partial().optional(),
          limit: z.number().optional(),
        }).strict(),
        containerStyle: z.object({
          backgroundColor: z.string().optional(),
          borderColor: z.string().optional(),
          borderStyle: z.string().optional(),
          borderWidth: z.union([z.number(), z.string()]).optional(),
          borderRadius: z.union([z.number(), z.string()]).optional(),
          boxShadow: z.string().optional(),
          padding: z.union([z.number(), z.string()]).optional(),
          margin: z.union([z.number(), z.string()]).optional(),
        }).partial().optional(),
        borderless: z.boolean().optional(),
        // xKey/yKey removed — server returns { label, value }
        fr: z.number().optional(),
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
          theme: NivoThemeSchema.optional(),
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
