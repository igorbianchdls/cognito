import { tool } from 'ai';
import { z } from 'zod';

export const updateDashboardTool = tool({
  description: 'Adiciona novos widgets ao dashboard existente',
  inputSchema: z.object({
    updateDescription: z.string().describe('Descrição dos novos widgets a adicionar ao dashboard'),
    newWidgets: z.array(z.object({
      id: z.string().describe('ID único para o novo widget'),
      type: z.enum(['bar', 'line', 'pie', 'area', 'kpi', 'table']).describe('Tipo do widget'),
      position: z.object({
        x: z.number().describe('Posição X no grid'),
        y: z.number().describe('Posição Y no grid'),
        w: z.number().describe('Largura do widget em colunas'),
        h: z.number().describe('Altura do widget em linhas')
      }).describe('Posição e tamanho no grid'),
      title: z.string().describe('Título do widget'),
      dataSource: z.object({
        table: z.string().describe('Nome EXATO da tabela descoberta via getTables'),
        x: z.string().optional().describe('Campo X - coluna EXATA descoberta via getTableSchema'),
        y: z.string().optional().describe('Campo Y - coluna EXATA descoberta via getTableSchema'),
        aggregation: z.enum(['SUM', 'COUNT', 'AVG', 'MIN', 'MAX']).optional().describe('Tipo de agregação para cálculos')
      }).describe('Fonte de dados com nomes reais das tabelas e colunas')
    })).describe('Array de novos widgets a serem adicionados')
  }),
  execute: async ({ updateDescription, newWidgets }) => {
    try {
      console.log('🎨 updateDashboardTool: Adicionando novos widgets');
      console.log(`📊 Descrição: ${updateDescription}`);
      console.log(`📈 Novos widgets: ${newWidgets.length} widgets definidos`);

      // Validação dos novos widgets
      for (const widget of newWidgets) {
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

        // Validar posições no grid (assumindo grid 12x12)
        if (widget.position.x < 0 || widget.position.x >= 12) {
          throw new Error(`Widget ${widget.id}: invalid x position (${widget.position.x})`);
        }
        if (widget.position.w <= 0 || widget.position.x + widget.position.w > 12) {
          throw new Error(`Widget ${widget.id}: invalid width (${widget.position.w})`);
        }
        if (widget.position.h <= 0) {
          throw new Error(`Widget ${widget.id}: invalid height (${widget.position.h})`);
        }
      }

      // Gerar JSON com os novos widgets
      const updateJson = JSON.stringify({
        newWidgets: newWidgets
      }, null, 2);

      return {
        success: true,
        updateJson,
        description: updateDescription,
        totalNewWidgets: newWidgets.length,
        message: `${newWidgets.length} novos widgets adicionados com sucesso ao dashboard`
      };

    } catch (error) {
      console.error('❌ Error in updateDashboardTool:', error);
      return {
        success: false,
        description: updateDescription,
        totalNewWidgets: newWidgets.length,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: `Failed to add widgets: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
});