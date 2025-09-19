import { tool } from 'ai';
import { z } from 'zod';
import { $visualBuilderState, visualBuilderActions } from '@/stores/visualBuilderStore';

export const getDashboardCode = tool({
  description: 'Obtém informações do dashboard builder atual incluindo widgets, configurações e código',
  inputSchema: z.object({}),
  execute: async () => {
    try {
      let currentState = $visualBuilderState.get();

      // Se o estado estiver vazio, tentar inicializar
      if (currentState.widgets.length === 0 && !currentState.isValid) {
        console.log('🔄 Tool getDashboardCode: Estado vazio, inicializando...');
        visualBuilderActions.initialize();
        currentState = $visualBuilderState.get();
      }

      console.log('🚀 TOOL CALL EXECUTADA! Getting dashboard code:', {
        widgetsCount: currentState.widgets.length,
        isValid: currentState.isValid,
        hasErrors: currentState.parseErrors.length > 0,
        codeLength: currentState.code.length
      });

      return {
        success: true,
        widgets: currentState.widgets,
        totalWidgets: currentState.widgets.length,
        gridConfig: currentState.gridConfig,
        code: currentState.code,
        isValid: currentState.isValid,
        parseErrors: currentState.parseErrors,
        summary: currentState.widgets.length === 0
          ? 'No widgets configured in dashboard'
          : `${currentState.widgets.length} widget(s) configured: ${currentState.widgets.map(w => w.title || w.id).join(', ')}`
      };
    } catch (error) {
      console.error('❌ Erro na tool getDashboardCode:', error);
      return {
        success: false,
        widgets: [],
        totalWidgets: 0,
        summary: `Error getting dashboard info: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
});