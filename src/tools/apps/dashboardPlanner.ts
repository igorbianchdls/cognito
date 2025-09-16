import { tool } from 'ai';
import { z } from 'zod';

interface TableColumn {
  column_name: string;
  data_type: string;
}

interface FieldAnalysis {
  numeric_fields: string[];
  categorical_fields: string[];
  date_fields: string[];
  text_fields: string[];
}

interface WidgetSuggestion {
  type: 'kpi' | 'chart' | 'table';
  title: string;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  // KPI specific
  field?: string;
  calculation?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
  // Chart specific
  chartType?: 'bar' | 'line' | 'pie' | 'area' | 'horizontal-bar';
  xField?: string;
  yField?: string;
  aggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
  // Table specific
  columns?: string[];
}

interface DashboardPlan {
  dashboard_objective: string;
  table_analysis: FieldAnalysis;
  suggested_widgets: WidgetSuggestion[];
  layout_recommendations: {
    kpi_section: string[];
    chart_section: string[];
    detail_section: string[];
  };
  implementation_notes: string[];
}

export const planDashboard = tool({
  description: 'Analyze table data and create strategic dashboard plan with intelligent widget suggestions based on data types and business objectives',
  inputSchema: z.object({
    tableName: z.string().describe('BigQuery table name to analyze'),
    objective: z.string().optional().describe('Dashboard objective (e.g., "sales analysis", "performance tracking", "financial overview")'),
    focusAreas: z.array(z.string()).optional().describe('Specific areas to focus on (e.g., ["revenue", "customer_behavior", "regional_performance"])'),
    columns: z.array(z.object({
      column_name: z.string(),
      data_type: z.string()
    })).optional().describe('Table schema columns (if already available)')
  }),
  execute: async ({ tableName, objective = "business analysis", focusAreas = [], columns = [] }) => {
    console.log('📊 Dashboard Planner tool executed');
    console.log('🎯 Planning dashboard for table:', tableName);
    console.log('🎯 Objective:', objective);
    console.log('🎯 Focus areas:', focusAreas);

    try {
      // If columns not provided, we'll work with common assumptions
      // In real implementation, this would integrate with getTableSchema
      const fieldAnalysis = analyzeFields(columns);

      // Generate widget suggestions based on analysis
      const suggestions = generateWidgetSuggestions(
        fieldAnalysis,
        objective,
        focusAreas,
        tableName
      );

      // Create layout recommendations
      const layoutRecommendations = createLayoutRecommendations(suggestions);

      // Generate implementation notes
      const implementationNotes = generateImplementationNotes(
        fieldAnalysis,
        suggestions,
        tableName
      );

      // Generate overview for Task component
      const overview = {
        title: `IA Analisando Dados de ${tableName}`,
        items: [
          `Analisando tabela ${tableName}: ${fieldAnalysis.numeric_fields.length + fieldAnalysis.categorical_fields.length + fieldAnalysis.date_fields.length + fieldAnalysis.text_fields.length} colunas`,
          `Campos identificados: ${fieldAnalysis.numeric_fields.slice(0,2).join(', ')} (numéricos), ${fieldAnalysis.categorical_fields.slice(0,2).join(', ')} (categóricos)`,
          `Sugerindo ${suggestions.length} widgets baseados na estrutura de dados`,
          `Queries otimizadas para performance`
        ]
      };

      // Convert suggestions to Task-compatible widgets with queries
      const widgets = suggestions.map(widget => {
        let title = '';
        let query = '';

        if (widget.type === 'kpi') {
          title = `KPI: ${widget.title} para Monitorar Performance`;
          query = `SELECT ${widget.calculation}(${widget.field}) as ${widget.field}_${widget.calculation?.toLowerCase()} FROM ${tableName}`;
        } else if (widget.type === 'chart') {
          if (widget.chartType === 'bar') {
            title = `Bar Chart: ${widget.title} para Comparar Performance`;
            query = `SELECT ${widget.xField}, ${widget.aggregation}(${widget.yField}) as total_${widget.yField}\nFROM ${tableName}\nGROUP BY ${widget.xField}\nORDER BY total_${widget.yField} DESC\nLIMIT 10`;
          } else if (widget.chartType === 'line') {
            title = `Line Chart: ${widget.title} para Analisar Tendências`;
            query = `SELECT DATE_TRUNC(${widget.xField}, MONTH) as mes, ${widget.aggregation}(${widget.yField}) as total_${widget.yField}\nFROM ${tableName}\nGROUP BY mes\nORDER BY mes`;
          } else if (widget.chartType === 'pie') {
            title = `Pie Chart: ${widget.title} para Visualizar Distribuição`;
            query = `SELECT ${widget.xField}, ${widget.aggregation}(${widget.yField}) as total_${widget.yField},\nROUND(${widget.aggregation}(${widget.yField}) * 100.0 / (SELECT ${widget.aggregation}(${widget.yField}) FROM ${tableName}), 2) as percentual\nFROM ${tableName}\nGROUP BY ${widget.xField}`;
          }
        } else if (widget.type === 'table') {
          title = `Table: ${widget.title} para Análise Detalhada`;
          query = `SELECT ${widget.columns?.join(', ')}\nFROM ${tableName}\nORDER BY ${widget.columns?.[0]} DESC\nLIMIT 50`;
        }

        return {
          title,
          query,
          description: widget.reasoning
        };
      });

      return {
        success: true,
        overview,
        widgets,
        summary: `Dashboard plan created for ${tableName}: ${suggestions.length} widgets suggested`
      };

    } catch (error) {
      console.error('❌ Error in planDashboard tool:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        plan: null
      };
    }
  }
});

