'use client'

import { useState } from 'react'
import { Editor } from '@monaco-editor/react'
import { Play, RotateCcw, Terminal, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CodeEditorInterfaceProps {
  code: string
  output: string[]
  isExecuting: boolean
  onCodeChange: (code: string) => void
  onExecute: () => void
  onReset: () => void
  onClearOutput: () => void
}

export default function CodeEditorInterface({
  code,
  output,
  isExecuting,
  onCodeChange,
  onExecute,
  onReset,
  onClearOutput
}: CodeEditorInterfaceProps) {
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(true)
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">Code Editor - Full CRUD (KPI, Table, Chart)</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="gap-2"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
          <Button
            onClick={onExecute}
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
            onChange={(value) => onCodeChange(value || '')}
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

        {/* Divider Line */}
        <div className="border-t border-border bg-border/20" />

        {/* Output Console */}
        <Card className="m-4 mt-0 border-t-0 rounded-t-none transition-all duration-200 ease-in-out">
          <CardHeader className="py-2 cursor-pointer" onClick={() => setIsConsoleExpanded(!isConsoleExpanded)}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Terminal className="w-3 h-3" />
                Console Output
                {isConsoleExpanded ? (
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ChevronUp className="w-3 h-3 text-muted-foreground" />
                )}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClearOutput()
                  }}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          {isConsoleExpanded && (
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
          )}
        </Card>
      </div>
    </div>
  )
}