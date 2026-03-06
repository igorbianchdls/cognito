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

const FrameStyleSchema = z.object({
  variant: z.enum(["hud"]).optional(),
  baseColor: z.string().optional(),
  cornerColor: z.string().optional(),
  cornerSize: z.union([z.number(), z.string()]).optional(),
  cornerWidth: z.union([z.number(), z.string()]).optional(),
}).partial();

const ContainerStyleSchema = z.object({
  backgroundColor: z.string().optional(),
  borderColor: z.string().optional(),
  borderStyle: z.string().optional(),
  borderWidth: z.union([z.number(), z.string()]).optional(),
  borderRadius: z.union([z.number(), z.string()]).optional(),
  boxShadow: z.string().optional(),
  padding: z.union([z.number(), z.string()]).optional(),
  margin: z.union([z.number(), z.string()]).optional(),
  frame: FrameStyleSchema.optional(),
}).partial();

const OrderBySchema = z
  .object({
    field: z.string().optional(),
    dir: z.enum(["asc", "desc"]).optional(),
  })
  .partial()
  .optional();

const LegacyKpiDataQuerySchema = z.object({
  model: z.string(),
  measure: z.string(),
  filters: z.record(z.any()).optional(),
  orderBy: OrderBySchema,
  limit: z.number().optional(),
}).strict();

const LegacyChartDataQuerySchema = z.object({
  model: z.string(),
  dimension: z.string().optional(),
  dimensionExpr: z.string().optional(),
  time: z.object({
    column: z.string(),
    granularity: z.enum(["day", "month", "year"]).default("month"),
    format: z.string().optional(),
    alias: z.string().optional(),
  }).strict().optional(),
  measure: z.string(),
  filters: z.record(z.any()).optional(),
  orderBy: OrderBySchema,
  limit: z.number().optional(),
}).strict();

const SqlKpiDataQuerySchema = z.object({
  query: z.string(),
  xField: z.string().optional(),
  yField: z.string().optional(),
  keyField: z.string().optional(),
  filters: z.record(z.any()).optional(),
  limit: z.number().optional(),
}).strict();

const SqlChartDataQuerySchema = z.object({
  query: z.string(),
  xField: z.string(),
  yField: z.string(),
  keyField: z.string().optional(),
  filters: z.record(z.any()).optional(),
  limit: z.number().optional(),
}).strict();

const SqlTableDataQuerySchema = z.object({
  query: z.string(),
  filters: z.record(z.any()).optional(),
  limit: z.number().optional(),
}).strict();

const TableColumnSchema = z.object({
  key: z.string(),
  header: z.string().optional(),
  label: z.string().optional(),
  width: z.number().optional(),
  format: z.enum(["text", "currency", "percent", "number"]).optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  editable: z.boolean().optional(),
  textColor: z.string().optional(),
}).strict();

