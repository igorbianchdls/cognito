import { tool } from 'ai';
import { z } from 'zod';

export const planDashboard = tool({
  description: 'Structure and organize dashboard plan with detailed titles and descriptions for widgets',
  inputSchema: z.object({
    widgets: z.array(z.object({
      titulo: z.string().describe('Título detalhado do widget específico'),
      tipo: z.enum(['kpi', 'chart', 'table']).describe('Tipo do widget'),
      descricao: z.string().describe('Descrição detalhada do que o widget vai analisar')
    })).describe('Array de widgets a executar com títulos detalhados e descrições')
  }),
  execute: async ({ widgets }) => {
    console.log('📊 Estruturando plano de dashboard com', widgets.length, 'widgets');

    // Apenas organizar e estruturar, sem executar
    const planoEstruturado = widgets.map((widget, index) => ({
      numero: index + 1,
      titulo: widget.titulo,
      tipo: widget.tipo,
      descricao: widget.descricao,
      status: 'planejado',
      queryType: widget.tipo.toUpperCase()
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

