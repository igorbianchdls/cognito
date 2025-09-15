import { tool } from 'ai';
import { z } from 'zod';
import { bigQueryService } from '@/services/bigquery';

// Função para gerar SQL automaticamente baseado no tipo de gráfico
const generateSQL = (tipo: string, x: string, y: string, tabela: string): string => {
  switch (tipo) {
    case 'bar':
    case 'line':
      return `SELECT ${x}, SUM(${y}) as ${y} FROM ${tabela} GROUP BY ${x} ORDER BY ${x} LIMIT 50`;
    case 'pie':
      return `SELECT ${x}, COUNT(*) as count FROM ${tabela} GROUP BY ${x} ORDER BY count DESC LIMIT 10`;
    default:
      return `SELECT ${x}, ${y} FROM ${tabela} LIMIT 50`;
  }
};

export const gerarGrafico = tool({
  description: 'Gera gráfico visual com SQL automático',
  inputSchema: z.object({
    tipo: z.enum(['bar', 'line', 'pie']).describe('Tipo do gráfico'),
    x: z.string().describe('Coluna X'),
    y: z.string().describe('Coluna Y'),
    tabela: z.string().describe('Nome da tabela (ex: dataset.tabela)')
  }),
  execute: async ({ tipo, x, y, tabela }) => {
    try {
      // 1. Gerar SQL automaticamente
      const sqlQuery = generateSQL(tipo, x, y, tabela);
      console.log('🔍 SQL gerado:', sqlQuery);

      // 2. Inicializar BigQuery service se necessário
      if (!bigQueryService['client']) {
        console.log('⚡ Inicializando BigQuery service...');
        await bigQueryService.initialize();
      }

      // 3. Executar query no BigQuery
      console.log('📊 Executando query no BigQuery...');
      const result = await bigQueryService.executeQuery({
        query: sqlQuery,
        jobTimeoutMs: 30000
      });

      const data = result.data || [];
      console.log(`✅ Query executada com sucesso: ${data.length} registros`);

      return {
        success: true,
        message: `✅ Gráfico ${tipo} criado: ${y} por ${x} da tabela ${tabela} (${data.length} registros)`,
        sqlQuery,
        data: data.slice(0, 10), // Mostrar apenas primeiros 10 registros
        totalRecords: data.length,
        chartType: tipo,
        xColumn: x,
        yColumn: y,
        table: tabela
      };
    } catch (error) {
      console.error('❌ Erro na geração do gráfico:', error);

      // Fallback para mock em caso de erro
      return {
        success: true,
        message: `⚠️ Gráfico ${tipo} criado (modo fallback): ${y} por ${x} da tabela ${tabela}`,
        sqlQuery: generateSQL(tipo, x, y, tabela),
        chartType: tipo,
        xColumn: x,
        yColumn: y,
        table: tabela,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallbackMode: true
      };
    }
  }
});