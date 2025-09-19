import { tool } from 'ai';
import { z } from 'zod';

export const updateDashboardTool = tool({
  description: 'Atualiza widgets existentes no dashboard baseado em IDs específicos',
  inputSchema: z.object({
    updateDescription: z.string().describe('Descrição das mudanças a fazer nos widgets existentes')
  }),
  execute: async ({ updateDescription }) => {
    // IA gera JSON com updates específicos por ID
    const updateJson = `{
  "updates": [
    {
      "id": "chart1",
      "changes": {
        "title": "Updated Chart Title",
        "styling": {
          "colors": ["#3b82f6", "#10b981", "#f59e0b"],
          "showLegend": true
        }
      }
    },
    {
      "id": "kpi1",
      "changes": {
        "title": "Updated KPI",
        "position": { "x": 6, "y": 0, "w": 4, "h": 2 },
        "kpiConfig": {
          "target": 1500,
          "kpiValueColor": "#059669"
        }
      }
    }
  ]
}`;

    return {
      success: true,
      updateJson,
      description: updateDescription,
      message: 'Widget updates generated and ready for preview'
    };
  }
});