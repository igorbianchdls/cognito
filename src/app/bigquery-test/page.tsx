'use client';

import { useState, useEffect } from 'react';
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
  const [carPricesResult, setCarPricesResult] = useState<BigQueryTestResult | null>(null);
  const [datasetInfoResult, setDatasetInfoResult] = useState<BigQueryTestResult | null>(null);
  
  // Daytona Sandbox states
  const [sandbox, setSandbox] = useState<{ id: string; status: string } | null>(null);
  const [sandboxStatus, setSandboxStatus] = useState<'idle' | 'creating' | 'ready' | 'error'>('idle');
  const [command, setCommand] = useState<string>('echo "Hello from Daytona!"');
  const [commandOutput, setCommandOutput] = useState<string>('');
  
  // Use the new hooks
  const tablesHook = useBigQueryTables('biquery_data');
  const tableDataHook = useBigQueryTableData('biquery_data', selectedTable, 100) as {
    data: { data: Record<string, unknown>[] } | null;
    loading: boolean;
    error: string | null;
    execute: () => Promise<void>;
    refetch: () => Promise<void>;
  };

  // Execute table data hook when selectedTable changes (and is valid)
  useEffect(() => {
    if (selectedTable && selectedTable.trim() !== '') {
      tableDataHook.execute();
    }
  }, [selectedTable, tableDataHook]);

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

  const testCarPrices = async () => {
    const query = 'SELECT * FROM `creatto-463117.biquery_data.car_prices` LIMIT 10';
    console.log('🚗 Testing car_prices with query:', query);
    
    setLoadingState('carPrices', true);
    setCarPricesResult(null);
    
    try {
      console.log('📤 Sending POST request to /api/bigquery');
      const response = await fetch('/api/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          query: query
        })
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);
      
      const result = await response.json();
      console.log('📊 Result:', result);
      
      setCarPricesResult(result);
    } catch (error) {
      console.error('❌ Error testing car_prices:', error);
      setCarPricesResult({
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      });
    } finally {
      setLoadingState('carPrices', false);
    }
  };

  const detectDatasetLocation = async () => {
    const datasetId = 'biquery_data';
    console.log('🔍 Detecting location for dataset:', datasetId);
    
    setLoadingState('datasetInfo', true);
    setDatasetInfoResult(null);
    
    try {
      console.log('📤 Sending GET request to detect dataset location');
      const response = await fetch(`/api/bigquery?action=dataset-info&dataset=${datasetId}`);
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);
      
      const result = await response.json();
      console.log('📊 Dataset info result:', result);
      
      if (result.success && result.data?.location) {
        console.log('🎯 Dataset location detected:', result.data.location);
      }
      
      setDatasetInfoResult(result);
    } catch (error) {
      console.error('❌ Error detecting dataset location:', error);
      setDatasetInfoResult({
        success: false,
        error: error instanceof Error ? error.message : 'Location detection failed'
      });
    } finally {
      setLoadingState('datasetInfo', false);
    }
  };

  // Daytona Sandbox functions
  const createSandbox = async () => {
    console.log('🏗️ Creating Daytona sandbox...');
    setSandboxStatus('creating');
    setCommandOutput('');
    
    try {
      const response = await fetch('/api/daytona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' })
      });
      
      const result = await response.json();
      console.log('📊 Sandbox creation result:', result);
      
      if (result.success) {
        setSandbox({ id: result.sandboxId, status: 'ready' });
        setSandboxStatus('ready');
        setCommandOutput('✅ Sandbox created successfully!\nSandbox ID: ' + result.sandboxId);
      } else {
        setSandboxStatus('error');
        setCommandOutput('❌ Error creating sandbox: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error creating sandbox:', error);
      setSandboxStatus('error');
      setCommandOutput('❌ Network error: ' + (error instanceof Error ? error.message : 'Failed to create sandbox'));
    }
  };

  const executeCommand = async () => {
    if (!sandbox?.id || !command.trim()) return;
    
    console.log('⚡ Executing command:', command);
    setLoadingState('commandExecution', true);
    
    try {
      const response = await fetch('/api/daytona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          command: command.trim(),
          sandboxId: sandbox.id
        })
      });
      
      const result = await response.json();
      console.log('📊 Command execution result:', result);
      
      if (result.success) {
        setCommandOutput(prev => prev + '\n\n$ ' + command + '\n' + (result.output || 'Command executed successfully'));
      } else {
        setCommandOutput(prev => prev + '\n\n$ ' + command + '\n❌ Error: ' + (result.error || 'Command failed'));
      }
    } catch (error) {
      console.error('❌ Error executing command:', error);
      setCommandOutput(prev => prev + '\n\n$ ' + command + '\n❌ Network error: ' + (error instanceof Error ? error.message : 'Failed to execute'));
    } finally {
      setLoadingState('commandExecution', false);
    }
  };

  const destroySandbox = async () => {
    if (!sandbox?.id) return;
    
    console.log('🗑️ Destroying sandbox:', sandbox.id);
    setLoadingState('destroySandbox', true);
    
    try {
      const response = await fetch('/api/daytona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'destroy',
          sandboxId: sandbox.id
        })
      });
      
      const result = await response.json();
      console.log('📊 Sandbox destroy result:', result);
      
      if (result.success) {
        setSandbox(null);
        setSandboxStatus('idle');
        setCommandOutput(prev => prev + '\n\n🗑️ Sandbox destroyed successfully!');
      } else {
        setCommandOutput(prev => prev + '\n\n❌ Error destroying sandbox: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error destroying sandbox:', error);
      setCommandOutput(prev => prev + '\n\n❌ Network error: ' + (error instanceof Error ? error.message : 'Failed to destroy'));
    } finally {
      setLoadingState('destroySandbox', false);
    }
  };

  const renderTableData = (data: Record<string, unknown>[], title: string) => {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);
    
    return (
      <div className="mt-4">
        <h4 className="font-medium mb-2">{title} ({data.length} rows)</h4>
        <div className="overflow-auto max-h-96 border rounded">
          <table className="min-w-full a divide-y divide-gray-200">
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
                  {tablesHook.data.map((table: {
                    DATASETID?: string;
                    TABLEID?: string;
                    PROJECTID?: string;
                    NUMROWS?: number;
                    NUMBYTES?: number;
                    CREATIONTIME?: string;
                    // Legacy format support
                    datasetId?: string;
                    tableId?: string;
                    projectId?: string;
                    description?: string;
                    numRows?: number;
                    numBytes?: number;
                    creationTime?: Date;
                    lastModifiedTime?: Date;
                  }) => {
                    // Support both API response formats
                    const tableId = table.TABLEID || table.tableId || '';
                    const numRows = table.NUMROWS || table.numRows;
                    
                    return (
                    <div
                      key={tableId}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTable === tableId 
                          ? 'bg-blue-100 border-blue-300' 
                          : 'bg-white hover:bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => {
                        setSelectedTable(tableId);
                        // Execute will be called automatically when selectedTable changes
                      }}
                    >
                      <div className="font-medium text-blue-600">{tableId}</div>
                      {table.description && (
                        <div className="text-xs text-gray-600 mt-1">{table.description}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-2">
                        {numRows && `📄 ${numRows.toLocaleString()} linhas`}
                      </div>
                    </div>
                  );
                  })}
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

          {/* Car Prices Direct Test */}
          <Card className="p-6 mb-6 border-2 border-green-200 bg-green-50">
            <h2 className="text-xl font-semibold mb-4">🚗 Teste Direto: car_prices</h2>
            <p className="text-gray-600 mb-4">
              Teste específico para carregar dados da tabela <code className="bg-gray-200 px-2 py-1 rounded">car_prices</code> 
              com query hardcoded.
            </p>
            
            <div className="mb-4">
              <code className="bg-gray-100 p-2 rounded text-sm block">
                SELECT * FROM `creatto-463117.biquery_data.car_prices` LIMIT 10
              </code>
            </div>

            <Button 
              onClick={testCarPrices} 
              disabled={loading.carPrices}
              className="bg-green-600 hover:bg-green-700 mb-4"
            >
              {loading.carPrices ? '🔄 Testando...' : '🚗 Testar car_prices'}
            </Button>

            {/* Show error if any */}
            {carPricesResult?.error && (
              <div className="text-red-600 mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <strong>❌ Erro:</strong> {carPricesResult.error}
              </div>
            )}

            {/* Show success result */}
            {carPricesResult?.success && carPricesResult.data && (
              <div className="mb-4">
                <div className="text-green-600 mb-2">
                  <strong>✅ Sucesso!</strong> Dados carregados da tabela car_prices
                </div>
                
                {/* Render table data if it's an array */}
                {(() => {
                  const data = carPricesResult.data;
                  
                  // Check if data has a 'data' property with array
                  if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data) && data.data.length > 0) {
                    return (
                      <div className="bg-white p-4 rounded border">
                        {renderTableData(data.data, 'Dados da tabela car_prices')}
                      </div>
                    );
                  }
                  
                  // Check if data itself is an array
                  if (Array.isArray(data) && data.length > 0) {
                    return (
                      <div className="bg-white p-4 rounded border">
                        {renderTableData(data, 'Dados da tabela car_prices')}
                      </div>
                    );
                  }
                  
                  // Show raw data
                  return (
                    <div className="bg-gray-100 p-4 rounded">
                      <strong>Dados retornados:</strong>
                      <pre className="mt-2 text-sm overflow-x-auto">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Show raw result for debugging */}
            {carPricesResult && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  🔍 Ver resultado completo (debug)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                  {JSON.stringify(carPricesResult, null, 2)}
                </pre>
              </details>
            )}
          </Card>

          {/* Dataset Location Detection */}
          <Card className="p-6 mb-6 border-2 border-yellow-200 bg-yellow-50">
            <h2 className="text-xl font-semibold mb-4">🔍 Detectar Location do Dataset</h2>
            <p className="text-gray-600 mb-4">
              Descubra a location (região) real do dataset <code className="bg-gray-200 px-2 py-1 rounded">biquery_data</code>. 
              Isso vai resolver o erro de &quot;Not found in location US&quot;.
            </p>

            <Button 
              onClick={detectDatasetLocation} 
              disabled={loading.datasetInfo}
              className="bg-yellow-600 hover:bg-yellow-700 mb-4"
            >
              {loading.datasetInfo ? '🔄 Detectando...' : '🔍 Detectar Location'}
            </Button>

            {/* Show error if any */}
            {datasetInfoResult?.error && (
              <div className="text-red-600 mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <strong>❌ Erro:</strong> {datasetInfoResult.error}
              </div>
            )}

            {/* Show success result */}
            {datasetInfoResult?.success && datasetInfoResult.data && (
              <div className="mb-4">
                <div className="text-green-600 mb-2">
                  <strong>✅ Dataset encontrado!</strong>
                </div>
                
                <div className="bg-white p-4 rounded border">
                  {(() => {
                    const data = datasetInfoResult.data as Record<string, unknown>; // Type assertion for dataset info
                    
                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Key information */}
                          <div>
                            <h4 className="font-semibold text-lg mb-2">📍 Informações Principais</h4>
                            <div className="space-y-1 text-sm">
                              <div><strong>Location:</strong> <code className="bg-green-100 px-2 py-1 rounded text-green-800">{String(data.location || 'N/A')}</code></div>
                              <div><strong>ID:</strong> <code>{String(data.id || 'N/A')}</code></div>
                              <div><strong>Nome Amigável:</strong> {String(data.friendlyName || 'N/A')}</div>
                              <div><strong>Descrição:</strong> {String(data.description || 'N/A')}</div>
                            </div>
                          </div>

                          {/* Timing information */}
                          <div>
                            <h4 className="font-semibold text-lg mb-2">⏰ Datas</h4>
                            <div className="space-y-1 text-sm">
                              <div><strong>Criado:</strong> {data.creationTime ? new Date(String(data.creationTime)).toLocaleString('pt-BR') : 'N/A'}</div>
                              <div><strong>Modificado:</strong> {data.lastModifiedTime ? new Date(String(data.lastModifiedTime)).toLocaleString('pt-BR') : 'N/A'}</div>
                            </div>
                          </div>
                        </div>

                        {/* Location highlight */}
                        {data.location && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">🎯</span>
                              <div>
                                <div className="font-semibold text-green-800">Location Detectada:</div>
                                <div className="text-green-700">
                                  Configure <code className="bg-green-100 px-2 py-1 rounded">BIGQUERY_LOCATION={String(data.location)}</code> no Vercel
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Show raw result for debugging */}
            {datasetInfoResult && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  🔍 Ver resultado completo (debug)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                  {JSON.stringify(datasetInfoResult, null, 2)}
                </pre>
              </details>
            )}
          </Card>

          {/* Daytona Sandbox */}
          <Card className="p-6 mb-6 border-2 border-indigo-200 bg-indigo-50">
            <h2 className="text-xl font-semibold mb-4">🏗️ Daytona Sandbox (Beta)</h2>
            <p className="text-gray-600 mb-4">
              Create and manage a cloud sandbox environment for testing commands and code execution.
            </p>

            {/* Status Display */}
            <div className="mb-4 p-3 bg-white border border-indigo-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Status: </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    sandboxStatus === 'idle' ? 'bg-gray-100 text-gray-800' :
                    sandboxStatus === 'creating' ? 'bg-yellow-100 text-yellow-800' :
                    sandboxStatus === 'ready' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {sandboxStatus === 'idle' && '⭕ Idle'}
                    {sandboxStatus === 'creating' && '🔄 Creating...'}
                    {sandboxStatus === 'ready' && '✅ Ready'}
                    {sandboxStatus === 'error' && '❌ Error'}
                  </span>
                </div>
                {sandbox?.id && (
                  <div className="text-xs text-gray-500">
                    ID: {sandbox.id.substring(0, 8)}...
                  </div>
                )}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-3 mb-6">
              <Button
                onClick={createSandbox}
                disabled={sandboxStatus === 'creating' || sandboxStatus === 'ready'}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {sandboxStatus === 'creating' ? '🔄 Creating...' : '🏗️ Create Sandbox'}
              </Button>
              
              <Button
                onClick={destroySandbox}
                disabled={sandboxStatus !== 'ready' || loading.destroySandbox}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                {loading.destroySandbox ? '🔄 Destroying...' : '🗑️ Destroy Sandbox'}
              </Button>
            </div>

            {/* Command Execution */}
            {sandboxStatus === 'ready' && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">💻 Execute Command</h3>
                <div className="flex gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Enter command to execute..."
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !loading.commandExecution && executeCommand()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={loading.commandExecution}
                  />
                  <Button
                    onClick={executeCommand}
                    disabled={!command.trim() || loading.commandExecution}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading.commandExecution ? '⏳ Running...' : '▶️ Execute'}
                  </Button>
                </div>

                {/* Quick Command Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    onClick={() => setCommand('echo "Hello from Daytona!"')}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Echo Test
                  </Button>
                  <Button
                    onClick={() => setCommand('node --version')}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Node Version
                  </Button>
                  <Button
                    onClick={() => setCommand('ls -la')}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    List Files
                  </Button>
                  <Button
                    onClick={() => setCommand('pwd')}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Current Dir
                  </Button>
                  <Button
                    onClick={() => setCommand('whoami')}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Who Am I
                  </Button>
                </div>
              </div>
            )}

            {/* Output Display */}
            {commandOutput && (
              <div className="mb-4">
                <h4 className="font-medium mb-3">📤 Output</h4>
                <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm max-h-64 overflow-y-auto">
                  <pre className="text-green-400 whitespace-pre-wrap">{commandOutput}</pre>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-indigo-100 border border-indigo-200 rounded-lg p-4">
              <h4 className="font-medium text-indigo-900 mb-2">💡 How to use:</h4>
              <div className="text-sm text-indigo-800 space-y-1">
                <p>1. Click <strong>&quot;Create Sandbox&quot;</strong> to create a new TypeScript environment</p>
                <p>2. Use the command input to execute terminal commands</p>
                <p>3. Try quick commands like <code>node --version</code> or <code>ls -la</code></p>
                <p>4. Click <strong>&quot;Destroy Sandbox&quot;</strong> when done to clean up resources</p>
                <p><strong>⚠️ Beta:</strong> Requires DAYTONA_API_KEY environment variable</p>
              </div>
            </div>
          </Card>

          {/* Instructions */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">📝 Instructions</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>1. Test Connection:</strong> Verify your BigQuery credentials are working</p>
              <p><strong>2. List Datasets:</strong> See all datasets in your project</p>
              <p><strong>3. List Tables:</strong> Enter a dataset name to see its tables</p>
              <p><strong>4. Custom Query:</strong> Run SQL queries (be careful with LIMIT to avoid costs)</p>
              <p><strong>5. Direct Tests:</strong> Test specific tables and detect dataset locations</p>
              <p><strong>6. Daytona Sandbox:</strong> Create cloud sandbox environments for testing (Beta)</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}