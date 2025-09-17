import { tool } from 'ai';
import { z } from 'zod';

export const manageWidgets = tool({
  description: 'Create or update dashboard widgets using code editor format',
  inputSchema: z.object({
    operations: z.array(z.object({
      action: z.enum(['create', 'update']),
      type: z.enum(['kpi', 'chart', 'table']).optional(),

      // Common fields
      table: z.string().optional().describe('BigQuery table name'),
      title: z.string().optional().describe('Widget title'),

      // For updates - widget identification
      name: z.string().optional().describe('Name of widget to update (required for updates)'),

      // KPI fields
      field: z.string().optional().describe('Field to calculate KPI from'),
      calculation: z.enum(['SUM', 'COUNT', 'AVG', 'MIN', 'MAX']).optional().describe('Calculation method'),

      // Chart fields
      chartType: z.enum(['bar', 'line', 'pie', 'area', 'horizontal-bar']).optional().describe('Chart type'),
      xField: z.string().optional().describe('X-axis field'),
      yField: z.string().optional().describe('Y-axis field'),
      aggregation: z.enum(['SUM', 'COUNT', 'AVG', 'MIN', 'MAX']).optional().describe('Chart aggregation method'),

      // Table fields
      columns: z.array(z.string()).optional().describe('Table columns to display'),

      // Background Advanced
      backgroundColor: z.string().optional().describe('Background color'),
      backgroundOpacity: z.number().min(0).max(1).optional().describe('Background opacity (0-1)'),
      backgroundGradient: z.object({
        enabled: z.boolean(),
        type: z.enum(['linear', 'radial', 'conic']),
        direction: z.string(),
        startColor: z.string(),
        endColor: z.string()
      }).optional().describe('Background gradient configuration'),
      backdropFilter: z.object({
        enabled: z.boolean(),
        blur: z.number()
      }).optional().describe('Backdrop filter configuration'),

      // Typography - Title/Subtitle
      titleFontSize: z.number().optional().describe('Title font size'),
      titleFontWeight: z.number().optional().describe('Title font weight'),
      titleColor: z.string().optional().describe('Title color'),
      subtitleFontSize: z.number().optional().describe('Subtitle font size'),
      subtitleFontWeight: z.number().optional().describe('Subtitle font weight'),
      subtitleColor: z.string().optional().describe('Subtitle color'),

      // Spacing - Title/Subtitle
      titleMarginTop: z.number().optional().describe('Title margin top'),
      titleMarginRight: z.number().optional().describe('Title margin right'),
      titleMarginBottom: z.number().optional().describe('Title margin bottom'),
      titleMarginLeft: z.number().optional().describe('Title margin left'),
      titlePaddingTop: z.number().optional().describe('Title padding top'),
      titlePaddingRight: z.number().optional().describe('Title padding right'),
      titlePaddingBottom: z.number().optional().describe('Title padding bottom'),
      titlePaddingLeft: z.number().optional().describe('Title padding left'),
      subtitleMarginTop: z.number().optional().describe('Subtitle margin top'),
      subtitleMarginRight: z.number().optional().describe('Subtitle margin right'),
      subtitleMarginBottom: z.number().optional().describe('Subtitle margin bottom'),
      subtitleMarginLeft: z.number().optional().describe('Subtitle margin left'),
      subtitlePaddingTop: z.number().optional().describe('Subtitle padding top'),
      subtitlePaddingRight: z.number().optional().describe('Subtitle padding right'),
      subtitlePaddingBottom: z.number().optional().describe('Subtitle padding bottom'),
      subtitlePaddingLeft: z.number().optional().describe('Subtitle padding left'),

      // Tailwind Classes - Title/Subtitle
      titleClassName: z.string().optional().describe('Title CSS class name'),
      subtitleClassName: z.string().optional().describe('Subtitle CSS class name'),
      containerClassName: z.string().optional().describe('Container CSS class name'),

      // Container Border & Shadow
      containerBorderWidth: z.number().optional().describe('Container border width'),
      containerBorderColor: z.string().optional().describe('Container border color'),
      containerBorderRadius: z.number().optional().describe('Container border radius'),
      containerPadding: z.number().optional().describe('Container padding'),
      containerShadowColor: z.string().optional().describe('Container shadow color'),
      containerShadowOpacity: z.number().min(0).max(1).optional().describe('Container shadow opacity'),
      containerShadowBlur: z.number().optional().describe('Container shadow blur'),
      containerShadowOffsetX: z.number().optional().describe('Container shadow offset X'),
      containerShadowOffsetY: z.number().optional().describe('Container shadow offset Y')
    }))
  }),
  execute: async ({ operations }) => {
    console.log('🎯 manageWidgets tool executed with:', operations.length, 'operations');

    try {
      // Validate operations
      const createOps = operations.filter(op => op.action === 'create');
      const updateOps = operations.filter(op => op.action === 'update');

      console.log(`📊 Operations breakdown: ${createOps.length} creates, ${updateOps.length} updates`);

      // Validate required fields for create operations
      for (const op of createOps) {
        if (!op.type) {
          throw new Error(`Create operation missing required 'type' field`);
        }
        if (op.type === 'kpi' && (!op.field || !op.calculation)) {
          throw new Error(`KPI create operation missing required 'field' or 'calculation'`);
        }
        if (op.type === 'chart' && (!op.xField || !op.yField || !op.chartType || !op.aggregation)) {
          throw new Error(`Chart create operation missing required fields`);
        }
        if (op.type === 'table' && !op.columns) {
          throw new Error(`Table create operation missing required 'columns'`);
        }
      }

      // Validate required fields for update operations
      for (const op of updateOps) {
        if (!op.name) {
          throw new Error(`Update operation missing required 'name' field`);
        }
      }

      return {
        success: true,
        totalOperations: operations.length,
        created: createOps.length,
        updated: updateOps.length,
        message: `${operations.length} widget operation(s) ready for execution.`,
        operations: operations // Return operations in flat format for code editor
      };
    } catch (error) {
      console.error('❌ Error in manageWidgets tool:', error);
      return {
        success: false,
        totalOperations: operations.length,
        created: 0,
        updated: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        operations: []
      };
    }
  }
});

// Export legacy tools as deprecated (for backwards compatibility during transition)
export const createWidget = manageWidgets;
export const updateWidget = manageWidgets;