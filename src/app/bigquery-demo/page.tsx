'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Sidebar from '@/components/navigation/Sidebar';
import { useBigQuery, useBigQueryDatasets, useBigQueryConnection, bigQueryUtils } from '@/hooks/useBigQuery';

export default function BigQueryDemoPage() {
  const [customQuery, setCustomQuery] = useState('');

  // Example 1: Test connection (similar to CUBE.js connection test)
  const connection = useBigQueryConnection();

  // Example 2: List datasets (auto-execute)
  const datasets = useBigQueryDatasets();

  // Example 3: Custom query hook
  const customQueryHook = useBigQuery('/api/bigquery-simple', {
    method: 'POST',
    body: customQuery ? {
      action: 'execute',
      query: customQuery
    } : null
  });

  // Example query builder
  const handleBuildQuery = () => {
    const table = bigQueryUtils.buildTableRef('creatto-463117', 'biquery_data', 'your_table_name');
    const query = bigQueryUtils.buildSelectQuery(table, {
      columns: ['*'],
      limit: 10
    });
    setCustomQuery(query);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">BigQuery Hook Demo</h1>
          <p className="text-gray-600 mb-8">
            Demonstração do hook useBigQuery - similar ao que usávamos com CUBE.js
          </p>

          {/* Connection Test */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">🔗 Teste de Conexão</h2>
            <Button 
              onClick={connection.execute} 
              disabled={connection.loading}
              className="mb-4"
            >
              {connection.loading ? 'Testando...' : 'Testar Conexão'}
            </Button>
            
            {connection.error && (
              <div className="text-red-600 mb-2">❌ {connection.error}</div>
            )}
            
            {connection.data && (
              <div className="bg-green-50 p-3 rounded">
                <div className="text-green-600 mb-2">✅ Conectado!</div>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(connection.data, null, 2)}
                </pre>
              </div>
            )}
          </Card>

          {/* Datasets List */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">📊 Lista de Datasets</h2>
            <Button 
              onClick={datasets.execute} 
              disabled={datasets.loading}
              className="mb-4"
            >
              {datasets.loading ? 'Carregando...' : 'Carregar Datasets'}
            </Button>
            
            {datasets.error && (
              <div className="text-red-600 mb-2">❌ {datasets.error}</div>
            )}
            
            {datasets.data && (
              <div className="grid gap-3">
                {datasets.data.map((dataset) => (
                  <div key={dataset.id} className="p-3 border rounded bg-gray-50">
                    <div className="font-medium text-blue-600">{dataset.id}</div>
                    {dataset.friendlyName && (
                      <div className="text-sm text-gray-600">{dataset.friendlyName}</div>
                    )}
                    {dataset.location && (
                      <div className="text-xs text-gray-500">📍 {dataset.location}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Custom Query */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">🔍 Query Personalizada</h2>
            <div className="mb-4">
              <textarea
                placeholder="SELECT * FROM `creatto-463117.biquery_data.table_name` LIMIT 10"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
            
            <div className="flex gap-3 mb-4">
              <Button 
                onClick={() => customQueryHook.execute()} 
                disabled={customQueryHook.loading || !customQuery.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {customQueryHook.loading ? 'Executando...' : 'Executar Query'}
              </Button>
              <Button 
                onClick={handleBuildQuery}
                variant="outline"
              >
                Exemplo de Query
              </Button>
            </div>
            
            {customQueryHook.error && (
              <div className="text-red-600 mb-2">❌ {customQueryHook.error}</div>
            )}
            
            {customQueryHook.data && (
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-blue-600 mb-2">✅ Query executada com sucesso!</div>
                <pre className="text-xs overflow-auto max-h-60">
                  {JSON.stringify(customQueryHook.data, null, 2)}
                </pre>
              </div>
            )}
          </Card>

          {/* Code Examples */}
          <Card className="p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📖 Exemplos de Uso</h3>
            <div className="text-sm space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">1. Teste de Conexão</h4>
                <pre className="bg-white p-3 rounded border text-xs overflow-auto">
{`const connection = useBigQueryConnection();

// Usar no componente
<Button onClick={connection.execute} disabled={connection.loading}>
  {connection.loading ? 'Testando...' : 'Testar Conexão'}
</Button>`}
                </pre>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">2. Listar Datasets</h4>
                <pre className="bg-white p-3 rounded border text-xs overflow-auto">
{`const datasets = useBigQueryDatasets();

// Auto-carrega ou execute manualmente
useEffect(() => {
  datasets.execute();
}, []);`}
                </pre>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">3. Query Personalizada</h4>
                <pre className="bg-white p-3 rounded border text-xs overflow-auto">
{`const queryResult = useBigQueryQuery(\`
  SELECT * FROM \\\`creatto-463117.biquery_data.table_name\\\` 
  LIMIT 10
\`);

// Ou com parâmetros
const { data, loading, error } = useBigQuery('/api/bigquery-simple', {
  method: 'POST',
  body: { action: 'execute', query: myQuery }
});`}
                </pre>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}