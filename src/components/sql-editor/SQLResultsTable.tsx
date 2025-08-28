'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface SQLResultsTableProps {
  data: Record<string, unknown>[];
  schema: { name: string; type: string; mode: string }[];
  pageSize?: number;
}

export default function SQLResultsTable({ data, schema, pageSize = 10 }: SQLResultsTableProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Get column names from schema or data
  const columns = schema.length > 0 
    ? schema.map(s => s.name)
    : data.length > 0 
      ? Object.keys(data[0])
      : [];

  // Filter data based on search
  const filteredData = data.filter(row =>
    Object.values(row).some(value =>
      String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Paginate data
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = currentPage * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getColumnType = (columnName: string): string => {
    const schemaColumn = schema.find(s => s.name === columnName);
    return schemaColumn ? `${schemaColumn.type} (${schemaColumn.mode})` : 'unknown';
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar nos resultados..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(0); // Reset to first page
          }}
          className="max-w-sm"
        />
        <span className="text-sm text-gray-600">
          {filteredData.length} de {data.length} linhas
        </span>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column} className="font-medium">
                  <div>
                    <div>{column}</div>
                    <div className="text-xs text-gray-500 font-normal">
                      {getColumnType(column)}
                    </div>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <TableRow key={startIndex + rowIndex}>
                  {columns.map((column) => (
                    <TableCell key={column} className="font-mono text-sm">
                      {formatValue(row[column])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                  {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum dado disponível'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Página {currentPage + 1} de {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}