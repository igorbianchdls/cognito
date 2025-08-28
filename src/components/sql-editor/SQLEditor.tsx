'use client';

import { useState, useEffect, useCallback } from 'react';
import { Editor } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Play, AlertCircle, CheckCircle } from 'lucide-react';
import SQLResultsTable from './SQLResultsTable';
import type { SQLEditorProps, QueryResult } from './types';

export default function SQLEditor({ 
  initialSQL = '', 
  onSQLChange,
  autoExecute = false,
  immediateExecute = false,
  height = '200px',
  readOnly = false
}: SQLEditorProps) {
  const [sql, setSQL] = useState(initialSQL);
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [activeTab, setActiveTab] = useState('editor');

  // Handle SQL changes
  const handleEditorChange = (value: string | undefined) => {
    const newSQL = value || '';
    setSQL(newSQL);
    onSQLChange?.(newSQL);
    
    // Immediate execution for AI agents
    if (immediateExecute && newSQL.trim() && !isExecuting && !readOnly) {
      executeSQL(newSQL);
      return;
    }
    
    // Auto-execute with debounce for manual typing
    if (autoExecute && newSQL.trim() && !isExecuting && !readOnly) {
      const timeout = setTimeout(() => {
        executeSQL(newSQL);
      }, 1000); // 1 second debounce
      
      return () => clearTimeout(timeout);
    }
  };

  // Execute SQL query
  const executeSQL = useCallback(async (querySQL?: string) => {
    const sqlToExecute = querySQL || sql;
    
    if (!sqlToExecute.trim() || readOnly) {
      return;
    }

    setIsExecuting(true);
    setResult(null);

    try {
      // Executar SQL via endpoint que roda no servidor
      const response = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sqlQuery: sqlToExecute.trim()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();
      // execute-sql API returns { data, schema, success } directly
      setResult({
        sqlQuery: sqlToExecute,
        data: apiResponse.data || [],
        schema: apiResponse.schema || [],
        rowsReturned: apiResponse.data?.length || 0,
        executionTime: 0, // execute-sql doesn't return executionTime yet
        success: apiResponse.success
      });
      
      // Auto-switch to results tab on successful execution
      if (apiResponse.success) {
        setActiveTab('results');
      }
    } catch (error) {
      setResult({
        sqlQuery: sqlToExecute,
        data: [],
        schema: [],
        rowsReturned: 0,
        executionTime: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao executar SQL'
      });
    } finally {
      setIsExecuting(false);
    }
  }, [sql, readOnly]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !readOnly) {
        event.preventDefault();
        executeSQL();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sql, readOnly, executeSQL]);


  // Format bytes for display
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor">SQL Editor</TabsTrigger>
            <TabsTrigger value="results" disabled={!result}>Resultados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor" className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">SQL Editor</h3>
              <Button
                onClick={() => executeSQL()}
                disabled={isExecuting || !sql.trim() || readOnly}
                className="flex items-center gap-2"
              >
                {isExecuting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isExecuting ? 'Executando...' : 'Executar'}
              </Button>
            </div>

            <div className="border rounded-md overflow-hidden">
              <Editor
                height={height}
                defaultLanguage="sql"
                value={sql}
                onChange={handleEditorChange}
                theme="vs-light"
                options={{
                  readOnly,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  automaticLayout: true,
                  tabSize: 2,
                  insertSpaces: true,
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
            </div>

            {!readOnly && (
              <div className="mt-2 text-xs text-gray-500">
                {immediateExecute 
                  ? 'Execução automática ativada • Ctrl+Enter para executar manualmente'
                  : 'Dica: Use Ctrl+Enter para executar rapidamente'
                }
              </div>
            )}
            
            {/* Show errors in editor tab */}
            {result && !result.success && result.error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                <div className="text-red-800 text-sm">
                  <div className="font-medium mb-1">Erro:</div>
                  <pre className="font-mono text-xs whitespace-pre-wrap">{result.error}</pre>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="results" className="mt-4">
            {result && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <h3 className="text-lg font-semibold">
                    {result.success ? 'Resultado da Query' : 'Erro na Execução'}
                  </h3>
                </div>

                {/* Execution Statistics */}
                {result.success && (
                  <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Linhas:</span>
                      <span className="text-green-600 font-mono">{result.rowsReturned.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Tempo:</span>
                      <span className="text-blue-600 font-mono">{result.executionTime}ms</span>
                    </div>
                    {result.bytesProcessed && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Bytes processados:</span>
                        <span className="text-purple-600 font-mono">{formatBytes(result.bytesProcessed)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Data Table */}
                {result.success && result.data && result.data.length > 0 && (
                  <SQLResultsTable
                    data={result.data}
                    schema={result.schema}
                    pageSize={10}
                  />
                )}

                {/* No Data Message */}
                {result.success && (!result.data || result.data.length === 0) && (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md border">
                    <div className="text-lg mb-2">📊</div>
                    <div className="font-medium">Query executada com sucesso</div>
                    <div className="text-sm">Nenhum dado foi retornado</div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}