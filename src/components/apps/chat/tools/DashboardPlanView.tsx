'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  BarChart3Icon,
  LineChartIcon,
  PieChartIcon,
  TrendingUpIcon,
  TableIcon,
  LightbulbIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  AreaChartIcon,
  ActivityIcon
} from 'lucide-react';

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
  field?: string;
  calculation?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
  chartType?: 'bar' | 'line' | 'pie' | 'area' | 'horizontal-bar';
  xField?: string;
  yField?: string;
  aggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
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

interface DashboardPlanViewProps {
  plan: DashboardPlan;
  success: boolean;
  error?: string;
  summary?: string;
  next_steps?: string[];
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800 border-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'kpi': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'chart': return 'bg-green-100 text-green-800 border-green-200';
    case 'table': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getWidgetIcon = (widget: WidgetSuggestion) => {
  if (widget.type === 'kpi') {
    return <TrendingUpIcon className="w-5 h-5" />;
  }
  if (widget.type === 'chart') {
    switch (widget.chartType) {
      case 'bar': case 'horizontal-bar': return <BarChart3Icon className="w-5 h-5" />;
      case 'line': return <LineChartIcon className="w-5 h-5" />;
      case 'pie': return <PieChartIcon className="w-5 h-5" />;
      case 'area': return <AreaChartIcon className="w-5 h-5" />;
      default: return <BarChart3Icon className="w-5 h-5" />;
    }
  }
  if (widget.type === 'table') {
    return <TableIcon className="w-5 h-5" />;
  }
  return <ActivityIcon className="w-5 h-5" />;
};

const getFieldIcon = (fieldType: string) => {
  switch (fieldType) {
    case 'numeric': return '🔢';
    case 'categorical': return '🏷️';
    case 'date': return '📅';
    case 'text': return '📝';
    default: return '❓';
  }
};

export default function DashboardPlanView({
  plan,
  success,
  error,
  summary,
  next_steps
}: DashboardPlanViewProps) {
  if (error || !success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircleIcon className="w-5 h-5 text-red-500" />
          <span className="font-medium text-red-800">Erro no Planejamento</span>
        </div>
        <p className="text-red-700 mt-2">{error || 'Erro desconhecido ao criar plano de dashboard'}</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600">Nenhum plano disponível</p>
      </div>
    );
  }

  const highPriorityWidgets = plan.suggested_widgets.filter(w => w.priority === 'high');
  const mediumPriorityWidgets = plan.suggested_widgets.filter(w => w.priority === 'medium');
  const lowPriorityWidgets = plan.suggested_widgets.filter(w => w.priority === 'low');

