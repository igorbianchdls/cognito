import { tool } from 'ai';
import { z } from 'zod';
import { bigQueryService } from '@/services/bigquery';

// Tipo para dados retornados do BigQuery
type BigQueryRowData = Record<string, unknown>;

// Função helper para adicionar backticks de forma inteligente
const safeSQLIdentifier = (identifier: string): string => {
  const trimmed = identifier.trim();
  // Se já tem backticks, retorna como está
  if (trimmed.startsWith('`') && trimmed.endsWith('`')) {
    return trimmed;
  }
  // Se contém parênteses (função SQL ou expressão), retorna como está
  if (trimmed.includes('(')) {
    return trimmed;
  }
  // Caso contrário, adiciona backticks
  return `\`${trimmed}\``;
};

// Função para processar cláusula ORDER BY
const processOrderBy = (orderBy: string): string => {
  return orderBy
    .split(',')
    .map(part => {
      const tokens = part.trim().split(/\s+/);
      const column = tokens[0];
      const direction = tokens.slice(1).join(' '); // ASC, DESC, ou vazio
      return direction
        ? `${safeSQLIdentifier(column)} ${direction}`
        : safeSQLIdentifier(column);
    })
    .join(', ');
};

// Função para processar cláusula WHERE
const processWhereClause = (where: string): string => {
  // Operadores SQL comuns (ordenados por tamanho para match correto)
  const operators = ['>=', '<=', '!=', '<>', '>', '<', '='];

  // Encontrar primeiro operador
  let operatorIndex = -1;
  let operator = '';

  for (const op of operators) {
    const index = where.indexOf(op);
    if (index !== -1 && (operatorIndex === -1 || index < operatorIndex)) {
      operatorIndex = index;
      operator = op;
    }
  }

  if (operatorIndex === -1) {
    // Sem operador encontrado, retorna como está
    return where;
  }

  // Separar coluna e resto da expressão
  const column = where.substring(0, operatorIndex).trim();
  const rest = where.substring(operatorIndex); // Inclui operador e valor

  return `${safeSQLIdentifier(column)}${rest}`;
};

// Função para gerar SQL automaticamente baseado no tipo de gráfico
const generateSQL = (tipo: string, x: string, y: string, tabela: string, agregacao?: string): string => {
  // Define agregação padrão se não fornecida
  const defaultAgregacao = tipo === 'pie' ? 'COUNT' : 'SUM';
  const funcaoAgregacao = agregacao || defaultAgregacao;

  switch (tipo) {
    case 'bar':
    case 'line':
    case 'horizontal-bar':
    case 'area':
      if (funcaoAgregacao === 'COUNT') {
        return `SELECT ${safeSQLIdentifier(x)}, COUNT(*) as count FROM ${tabela} GROUP BY ${safeSQLIdentifier(x)} ORDER BY ${safeSQLIdentifier(x)} LIMIT 50`;
      }
      return `SELECT ${safeSQLIdentifier(x)}, ${funcaoAgregacao}(${safeSQLIdentifier(y)}) as value FROM ${tabela} GROUP BY ${safeSQLIdentifier(x)} ORDER BY ${safeSQLIdentifier(x)} LIMIT 50`;
    case 'pie':
      if (funcaoAgregacao === 'COUNT') {
        return `SELECT ${safeSQLIdentifier(x)}, COUNT(*) as count FROM ${tabela} GROUP BY ${safeSQLIdentifier(x)} ORDER BY count DESC LIMIT 10`;
      }
      return `SELECT ${safeSQLIdentifier(x)}, ${funcaoAgregacao}(${safeSQLIdentifier(y)}) as value FROM ${tabela} GROUP BY ${safeSQLIdentifier(x)} ORDER BY ${funcaoAgregacao}(${safeSQLIdentifier(y)}) DESC LIMIT 10`;
    default:
      return `SELECT ${safeSQLIdentifier(x)}, ${safeSQLIdentifier(y)} FROM ${tabela} LIMIT 50`;
  }
};

