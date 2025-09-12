'use client'

import StoreUpdatePhase from '../code/phases/StoreUpdatePhase'

interface WidgetOperation {
  action: 'create' | 'update'
  type?: 'kpi' | 'chart' | 'table'
  widgetName?: string
  params: Record<string, unknown>
}

interface AICodeExecutorProps {
  operations: WidgetOperation[]
}

export default function AICodeExecutor({ operations }: AICodeExecutorProps) {
  return (
    <div className="mt-3 border border-blue-200 rounded-lg overflow-hidden h-[700px]">
      <div className="bg-blue-50 p-3 border-b border-blue-200">
        <div className="flex items-center gap-2">
          <span className="text-blue-600">🤖</span>
          <span className="font-medium text-blue-800">AI Code Executor</span>
          <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
            {operations.length} operation{operations.length !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-blue-700 text-sm mt-1">
          Use o editor abaixo para executar as operações sugeridas pela IA
        </p>
      </div>
      
      <div className="bg-white h-full">
        <StoreUpdatePhase />
      </div>
    </div>
  )
}