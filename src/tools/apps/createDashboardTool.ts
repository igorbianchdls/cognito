import { tool } from 'ai';
import { z } from 'zod';

export const createDashboardTool = tool({
  description: 'Cria dashboard completo baseado em dados reais explorados com getTables e getTableSchema',
  inputSchema: z.object({
    dashboardDescription: z.string().describe('Descrição do dashboard a ser criado'),
    theme: z.enum(['light', 'dark', 'minimal', 'corporate', 'neon', 'circuit', 'glass']).optional().describe('Tema visual do dashboard'),
    gridConfig: z.object({
      layoutRows: z.record(z.string(), z.object({
        desktop: z.number().describe('Número de colunas no desktop'),
        tablet: z.number().describe('Número de colunas no tablet'),
        mobile: z.number().describe('Número de colunas no mobile')
      })).describe('Layout responsivo por linhas (ex: "1", "2", "3")')
    }),
    widgets: z.array(z.object({
      id: z.string().describe('ID único do widget (ex: "chart1", "kpi1")'),
      type: z.enum(['bar', 'line', 'pie', 'area', 'kpi', 'table']).describe('Tipo de widget'),
      position: z.object({
        x: z.number().describe('Posição X no grid (0-based)'),
        y: z.number().describe('Posição Y no grid (0-based)'),
        w: z.number().describe('Largura do widget em colunas do grid'),
        h: z.number().describe('Altura do widget em linhas do grid')
      }).describe('Posição e tamanho no grid'),
      title: z.string().describe('Título do widget'),
      // Campos responsivos opcionais
      row: z.string().optional().describe('Referência para linha do layout (ex: "1", "2", "3")'),
      span: z.object({
        desktop: z.number().optional().describe('Quantas colunas ocupar no desktop'),
        tablet: z.number().optional().describe('Quantas colunas ocupar no tablet'),
        mobile: z.number().optional().describe('Quantas colunas ocupar no mobile')
      }).optional().describe('Configuração responsiva de spanning'),
      order: z.number().optional().describe('Ordem de exibição do widget'),
      dataSource: z.object({
        table: z.string().describe('Nome EXATO da tabela descoberta via getTables'),
        x: z.string().optional().describe('Campo X - coluna EXATA descoberta via getTableSchema'),
        y: z.string().optional().describe('Campo Y - coluna EXATA descoberta via getTableSchema'),
        aggregation: z.enum(['SUM', 'COUNT', 'AVG', 'MIN', 'MAX']).optional().describe('Tipo de agregação para cálculos')
      }).describe('Fonte de dados com nomes reais das tabelas e colunas'),
    }))
  }),
  execute: async ({ dashboardDescription, theme, gridConfig, widgets }) => {
    console.log('🎨 createDashboardTool: Criando dashboard com dados reais');
    console.log(`📊 Dashboard: ${dashboardDescription}`);
    console.log(`📈 Widgets: ${widgets.length} widgets definidos`);

    try {
      // Validação dos widgets
      for (const widget of widgets) {
        // Validar campos obrigatórios por tipo
        if (['bar', 'line', 'pie', 'area'].includes(widget.type)) {
          if (!widget.dataSource.x || !widget.dataSource.y) {
            throw new Error(`Widget ${widget.id} (${widget.type}): missing x or y field`);
          }
          if (!widget.dataSource.aggregation) {
            throw new Error(`Widget ${widget.id} (${widget.type}): missing aggregation`);
          }
        }

        if (widget.type === 'kpi') {
          if (!widget.dataSource.y) {
            throw new Error(`Widget ${widget.id} (KPI): missing y field`);
          }
          if (!widget.dataSource.aggregation) {
            throw new Error(`Widget ${widget.id} (KPI): missing aggregation`);
          }
        }

        // Validar posições no grid
        if (widget.position.x < 0) {
          throw new Error(`Widget ${widget.id}: invalid x position (${widget.position.x})`);
        }
        if (widget.position.w <= 0) {
          throw new Error(`Widget ${widget.id}: invalid width (${widget.position.w})`);
        }
        if (widget.position.h <= 0) {
          throw new Error(`Widget ${widget.id}: invalid height (${widget.position.h})`);
        }
      }

      // Gerar configuração final do dashboard
      const dashboardConfig = {
        config: gridConfig,
        theme: theme || 'light',
        widgets: widgets
      };

      return {
        success: true,
        description: dashboardDescription,
        totalWidgets: widgets.length,
        dashboardConfig: dashboardConfig,
        message: `Dashboard "${dashboardDescription}" created with ${widgets.length} widgets using real data sources`,
        generatedJson: JSON.stringify(dashboardConfig, null, 2)
      };

    } catch (error) {
      console.error('❌ Error in createDashboardTool:', error);
      return {
        success: false,
        description: dashboardDescription,
        totalWidgets: widgets.length,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: `Failed to create dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
});