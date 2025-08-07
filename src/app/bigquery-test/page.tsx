'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Sidebar from '@/components/navigation/Sidebar';
import { useBigQueryTables, useBigQueryTableData } from '@/hooks/useBigQuery';

interface BigQueryTestResult {
  success: boolean;
  data?: Record<string, unknown>[] | Record<string, unknown> | string | null;
  message?: string;
  error?: string;
}

export default function BigQueryTestPage() {
  const [connectionStatus, setConnectionStatus] = useState<BigQueryTestResult | null>(null);
  const [datasets, setDatasets] = useState<BigQueryTestResult | null>(null);
  const [tables, setTables] = useState<BigQueryTestResult | null>(null);
  const [queryResult, setQueryResult] = useState<BigQueryTestResult | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [customQuery, setCustomQuery] = useState<string>('');
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [selectedTable, setSelectedTable] = useState<string>('');
  
  // Use the new hooks
  const tablesHook = useBigQueryTables('biquery_data');
  const tableDataHook = useBigQueryTableData('biquery_data', selectedTable, 100);

  const setLoadingState = (key: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [key]: isLoading }));
  };

  const testConnection = async () => {
    setLoadingState('connection', true);
    try {
      const response = await fetch('/api/bigquery/test');
      const result = await response.json();
      setConnectionStatus(result);
    } catch (error) {
      setConnectionStatus({
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      });
    } finally {
      setLoadingState('connection', false);
    }
  };



  const listDatasets = async () => {
    setLoadingState('datasets', true);
    try {
      const response = await fetch('/api/bigquery?action=datasets');
      const result = await response.json();
      setDatasets(result);
    } catch (error) {
      setDatasets({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list datasets'
      });
    } finally {
      setLoadingState('datasets', false);
    }
  };

  const listTables = async (datasetId: string) => {
    if (!datasetId) return;
    
    setLoadingState('tables', true);
    try {
      const response = await fetch(`/api/bigquery?action=tables&dataset=${datasetId}`);
      const result = await response.json();
      setTables(result);
      setSelectedDataset(datasetId);
    } catch (error) {
      setTables({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list tables'
      });
    } finally {
      setLoadingState('tables', false);
    }
  };

  const executeQuery = async () => {
    if (!customQuery.trim()) return;
    
    setLoadingState('query', true);
    try {
      const response = await fetch('/api/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          query: customQuery
        })
      });
      const result = await response.json();
      setQueryResult(result);
    } catch (error) {
      setQueryResult({
        success: false,
        error: error instanceof Error ? error.message : 'Query execution failed'
      });
    } finally {
      setLoadingState('query', false);
    }
  };

  const renderTableData = (data: Record<string, unknown>[], title: string) => {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);
    
    return (
      <div className="mt-4">
        <h4 className="font-medium mb-2">{title} ({data.length} rows)</h4>
        <div className="overflow-auto max-h-96 border rounded">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {columns.map(column => (
                  <th 
                    key={column}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.charAt(0).toUpperCase() + column.slice(1).replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {columns.map(column => (
                    <td key={column} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {String(row[column] || '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length > 20 && (
          <p className="text-xs text-gray-500 mt-2">
            Showing first 20 results. Total: {data.length} rows
          </p>
        )}
      </div>
    );
  };

  const renderResult = (result: BigQueryTestResult | null, title: string) => {
    if (!result) return null;

    return (
      <Card className="p-4 mt-4">
        <h3 className="font-semibold mb-2">{title}</h3>
        {result.success ? (
          <div>
            <div className="text-green-600 mb-2">✅ Success</div>
            {result.message && <p className="text-sm text-gray-600 mb-2">{result.message}</p>}
            
            {result.data && (
              <>
                {/* Check if data is array of objects (tabular data) */}
                {Array.isArray(result.data) && result.data.length > 0 && typeof result.data[0] === 'object' && result.data[0] !== null ? (
                  renderTableData(result.data as Record<string, unknown>[], 'Query Results')
                ) : (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">View Raw Data</summary>
                    <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-60">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </>
            )}
          </div>
        ) : (
          <div>
            <div className="text-red-600 mb-2">❌ Error</div>
            <p className="text-sm text-red-800">{result.error || result.message}</p>
          </div>
        )}
      </Card>
    );
  };

  const renderDatasetsCards = (datasetsResult: BigQueryTestResult | null) => {
    if (!datasetsResult?.success || !Array.isArray(datasetsResult.data)) return null;

    return (
      <div className="mt-4">
        <h4 className="font-medium mb-3">Available Datasets ({datasetsResult.data.length})</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(datasetsResult.data as { id: string; friendlyName?: string; description?: string; location?: string }[]).map((dataset) => (
            <div
              key={dataset.id}
              className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => {
                setSelectedDataset(dataset.id);
                listTables(dataset.id);
              }}
            >
              <div className="font-medium text-sm text-blue-600">{dataset.id}</div>
              {dataset.friendlyName && (
                <div className="text-xs text-gray-600 mt-1">{dataset.friendlyName}</div>
              )}
              {dataset.description && (
                <div className="text-xs text-gray-500 mt-1 truncate">{dataset.description}</div>
              )}
              <div className="text-xs text-gray-400 mt-2">
                {dataset.location && `📍 ${dataset.location}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">BigQuery Test Console</h1>
          
          {/* Connection Test Section */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">🔗 Connection Test</h2>
            <p className="text-gray-600 mb-4">
              Test if BigQuery is properly configured with your credentials.
            </p>
            <Button 
              onClick={testConnection} 
              disabled={loading.connection}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading.connection ? 'Testing...' : 'Test Connection'}
            </Button>
            {renderResult(connectionStatus, 'Connection Status')}
          </Card>


          {/* Datasets Section */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">📊 Datasets</h2>
            <p className="text-gray-600 mb-4">
              List all datasets available in your BigQuery project.
            </p>
            <Button 
              onClick={listDatasets} 
              disabled={loading.datasets}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading.datasets ? 'Loading...' : 'List Datasets'}
            </Button>
            {datasets?.success ? (
              renderDatasetsCards(datasets)
            ) : datasets ? (
              renderResult(datasets, 'Available Datasets')
            ) : null}
          </Card>

          {/* Tables Section */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">📋 Tables</h2>
            <p className="text-gray-600 mb-4">
              List tables in a specific dataset.
            </p>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="Enter dataset name..."
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button 
                onClick={() => listTables(selectedDataset)} 
                disabled={loading.tables || !selectedDataset}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {loading.tables ? 'Loading...' : 'List Tables'}
              </Button>
            </div>
            {renderResult(tables, `Tables in Dataset: ${selectedDataset}`)}
          </Card>

          {/* BigQuery Data Tables Section */}
          <Card className="p-6 mb-6 border-2 border-blue-200 bg-blue-50">
            <h2 className="text-xl font-semibold mb-4">🗂️ Tabelas do biquery_data</h2>
            <p className="text-gray-600 mb-4">
              Listar e visualizar dados das tabelas dentro do dataset <code className="bg-gray-200 px-2 py-1 rounded">biquery_data</code>.
            </p>
            
            <div className="flex gap-3 mb-4">
              <Button 
                onClick={() => tablesHook.execute()} 
                disabled={tablesHook.loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {tablesHook.loading ? 'Carregando...' : 'Listar Tabelas'}
              </Button>
            </div>

            {/* Show error if any */}
            {tablesHook.error && (
              <div className="text-red-600 mb-4">❌ Erro: {tablesHook.error}</div>
            )}

            {/* Show tables list */}
            {tablesHook.data && Array.isArray(tablesHook.data) && tablesHook.data.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">📊 Tabelas encontradas ({tablesHook.data.length}):</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tablesHook.data.map((table: any) => (
                    <div
                      key={table.tableId}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTable === table.tableId 
                          ? 'bg-blue-100 border-blue-300' 
                          : 'bg-white hover:bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => {
                        setSelectedTable(table.tableId);
                        tableDataHook.execute();
                      }}
                    >
                      <div className="font-medium text-blue-600">{table.tableId}</div>
                      {table.description && (
                        <div className="text-xs text-gray-600 mt-1">{table.description}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-2">
                        {table.numRows && `📄 ${table.numRows} linhas`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show table data */}
            {selectedTable && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-semibold">📋 Dados da tabela: {selectedTable}</h3>
                  <Button 
                    onClick={() => tableDataHook.execute()} 
                    disabled={tableDataHook.loading}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {tableDataHook.loading ? 'Carregando...' : 'Atualizar Dados'}
                  </Button>
                </div>

                {tableDataHook.error && (
                  <div className="text-red-600 mb-4">❌ Erro ao carregar dados: {tableDataHook.error}</div>
                )}

                {tableDataHook.data && (
                  <div className="bg-white p-4 rounded border">
                    {Array.isArray(tableDataHook.data.data) && tableDataHook.data.data.length > 0 ? (
                      renderTableData(tableDataHook.data.data, `Dados da tabela ${selectedTable}`)
                    ) : (
                      <div className="text-gray-500 text-center py-8">
                        Nenhum dado encontrado na tabela {selectedTable}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Custom Query Section */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">🔍 Custom Query</h2>
            <p className="text-gray-600 mb-4">
              Execute a custom SQL query on your BigQuery data.
            </p>
            <div className="mb-4">
              <textarea
                placeholder="SELECT * FROM `project.dataset.table` LIMIT 10"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
            <Button 
              onClick={executeQuery} 
              disabled={loading.query || !customQuery.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading.query ? 'Executing...' : 'Execute Query'}
            </Button>
            {renderResult(queryResult, 'Query Results')}
          </Card>

          {/* Instructions */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">📝 Instructions</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>1. Test Connection:</strong> Verify your BigQuery credentials are working</p>
              <p><strong>2. List Datasets:</strong> See all datasets in your project</p>
              <p><strong>3. List Tables:</strong> Enter a dataset name to see its tables</p>
              <p><strong>4. Custom Query:</strong> Run SQL queries (be careful with LIMIT to avoid costs)</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}