// Função para gerar SQL para tabelas (sem agregação)
const generateSQLForTable = (
  colunas: string,
  tabela: string,
  filtro?: string,
  ordenacao?: string,
  limite?: number
): string => {
  // Adicionar backticks em cada coluna de forma inteligente
  const colunasComBackticks = colunas === '*'
    ? '*'
    : colunas.split(',').map(col => safeSQLIdentifier(col)).join(', ');

  let sql = `SELECT ${colunasComBackticks} FROM ${tabela}`;
  if (filtro) sql += ` WHERE ${processWhereClause(filtro)}`;
  if (ordenacao) sql += ` ORDER BY ${processOrderBy(ordenacao)}`;
  sql += ` LIMIT ${limite || 100}`;
  return sql;
};

// Função para processar dados BigQuery para formato dos charts
const processDataForChart = (data: BigQueryRowData[], x: string, y: string, tipo: string) => {
  return data.map(row => ({
    x: String(row[x] || 'N/A'),
    y: Number(row.value || row.count || 0),
    label: String(row[x] || 'N/A'),
    value: Number(row.value || row.count || 0)
  }));
};

export const gerarGrafico = tool({
  description: 'Gera gráfico visual com SQL automático',
  inputSchema: z.object({
    tipo: z.enum(['bar', 'line', 'pie', 'horizontal-bar', 'area']).describe('Tipo do gráfico'),
    x: z.string().describe('Coluna X'),
    y: z.string().describe('Coluna Y'),
    tabela: z.string().describe('Nome da tabela (ex: dataset.tabela)'),
    agregacao: z.enum(['SUM', 'COUNT', 'AVG', 'MAX', 'MIN']).optional().describe('Função de agregação (padrão: SUM para bar/line, COUNT para pie)'),
    titulo: z.string().describe('Título do gráfico'),
    descricao: z.string().optional().describe('Descrição do gráfico'),
    explicacao: z.string().optional().describe('Explicação do que este gráfico vai analisar')
  }),
  execute: async ({ tipo, x, y, tabela, agregacao, titulo, descricao, explicacao }) => {
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
        jobTimeoutMs: 180000
      });

      const data = result.data || [];
      console.log(`✅ Query executada com sucesso: ${data.length} registros`);

      // Debug: Dados brutos do BigQuery
      console.log('🔍 DADOS BRUTOS BigQuery:', {
        sqlQuery,
        rawDataLength: data.length,
        firstRawRow: data[0],
        allRawData: data.slice(0, 3)
      });

      // Processar dados para formato dos charts
      const processedData = processDataForChart(data, x, y, tipo);

      // Debug: Dados processados
      console.log('🔍 DADOS PROCESSADOS:', {
        processedLength: processedData.length,
        firstProcessed: processedData[0],
        allProcessed: processedData.slice(0, 3)
      });

      // Retornar objeto JSON (generative UI será renderizada no RespostaDaIA.tsx)
      return {
        success: true,
        chartData: processedData,
        chartType: tipo,
        title: titulo,
        description: descricao,
        explicacao: explicacao,
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

export const gerarMultiplosGraficos = tool({
  description: 'Gera múltiplos gráficos e tabelas em um dashboard para análises completas',
  inputSchema: z.object({
    tabela: z.string().describe('Nome da tabela (ex: creatto-463117.biquery_data.shopify_orders)'),
    graficos: z.array(z.object({
      tipo: z.enum(['bar', 'line', 'pie', 'horizontal-bar', 'area', 'table']).describe('Tipo do gráfico ou tabela'),
      x: z.string().optional().describe('Coluna X (obrigatório para gráficos, ignorado para tabelas)'),
      y: z.string().optional().describe('Coluna Y (obrigatório para gráficos, ignorado para tabelas)'),
      agregacao: z.enum(['SUM', 'COUNT', 'AVG', 'MAX', 'MIN']).optional().describe('Função de agregação para gráficos'),
      titulo: z.string().describe('Título do gráfico ou tabela'),
      descricao: z.string().optional().describe('Descrição do gráfico ou tabela'),
      explicacao: z.string().optional().describe('Explicação do que este gráfico/tabela vai analisar'),
      // Campos específicos para tabelas
      colunas: z.string().optional().describe('Colunas a selecionar para tabela (ex: "id, name, total_price") ou "*" para todas'),
      filtro: z.string().optional().describe('Condição WHERE para filtrar dados (ex: "total_price > 1000")'),
      ordenacao: z.string().optional().describe('Cláusula ORDER BY (ex: "created_at DESC")'),
      limite: z.number().optional().describe('LIMIT - número máximo de registros para tabela (padrão: 100)')
    })).describe('Array de configurações de gráficos e tabelas')
  }),
  execute: async ({ tabela, graficos }) => {
    console.log('📊 Gerando múltiplos gráficos:', { tabela, quantidadeGraficos: graficos.length });

    try {
      // Initialize BigQuery service if needed
      if (!bigQueryService['client']) {
        console.log('⚡ Inicializando BigQuery service...');
        await bigQueryService.initialize();
      }

      // Execute all queries in parallel
      const chartPromises = graficos.map(async (grafico, index) => {
        try {
          // Gerar SQL apropriado baseado no tipo
          const sqlQuery = grafico.tipo === 'table'
            ? generateSQLForTable(
                grafico.colunas || '*',
                tabela,
                grafico.filtro,
                grafico.ordenacao,
                grafico.limite
              )
            : generateSQL(grafico.tipo, grafico.x || '', grafico.y || '', tabela, grafico.agregacao);

          console.log(`🔍 SQL gerado para ${grafico.tipo === 'table' ? 'tabela' : 'gráfico'} ${index + 1}:`, sqlQuery);

          const result = await bigQueryService.executeQuery({
            query: sqlQuery,
            jobTimeoutMs: 180000
          });

          const data = result.data || [];

          // Debug: Dados do BigQuery
          console.log(`🔍 ${grafico.tipo.toUpperCase()} ${index + 1} - Dados BigQuery:`, {
            titulo: grafico.titulo,
            tipo: grafico.tipo,
            rawLength: data.length,
            firstRaw: data[0],
            sqlQuery
          });

          // Para TABELAS: retornar dados raw
          if (grafico.tipo === 'table') {
            return {
              success: true,
              type: 'table',
              tableData: data,
              title: grafico.titulo,
              description: grafico.descricao,
              explicacao: grafico.explicacao,
              sqlQuery,
              totalRecords: data.length,
              metadata: {
                generatedAt: new Date().toISOString(),
                dataSource: 'bigquery-sql'
              }
            };
          }

          // Para GRÁFICOS: validar campos obrigatórios
          if (!grafico.x || !grafico.y) {
            throw new Error(`Gráfico "${grafico.titulo}" do tipo "${grafico.tipo}" requer campos x e y`);
          }

          // Processar dados do gráfico
          const processedData = processDataForChart(data, grafico.x, grafico.y, grafico.tipo);

          // Debug: Dados processados do gráfico
          console.log(`🔍 GRÁFICO ${index + 1} - Dados Processados:`, {
            titulo: grafico.titulo,
            processedLength: processedData.length,
            firstProcessed: processedData[0]
          });

          return {
            success: true,
            type: 'chart',
            chartData: processedData,
            chartType: grafico.tipo,
            title: grafico.titulo,
            description: grafico.descricao,
            explicacao: grafico.explicacao,
            xColumn: grafico.x,
            yColumn: grafico.y,
            aggregation: grafico.agregacao || (grafico.tipo === 'pie' ? 'COUNT' : 'SUM'),
            sqlQuery,
            totalRecords: data.length,
            metadata: {
              generatedAt: new Date().toISOString(),
              dataSource: 'bigquery-sql'
            }
          };
        } catch (error) {
          console.error(`❌ Erro no item ${index + 1}:`, error);
          return {
            success: false,
            type: grafico.tipo === 'table' ? 'table' : 'chart',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            title: grafico.titulo,
            chartType: grafico.tipo
          };
        }
      });

      // Wait for all charts to complete
      const chartResults = await Promise.all(chartPromises);
      const successfulCharts = chartResults.filter(chart => chart.success);
      const failedCharts = chartResults.filter(chart => !chart.success);

      console.log(`✅ Dashboard gerado: ${successfulCharts.length}/${graficos.length} gráficos`);

      return {
        success: true,
        dashboardTitle: `Dashboard Shopify - ${successfulCharts.length} Gráficos`,
        charts: chartResults,
        summary: {
          total: graficos.length,
          successful: successfulCharts.length,
          failed: failedCharts.length,
          table: tabela
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          dataSource: 'bigquery-sql-multiple'
        }
      };

    } catch (error) {
      console.error('❌ Erro geral no dashboard:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao gerar dashboard',
        charts: [],
        summary: {
          total: graficos.length,
          successful: 0,
          failed: graficos.length,
          table: tabela
        }
      };
    }
  }
});