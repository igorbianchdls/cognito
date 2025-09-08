'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTable, TableData } from '@/components/widgets/Table';

interface Dataset extends TableData {
  id: string;
  friendlyName?: string;
  description?: string;
  location?: string;
  creationTime?: string;
  lastModifiedTime?: string;
}

interface DatasetsListProps {
  datasets?: Dataset[];
  success?: boolean;
  error?: string;
}

const columns: ColumnDef<Dataset>[] = [
  {
    accessorKey: 'id',
    header: 'ID do Dataset',
    cell: ({ row }) => (
      <span className="font-medium text-gray-900">{row.getValue('id')}</span>
    ),
  },
  {
    accessorKey: 'friendlyName',
    header: 'Nome',
    cell: ({ row }) => row.getValue('friendlyName') || '-',
  },
  {
    accessorKey: 'description',
    header: 'Descrição',
    cell: ({ row }) => {
      const description = row.getValue('description') as string;
      return (
        <div className="max-w-xs truncate" title={description}>
          {description || '-'}
        </div>
      );
    },
  },
  {
    accessorKey: 'location',
    header: 'Localização',
    cell: ({ row }) => row.getValue('location') || '-',
  },
  {
    accessorKey: 'creationTime',
    header: 'Criado em',
    cell: ({ row }) => {
      const creationTime = row.getValue('creationTime') as string;
      return creationTime ? new Date(creationTime).toLocaleDateString('pt-BR') : '-';
    },
  },
];

export default function DatasetsList({ datasets, success, error }: DatasetsListProps) {
  if (error || !success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-red-800">Erro ao carregar datasets</h3>
        </div>
        <p className="text-red-700 text-sm mt-1">{error || 'Erro desconhecido'}</p>
      </div>
    );
  }

  if (!datasets || datasets.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-yellow-800">Nenhum dataset encontrado</h3>
        </div>
        <p className="text-yellow-700 text-sm mt-1">Não há datasets disponíveis no projeto.</p>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={datasets}
      searchPlaceholder="Filtrar datasets..."
      pageSize={10}
    />
  );
}