  return (
    <div className="space-y-6">
      {/* Header do Plano */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LightbulbIcon className="w-6 h-6 text-yellow-500" />
            <CardTitle>Plano de Dashboard</CardTitle>
          </div>
          <CardDescription className="text-base">
            <strong>Objetivo:</strong> {plan.dashboard_objective}
          </CardDescription>
          {summary && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
              <p className="text-blue-800 text-sm">{summary}</p>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Análise dos Campos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Análise da Tabela</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {plan.table_analysis.numeric_fields.length}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                {getFieldIcon('numeric')} Numéricos
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {plan.table_analysis.numeric_fields.slice(0, 2).join(', ')}
                {plan.table_analysis.numeric_fields.length > 2 && '...'}
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {plan.table_analysis.categorical_fields.length}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                {getFieldIcon('categorical')} Categóricos
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {plan.table_analysis.categorical_fields.slice(0, 2).join(', ')}
                {plan.table_analysis.categorical_fields.length > 2 && '...'}
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {plan.table_analysis.date_fields.length}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                {getFieldIcon('date')} Data/Tempo
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {plan.table_analysis.date_fields.slice(0, 2).join(', ')}
                {plan.table_analysis.date_fields.length > 2 && '...'}
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {plan.table_analysis.text_fields.length}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                {getFieldIcon('text')} Texto
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {plan.table_analysis.text_fields.slice(0, 2).join(', ')}
                {plan.table_analysis.text_fields.length > 2 && '...'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Widgets Sugeridos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Widgets Sugeridos ({plan.suggested_widgets.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Alta Prioridade */}
          {highPriorityWidgets.length > 0 && (
            <div>
              <h4 className="font-medium text-red-700 mb-3 flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">ALTA PRIORIDADE</Badge>
                {highPriorityWidgets.length} widget(s)
              </h4>
              <div className="grid gap-3">
                {highPriorityWidgets.map((widget, index) => (
                  <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getTypeColor(widget.type)}`}>
                        {getWidgetIcon(widget)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium">{widget.title}</h5>
                          <Badge className={`text-xs ${getTypeColor(widget.type)}`}>
                            {widget.type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{widget.reasoning}</p>
                        <div className="text-xs text-gray-500">
                          {widget.type === 'kpi' && widget.field && (
                            <span>Campo: {widget.field} • Cálculo: {widget.calculation}</span>
                          )}
                          {widget.type === 'chart' && widget.xField && widget.yField && (
                            <span>X: {widget.xField} • Y: {widget.yField} • Tipo: {widget.chartType}</span>
                          )}
                          {widget.type === 'table' && widget.columns && (
                            <span>Colunas: {widget.columns.slice(0, 3).join(', ')}
                            {widget.columns.length > 3 && '...'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Média Prioridade */}
          {mediumPriorityWidgets.length > 0 && (
            <div>
              <Separator className="my-4" />
              <h4 className="font-medium text-yellow-700 mb-3 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">MÉDIA PRIORIDADE</Badge>
                {mediumPriorityWidgets.length} widget(s)
              </h4>
              <div className="grid gap-3">
                {mediumPriorityWidgets.map((widget, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getTypeColor(widget.type)}`}>
                        {getWidgetIcon(widget)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium">{widget.title}</h5>
                          <Badge className={`text-xs ${getTypeColor(widget.type)}`}>
                            {widget.type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{widget.reasoning}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Baixa Prioridade */}
          {lowPriorityWidgets.length > 0 && (
            <div>
              <Separator className="my-4" />
              <h4 className="font-medium text-gray-600 mb-3 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">BAIXA PRIORIDADE</Badge>
                {lowPriorityWidgets.length} widget(s)
              </h4>
              <div className="grid gap-2">
                {lowPriorityWidgets.map((widget, index) => (
                  <div key={index} className="border border-gray-100 rounded p-3 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${getTypeColor(widget.type)}`}>
                        {getWidgetIcon(widget)}
                      </div>
                      <span className="font-medium text-sm">{widget.title}</span>
                      <Badge className={`text-xs ${getTypeColor(widget.type)}`}>
                        {widget.type.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recomendações de Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recomendações de Layout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h5 className="font-medium text-blue-700 mb-2">📊 Seção KPIs</h5>
              <ul className="text-sm space-y-1">
                {plan.layout_recommendations.kpi_section.map((item, index) => (
                  <li key={index} className="text-gray-600">• {item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-green-700 mb-2">📈 Seção Gráficos</h5>
              <ul className="text-sm space-y-1">
                {plan.layout_recommendations.chart_section.map((item, index) => (
                  <li key={index} className="text-gray-600">• {item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-purple-700 mb-2">📋 Seção Detalhes</h5>
              <ul className="text-sm space-y-1">
                {plan.layout_recommendations.detail_section.map((item, index) => (
                  <li key={index} className="text-gray-600">• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notas de Implementação */}
      {plan.implementation_notes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
              Notas de Implementação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {plan.implementation_notes.map((note, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">{note}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Próximos Passos */}
      {next_steps && next_steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ActivityIcon className="w-5 h-5 text-blue-500" />
              Próximos Passos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {next_steps.map((step, index) => (
                <li key={index} className="flex items-start gap-3 text-sm">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}