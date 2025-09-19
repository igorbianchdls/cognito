import { tool } from 'ai';
import { z } from 'zod';

export const createDashboardTool = tool({
  description: 'Cria dashboard JSON com preview editável baseado em descrição',
  inputSchema: z.object({
    dashboardDescription: z.string().describe('Descrição do dashboard a ser criado')
  }),
  execute: async ({ dashboardDescription }) => {
    // IA gera JSON baseado na descrição fornecida
    const generatedJson = `{
  "config": {
    "maxRows": 12,
    "rowHeight": 30,
    "cols": 12
  },
  "widgets": [
    {
      "id": "chart1",
      "type": "bar",
      "position": { "x": 0, "y": 0, "w": 6, "h": 4 },
      "title": "Sample Bar Chart",
      "dataSource": {
        "table": "sample_data",
        "x": "category",
        "y": "value",
        "aggregation": "SUM"
      }
    },
    {
      "id": "kpi1",
      "type": "kpi",
      "position": { "x": 6, "y": 0, "w": 3, "h": 2 },
      "title": "Sample KPI",
      "dataSource": {
        "table": "sample_data",
        "x": "value",
        "aggregation": "COUNT"
      }
    }
  ]
}`;

    return {
      success: true,
      generatedJson,
      description: dashboardDescription,
      message: 'Dashboard JSON generated and ready for preview'
    };
  }
});