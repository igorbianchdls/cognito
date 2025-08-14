import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage, tool } from 'ai';
import { z } from 'zod';
import type { DroppedWidget } from '@/types/widget';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, widgets }: { messages: UIMessage[], widgets: DroppedWidget[] } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: `You are a helpful AI assistant for the Apps Dashboard. You can help users with:
- General questions about their widgets and data
- Assistance with dashboard management
- Simple calculations and data analysis
- General productivity support

Use the getCanvasWidgets tool to see what widgets are currently on the canvas when users ask about their dashboard.

Respond in a clear, helpful manner. Keep responses concise and actionable.`,
    messages: convertToModelMessages(messages),
    tools: {
      getCanvasWidgets: tool({
        description: 'Get current widgets on the dashboard canvas with their positions, sizes and properties',
        inputSchema: z.object({}),
        execute: async () => {
          console.log('🔍 Getting canvas widgets:', widgets.length);
          
          return {
            success: true,
            widgets: widgets.map(w => ({
              id: w.id,
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
        }
      })
    }
  });

  return result.toUIMessageStreamResponse();
}