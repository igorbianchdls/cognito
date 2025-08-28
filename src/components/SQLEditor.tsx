'use client';

import { useState, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Play, AlertCircle, CheckCircle } from 'lucide-react';
import { DataTable, createSortableHeader } from '@/components/widgets/Table';
import type { ColumnDef } from '@tanstack/react-table';

interface SQLEditorProps {
  initialSQL?: string;
  onSQLChange?: (sql: string) => void;
  autoExecute?: boolean;
}

interface QueryResult {
  data: Record<string, unknown>[];
  schema: { name: string; type: string; mode: string }[];
  rowsReturned: number;
  executionTime: number;
  bytesProcessed?: number;
  success: boolean;
  error?: string;
}

export default function SQLEditor({ 
  initialSQL = '', 
  onSQLChange,
  autoExecute = false 
}: SQLEditorProps) {
  const [sql, setSQL] = useState(initialSQL);
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const editorRef = useRef(null);

  const handleEditorChange = (value: string | undefined) => {
    const newSQL = value || '';
    setSQL(newSQL);
    onSQLChange?.(newSQL);
    
    // Auto-execute if enabled and SQL is valid
    if (autoExecute && newSQL.trim() && !isExecuting) {
      const timeout = setTimeout(() => {
        executeSQL(newSQL);
      }, 1000); // Debounce 1 second
      
      return () => clearTimeout(timeout);
    }
  };

  const executeSQL = async (querySQL?: string) => {
    const sqlToExecute = querySQL || sql;
    
    if (!sqlToExecute.trim()) {
      return;
    }

    setIsExecuting(true);
    setResult(null);

    try {
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

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
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
  };

  // Create table columns dynamically from schema
  const createTableColumns = (schema: QueryResult['schema'], data: Record<string, unknown>[]): ColumnDef<Record<string, unknown>>[] => {
    if (!schema.length && data.length > 0) {
      // Fallback: infer columns from first row
      return Object.keys(data[0]).map(key => ({
        accessorKey: key,
        header: createSortableHeader(key.charAt(0).toUpperCase() + key.slice(1)),
        cell: ({ row }) => {
          const value = row.getValue(key);
          return <div className="font-mono text-sm">{String(value || '')}</div>;
        }
      }));
    }

    return schema.map(column => ({
      accessorKey: column.name,
      header: createSortableHeader(column.name),
      cell: ({ row }) => {
        const value = row.getValue(column.name);
        return (
          <div className="font-mono text-sm" title={`Type: ${column.type}`}>
            {String(value || '')}
          </div>
        );
      }
    }));
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* SQL Editor */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">SQL Editor</h3>
          <Button
            onClick={() => executeSQL()}
            disabled={isExecuting || !sql.trim()}
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
            ref={editorRef}
            height="200px"
            defaultLanguage="sql"
            value={sql}
            onChange={handleEditorChange}
            theme="vs-light"
            options={{
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

        <div className="mt-2 text-xs text-gray-500">
          Dica: Use Ctrl+Enter para executar rapidamente
        </div>
      </Card>

      {/* Results */}
      {result && (
        <Card className="p-4">
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

          {/* Execution Stats */}
          {result.success && (
            <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <span className="font-medium">Linhas:</span>
                <span>{result.rowsReturned.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">Tempo:</span>
                <span>{result.executionTime}ms</span>
              </div>
              {result.bytesProcessed && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Bytes:</span>
                  <span>{formatBytes(result.bytesProcessed)}</span>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {!result.success && result.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-red-800 text-sm font-mono">{result.error}</p>
            </div>
          )}

          {/* Data Table */}
          {result.success && result.data && result.data.length > 0 && (
            <div className="border rounded-md">
              <DataTable
                columns={createTableColumns(result.schema, result.data)}
                data={result.data}
                searchPlaceholder="Buscar nos resultados..."
                pageSize={10}
              />
            </div>
          )}

          {/* No Data */}
          {result.success && (!result.data || result.data.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              Query executada com sucesso, mas não retornou dados.
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// Hook for keyboard shortcuts
export function useSQLEditorShortcuts(executeSQL: () => void) {
  const handleKeyDown = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      executeSQL();
    }
  };

  return { handleKeyDown };
}