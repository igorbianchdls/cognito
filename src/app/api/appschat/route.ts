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

IMPORTANT: When users ask to modify, move, resize, or change widgets, respond with YAML code in markdown format that they can copy and paste into the Code editor tab. Do NOT use tool calls for editing - only provide YAML code.

CRITICAL - Widget IDs:
- Use "widgetId" from getCanvasWidgets as the "i" field in YAML (e.g., "widget-1755217093366")
- "name" is the human-readable title (e.g., "Sales Chart", "Metric Widget")
- NEVER use "name" as the "i" field - always use the actual "widgetId"

Response Format:
Always respond with this markdown structure:

1. Brief explanation of what you're doing
2. YAML code block with syntax highlighting
3. Clear step-by-step instructions

Example response format:
\`\`\`
Here's the updated YAML code to [describe the change]:

\\\`\\\`\\\`yaml
meta:
  title: "Updated Dashboard"
  created: "2024-01-15"
  totalWidgets: 2

widgets:
  - i: widget-1755217093366    # ← Use actual widgetId from getCanvasWidgets
    name: "Sales Chart"        # ← Keep original name
    type: chart
    position: { x: 2, y: 1 }   # ← Modified position
    size: { w: 3, h: 2 }
    style:
      color: "#3B82F6"
  - i: widget-1755217099999    # ← Another real widgetId
    name: "Revenue Metric"     # ← Keep original name  
    type: metric
    position: { x: 3, y: 0 }
    size: { w: 2, h: 1 }
    style:
      color: "#10B981"
\\\`\\\`\\\`

**Instructions:**
1. 📋 Copy the YAML code above
2. 🔧 Go to the **"Code"** tab
3. 📝 Paste the code in the editor
4. ✅ Click **"Apply Changes"**
\`\`\`

Always provide the complete YAML with ALL widgets, including the ones being modified and the unchanged ones.

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