function analyzeFields(columns: TableColumn[]): FieldAnalysis {
  const analysis: FieldAnalysis = {
    numeric_fields: [],
    categorical_fields: [],
    date_fields: [],
    text_fields: []
  };

  // If no columns provided, return common field suggestions
  if (columns.length === 0) {
    return {
      numeric_fields: ['receita', 'quantidade', 'valor', 'preco', 'total'],
      categorical_fields: ['categoria', 'produto', 'regiao', 'status', 'tipo'],
      date_fields: ['data_criacao', 'data_venda', 'data_pedido', 'timestamp'],
      text_fields: ['nome', 'descricao', 'observacoes']
    };
  }

  for (const column of columns) {
    const dataType = column.data_type.toLowerCase();
    const columnName = column.column_name.toLowerCase();

    // Classify by data type
    if (dataType.includes('int') || dataType.includes('float') || dataType.includes('numeric') || dataType.includes('decimal')) {
      analysis.numeric_fields.push(column.column_name);
    } else if (dataType.includes('date') || dataType.includes('timestamp') || dataType.includes('time')) {
      analysis.date_fields.push(column.column_name);
    } else if (dataType.includes('string') || dataType.includes('text')) {
      // Further classify string fields
      if (isLikelyCategorical(columnName)) {
        analysis.categorical_fields.push(column.column_name);
      } else {
        analysis.text_fields.push(column.column_name);
      }
    } else {
      analysis.categorical_fields.push(column.column_name);
    }
  }

  return analysis;
}

function isLikelyCategorical(columnName: string): boolean {
  const categoricalPatterns = [
    'categoria', 'tipo', 'status', 'regiao', 'cidade', 'estado',
    'produto', 'marca', 'segmento', 'canal', 'fonte', 'origem',
    'departamento', 'setor', 'grupo', 'classe', 'nivel'
  ];

  return categoricalPatterns.some(pattern =>
    columnName.includes(pattern)
  );
}

