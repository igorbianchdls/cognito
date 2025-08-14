import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage, tool } from 'ai';
import { z } from 'zod';
import type { DroppedWidget } from '@/types/widget';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, widgets }: { messages: UIMessage[], widgets: DroppedWidget[] } = await req.json();
  
  console.log('📦 API Request received:', { 
    messagesCount: messages.length, 
    widgetsCount: widgets?.length || 0 
  });
  console.log('🎯 Widgets recebidos na API:', widgets);

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
          console.log('🚀 TOOL CALL EXECUTADA! Getting canvas widgets:', widgets?.length || 0);
          console.log('🎯 Widgets disponíveis para tool:', widgets);
          
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
      }),
      
      editWidget: tool({
        description: 'Edit widget properties like position, size, color, and styling on the dashboard canvas',
        inputSchema: z.object({
          widgetId: z.string().describe('ID of the widget to edit (use the "i" property from getCanvasWidgets)'),
          action: z.enum(['move', 'resize', 'changeColor', 'changeStyle', 'delete']).describe('Type of edit to perform'),
          
          position: z.object({
            x: z.number().min(0).describe('X coordinate in grid units'),
            y: z.number().min(0).describe('Y coordinate in grid units')
          }).optional().describe('New position (required for move action)'),
          
          size: z.object({
            width: z.number().min(1).describe('Width in grid units'),
            height: z.number().min(1).describe('Height in grid units')
          }).optional().describe('New size (required for resize action)'),
          
          color: z.string().optional().describe('New color theme: blue, red, green, purple, or hex code (required for changeColor action)'),
          
          style: z.object({
            borderRadius: z.enum(['small', 'medium', 'large']).optional(),
            shadow: z.boolean().optional(),
            background: z.enum(['solid', 'gradient']).optional()
          }).optional().describe('Style properties (required for changeStyle action)')
        }),
        execute: async ({ widgetId, action, position, size, color, style }) => {
          console.log('🎨 EDIT WIDGET TOOL EXECUTADA!', { widgetId, action, position, size, color, style });
          
          // Find the widget to edit
          const widgetIndex = widgets.findIndex(w => w.i === widgetId);
          if (widgetIndex === -1) {
            return {
              success: false,
              error: `Widget with ID "${widgetId}" not found on canvas`,
              availableWidgets: widgets.map(w => ({ id: w.i, name: w.name }))
            };
          }
          
          const widget = widgets[widgetIndex];
          let changes = {};
          
          try {
            switch (action) {
              case 'move':
                if (!position) {
                  return { success: false, error: 'Position is required for move action' };
                }
                changes = { x: position.x, y: position.y };
                break;
                
              case 'resize':
                if (!size) {
                  return { success: false, error: 'Size is required for resize action' };
                }
                changes = { w: size.width, h: size.height };
                break;
                
              case 'changeColor':
                if (!color) {
                  return { success: false, error: 'Color is required for changeColor action' };
                }
                // Note: This would need to be implemented in the widget component
                changes = { color };
                break;
                
              case 'changeStyle':
                if (!style) {
                  return { success: false, error: 'Style is required for changeStyle action' };
                }
                // Note: This would need to be implemented in the widget component  
                changes = { style };
                break;
                
              case 'delete':
                // Note: This would need to trigger widget removal
                return {
                  success: true,
                  action: 'delete',
                  widgetId,
                  widgetName: widget.name,
                  message: `Widget "${widget.name}" would be deleted (not implemented yet - needs frontend callback)`
                };
                
              default:
                return { success: false, error: `Unknown action: ${action}` };
            }
            
            return {
              success: true,
              action,
              widgetId,
              widgetName: widget.name,
              changes,
              message: `Widget "${widget.name}" ${action} completed`,
              note: 'Changes are simulated - real implementation needs frontend state updates'
            };
            
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error occurred',
              widgetId,
              action
            };
          }
        }
      })
    }
  });

  return result.toUIMessageStreamResponse();
}