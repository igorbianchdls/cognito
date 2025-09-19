import { tool } from 'ai';
import { z } from 'zod';

export const getDashboardCode = tool({
  description: 'Obtém informações do dashboard builder atual incluindo widgets, configurações e código',
  inputSchema: z.object({}),
  execute: async () => {
    console.log('🚀 TOOL CALL EXECUTADA! getDashboardCode - preparando dados para UI');

    // Retorna dados que serão usados pelo componente renderDashboardCode
    return {
      success: true,
      action: 'renderDashboard',
      message: 'Dashboard state retrieved successfully'
    };
  }
});