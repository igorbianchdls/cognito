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
      columns: z.array(z.string()).optional().describe('Table columns to display')
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