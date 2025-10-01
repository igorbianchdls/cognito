import { ColDef } from 'ag-grid-community';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Função genérica para buscar dados de uma tabela
export async function fetchSupabaseTable(tableName: string) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching table ${tableName}:`, error);
    throw error;
  }
}

// Configurações de colunas para Contas a Receber
export const contasAReceberColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 80,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'numero_fatura',
    headerName: 'Fatura',
    width: 120,
    editable: false,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'cliente_nome',
    headerName: 'Cliente',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'cliente_email',
    headerName: 'Email',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'valor_total',
    headerName: 'Valor Total (R$)',
    width: 130,
    editable: false,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(params.value);
    }
  },
  {
    field: 'valor_pago',
    headerName: 'Pago (R$)',
    width: 130,
    editable: false,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(params.value);
    }
  },
  {
    field: 'valor_pendente',
    headerName: 'Pendente (R$)',
    width: 130,
    editable: false,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(params.value);
    }
  },
  {
    field: 'data_emissao',
    headerName: 'Emissão',
    width: 120,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleDateString('pt-BR');
    }
  },
  {
    field: 'data_vencimento',
    headerName: 'Vencimento',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleDateString('pt-BR');
    }
  },
  {
    field: 'data_pagamento',
    headerName: 'Pagamento',
    width: 120,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleDateString('pt-BR');
    }
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 100,
    editable: false,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true,
    cellStyle: (params) => {
      switch (params.value) {
        case 'pago': return { color: '#2e7d32', fontWeight: 'bold' };
        case 'pendente': return { color: '#f57c00', fontWeight: 'bold' };
        case 'vencido': return { color: '#c62828', fontWeight: 'bold' };
        case 'cancelado': return { color: '#757575', fontWeight: 'bold' };
        default: return undefined;
      }
    }
  },
  {
    field: 'metodo_pagamento',
    headerName: 'Método',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter'
  }
];

// Configurações de colunas para Contas a Pagar
export const contasAPagarColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 80,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'numero_conta',
    headerName: 'Conta',
    width: 120,
    editable: false,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'fornecedor_nome',
    headerName: 'Fornecedor',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'fornecedor_cnpj',
    headerName: 'CNPJ',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'valor_total',
    headerName: 'Valor Total (R$)',
    width: 130,
    editable: false,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(params.value);
    }
  },
  {
    field: 'valor_pago',
    headerName: 'Pago (R$)',
    width: 130,
    editable: false,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(params.value);
    }
  },
  {
    field: 'valor_pendente',
    headerName: 'Pendente (R$)',
    width: 130,
    editable: false,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(params.value);
    }
  },
  {
    field: 'categoria',
    headerName: 'Categoria',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true
  },
  {
    field: 'centro_custo',
    headerName: 'Centro Custo',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'data_emissao',
    headerName: 'Emissão',
    width: 120,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleDateString('pt-BR');
    }
  },
  {
    field: 'data_vencimento',
    headerName: 'Vencimento',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleDateString('pt-BR');
    }
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 100,
    editable: false,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true,
    cellStyle: (params) => {
      switch (params.value) {
        case 'pago': return { color: '#2e7d32', fontWeight: 'bold' };
        case 'pendente': return { color: '#f57c00', fontWeight: 'bold' };
        case 'vencido': return { color: '#c62828', fontWeight: 'bold' };
        case 'cancelado': return { color: '#757575', fontWeight: 'bold' };
        default: return undefined;
      }
    }
  }
];

// Configurações de colunas para Estoque
export const inventoryColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 80,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'codigo_produto',
    headerName: 'Código',
    width: 120,
    editable: false,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'nome_produto',
    headerName: 'Produto',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'categoria',
    headerName: 'Categoria',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true
  },
  {
    field: 'descricao',
    headerName: 'Descrição',
    width: 250,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'quantidade_atual',
    headerName: 'Estoque',
    width: 100,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    cellStyle: (params) => {
      const minimo = params.data?.quantidade_minima || 0;
      if (params.value < minimo) {
        return { backgroundColor: '#ffebee', color: '#c62828', fontWeight: 'bold' };
      } else if (params.value < minimo * 2) {
        return { backgroundColor: '#fff3e0', color: '#f57c00' };
      }
      return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
    }
  },
  {
    field: 'quantidade_minima',
    headerName: 'Mínimo',
    width: 90,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter'
  },
  {
    field: 'quantidade_maxima',
    headerName: 'Máximo',
    width: 90,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter'
  },
  {
    field: 'unidade_medida',
    headerName: 'Unidade',
    width: 90,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter'
  },
  {
    field: 'localizacao',
    headerName: 'Localização',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'fornecedor',
    headerName: 'Fornecedor',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'custo_unitario',
    headerName: 'Custo (R$)',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'avg',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(params.value);
    }
  },
  {
    field: 'preco_venda',
    headerName: 'Preço (R$)',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'avg',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(params.value);
    }
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    cellStyle: (params) => {
      switch (params.value) {
        case 'disponivel': return { color: '#2e7d32', fontWeight: 'bold' };
        case 'baixo_estoque': return { color: '#f57c00', fontWeight: 'bold' };
        case 'esgotado': return { color: '#c62828', fontWeight: 'bold' };
        case 'descontinuado': return { color: '#757575', fontWeight: 'bold' };
        default: return undefined;
      }
    }
  }
];

// Definição de datasets do Supabase
export interface SupabaseDatasetConfig {
  id: string;
  name: string;
  description: string;
  tableName: string;
  columnDefs: ColDef[];
  icon?: string;
}

export const SUPABASE_DATASETS: SupabaseDatasetConfig[] = [
  {
    id: 'contas-a-receber',
    name: 'Contas a Receber',
    description: 'Faturas e recebiveis de clientes',
    tableName: 'invoices',
    columnDefs: contasAReceberColumns,
    icon: '💰'
  },
  {
    id: 'contas-a-pagar',
    name: 'Contas a Pagar',
    description: 'Despesas e contas de fornecedores',
    tableName: 'accounts_payable',
    columnDefs: contasAPagarColumns,
    icon: '💸'
  },
  {
    id: 'estoque',
    name: 'Estoque',
    description: 'Inventario de produtos',
    tableName: 'inventory',
    columnDefs: inventoryColumns,
    icon: '📦'
  }
];
