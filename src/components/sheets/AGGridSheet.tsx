'use client';

import { useState, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';

// AG Grid CSS
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

interface RowData {
  id: number;
  produto: string;
  categoria: string;
  preco: number;
  estoque: number;
  vendas: number;
  ativo: boolean;
  dataLancamento: string;
}

export default function AGGridSheet() {
  // Dados de exemplo
  const [rowData] = useState<RowData[]>([
    {
      id: 1,
      produto: "iPhone 15 Pro",
      categoria: "Smartphones",
      preco: 7999.99,
      estoque: 45,
      vendas: 1250,
      ativo: true,
      dataLancamento: "2023-09-15"
    },
    {
      id: 2,
      produto: "Samsung Galaxy S24",
      categoria: "Smartphones",
      preco: 6999.99,
      estoque: 32,
      vendas: 890,
      ativo: true,
      dataLancamento: "2024-01-20"
    },
    {
      id: 3,
      produto: "MacBook Air M3",
      categoria: "Laptops",
      preco: 12999.99,
      estoque: 18,
      vendas: 456,
      ativo: true,
      dataLancamento: "2024-03-10"
    },
    {
      id: 4,
      produto: "Dell XPS 13",
      categoria: "Laptops",
      preco: 8999.99,
      estoque: 25,
      vendas: 332,
      ativo: true,
      dataLancamento: "2023-11-05"
    },
    {
      id: 5,
      produto: "iPad Air",
      categoria: "Tablets",
      preco: 4999.99,
      estoque: 67,
      vendas: 778,
      ativo: true,
      dataLancamento: "2024-02-28"
    },
    {
      id: 6,
      produto: "AirPods Pro 2",
      categoria: "Acessórios",
      preco: 2299.99,
      estoque: 120,
      vendas: 2150,
      ativo: true,
      dataLancamento: "2023-09-20"
    },
    {
      id: 7,
      produto: "Sony WH-1000XM5",
      categoria: "Acessórios",
      preco: 1899.99,
      estoque: 58,
      vendas: 445,
      ativo: true,
      dataLancamento: "2023-07-12"
    },
    {
      id: 8,
      produto: "Nintendo Switch OLED",
      categoria: "Games",
      preco: 2499.99,
      estoque: 91,
      vendas: 1680,
      ativo: true,
      dataLancamento: "2023-10-08"
    },
    {
      id: 9,
      produto: "PlayStation 5",
      categoria: "Games",
      preco: 4999.99,
      estoque: 12,
      vendas: 567,
      ativo: false,
      dataLancamento: "2023-05-15"
    },
    {
      id: 10,
      produto: "Apple Watch Series 9",
      categoria: "Wearables",
      preco: 3299.99,
      estoque: 74,
      vendas: 892,
      ativo: true,
      dataLancamento: "2023-09-22"
    }
  ]);

  // Definição das colunas
  const [colDefs] = useState<ColDef<RowData>[]>([
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      pinned: 'left',
      editable: false,
      sortable: true
    },
    {
      field: 'produto',
      headerName: 'Produto',
      width: 200,
      editable: true,
      sortable: true,
      filter: 'agTextColumnFilter'
    },
    {
      field: 'categoria',
      headerName: 'Categoria',
      width: 150,
      editable: true,
      sortable: true,
      filter: 'agSetColumnFilter'
    },
    {
      field: 'preco',
      headerName: 'Preço (R$)',
      width: 120,
      editable: true,
      sortable: true,
      filter: 'agNumberColumnFilter',
      valueFormatter: (params) => {
        if (params.value == null) return '';
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(params.value);
      }
    },
    {
      field: 'estoque',
      headerName: 'Estoque',
      width: 100,
      editable: true,
      sortable: true,
      filter: 'agNumberColumnFilter',
      cellStyle: (params) => {
        if (params.value < 20) {
          return { backgroundColor: '#ffebee', color: '#c62828' };
        } else if (params.value < 50) {
          return { backgroundColor: '#fff3e0', color: '#f57c00' };
        }
        return { backgroundColor: '#e8f5e8', color: '#2e7d32' };
      }
    },
    {
      field: 'vendas',
      headerName: 'Vendas',
      width: 100,
      editable: true,
      sortable: true,
      filter: 'agNumberColumnFilter'
    },
    {
      field: 'ativo',
      headerName: 'Ativo',
      width: 80,
      editable: true,
      sortable: true,
      filter: 'agSetColumnFilter',
      cellRenderer: (params: { value: boolean }) => {
        return params.value ? '✓' : '✗';
      },
      cellStyle: (params) => {
        return params.value 
          ? { color: '#2e7d32', fontWeight: 'bold' }
          : { color: '#c62828', fontWeight: 'bold' };
      }
    },
    {
      field: 'dataLancamento',
      headerName: 'Data Lançamento',
      width: 150,
      editable: true,
      sortable: true,
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString('pt-BR');
      }
    }
  ]);

  // Grid options
  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: true
  };

  // Callbacks
  const onCellValueChanged = useCallback((event: { colDef: { field: string }, oldValue: unknown, newValue: unknown, data: RowData }) => {
    console.log('Célula alterada:', {
      field: event.colDef.field,
      oldValue: event.oldValue,
      newValue: event.newValue,
      data: event.data
    });
  }, []);

  const onRowSelected = useCallback((event: { node: { isSelected: () => boolean }, data: RowData }) => {
    if (event.node.isSelected()) {
      console.log('Linha selecionada:', event.data);
    }
  }, []);

  return (
    <div className="w-full h-full p-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Planilha de Produtos
        </h2>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>📊 {rowData.length} produtos</span>
          <span>✏️ Edição inline habilitada</span>
          <span>🔍 Filtros disponíveis</span>
          <span>📋 Seleção múltipla</span>
        </div>
      </div>

      {/* AG Grid */}
      <div className="ag-theme-alpine w-full" style={{ height: 'calc(100vh - 180px)' }}>
        <AgGridReact<RowData>
          rowData={rowData}
          columnDefs={colDefs}
          defaultColDef={defaultColDef}
          rowSelection="multiple"
          suppressRowClickSelection={false}
          animateRows={true}
          pagination={true}
          paginationPageSize={20}
          onCellValueChanged={onCellValueChanged}
          onRowSelected={onRowSelected}
        />
      </div>
    </div>
  );
}