'use client';

import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactContent
} from '@/components/ai-elements/artifact';
import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';

interface QueryResult {
  nome: string;
  success: boolean;
  data?: Array<Record<string, unknown>>;
  schema?: Array<{
    name: string;
    type: string;
    mode: string;
  }>;
  rowsReturned?: number;
  executionTime?: number;
  sqlQuery: string;
  descricao?: string;
  explicacao?: string;
  error?: string;
}

interface MultipleSQLProps {
  title: string;
  results: QueryResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalRows: number;
    totalExecutionTime: number;
  };
  metadata: {
    generatedAt: string;
    dataSource: string;
    datasetId: string;
  };
}

// Function to determine optimal grid layout based on query count
const getGridLayout = (count: number): string => {
  switch (count) {
    case 1:
      return 'grid-cols-1';
    case 2:
      return 'grid-cols-1 lg:grid-cols-2';
    case 3:
      return 'grid-cols-1 lg:grid-cols-3';
    case 4:
      return 'grid-cols-1 md:grid-cols-2';
    case 5:
    case 6:
      return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
    default:
      return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
  }
};

// Query Result Card Component
function QueryCard({ result, index }: { result: QueryResult; index: number }) {
  const [showSQL, setShowSQL] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 10;

  const paginatedData = result.data?.slice(
    currentPage * rowsPerPage,
    (currentPage + 1) * rowsPerPage
  ) || [];

  const totalPages = result.data ? Math.ceil(result.data.length / rowsPerPage) : 0;

  return (
    <div className={`border rounded-lg p-4 ${
      result.success
        ? 'border-green-200 bg-green-50'
        : 'border-red-200 bg-red-50'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className={result.success ? 'text-green-600' : 'text-red-600'}>
          {result.success ? '✅' : '❌'}
        </span>
        <h3 className="font-semibold text-gray-900">{result.nome}</h3>
      </div>

      {/* Explicação */}
      {result.explicacao && (
        <div className="mb-3 p-2 bg-blue-50 border-l-4 border-blue-400 rounded">
          <p className="text-blue-800 text-sm">
            📊 {result.explicacao}
          </p>
        </div>
      )}

      {/* Description */}
      {result.descricao && (
        <p className="text-sm text-gray-600 mb-3">{result.descricao}</p>
      )}

      {/* Success Content */}
      {result.success && result.data && (
        <div className="space-y-3">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{result.rowsReturned} registros</span>
            <span>{result.executionTime}ms</span>
          </div>

          {/* Data Table */}
          {paginatedData.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      {result.schema?.map(col => (
                        <th key={col.name} className="px-3 py-2 text-left font-medium text-gray-700">
                          {col.name}
                          <span className="ml-1 text-gray-400 text-xs">({col.type})</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {paginatedData.map((row, idx) => (
                      <tr key={idx} className="border-t hover:bg-gray-50">
                        {result.schema?.map(col => (
                          <td key={col.name} className="px-3 py-2 text-gray-600">
                            {String(row[col.name] || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t text-xs">
                  <span className="text-gray-500">
                    Página {currentPage + 1} de {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      className="px-2 py-1 bg-white border rounded disabled:opacity-50 hover:bg-gray-100"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage >= totalPages - 1}
                      className="px-2 py-1 bg-white border rounded disabled:opacity-50 hover:bg-gray-100"
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Content */}
      {result.error && (
        <div className="bg-red-100 border border-red-200 rounded p-3">
          <p className="text-red-700 text-sm font-medium">Erro na execução:</p>
          <p className="text-red-600 text-sm mt-1">{result.error}</p>
        </div>
      )}

      {/* SQL Query Toggle */}
      <div className="mt-3">
        <button
          onClick={() => setShowSQL(!showSQL)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          {showSQL ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
          Ver SQL
        </button>

        {showSQL && (
          <div className="mt-2 bg-gray-100 rounded p-3">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
              {result.sqlQuery}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export function MultipleSQL({
  title,
  results,
  summary,
  metadata
}: MultipleSQLProps) {
  const successfulQueries = results.filter(result => result.success);
  const failedQueries = results.filter(result => !result.success);

  const gridLayout = getGridLayout(results.length);

  return (
    <Artifact>
      <ArtifactHeader>
        <div className="flex-1 min-w-0">
          <ArtifactTitle>{title}</ArtifactTitle>
          <ArtifactDescription>
            📊 {summary.successful} de {summary.total} queries •
            📈 {summary.totalRows.toLocaleString()} registros •
            ⏱️ {summary.totalExecutionTime}ms •
            📅 {new Date(metadata.generatedAt).toLocaleString('pt-BR')}
          </ArtifactDescription>
        </div>
      </ArtifactHeader>

      <ArtifactContent className="p-0">
        <div style={{ minHeight: '400px', padding: '16px' }}>
          {/* Success Summary */}
          {summary.successful > 0 && (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">📊</span>
                  <span className="font-medium text-blue-800">
                    Análises SQL executadas com sucesso
                  </span>
                </div>
                <div className="text-blue-700 text-sm mt-1">
                  {summary.successful} quer{summary.successful !== 1 ? 'ies' : 'y'} •
                  {summary.totalRows.toLocaleString()} registros totais •
                  Dataset: {metadata.datasetId}
                  {summary.failed > 0 && ` • ${summary.failed} erro${summary.failed !== 1 ? 's' : ''}`}
                </div>
              </div>
            </div>
          )}

          {/* Queries Grid */}
          {results.length > 0 && (
            <div className={`grid ${gridLayout} gap-6 mb-6`}>
              {results.map((result, index) => (
                <QueryCard key={index} result={result} index={index} />
              ))}
            </div>
          )}

          {/* No Queries Available */}
          {results.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma query disponível
              </h3>
              <p className="text-gray-600">
                Não foi possível executar as análises SQL.
              </p>
            </div>
          )}

          {/* Performance Summary */}
          <div className="mt-8 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-lg font-semibold text-gray-900">{summary.total}</div>
                <div className="text-xs text-gray-500">Total Queries</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-lg font-semibold text-green-700">{summary.successful}</div>
                <div className="text-xs text-gray-500">Sucessos</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-lg font-semibold text-blue-700">
                  {summary.totalRows.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Registros</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-lg font-semibold text-purple-700">
                  {summary.totalExecutionTime}ms
                </div>
                <div className="text-xs text-gray-500">Tempo Total</div>
              </div>
            </div>
          </div>

          {/* Metadata Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Dataset: {metadata.datasetId}</span>
              <span>Fonte: {metadata.dataSource}</span>
            </div>
          </div>
        </div>
      </ArtifactContent>
    </Artifact>
  );
}