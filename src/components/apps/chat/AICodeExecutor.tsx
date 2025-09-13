'use client'

import StoreUpdatePhase from '../code/phases/StoreUpdatePhase'

interface WidgetOperation {
  action: 'create' | 'update'
  type?: 'kpi' | 'chart' | 'table'
  name?: string // For updates
  [key: string]: unknown // Flat format - accepts all fields directly
}

interface AICodeExecutorProps {
  operations: WidgetOperation[]
}

export default function AICodeExecutor({ operations }: AICodeExecutorProps) {
  console.log('🤖 AICodeExecutor received operations:', operations)
  console.log('🤖 Operations count:', operations.length)
  console.log('🤖 Operations data:', JSON.stringify(operations, null, 2))
  
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
        
        {/* Debug Panel */}
        <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
          <details>
            <summary className="cursor-pointer text-yellow-800 font-medium">
              🔍 DEBUG: Operations Data ({operations.length} operations)
            </summary>
            <pre className="mt-2 text-yellow-900 overflow-auto max-h-32 whitespace-pre-wrap">
              {JSON.stringify(operations, null, 2)}
            </pre>
          </details>
        </div>
      </div>
      
      <div className="bg-white h-full">
        <StoreUpdatePhase initialCode={JSON.stringify(operations, null, 2)} />
      </div>
    </div>
  )
}