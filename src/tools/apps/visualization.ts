import { tool } from 'ai';
import { z } from 'zod';
import { bigQueryService } from '@/services/bigquery';

// Tipo para dados retornados do BigQuery
type BigQueryRowData = Record<string, unknown>;

// Função para gerar SQL automaticamente baseado no tipo de gráfico
const generateSQL = (tipo: string, x: string, y: string, tabela: string, agregacao?: string): string => {
  // Define agregação padrão se não fornecida
  const defaultAgregacao = tipo === 'pie' ? 'COUNT' : 'SUM';
  const funcaoAgregacao = agregacao || defaultAgregacao;

  switch (tipo) {
    case 'bar':
    case 'line':
      if (funcaoAgregacao === 'COUNT') {
        return `SELECT ${x}, COUNT(*) as count FROM ${tabela} GROUP BY ${x} ORDER BY ${x} LIMIT 50`;
      }
      return `SELECT ${x}, ${funcaoAgregacao}(${y}) as ${y} FROM ${tabela} GROUP BY ${x} ORDER BY ${x} LIMIT 50`;
    case 'pie':
      if (funcaoAgregacao === 'COUNT') {
        return `SELECT ${x}, COUNT(*) as count FROM ${tabela} GROUP BY ${x} ORDER BY count DESC LIMIT 10`;
      }
      return `SELECT ${x}, ${funcaoAgregacao}(${y}) as ${y} FROM ${tabela} GROUP BY ${x} ORDER BY ${funcaoAgregacao}(${y}) DESC LIMIT 10`;
    default:
      return `SELECT ${x}, ${y} FROM ${tabela} LIMIT 50`;
  }
};

// Função para processar dados BigQuery para formato dos charts
const processDataForChart = (data: BigQueryRowData[], x: string, y: string, tipo: string) => {
  return data.map(row => ({
    x: String(row[x] || 'N/A'),
    y: Number(row[y] || row.count || 0),
    label: String(row[x] || 'N/A'),
    value: Number(row[y] || row.count || 0)
  }));
};

export const gerarGrafico = tool({
  description: 'Gera gráfico visual com SQL automático',
  inputSchema: z.object({
    tipo: z.enum(['bar', 'line', 'pie']).describe('Tipo do gráfico'),
    x: z.string().describe('Coluna X'),
    y: z.string().describe('Coluna Y'),
    tabela: z.string().describe('Nome da tabela (ex: dataset.tabela)'),
    agregacao: z.enum(['SUM', 'COUNT', 'AVG', 'MAX', 'MIN']).optional().describe('Função de agregação (padrão: SUM para bar/line, COUNT para pie)'),
    titulo: z.string().describe('Título do gráfico'),
    descricao: z.string().optional().describe('Descrição do gráfico')
  }),
  execute: async ({ tipo, x, y, tabela, agregacao, titulo, descricao }) => {
    try {
      // 1. Gerar SQL automaticamente
      const sqlQuery = generateSQL(tipo, x, y, tabela, agregacao);
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

      // Processar dados para formato dos charts
      const processedData = processDataForChart(data, x, y, tipo);

      // Retornar objeto JSON (generative UI será renderizada no RespostaDaIA.tsx)
      return {
        success: true,
        chartData: processedData,
        chartType: tipo,
        title: titulo,
        description: descricao,
        xColumn: x,
        yColumn: y,
        aggregation: agregacao || (tipo === 'pie' ? 'COUNT' : 'SUM'),
        sqlQuery,
        totalRecords: data.length,
        metadata: {
          generatedAt: new Date().toISOString(),
          dataSource: 'bigquery-sql'
        }
      };
    } catch (error) {
      console.error('❌ Erro na geração do gráfico:', error);

      // Fallback para mock em caso de erro
      return {
        success: true,
        message: `⚠️ Gráfico ${tipo} criado (modo fallback): ${titulo}`,
        sqlQuery: generateSQL(tipo, x, y, tabela, agregacao),
        chartType: tipo,
        title: titulo,
        description: descricao,
        xColumn: x,
        yColumn: y,
        aggregation: agregacao || (tipo === 'pie' ? 'COUNT' : 'SUM'),
        table: tabela,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallbackMode: true
      };
    }
  }
});