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
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, BarChart3, Copy, MessageSquare, FileText } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { $lastQueryData } from '@/stores/queryStore';

interface SQLResultsTableProps {
  data: Record<string, unknown>[];
  schema: { name: string; type: string; mode: string }[];
  pageSize?: number;
}

export default function SQLResultsTable({ data, schema, pageSize = 10 }: SQLResultsTableProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Access query store for fresh data
  const queryStoreData = useStore($lastQueryData);
  
  // Use fresh data from store if available, fallback to props
  const exportData = queryStoreData && queryStoreData.length > 0 ? queryStoreData : data;

  // Export to CSV function
  const exportToCSV = () => {
    if (!exportData || exportData.length === 0) {
      alert('Nenhum dado disponível para exportar');
      return;
    }

    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value || '');
          return stringValue.includes(',') || stringValue.includes('"') 
            ? `"${stringValue.replace(/"/g, '""')}"` 
            : stringValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `query-results-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON function  
  const exportToJSON = () => {
    if (!exportData || exportData.length === 0) {
      alert('Nenhum dado disponível para exportar');
      return;
    }

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `query-results-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Analyze with AI function
  const analyzeWithAI = () => {
    if (!exportData || exportData.length === 0) {
      alert('Nenhum dado disponível para analisar');
      return;
    }

    console.log('📊 SQLResultsTable: Sending data for AI analysis:', exportData.length, 'rows');
    
    // Send data via postMessage to chat
    window.postMessage({
      type: 'ANALYZE_DATA',
      data: exportData,
      query: 'Dados da tabela SQL',
      timestamp: new Date().toISOString()
    }, '*');
  };

  // Copy raw data function
  const copyRawData = () => {
    if (!data || data.length === 0) {
      alert('Nenhum dado disponível para copiar');
      return;
    }

    try {
      const rawJson = JSON.stringify(data, null, 2);
      navigator.clipboard.writeText(rawJson);
      alert('Dados copiados para o clipboard!');
    } catch (error) {
      console.error('Erro ao copiar dados:', error);
      alert('Erro ao copiar dados para o clipboard');
    }
  };

  // Copy to chat function
  const copyToChat = () => {
    if (!data || data.length === 0) {
      alert('Nenhum dado disponível para enviar');
      return;
    }

    const displayText = `[+${data.length} linhas de dados]`;
    
    console.log('📊 SQLResultsTable: Sending data to chat:', data.length, 'rows');
    
    // Send data via postMessage to chat
    window.postMessage({
      type: 'SEND_TO_CHAT',
      data: data,
      displayText: displayText,
      query: 'Dados da tabela SQL',
      timestamp: new Date().toISOString()
    }, '*');
  };

  // Copy JSON to chat function
  const copyJSONToChat = () => {
    if (!data || data.length === 0) {
      alert('Nenhum dado disponível para enviar');
      return;
    }

    const displayText = `📄 SQL_Results.json (${data.length} registros)`;
    
    console.log('📄 SQLResultsTable: Sending JSON to chat:', data.length, 'rows');
    
    // Send data via postMessage to chat
    window.postMessage({
      type: 'SEND_JSON_TO_CHAT',
      data: data,
      displayText: displayText,
      fileName: 'SQL_Results.json',
      query: 'Dados da tabela SQL',
      timestamp: new Date().toISOString()
    }, '*');
  };

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
      {/* Search and Actions */}
      <div className="flex items-center justify-between gap-4">
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
        
        {/* Action buttons - always visible when there's data */}
        {exportData && exportData.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={analyzeWithAI}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analisar com IA
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToChat}
              className="bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Copiar pro Chat
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyJSONToChat}
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <FileText className="w-4 h-4 mr-2" />
              JSON pro Chat
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyRawData}
              className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar Dados Puros
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToJSON}
              className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
            >
              <Download className="w-4 h-4 mr-2" />
              JSON
            </Button>
            <span className="text-xs text-gray-500 ml-2">
              {exportData.length} registros
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <Table className="border-collapse">
          <TableHeader className="sticky top-0 bg-gray-50 z-10">
            <TableRow className="border-0">
              {columns.map((column) => (
                <TableHead key={column} className="bg-gray-50 font-medium text-gray-600 text-sm border-r border-gray-300 last:border-r-0 px-4 py-0 h-12">
                  <div className="flex items-center h-full">
                    {column}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <TableRow key={startIndex + rowIndex} className="hover:bg-gray-50 border-0 h-8 group">
                  {columns.map((column) => (
                    <TableCell key={column} className="font-mono text-sm border-r border-gray-300 last:border-r-0 border-b border-gray-200 px-4 py-0">
                      <div className="flex items-center h-full">
                        {formatValue(row[column])}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center border-r border-gray-300 border-b border-gray-200">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <span className="text-sm font-medium">{searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum dado disponível'}</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Baserow-style footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
        <div className="flex items-center gap-6">
          <span className="font-medium">{filteredData.length} rows</span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-3">
            <span className="text-gray-500">Page {currentPage + 1} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(0)}
                disabled={currentPage === 0}
                className="h-7 w-7 p-0 hover:bg-gray-200"
              >
                ‹‹
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 0}
                className="h-7 w-7 p-0 hover:bg-gray-200"
              >
                ‹
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="h-7 w-7 p-0 hover:bg-gray-200"
              >
                ›
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(totalPages - 1)}
                disabled={currentPage >= totalPages - 1}
                className="h-7 w-7 p-0 hover:bg-gray-200"
              >
                ››
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}