'use client';

import { AlertCircleIcon } from 'lucide-react';
import {
  Task,
  TaskContent,
  TaskItem,
  TaskTrigger
} from '@/components/ai-elements/task';

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

export interface DashboardPlan {
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

interface TaskOverview {
  title: string;
  items: string[];
}

interface TaskWidget {
  title: string;
  query: string;
  description: string;
}

interface DashboardPlanViewProps {
  overview?: TaskOverview;
  widgets?: TaskWidget[];
  success: boolean;
  error?: string;
  summary?: string;
  // Legacy support for old format
  plan?: DashboardPlan;
}

export default function DashboardPlanView({
  overview,
  widgets,
  success,
  error,
  summary,
  plan
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

  // Use new format if available, fallback to legacy
  if (overview && widgets) {
    return (
      <div className="space-y-4">
        {/* Overview Task */}
        <Task>
          <TaskTrigger title={overview.title} />
          <TaskContent>
            {overview.items.map((item, index) => (
              <TaskItem key={index}>{item}</TaskItem>
            ))}
          </TaskContent>
        </Task>

        {/* Widget Tasks */}
        {widgets.map((widget, index) => (
          <Task defaultOpen={false} key={index}>
            <TaskTrigger title={widget.title} />
            <TaskContent>
              <TaskItem><strong>Descrição:</strong> {widget.description}</TaskItem>
              <TaskItem>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1 whitespace-pre-wrap">
                  {widget.query}
                </code>
              </TaskItem>
            </TaskContent>
          </Task>
        ))}

        {summary && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-blue-800 text-sm">{summary}</p>
          </div>
        )}
      </div>
    );
  }

  // Legacy support - show message for old format
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <p className="text-gray-600">Plano usando formato legado - atualize a tool planDashboard para o novo formato Task</p>
    </div>
  );
}