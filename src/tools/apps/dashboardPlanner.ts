import { tool } from 'ai';
import { z } from 'zod';

export const planDashboard = tool({
  description: 'Structure and organize dashboard plan with detailed titles and SQL queries for widgets',
  inputSchema: z.object({
    widgets: z.array(z.object({
      titulo: z.string().describe('Título detalhado do widget específico'),
      tipo: z.enum(['kpi', 'chart', 'table']).describe('Tipo do widget'),
      query: z.string().describe('Query SQL para executar o widget')
    })).describe('Array de widgets a executar com títulos detalhados e queries SQL')
  }),
  execute: async ({ widgets }) => {
    console.log('📊 Estruturando plano de dashboard com', widgets.length, 'widgets');

    // Apenas organizar e estruturar, sem executar
    const planoEstruturado = widgets.map((widget, index) => ({
      numero: index + 1,
      titulo: widget.titulo,
      tipo: widget.tipo,
      query: widget.query,
      status: 'planejado',
      queryType: widget.query.trim().toLowerCase().split(' ')[0].toUpperCase()
    }));

    return {
      success: true,
      totalWidgets: widgets.length,
      plano: planoEstruturado,
      message: `Plano de dashboard criado com ${widgets.length} widgets estruturados`,
      metadata: {
        generatedAt: new Date().toISOString(),
        planType: 'dashboard-structure'
      }
    };
  }
});

