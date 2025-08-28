'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTable, createSortableHeader, TableData } from '@/components/widgets/Table';

interface SchemaColumn extends TableData {
  column_name: string;
  data_type: string;
}

interface TableSchemaProps {
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
    header: createSortableHeader('Nome da Coluna'),
    cell: ({ row }) => (
      <span className="font-medium text-gray-900">{row.getValue('column_name')}</span>
    ),
  },
  {
    accessorKey: 'data_type',
    header: createSortableHeader('Tipo de Dados'),
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

export default function TableSchema({ 
  columns = [], 
  success = true, 
  tableName,
  datasetId,
  projectId,
  totalColumns,
  error 
}: TableSchemaProps) {
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 font-medium">Erro ao obter schema:</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!success) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-600">Não foi possível obter o schema da tabela.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Schema da Tabela: {tableName}
          </h3>
          <p className="text-sm text-gray-600">
            {projectId}.{datasetId}.{tableName} • {totalColumns} colunas
          </p>
        </div>
      </div>
      
      {columns.length > 0 ? (
        <DataTable 
          columns={schemaColumns} 
          data={columns}
          showPagination={true}
        />
      ) : (
        <div className="p-8 text-center text-gray-500">
          <p>Nenhuma coluna encontrada na tabela.</p>
        </div>
      )}
    </div>
  );
}