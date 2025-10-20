'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTable, TableData } from '@/components/widgets/Table';

interface SchemaColumn extends TableData {
  column_name: string;
  data_type: string;
}

interface TableSchemaCustomProps {
  columns?: SchemaColumn[];
  success?: boolean;
  tableName?: string;
  datasetId?: string;
  projectId?: string;
  totalColumns?: number;
  error?: string;
}

const schemaColumns: ColumnDef<SchemaColumn>[] = [
  {
    accessorKey: 'column_name',
    header: 'Nome da Coluna',
    cell: ({ row }) => (
      <span className="font-medium text-gray-900">{row.getValue('column_name')}</span>
    ),
  },
  {
    accessorKey: 'data_type',
    header: 'Tipo de Dados',
    cell: ({ row }) => {
      const dataType = row.getValue('data_type') as string;
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {dataType}
        </span>
      );
    },
  },
];

export default function TableSchemaCustom({
  columns = [],
  success = true,
  tableName,
  error
}: TableSchemaCustomProps) {
  if (error || !success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-red-800">Erro ao carregar schema</h3>
        </div>
        <p className="text-red-700 text-sm mt-1">{error || 'Erro desconhecido'}</p>
      </div>
    );
  }

  if (!columns || columns.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-yellow-800">Nenhuma coluna encontrada</h3>
        </div>
        <p className="text-yellow-700 text-sm mt-1">
          Não há colunas na tabela {tableName || 'especificada'}.
        </p>
      </div>
    );
  }

  return (
    <DataTable
      columns={schemaColumns}
      data={columns}
      searchPlaceholder="Filtrar colunas..."
      pageSize={10}
    />
  );
}