function generateWidgetSuggestions(
  analysis: FieldAnalysis,
  objective: string,
  focusAreas: string[],
  tableName: string
): WidgetSuggestion[] {
  const suggestions: WidgetSuggestion[] = [];

  // Generate KPI suggestions
  for (const numField of analysis.numeric_fields.slice(0, 4)) { // Limit to 4 KPIs
    const isRevenue = numField.toLowerCase().includes('receita') ||
                     numField.toLowerCase().includes('valor') ||
                     numField.toLowerCase().includes('total');

    const calculation = isRevenue ? 'SUM' :
                       numField.toLowerCase().includes('quantidade') ? 'COUNT' : 'SUM';

    suggestions.push({
      type: 'kpi',
      title: `Total ${numField}`,
      field: numField,
      calculation,
      reasoning: `Campo numérico ${numField} ideal para métrica ${calculation} - fundamental para ${objective}`,
      priority: isRevenue || focusAreas.some(area => numField.includes(area)) ? 'high' : 'medium'
    });
  }

  // Generate Chart suggestions
  if (analysis.categorical_fields.length > 0 && analysis.numeric_fields.length > 0) {
    // Bar chart suggestion
    const topCategorical = analysis.categorical_fields[0];
    const topNumeric = analysis.numeric_fields[0];

    suggestions.push({
      type: 'chart',
      chartType: 'bar',
      title: `${topNumeric} por ${topCategorical}`,
      xField: topCategorical,
      yField: topNumeric,
      aggregation: 'SUM',
      reasoning: `Comparação de ${topNumeric} entre diferentes ${topCategorical} - visualização essencial para análise`,
      priority: 'high'
    });

    // Time series if date field exists
    if (analysis.date_fields.length > 0) {
      suggestions.push({
        type: 'chart',
        chartType: 'line',
        title: `Evolução de ${topNumeric} ao longo do tempo`,
        xField: analysis.date_fields[0],
        yField: topNumeric,
        aggregation: 'SUM',
        reasoning: `Tendência temporal de ${topNumeric} - crucial para identificar padrões e sazonalidade`,
        priority: 'high'
      });
    }

    // Pie chart for categorical distribution
    if (analysis.categorical_fields.length > 1) {
      suggestions.push({
        type: 'chart',
        chartType: 'pie',
        title: `Distribuição por ${analysis.categorical_fields[1]}`,
        xField: analysis.categorical_fields[1],
        yField: topNumeric,
        aggregation: 'SUM',
        reasoning: `Distribuição proporcional de ${topNumeric} por ${analysis.categorical_fields[1]}`,
        priority: 'medium'
      });
    }
  }

  // Generate Table suggestion
  const importantColumns = [
    ...analysis.categorical_fields.slice(0, 2),
    ...analysis.numeric_fields.slice(0, 2),
    ...analysis.date_fields.slice(0, 1)
  ].slice(0, 5); // Limit to 5 columns

  if (importantColumns.length > 0) {
    suggestions.push({
      type: 'table',
      title: `Detalhes de ${tableName}`,
      columns: importantColumns,
      reasoning: `Tabela detalhada com campos mais relevantes para análise granular dos dados`,
      priority: 'medium'
    });
  }

  // Sort by priority
  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

function createLayoutRecommendations(suggestions: WidgetSuggestion[]) {
  return {
    kpi_section: suggestions
      .filter(s => s.type === 'kpi')
      .map(s => s.title),
    chart_section: suggestions
      .filter(s => s.type === 'chart')
      .map(s => s.title),
    detail_section: suggestions
      .filter(s => s.type === 'table')
      .map(s => s.title)
  };
}

function generateImplementationNotes(
  analysis: FieldAnalysis,
  suggestions: WidgetSuggestion[],
  tableName: string
): string[] {
  const notes: string[] = [];

  notes.push(`Tabela analisada: ${tableName}`);
  notes.push(`Campos identificados: ${analysis.numeric_fields.length} numéricos, ${analysis.categorical_fields.length} categóricos, ${analysis.date_fields.length} de data`);

  if (suggestions.filter(s => s.priority === 'high').length > 0) {
    notes.push(`Comece pelos ${suggestions.filter(s => s.priority === 'high').length} widgets de alta prioridade`);
  }

  if (analysis.date_fields.length > 0) {
    notes.push(`Considere filtros de data para análise temporal`);
  }

  if (analysis.categorical_fields.length > 2) {
    notes.push(`Múltiplos campos categóricos disponíveis - considere filtros interativos`);
  }

  notes.push(`Valide nomes dos campos com getTableSchema antes da implementação`);

  return notes;
}