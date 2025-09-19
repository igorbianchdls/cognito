import { tool } from 'ai';
import { z } from 'zod';
import { $visualBuilderState } from '@/stores/visualBuilderStore';

export const getDashboardState = tool({
  description: 'Acessa o estado atual do dashboard builder para análise da IA, incluindo widgets, configuração do grid e código JSON',
  inputSchema: z.object({
    includeCode: z.boolean().optional().describe('Se deve incluir o código JSON completo na resposta')
  }),
  execute: async ({ includeCode = false }) => {
    const state = $visualBuilderState.get();

    return {
      widgets: state.widgets,
      gridConfig: state.gridConfig,
      parseErrors: state.parseErrors,
      isValid: state.isValid,
      widgetCount: state.widgets.length,
      widgetTypes: [...new Set(state.widgets.map(w => w.type))],
      ...(includeCode && { code: state.code })
    };
  }
});