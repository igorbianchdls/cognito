'use client';

import { useState, useEffect, useCallback } from 'react';
import { Editor } from '@monaco-editor/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="editor">SQL Editor</TabsTrigger>
            <TabsTrigger value="results" disabled={!result}>Resultados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor" className="mt-4">

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