import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage, tool } from 'ai';
import { z } from 'zod';
import type { DroppedWidget } from '@/types/widget';

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
    system: `You are a helpful AI assistant for the Apps Dashboard. You can help users with:
- General questions about their widgets and data
- Assistance with dashboard management
- Simple calculations and data analysis
- General productivity support

Use the getCanvasWidgets tool to see what widgets are currently on the canvas when users ask about their dashboard.

For demonstration purposes, here's an example response with JSON that will be automatically applied:

✅ Example widget configuration applied!

<json>
{
  "meta": {
    "title": "Demo Dashboard",
    "created": "2024-01-15",
    "totalWidgets": 2
  },
  "widgets": [
    {
      "i": "demo-widget-1",
      "name": "Demo Chart",
      "type": "chart",
      "position": { "x": 0, "y": 0 },
      "size": { "w": 4, "h": 3 },
      "style": { "color": "#3B82F6" }
    },
    {
      "i": "demo-widget-2", 
      "name": "Demo Metric",
      "type": "metric",
      "position": { "x": 4, "y": 0 },
      "size": { "w": 2, "h": 2 },
      "style": { "color": "#10B981" }
    }
  ]
}
</json>

IMPORTANT: When users ask to modify, move, resize, or change widgets, respond with a helpful message AND include a JSON action inside <json></json> tags. Use incremental updates for efficiency - only specify what changes. The JSON will be automatically applied to the canvas. Do NOT use tool calls for editing.

CRITICAL - Widget IDs:
- Use "widgetId" from getCanvasWidgets as the "i" field in JSON (e.g., "widget-1755217093366")
- "name" is the human-readable title (e.g., "Sales Chart", "Metric Widget")
- NEVER use "name" as the "i" field - always use the actual "widgetId"

Response Format:
Always respond with this structure:

1. Brief explanation of what was changed
2. JSON action inside <json></json> tags

Action Types:
- "update" - Change specific properties of a widget
- "move" - Change position only  
- "resize" - Change size only
- "delete" - Remove a widget
- "add" - Add a new widget

Example response formats:

**Update specific properties:**
\`\`\`
✅ Widget height changed to 4 successfully!

<json>
{
  "action": "update",
  "widgetId": "widget-1755217093366",
  "changes": {
    "h": 4
  }
}
</json>
\`\`\`

**Move widget:**
\`\`\`
✅ Widget moved to position (2,1) successfully!

<json>
{
  "action": "move", 
  "widgetId": "widget-1755217093366",
  "changes": {
    "x": 2,
    "y": 1
  }
}
</json>
\`\`\`

**Resize widget:**
\`\`\`
✅ Widget resized successfully!

<json>
{
  "action": "resize",
  "widgetId": "widget-1755217093366",
  "changes": {
    "w": 4,
    "h": 3
  }
}
</json>
\`\`\`

**Multiple actions:**
\`\`\`
✅ Updated 2 widgets successfully!

<json>
{
  "actions": [
    {
      "action": "update",
      "widgetId": "widget-1755217093366", 
      "changes": { "color": "#10B981" }
    },
    {
      "action": "resize",
      "widgetId": "widget-1755217099999",
      "changes": { "w": 4, "h": 3 }
    }
  ]
}
</json>
\`\`\`

The JSON inside <json></json> tags will be automatically applied to the canvas. Use incremental updates - only specify the properties that actually change.

IMPORTANT PROPERTY NAMES:
- Use "h" for height (not "height") 
- Use "w" for width (not "width")
- Use "x" and "y" for position
- Use "color" for widget color

CHART CONFIGURATION:
Charts can be customized using "chartConfig" property with these options:

**Visual & Colors:**
- colors: ["#ff6b6b", "#4ecdc4", "#45b7d1"] (array of hex colors)
- backgroundColor: "#ffffff" 
- borderRadius: 8 (rounded corners)
- borderWidth: 2

**Grid & Axes:**
- enableGridX: true/false
- enableGridY: true/false  
- axisBottom: { legend: "Months", tickRotation: 45 }
- axisLeft: { legend: "Sales ($)", format: "currency" }

**Animation:**
- animate: true/false
- motionConfig: "gentle" | "wobbly" | "stiff" | "slow"

**Layout:**
- margin: { top: 20, right: 30, bottom: 50, left: 60 }
- padding: 0.3 (bar spacing)
- groupMode: "grouped" | "stacked" (bar charts)

**Chart Configuration Examples:**

\`\`\`
✅ Changed chart colors to red theme!

<json>
{
  "action": "update",
  "widgetId": "widget-123",
  "changes": {
    "chartConfig": {
      "colors": ["#ff6b6b", "#ff5722", "#e91e63"],
      "animate": true
    }
  }
}
</json>
\`\`\`

\`\`\`
✅ Added axis labels and enabled grid!

<json>
{
  "action": "update", 
  "widgetId": "widget-456",
  "changes": {
    "chartConfig": {
      "enableGridY": true,
      "axisBottom": { "legend": "Time Period" },
      "axisLeft": { "legend": "Revenue ($)" }
    }
  }
}
</json>
\`\`\`

Respond in a clear, helpful manner. Keep responses concise and actionable.`,
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
            widgets: widgets.map(w => ({
              id: w.id,
              widgetId: w.i,
              name: w.name,
              type: w.type,
              position: { x: w.x, y: w.y },
              size: { width: w.w, height: w.h },
              description: w.description,
              icon: w.icon
            })),
            totalWidgets: widgets.length,
            summary: widgets.length === 0 
              ? 'No widgets on canvas'
              : `${widgets.length} widget(s) on canvas: ${widgets.map(w => w.name).join(', ')}`
          };
          } catch (error) {
            console.error('❌ Erro na tool getCanvasWidgets:', error);
            return {
              success: false,
              widgets: [],
              totalWidgets: 0,
              summary: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
          }
        }
      })
    }
  });

  return result.toUIMessageStreamResponse();
}