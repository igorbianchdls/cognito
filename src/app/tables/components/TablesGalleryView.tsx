'use client';

import { useMemo } from 'react';
import { useSupabaseTables } from '../hooks/useSupabaseTables';
import { SUPABASE_DATASETS } from '@/data/supabaseDatasets';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TablesGalleryViewProps {
  tableName: string | null;
}

export default function TablesGalleryView({ tableName }: TablesGalleryViewProps) {
  const { data, loading, error } = useSupabaseTables(tableName || '');
  const datasetConfig = SUPABASE_DATASETS.find(ds => ds.tableName === tableName);

  // Identify key fields to display on cards
  const displayFields = useMemo(() => {
    if (!datasetConfig?.columnDefs) return [];

    // Get first 4 non-ID fields for display
    return datasetConfig.columnDefs
      .filter(col => col.field !== 'id' && col.field !== 'created_at' && col.field !== 'updated_at')
      .slice(0, 4);
  }, [datasetConfig]);

  // Get title field (first non-ID text field)
  const titleField = useMemo(() => {
    if (!datasetConfig?.columnDefs) return null;

    const candidates = datasetConfig.columnDefs.find(
      col => col.field !== 'id' &&
             (col.field?.includes('nome') ||
              col.field?.includes('titulo') ||
              col.field?.includes('numero'))
    );

    return candidates?.field || datasetConfig.columnDefs[1]?.field;
  }, [datasetConfig]);

  // Format value based on field type
  const formatValue = (value: unknown, fieldName: string): string => {
    if (value === null || value === undefined) return '—';

    // Currency
    if (fieldName?.includes('valor') || fieldName?.includes('preco')) {
      const num = Number(value);
      if (!isNaN(num)) {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(num);
      }
    }

    // Date
    if (fieldName?.includes('data')) {
      const date = new Date(String(value));
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR');
      }
    }

    // Boolean
    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não';
    }

    return String(value);
  };

  // Get status badge color
  const getStatusColor = (status: string): string => {
    const statusLower = status?.toLowerCase() || '';

    if (statusLower.includes('pago') || statusLower.includes('conclu') || statusLower.includes('aprovado') || statusLower.includes('autorizada')) {
      return 'bg-green-100 text-green-800 border-green-300';
    }
    if (statusLower.includes('pendente') || statusLower.includes('draft')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
    if (statusLower.includes('vencido') || statusLower.includes('reprovado') || statusLower.includes('cancelad')) {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    if (statusLower.includes('andamento')) {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    }

    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (!tableName) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">Selecione uma tabela</p>
          <p className="text-sm">Escolha uma tabela do painel lateral para visualizar os dados</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium">Erro ao carregar dados</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">Nenhum registro encontrado</p>
          <p className="text-sm">Esta tabela está vazia</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.map((row: Record<string, unknown>) => {
          const title = titleField ? row[titleField] : row.id;
          const statusField = Object.keys(row).find(key => key === 'status');
          const status = statusField ? String(row[statusField] || '') : '';

          return (
            <Card
              key={row.id as string}
              className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
            >
              {/* Cover/Attachment area - placeholder for now */}
              <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <div className="text-4xl opacity-30">{datasetConfig?.icon || '📄'}</div>
              </div>

              <CardContent className="p-4 space-y-3">
                {/* Title */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                    {formatValue(title, titleField || '')}
                  </h3>
                  {status && status !== '' && (
                    <Badge className={getStatusColor(status)}>
                      {status}
                    </Badge>
                  )}
                </div>

                {/* Display Fields */}
                <div className="space-y-2">
                  {displayFields.slice(0, 3).map((field) => {
                    const value = row[field.field || ''];
                    if (!value || field.field === 'status') return null;

                    return (
                      <div key={field.field} className="text-sm">
                        <span className="text-gray-500">{field.headerName}:</span>
                        <span className="ml-2 text-gray-900 font-medium">
                          {formatValue(value, field.field || '')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Footer with ID */}
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    ID: {row.id as string}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
