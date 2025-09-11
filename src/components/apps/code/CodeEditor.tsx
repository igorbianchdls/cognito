'use client'

import { useState, useEffect } from 'react'
import { Editor } from '@monaco-editor/react'
import { Play, RotateCcw, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { kpiActions } from '@/stores/apps/kpiStore'

export default function CodeEditor() {
  const [code, setCode] = useState('')
  const [output, setOutput] = useState<string[]>([])
  const [isExecuting, setIsExecuting] = useState(false)

  // Default example code
  const defaultCode = `// Criar KPIs programaticamente

// Exemplo: COUNT de IDs
createKPI('ecommerce', 'id', 'COUNT', 'Total de Registros')

// Exemplo: SUM de valores
createKPI('vendas_2024', 'valor_total', 'SUM', 'Vendas Totais')

// Exemplo: AVG de preços
createKPI('produtos', 'preco', 'AVG', 'Preço Médio')

console.log('KPIs criados!')
`

  useEffect(() => {
    setCode(defaultCode)
  }, [defaultCode])

  // Log function for output
  const log = (...args: unknown[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ')
    setOutput(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Simple KPI creation function
  const createKPI = async (table: string, field: string, calculation: string, title: string) => {
    try {
      // Generate SQL query automatically (same as Datasets)
      const query = `SELECT ${calculation}(${field}) as value FROM \`creatto-463117.biquery_data.${table}\``
      
      log(`Executing: ${query}`)

      // Execute BigQuery (same as Datasets)
      const response = await fetch('/api/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'execute',
          query: query 
        })
      })

      if (!response.ok) {
        const responseText = await response.text()
        throw new Error(`Query failed: ${response.statusText} - ${responseText}`)
      }

      const result = await response.json()
      
      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const data = result.data.data
        const value = data[0]?.value || 0
        
        // Create KPI using the same action as Datasets
        kpiActions.addKPI({
          name: title,
          icon: '📈',
          description: `KPI from ${table}`,
          position: { x: 0, y: 0 },
          size: { w: 48, h: 100 },
          config: {
            name: title,
            value: value,
            metric: field,
            calculation: calculation,
            unit: '',
            showTarget: false,
            showTrend: false,
            visualizationType: 'card' as const,
            enableSimulation: false,
            dataSourceType: 'bigquery' as const,
            bigqueryData: {
              selectedTable: table,
              kpiValueFields: [{ 
                name: field, 
                type: 'NUMERIC', 
                mode: 'NULLABLE',
                aggregation: calculation as 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'COUNT_DISTINCT'
              }],
              filterFields: [],
              query: query,
              lastExecuted: new Date(),
              isLoading: false,
              error: null
            }
          }
        })

        log(`✅ KPI "${title}" created with value: ${value}`)
      } else {
        throw new Error(result.error || 'No data returned')
      }
    } catch (error) {
      log(`❌ Failed to create KPI: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Execute the code
  const executeCode = async () => {
    if (!code.trim()) {
      log('❌ No code to execute')
      return
    }

    setIsExecuting(true)
    setOutput([])
    log('🚀 Executing code...')

    try {
      // Create execution context
      const context = {
        createKPI,
        console: { log }
      }

      // Execute code
      const asyncFunction = new Function(
        'context',
        `
        const { createKPI, console } = context;
        return (async () => {
          ${code}
        })();
        `
      )

      await asyncFunction(context)
      log('✅ Code executed successfully')
    } catch (error) {
      log('❌ Execution failed:', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsExecuting(false)
    }
  }

  const clearOutput = () => {
    setOutput([])
  }

  const resetCode = () => {
    setCode(defaultCode)
    setOutput([])
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">Code Editor - KPI</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetCode}
            className="gap-2"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
          <Button
            onClick={executeCode}
            disabled={isExecuting}
            size="sm"
            className="gap-2"
          >
            <Play className="w-3 h-3" />
            {isExecuting ? 'Executing...' : 'Execute'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Code Editor */}
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              folding: true
            }}
          />
        </div>

        {/* Output Console */}
        <Card className="m-4 mt-0 border-t-0 rounded-t-none">
          <CardHeader className="py-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Terminal className="w-3 h-3" />
                Console Output
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearOutput}
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent className="py-2">
            <ScrollArea className="h-24 w-full">
              <div className="space-y-1">
                {output.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No output yet. Execute some code to see results.</p>
                ) : (
                  output.map((line, index) => (
                    <p key={index} className="text-xs font-mono text-foreground whitespace-pre-wrap">
                      {line}
                    </p>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}