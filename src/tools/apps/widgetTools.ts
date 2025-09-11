import { tool } from 'ai';
import { z } from 'zod';

export const createWidget = tool({
  description: 'Create new widgets on the dashboard with BigQuery integration',
  inputSchema: z.object({
    widgets: z.array(z.discriminatedUnion('type', [
      // KPI
      z.object({
        type: z.literal('kpi'),
        table: z.string().describe('BigQuery table name'),
        field: z.string().describe('Field to calculate KPI from'),
        calculation: z.enum(['SUM', 'COUNT', 'AVG', 'MIN', 'MAX']),
        title: z.string().describe('KPI title/name')
      }),
      // Chart
      z.object({
        type: z.literal('chart'),
        chartType: z.enum(['bar', 'line', 'pie', 'area', 'horizontal-bar']),
        table: z.string().describe('BigQuery table name'),
        xField: z.string().describe('X-axis field'),
        yField: z.string().describe('Y-axis field'),
        aggregation: z.enum(['SUM', 'COUNT', 'AVG', 'MIN', 'MAX']),
        title: z.string().describe('Chart title')
      }),
      // Table
      z.object({
        type: z.literal('table'),
        table: z.string().describe('BigQuery table name'),
        columns: z.array(z.string()).min(1),
        title: z.string().optional()
      })
    ]))
  }),
  execute: async ({ widgets }) => {
    console.log('🎯 createWidget tool executed with:', widgets.length, 'widgets');
    
    try {
      const operations = widgets.map(widget => ({
        action: 'create' as const,
        type: widget.type,
        params: widget
      }));
      
      return {
        success: true,
        totalWidgets: widgets.length,
        created: widgets.length,
        failed: 0,
        message: `${widgets.length} widget(s) prontos para criação.`,
        operations,
        results: widgets.map((widget, index) => ({
          type: widget.type,
          success: true,
          name: widget.title || `Widget ${index + 1}`,
          message: 'Pronto para execução'
        }))
      };
    } catch (error) {
      console.error('❌ Error in createWidget tool:', error);
      return {
        success: false,
        totalWidgets: widgets.length,
        created: 0,
        failed: widgets.length,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        operations: []
      };
    }
  }
});

export const updateWidget = tool({
  description: 'Update existing widgets on the dashboard',
  inputSchema: z.object({
    updates: z.array(z.object({
      widgetName: z.string().describe('Name of widget to update'),
      changes: z.object({
        newTitle: z.string().optional(),
        newTable: z.string().optional(),
        newField: z.string().optional(),
        newCalculation: z.enum(['SUM', 'COUNT', 'AVG', 'MIN', 'MAX']).optional(),
        newXField: z.string().optional(),
        newYField: z.string().optional(),
        newChartType: z.enum(['bar', 'line', 'pie', 'area', 'horizontal-bar']).optional(),
        newAggregation: z.enum(['SUM', 'COUNT', 'AVG', 'MIN', 'MAX']).optional(),
        newColumns: z.array(z.string()).optional()
      }).refine(data => {
        if (data.newXField || data.newYField) {
          return data.newXField && data.newYField;
        }
        return true;
      }, "Chart updates require both xField and yField")
    }))
  }),
  execute: async ({ updates }) => {
    console.log('🔄 updateWidget tool executed with:', updates.length, 'updates');
    
    try {
      const operations = updates.map(update => ({
        action: 'update' as const,
        widgetName: update.widgetName,
        params: update.changes
      }));
      
      return {
        success: true,
        totalUpdates: updates.length,
        successful: updates.length,
        failed: 0,
        message: `${updates.length} update(s) prontos para execução.`,
        operations,
        results: updates.map(update => ({
          widgetName: update.widgetName,
          success: true,
          message: 'Pronto para execução'
        }))
      };
    } catch (error) {
      console.error('❌ Error in updateWidget tool:', error);
      return {
        success: false,
        totalUpdates: updates.length,
        successful: 0,
        failed: updates.length,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        operations: []
      };
    }
  }
});