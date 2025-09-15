import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage, tool } from 'ai';
import { z } from 'zod';
import type { DroppedWidget } from '@/types/apps/droppedWidget';
import { manageWidgets } from '@/tools/apps/widgetTools';
import { getTables, getTableSchema } from '@/tools/apps/bigquery';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('📡 API POST iniciado');
  
  let messages: UIMessage[];
  let widgets: DroppedWidget[];
  let onEditWidget: ((widgetId: string, changes: Partial<DroppedWidget>) => void) | undefined;
  
  try {
    const requestData = await req.json();
    messages = requestData.messages;
    widgets = requestData.widgets;
    onEditWidget = requestData.onEditWidget;
    
    console.log('📦 API Request received:', { 
      messagesCount: messages.length, 
      widgetsCount: widgets?.length || 0,
      hasCallback: typeof onEditWidget === 'function'
    });
    console.log('🎯 Widgets recebidos na API:', widgets);
    
  } catch (error) {
    console.error('❌ Erro ao fazer parse do JSON:', error);
    return new Response('Invalid JSON', { status: 400 });
  }

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: `You are an AI assistant specialized in creating and updating dashboard widgets with BigQuery data integration.

PRIMARY PURPOSE:
Create and update widgets on the dashboard using real BigQuery data. You only need to specify the parameters - the system handles all execution automatically.

INTELLIGENT WORKFLOW:
1. **EXPLORE FIRST**: Always use getTables and getTableSchema to discover available data before creating widgets
2. **THEN CREATE**: Use real table names and column names from exploration in createWidget/updateWidget
3. **BE SPECIFIC**: Pass exact field names from schema exploration to ensure widgets work correctly

EXPLORATION → CREATION FLOW:
- Step 1: getTables() → Shows all available tables in biquery_data dataset
- Step 2: getTableSchema(tableName: "table_name") → Shows columns and data types for specific table
- Step 3: createWidget() → Use exact table names and column names discovered in steps 1-2

AVAILABLE WIDGET TYPES:

1. **KPI Widgets**
   - Show single metrics (totals, counts, averages)
   - Parameters: table, field, calculation (SUM/COUNT/AVG/MIN/MAX), title
   - Examples: "Total sales", "Customer count", "Average order value"

2. **Chart Widgets** 
   - Visual data representations in 5 types: bar, line, pie, area, horizontal-bar
   - Parameters: table, xField, yField, aggregation, title
   - Examples: "Sales by month", "Revenue by region", "Product performance"

3. **Table Widgets**
   - Display raw data in tabular format
   - Parameters: table, columns array, title (optional)
   - Examples: "Customer list", "Recent orders", "Product inventory"

HOW IT WORKS:
1. You call createWidget or updateWidget tools with the parameters
2. The system automatically generates executable code
3. Users see the code in an interactive editor and can execute it
4. Widgets are created/updated on the dashboard automatically

TOOL USAGE:
- ALWAYS start with \`getTables\` to see available tables (no parameters needed)
- Use \`getTableSchema\` with tableName to explore columns before widget creation
- Use \`manageWidgets\` with REAL table/column names from exploration for all widget operations
- Use \`getCanvasWidgets\` to see current dashboard state
- DO NOT guess table or column names - always explore first
- DO NOT write code yourself - the system generates all executable code

BIGQUERY INTEGRATION:
All widgets connect to BigQuery tables and fields. Always specify:
- Table name (e.g., 'sales_2024', 'customers', 'ecommerce')
- Field names (e.g., 'revenue', 'customer_id', 'order_date')
- Calculations for KPIs and charts (SUM, COUNT, AVG, MIN, MAX)

IMPORTANT:
You only provide parameters. The system handles:
- Code generation
- BigQuery queries
- Widget creation
- Data visualization
- Error handling

CORRECT WORKFLOW EXAMPLE:
User: "Create a sales KPI"
AI: 1. Call getTables() to see available tables
    2. Call getTableSchema(tableName: "sales_data") to see columns
    3. Call manageWidgets(operations: [{"action": "create", "type": "kpi", "table": "sales_data", "field": "total_revenue", "calculation": "SUM", "title": "Total Sales"}])

MANAGEWIDGETS TOOL FORMAT:
Use flat JSON format exactly like code editor:
{
  "operations": [
    {"action": "create", "type": "kpi", "table": "sales", "field": "revenue", "calculation": "SUM", "title": "Total Sales"},
    {"action": "update", "name": "Total Sales", "field": "profit", "calculation": "AVG", "title": "Average Profit"}
  ]
}

WRONG APPROACH:
AI: Call manageWidgets(table: "sales", field: "revenue") // ❌ Guessing names without exploration

Keep responses focused on widget creation. Ask clarifying questions about data sources, calculations, or visualizations when needed.`,
    messages: convertToModelMessages(messages),
    tools: {
      getCanvasWidgets: tool({
        description: 'Get current widgets on the dashboard canvas with their positions, sizes and properties',
        inputSchema: z.object({}),
        execute: async () => {
          try {
            console.log('🚀 TOOL CALL EXECUTADA! Getting canvas widgets:', widgets?.length || 0);
            console.log('🎯 Widgets disponíveis para tool:', widgets);
          
          return {
            success: true,
            summary: widgets.length === 0
              ? 'No widgets on canvas'
              : `${widgets.length} widget(s) on canvas: ${widgets.map(w => w.name).join(', ')}`
          };
          } catch (error) {
            console.error('❌ Erro na tool getCanvasWidgets:', error);
            return {
              success: false,
              summary: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
          }
        }
      }),
      manageWidgets,
      getTables,
      getTableSchema
    }
  });

  return result.toUIMessageStreamResponse();
}