export const catalog = {
  components: {
    Theme: {
      props: z.object({
        name: z.string(),
        headerTheme: z.string().optional(),
        managers: z.object({
          font: z.string().optional(),
          border: z.object({
            style: z.enum(["none","solid","dashed","dotted"]).optional(),
            width: z.union([z.number(), z.string()]).optional(),
            color: z.string().optional(),
            radius: z.union([z.number(), z.string()]).optional(),
            shadow: z.enum(["none","sm","md","lg","xl","2xl"]).optional(),
            frame: FrameStyleSchema.optional(),
          }).partial().optional(),
          color: z.object({
            scheme: z.array(z.string()).optional(),
          }).partial().optional(),
          background: z.string().optional(),
          backgroundPreset: z.string().optional(),
          cardStylePreset: z.string().optional(),
          surface: z.string().optional(),
          h1: z.object({
            color: z.string().optional(),
            weight: z.union([z.string(), z.number()]).optional(),
            size: z.union([z.string(), z.number()]).optional(),
            font: z.string().optional(),
            letterSpacing: z.union([z.string(), z.number()]).optional(),
            padding: z.union([z.string(), z.number()]).optional(),
          }).partial().optional(),
          kpi: z.object({
            title: z.object({
              font: z.string().optional(),
              weight: z.union([z.string(), z.number()]).optional(),
              color: z.string().optional(),
              letterSpacing: z.union([z.string(), z.number()]).optional(),
              padding: z.union([z.string(), z.number()]).optional(),
            }).partial().optional(),
            value: z.object({
              font: z.string().optional(),
              weight: z.union([z.string(), z.number()]).optional(),
              color: z.string().optional(),
              letterSpacing: z.union([z.string(), z.number()]).optional(),
              padding: z.union([z.string(), z.number()]).optional(),
            }).partial().optional(),
          }).partial().optional(),
        }).partial().optional(),
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
        frame: FrameStyleSchema.optional(),
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
            // legacy
            padding: z.union([z.number(), z.string()]).optional(),
            margin: z.union([z.number(), z.string()]).optional(),
            fontFamily: z.string().optional(),
            fontSize: z.union([z.number(), z.string()]).optional(),
            color: z.string().optional(),
            // themed
            labelStyle: z.object({}).passthrough().optional(),
            fieldStyle: z.object({
              backgroundColor: z.string().optional(),
              color: z.string().optional(),
              borderColor: z.string().optional(),
              borderWidth: z.union([z.number(), z.string()]).optional(),
              borderRadius: z.union([z.number(), z.string()]).optional(),
              paddingX: z.union([z.number(), z.string()]).optional(),
              paddingY: z.union([z.number(), z.string()]).optional(),
            }).partial().optional(),
            iconStyle: z.object({
              color: z.string().optional(),
              backgroundColor: z.string().optional(),
              size: z.union([z.number(), z.string()]).optional(),
              padding: z.union([z.number(), z.string()]).optional(),
              borderRadius: z.union([z.number(), z.string()]).optional(),
              position: z.enum(["left","right"]).optional(),
            }).partial().optional(),
          }).partial().optional(),
        }).partial().optional(),
        // Slicers (dropdown/list/multi/tile/tile-multi)
        slicers: z.array(z.union([
          z.object({
            label: z.string().optional(),
            storePath: z.string(),
            type: z.enum(["dropdown","multi","list","tile","tile-multi"]).default("dropdown"),
            placeholder: z.string().optional(),
            clearable: z.boolean().optional(),
            width: z.union([z.number(), z.string()]).optional(),
            query: z.string().optional(),
            limit: z.number().optional(),
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
              }).strict(),
              z.object({
                type: z.literal('options'),
                model: z.string(),
                field: z.string(),
                pageSize: z.number().optional(),
                limit: z.number().optional(),
                dependsOn: z.array(z.string()).optional(),
              }).strict()
            ]).optional(),
            actionOnChange: z.object({ type: z.string() }).partial().optional(),
            labelStyle: TitleStyleSchema.optional(),
            optionStyle: TitleStyleSchema.optional(),
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
            labelStyle: TitleStyleSchema.optional(),
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
        frame: FrameStyleSchema.optional(),
      }).strict(),
      hasChildren: true,
    },
    Card: {
      props: z.object({
        title: z.string(),
        titleStyle: TitleStyleSchema.optional(),
        frame: FrameStyleSchema.optional(),
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
    KPI: {
      props: z.object({
        title: z.string(),
        valuePath: z.string().optional(),
        dataQuery: z.union([LegacyKpiDataQuerySchema, SqlKpiDataQuerySchema]).optional(),
        valueKey: z.string().optional(),
        format: z.enum(["currency", "percent", "number"]).default("number"),
        titleStyle: TitleStyleSchema.optional(),
        valueStyle: TitleStyleSchema.optional(),
        containerStyle: ContainerStyleSchema.optional(),
        borderless: z.boolean().optional(),
        fr: z.number().optional(),
        unit: z.string().optional(),
      }).strict().refine((p) => !!(p.valuePath || p.dataQuery), { message: 'KPI requires either valuePath or dataQuery' }),
      hasChildren: false,
    },
    BarChart: {
      props: z.object({
        title: z.string().optional(),
        titleStyle: TitleStyleSchema.optional(),
        dataQuery: z.union([LegacyChartDataQuerySchema, SqlChartDataQuerySchema]),
        drill: z.object({
          enabled: z.boolean().optional(),
          showBreadcrumb: z.boolean().optional(),
          levels: z.array(z.object({
            label: z.string().optional(),
            dimension: z.string().optional(),
            dimensionExpr: z.string().optional(),
            filterField: z.string().optional(),
          }).strict().refine((l) => Boolean(l.dimension || l.dimensionExpr), { message: 'drill level requires dimension or dimensionExpr' })).optional(),
        }).partial().optional(),
        interaction: z.object({
          clickAsFilter: z.boolean().optional(),
          filterField: z.string().optional(),
          storePath: z.string().optional(),
          clearOnSecondClick: z.boolean().optional(),
          alsoWithDrill: z.boolean().optional(),
        }).partial().optional(),
        containerStyle: ContainerStyleSchema.optional(),
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
            maxTicks: z.number().optional(),
          }).partial().optional(),
          axisLeft: z.object({
            legend: z.string().optional(),
            legendOffset: z.number().optional(),
            maxTicks: z.number().optional(),
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
        dataQuery: z.union([LegacyChartDataQuerySchema, SqlChartDataQuerySchema]),
        interaction: z.object({
          clickAsFilter: z.boolean().optional(),
          filterField: z.string().optional(),
          storePath: z.string().optional(),
          clearOnSecondClick: z.boolean().optional(),
        }).partial().optional(),
        containerStyle: ContainerStyleSchema.optional(),
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
        dataQuery: z.union([LegacyChartDataQuerySchema, SqlChartDataQuerySchema]),
        interaction: z.object({
          clickAsFilter: z.boolean().optional(),
          filterField: z.string().optional(),
          storePath: z.string().optional(),
          clearOnSecondClick: z.boolean().optional(),
        }).partial().optional(),
        containerStyle: ContainerStyleSchema.optional(),
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
    Gauge: {
      props: z.object({
        title: z.string().optional(),
        label: z.string().optional(),
        value: z.number().optional(),
        valuePath: z.string().optional(),
        min: z.number().optional(),
        max: z.number().optional(),
        format: z.enum(["currency","percent","number"]).optional(),
        size: z.number().optional(),
        thickness: z.number().optional(),
        trackColor: z.string().optional(),
        indicatorColor: z.string().optional(),
        showValue: z.boolean().optional(),
        roundedCaps: z.boolean().optional(),
        containerStyle: ContainerStyleSchema.optional(),
        borderless: z.boolean().optional(),
        fr: z.number().optional(),
      }).strict(),
      hasChildren: false,
    },
    Table: {
      props: z.object({
        title: z.string().optional(),
        dataPath: z.string().optional(),
        dataQuery: SqlTableDataQuerySchema.optional(),
        columns: z.array(TableColumnSchema).optional(),
        fr: z.number().optional(),
        height: z.union([z.number(), z.string()]).optional(),
        searchPlaceholder: z.string().optional(),
        showColumnToggle: z.boolean().optional(),
        showPagination: z.boolean().optional(),
        pageSize: z.number().optional(),
        enableSearch: z.boolean().optional(),
        enableFiltering: z.boolean().optional(),
        enableRowSelection: z.boolean().optional(),
        selectionMode: z.enum(["single", "multiple"]).optional(),
        defaultSortColumn: z.string().optional(),
        defaultSortDirection: z.enum(["asc", "desc"]).optional(),
        editableMode: z.boolean().optional(),
        editableCells: z.union([z.enum(["all", "none"]), z.array(z.string())]).optional(),
        editableRowActions: z.object({
          allowAdd: z.boolean().optional(),
          allowDelete: z.boolean().optional(),
          allowDuplicate: z.boolean().optional(),
        }).partial().optional(),
        validationRules: z.record(z.any()).optional(),
        enableValidation: z.boolean().optional(),
        showValidationErrors: z.boolean().optional(),
        saveBehavior: z.enum(["auto", "manual", "onBlur"]).optional(),
        editTrigger: z.enum(["click", "doubleClick", "focus"]).optional(),
        headerBackground: z.string().optional(),
        headerTextColor: z.string().optional(),
        rowHoverColor: z.string().optional(),
        borderColor: z.string().optional(),
        borderWidth: z.number().optional(),
        fontSize: z.number().optional(),
        padding: z.number().optional(),
        headerPadding: z.number().optional(),
        headerFontSize: z.number().optional(),
        headerFontFamily: z.string().optional(),
        headerFontWeight: z.string().optional(),
        headerLetterSpacing: z.number().optional(),
        cellFontSize: z.number().optional(),
        cellFontFamily: z.string().optional(),
        cellFontWeight: z.string().optional(),
        cellTextColor: z.string().optional(),
        cellLetterSpacing: z.number().optional(),
        enableZebraStripes: z.boolean().optional(),
        rowAlternateBgColor: z.string().optional(),
        selectionColumnWidth: z.number().optional(),
        editingCellColor: z.string().optional(),
        validationErrorColor: z.string().optional(),
        modifiedCellColor: z.string().optional(),
        newRowColor: z.string().optional(),
        titleStyle: TitleStyleSchema.optional(),
        containerStyle: ContainerStyleSchema.optional(),
        borderless: z.boolean().optional(),
      }).strict().refine((p) => Boolean(p.dataPath || p.dataQuery), {
        message: 'Table requires either dataPath or dataQuery',
      }),
      hasChildren: false,
    },
    SlicerCard: {
      props: z.object({
        title: z.string().optional(),
        fr: z.number().optional(),
        layout: z.enum(["vertical","horizontal"]).optional(),
        applyMode: z.enum(["auto","manual"]).optional(),
        actionOnApply: z.object({ type: z.string() }).partial().optional(),
        containerStyle: ContainerStyleSchema.optional(),
        borderless: z.boolean().optional(),
        fields: z.array(z.object({
          label: z.string().optional(),
          type: z.enum(["list","dropdown","multi","tile","tile-multi"]).default("list"),
          storePath: z.string(),
          placeholder: z.string().optional(),
          clearable: z.boolean().optional(),
          selectAll: z.boolean().optional(),
          search: z.boolean().optional(),
          width: z.union([z.number(), z.string()]).optional(),
          query: z.string().optional(),
          limit: z.number().optional(),
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
            }).strict(),
            z.object({
              type: z.literal('options'),
              model: z.string(),
              field: z.string(),
              pageSize: z.number().optional(),
              limit: z.number().optional(),
              dependsOn: z.array(z.string()).optional(),
            }).strict(),
            z.object({
              type: z.literal('query'),
              model: z.string(),
              dimension: z.string(),
              filters: z.record(z.any()).optional(),
              limit: z.number().optional(),
            }).strict(),
          ]).optional(),
          actionOnChange: z.object({ type: z.string() }).partial().optional(),
        }).strict()).default([]),
      }).strict(),
      hasChildren: false,
    },
    AISummary: {
      props: z.object({
        title: z.string().optional(),
        items: z.array(z.object({
          icon: z.string().optional(),
          text: z.string(),
          iconBgColor: z.string().optional(),
          iconColor: z.string().optional(),
        }).strict()).default([]),
        fr: z.number().optional(),
        itemGap: z.number().optional(),
        contentPaddingX: z.union([z.number(), z.string()]).optional(),
        contentPaddingBottom: z.union([z.number(), z.string()]).optional(),
        iconGap: z.number().optional(),
        iconBoxSize: z.number().optional(),
        iconSize: z.number().optional(),
        iconBoxRadius: z.union([z.number(), z.string()]).optional(),
        titleStyle: TitleStyleSchema.optional(),
        itemTextStyle: TitleStyleSchema.optional(),
        colorScheme: z.union([z.string(), z.array(z.string())]).optional(),
        containerStyle: ContainerStyleSchema.optional(),
        borderless: z.boolean().optional(),
        task: z.object({
          name: z.string().optional(),
          prompt: z.string().optional(),
          schedule: z.object({
            frequency: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
            hour: z.string().optional(),
            minute: z.string().optional(),
          }).partial().optional(),
          notifications: z.object({
            channels: z.array(z.enum(['email', 'whatsapp'])).default([]).optional(),
          }).partial().optional(),
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
