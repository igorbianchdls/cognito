'use client';

import { AlertCircleIcon } from 'lucide-react';
import {
  Task,
  TaskContent,
  TaskItem,
  TaskTrigger
} from '@/components/ai-elements/task';
import { TaskOverview, TaskWidget } from '../apps/chat/tools/DashboardPlanView';

interface PlanAnalysisProps {
  overview?: TaskOverview;
  widgets?: TaskWidget[];
  success: boolean;
  error?: string;
  summary?: string;
}

export default function PlanAnalysis({
  overview,
  widgets,
  success,
  error,
  summary
}: PlanAnalysisProps) {
  if (error || !success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircleIcon className="w-5 h-5 text-red-500" />
          <span className="font-medium text-red-800">Erro no Planejamento</span>
        </div>
        <p className="text-red-700 mt-2">{error || 'Erro desconhecido ao criar plano de análise'}</p>
      </div>
    );
  }

  // Use new format if available
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
              <TaskItem><strong>Visualização:</strong> {widget.description}</TaskItem>
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

  // Fallback for old format
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <p className="text-gray-600">Plano usando formato legado - atualize a tool planAnalysis para o novo formato Task</p>
    </div>
  );
}