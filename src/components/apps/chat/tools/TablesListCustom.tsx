'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTable, TableData } from '@/components/widgets/Table';

interface Table extends TableData {
  tableId: string;
  numBytes?: number;
}

interface TablesListCustomProps {
  tables?: Table[];
  datasetId?: string;
  success?: boolean;
  error?: string;
}

function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

const columns: ColumnDef<Table>[] = [
  {
    accessorKey: 'tableId',
    header: 'Nome da Tabela',
    cell: ({ row }) => (
      <span className="font-medium text-gray-900">{row.getValue('tableId')}</span>
    ),
  },
  {
    accessorKey: 'numBytes',
    header: 'Tamanho',
    cell: ({ row }) => {
      const numBytes = row.getValue('numBytes') as number;
      return numBytes ? formatBytes(numBytes) : '-';
    },
  },
];

export default function TablesListCustom({ tables, datasetId, success, error }: TablesListCustomProps) {
  if (error || !success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-red-800">Erro ao carregar tabelas</h3>
        </div>
        <p className="text-red-700 text-sm mt-1">{error || 'Erro desconhecido'}</p>
      </div>
    );
  }

  if (!tables || tables.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-yellow-800">Nenhuma tabela encontrada</h3>
        </div>
        <p className="text-yellow-700 text-sm mt-1">
          Não há tabelas no dataset {datasetId || 'especificado'}.
        </p>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={tables}
      searchPlaceholder="Filtrar tabelas..."
      pageSize={10}
    />
  );
}