'use client';

import { useMemo } from 'react';
import { useSupabaseTables } from '../hooks/useSupabaseTables';
import { SUPABASE_DATASETS } from '@/data/supabaseDatasets';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TablesGalleryViewProps {
  tableName: string | null;
  showCover?: boolean;
}

export default function TablesGalleryView({ tableName, showCover = true }: TablesGalleryViewProps) {
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

  // Get status badge color (mais destacado)
  const getStatusColor = (status: string): string => {
    const statusLower = status?.toLowerCase() || '';

    if (statusLower.includes('pago') || statusLower.includes('conclu') || statusLower.includes('aprovado') || statusLower.includes('autorizada')) {
      return 'bg-green-500 text-white';
    }
    if (statusLower.includes('pendente') || statusLower.includes('draft') || statusLower.includes('fazer')) {
      return 'bg-yellow-500 text-white';
    }
    if (statusLower.includes('vencido') || statusLower.includes('reprovado') || statusLower.includes('cancelad')) {
      return 'bg-red-500 text-white';
    }
    if (statusLower.includes('andamento') || statusLower.includes('progresso') || statusLower.includes('revisão')) {
      return 'bg-blue-500 text-white';
    }

    return 'bg-gray-500 text-white';
  };

  // Get gradient for cover based on status/category
  const getCoverGradient = (row: Record<string, unknown>): string => {
    const statusField = Object.keys(row).find(key => key === 'status');
    const status = statusField ? String(row[statusField] || '').toLowerCase() : '';

    if (status.includes('pago') || status.includes('conclu')) {
      return 'from-green-400 to-emerald-600';
    }
    if (status.includes('pendente') || status.includes('fazer')) {
      return 'from-yellow-400 to-orange-500';
    }
    if (status.includes('vencido') || status.includes('cancelad')) {
      return 'from-red-400 to-rose-600';
    }
    if (status.includes('andamento') || status.includes('progresso')) {
      return 'from-blue-400 to-indigo-600';
    }

    return 'from-gray-400 to-slate-600';
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
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .gallery-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .gallery-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .gallery-scrollbar::-webkit-scrollbar-thumb {
          background: #9ca3af;
          border-radius: 3px;
        }
        .gallery-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        .gallery-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #9ca3af transparent;
        }
      `}} />
      <div className="h-full overflow-y-auto bg-white p-6 gallery-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((row: Record<string, unknown>) => {
          const titleValue = titleField ? row[titleField] : row.id;
          const title = String(titleValue || '');
          const statusField = Object.keys(row).find(key => key === 'status');
          const status = statusField ? String(row[statusField] || '') : '';
          const descField = displayFields.find(f => f.field?.includes('descri'));
          const descriptionValue = descField ? row[descField.field || ''] : null;
          const description = descriptionValue ? String(descriptionValue) : null;

          return (
            <Card
              key={row.id as string}
              className="hover:shadow-xl transition-all cursor-pointer overflow-hidden border border-gray-200 p-0"
            >
              {/* Cover/Header - sem padding, colado no topo */}
              {showCover && (
                <div className={`w-full h-48 bg-gradient-to-br ${getCoverGradient(row)} flex items-center justify-center`}>
                  <div className="text-6xl text-white opacity-40">{datasetConfig?.icon || '📄'}</div>
                </div>
              )}

              <div className="px-6 pb-6 pt-3 space-y-4">
                {/* Title - GRANDE */}
                <h3 className="font-bold text-xl text-gray-900 line-clamp-2">
                  {title}
                </h3>

                {/* Status Section */}
                {status && status !== '' && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</p>
                    <Badge className={`${getStatusColor(status)} px-3 py-1 text-sm font-medium`}>
                      {status}
                    </Badge>
                  </div>
                )}

                {/* Description/Info Section */}
                {description && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descrição</p>
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {description}
                    </p>
                  </div>
                )}

                {/* Other Fields Section */}
                <div className="space-y-2">
                  {displayFields
                    .filter(f => !f.field?.includes('descri') && f.field !== 'status')
                    .slice(0, 2)
                    .map((field) => {
                      const value = row[field.field || ''];
                      if (!value) return null;

                      return (
                        <div key={field.field} className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {field.headerName}
                          </p>
                          <p className="text-sm text-gray-900 font-medium">
                            {formatValue(value, field.field || '')}
                          </p>
                        </div>
                      );
                    })}
                </div>

                {/* Footer com ID - discreto */}
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    #{row.id as string}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
    </>
  );
}
