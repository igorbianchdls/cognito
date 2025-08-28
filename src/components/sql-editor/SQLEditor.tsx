'use client';

import { useState, useEffect, useCallback } from 'react';
import { Editor } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Play } from 'lucide-react';
import SQLResultsTable from './SQLResultsTable';
import type { SQLEditorProps, QueryResult } from './types';
import { setLastQueryData } from '@/stores/queryStore';

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

  // Execute immediately on mount if immediateExecute is true and there's initial SQL
  useEffect(() => {
    if (immediateExecute && initialSQL.trim() && !isExecuting && !readOnly) {
      executeSQL(initialSQL);
    }
  }, [immediateExecute, initialSQL, readOnly]);

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
        // Save data to global store for AI access
        if (apiResponse.data) {
          setLastQueryData(apiResponse.data);
        }
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
    <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="editor">SQL Editor</TabsTrigger>
            <TabsTrigger value="results" disabled={!result}>Resultados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor" className="mt-4">
            <div className="relative">
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
              
              {!readOnly && (
                <Button
                  onClick={() => executeSQL()}
                  disabled={isExecuting || !sql.trim()}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 h-8 w-8 p-0 rounded-full bg-blue-500 hover:bg-blue-600 border-0 shadow-md"
                  size="sm"
                >
                  {isExecuting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Play className="h-4 w-4 text-white ml-0.5" />
                  )}
                </Button>
              )}
            </div>
            
            {/* Show errors in editor tab */}
            {result && !result.success && result.error && (
              <div className="mt-4">
                <div className="text-red-600 text-sm">
                  <pre className="font-mono text-xs whitespace-pre-wrap">{result.error}</pre>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="results" className="mt-4">
            {result && result.success && result.data && result.data.length > 0 && (
              <SQLResultsTable
                data={result.data}
                schema={result.schema}
                pageSize={10}
              />
            )}
          </TabsContent>
    </Tabs>
  );
}