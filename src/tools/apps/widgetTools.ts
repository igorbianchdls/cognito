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
  description: 'Update one or multiple widgets in a single call',
  inputSchema: z.object({
    widgets: z.array(z.object({
      name: z.string().describe('Name of widget to update'),
      field: z.string().optional().describe('New field for KPI'),
      calculation: z.enum(['SUM', 'COUNT', 'AVG', 'MIN', 'MAX']).optional().describe('New calculation for KPI'),
      table: z.string().optional().describe('New BigQuery table'),
      title: z.string().optional().describe('New widget title'),
      xField: z.string().optional().describe('New X-axis field for chart'),
      yField: z.string().optional().describe('New Y-axis field for chart'),
      chartType: z.enum(['bar', 'line', 'pie', 'area', 'horizontal-bar']).optional().describe('New chart type'),
      aggregation: z.enum(['SUM', 'COUNT', 'AVG', 'MIN', 'MAX']).optional().describe('New aggregation for chart'),
      columns: z.array(z.string()).optional().describe('New columns for table')
    }))
  }),
  execute: async ({ widgets }) => {
    console.log('🔄 updateWidget tool executed with:', widgets.length, 'widgets');
    
    try {
      const operations = widgets.map(widget => ({
        action: 'update' as const,
        widgetName: widget.name,
        params: {
          newField: widget.field,
          newCalculation: widget.calculation,
          newTable: widget.table,
          newTitle: widget.title,
          newXField: widget.xField,
          newYField: widget.yField,
          newChartType: widget.chartType,
          newAggregation: widget.aggregation,
          newColumns: widget.columns
        }
      }));
      
      return {
        success: true,
        totalUpdates: widgets.length,
        successful: widgets.length,
        failed: 0,
        message: `${widgets.length} widget(s) prontos para atualização.`,
        operations,
        results: widgets.map(widget => ({
          widgetName: widget.name,
          success: true,
          message: 'Pronto para execução'
        }))
      };
    } catch (error) {
      console.error('❌ Error in updateWidget tool:', error);
      return {
        success: false,
        totalUpdates: widgets.length,
        successful: 0,
        failed: widgets.length,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        operations: []
      };
    }
  }
});