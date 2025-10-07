import { ColDef } from 'ag-grid-community';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Função genérica para buscar dados de uma tabela
export async function fetchSupabaseTable(tableName: string) {
  try {
    // Detectar se há schema no nome da tabela (ex: gestaofinanceira.categorias)
    const [schemaOrTable, maybeTable] = tableName.split('.');
    const schema = maybeTable ? schemaOrTable : undefined;
    const table = maybeTable || schemaOrTable;

    // Determinar coluna de ordenação (schemas novos usam criado_em)
    const orderColumn = schema ? 'criado_em' : 'created_at';

    if (schema) {
      // Para schemas customizados, usar RPC function
      const { data, error } = await supabase.rpc('fetch_table_data', {
        p_schema: schema,
        p_table: table,
        p_order_column: orderColumn,
        p_limit: 1000
      });

      if (error) throw error;
      return data || [];
    } else {
      // Para schema public, usar o método normal
      const { data, error} = await supabase
        .from(table)
        .select('*')
        .order(orderColumn, { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data || [];
    }
  } catch (error) {
    console.error(`Error fetching table ${tableName}:`, error);
    throw error;
  }
}

// Função genérica para atualizar um registro de uma tabela
export async function updateSupabaseTableRow(
  tableName: string,
  id: number | string,
  updates: Record<string, unknown>
) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating table ${tableName}:`, error);
    throw error;
  }
}

// ============================================
// GESTÃO FINANCEIRA - Schema: gestaofinanceira
// ============================================

// Configurações de colunas para Categorias (Gestão Financeira)
export const categoriasGestaoColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'nome',
    headerName: 'Nome',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'tipo',
    headerName: 'Tipo',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true,
    cellStyle: (params) => {
      return params.value === 'receita'
        ? { color: '#2e7d32', fontWeight: 'bold' }
        : { color: '#c62828', fontWeight: 'bold' };
    }
  },
  {
    field: 'criado_em',
    headerName: 'Criado em',
    width: 150,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleString('pt-BR');
    }
  }
];

// Configurações de colunas para Clientes (Gestão Financeira)
export const clientesGestaoColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'nome',
    headerName: 'Nome',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'cpf_cnpj',
    headerName: 'CPF/CNPJ',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'email',
    headerName: 'Email',
    width: 220,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'telefone',
    headerName: 'Telefone',
    width: 140,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'criado_em',
    headerName: 'Criado em',
    width: 150,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleString('pt-BR');
    }
  }
];

// Configurações de colunas para Fornecedores (Gestão Financeira)
export const fornecedoresGestaoColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'nome',
    headerName: 'Nome',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'cnpj',
    headerName: 'CNPJ',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'email',
    headerName: 'Email',
    width: 220,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'telefone',
    headerName: 'Telefone',
    width: 140,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'criado_em',
    headerName: 'Criado em',
    width: 150,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleString('pt-BR');
    }
  }
];

// Configurações de colunas para Contas (Gestão Financeira)
export const contasGestaoColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'nome',
    headerName: 'Nome da Conta',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'tipo',
    headerName: 'Tipo',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true
  },
  {
    field: 'saldo',
    headerName: 'Saldo (R$)',
    width: 150,
    editable: true,
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
    },
    cellStyle: (params) => {
      const saldo = params.value || 0;
      return saldo < 0
        ? { color: '#c62828', fontWeight: 'bold' }
        : { color: '#2e7d32', fontWeight: 'bold' };
    }
  },
  {
    field: 'criado_em',
    headerName: 'Criado em',
    width: 150,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleString('pt-BR');
    }
  }
];

// Configurações de colunas para Contas a Pagar (Gestão Financeira)
export const contasAPagarGestaoColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'fornecedor_id',
    headerName: 'Fornecedor ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'categoria_id',
    headerName: 'Categoria ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
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
    field: 'data_vencimento',
    headerName: 'Vencimento',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleDateString('pt-BR');
    }
  },
  {
    field: 'valor',
    headerName: 'Valor (R$)',
    width: 140,
    editable: true,
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
    field: 'status',
    headerName: 'Status',
    width: 110,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true,
    cellStyle: (params) => {
      switch (params.value) {
        case 'pago': return { color: '#2e7d32', fontWeight: 'bold' };
        case 'pendente': return { color: '#f57c00', fontWeight: 'bold' };
        case 'vencido': return { color: '#c62828', fontWeight: 'bold' };
        default: return undefined;
      }
    }
  },
  {
    field: 'data_pagamento',
    headerName: 'Data Pagamento',
    width: 140,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleDateString('pt-BR');
    }
  },
  {
    field: 'conta_id',
    headerName: 'Conta ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'criado_em',
    headerName: 'Criado em',
    width: 150,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleString('pt-BR');
    }
  }
];

// Configurações de colunas para Contas a Receber (Gestão Financeira)
export const contasAReceberGestaoColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'cliente_id',
    headerName: 'Cliente ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'categoria_id',
    headerName: 'Categoria ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
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
    field: 'data_vencimento',
    headerName: 'Vencimento',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleDateString('pt-BR');
    }
  },
  {
    field: 'valor',
    headerName: 'Valor (R$)',
    width: 140,
    editable: true,
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
    field: 'status',
    headerName: 'Status',
    width: 110,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true,
    cellStyle: (params) => {
      switch (params.value) {
        case 'pago': return { color: '#2e7d32', fontWeight: 'bold' };
        case 'pendente': return { color: '#f57c00', fontWeight: 'bold' };
        case 'vencido': return { color: '#c62828', fontWeight: 'bold' };
        default: return undefined;
      }
    }
  },
  {
    field: 'data_recebimento',
    headerName: 'Data Recebimento',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleDateString('pt-BR');
    }
  },
  {
    field: 'conta_id',
    headerName: 'Conta ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'criado_em',
    headerName: 'Criado em',
    width: 150,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleString('pt-BR');
    }
  }
];

// Configurações de colunas para Conciliação Bancária (Gestão Financeira)
export const conciliacaoBancariaColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'conta_id',
    headerName: 'Conta ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'data_extrato',
    headerName: 'Data Extrato',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleDateString('pt-BR');
    }
  },
  {
    field: 'saldo_extrato',
    headerName: 'Saldo Extrato (R$)',
    width: 160,
    editable: true,
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
    field: 'saldo_sistema',
    headerName: 'Saldo Sistema (R$)',
    width: 160,
    editable: true,
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
    field: 'diferenca',
    headerName: 'Diferença (R$)',
    width: 140,
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
    },
    cellStyle: (params) => {
      const diff = params.value || 0;
      return diff !== 0
        ? { backgroundColor: '#ffebee', color: '#c62828', fontWeight: 'bold' }
        : { backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 'bold' };
    }
  },
  {
    field: 'conciliado',
    headerName: 'Conciliado',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    valueFormatter: (params) => {
      return params.value ? 'Sim' : 'Não';
    },
    cellStyle: (params) => {
      return params.value
        ? { color: '#2e7d32', fontWeight: 'bold' }
        : { color: '#f57c00', fontWeight: 'bold' };
    }
  },
  {
    field: 'criado_em',
    headerName: 'Criado em',
    width: 150,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleString('pt-BR');
    }
  }
];

// Configurações de colunas para Movimentos (Gestão Financeira)
export const movimentosGestaoColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'conta_id',
    headerName: 'Conta ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'categoria_id',
    headerName: 'Categoria ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'tipo',
    headerName: 'Tipo',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true,
    cellStyle: (params) => {
      return params.value === 'entrada'
        ? { color: '#2e7d32', fontWeight: 'bold' }
        : { color: '#c62828', fontWeight: 'bold' };
    }
  },
  {
    field: 'valor',
    headerName: 'Valor (R$)',
    width: 140,
    editable: true,
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
    field: 'data',
    headerName: 'Data',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleDateString('pt-BR');
    }
  },
  {
    field: 'conta_a_pagar_id',
    headerName: 'Conta a Pagar ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'conta_a_receber_id',
    headerName: 'Conta a Receber ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'criado_em',
    headerName: 'Criado em',
    width: 150,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleString('pt-BR');
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
  category: string;
}

export const SUPABASE_DATASETS: SupabaseDatasetConfig[] = [
  {
    id: 'gestao-categorias',
    name: 'Categorias',
    description: 'Categorias de receitas e despesas',
    tableName: 'gestaofinanceira.categorias',
    columnDefs: categoriasGestaoColumns,
    icon: '🏷️',
    category: 'Gestão Financeira'
  },
  {
    id: 'gestao-clientes',
    name: 'Clientes',
    description: 'Cadastro de clientes',
    tableName: 'gestaofinanceira.clientes',
    columnDefs: clientesGestaoColumns,
    icon: '👥',
    category: 'Gestão Financeira'
  },
  {
    id: 'gestao-fornecedores',
    name: 'Fornecedores',
    description: 'Cadastro de fornecedores',
    tableName: 'gestaofinanceira.fornecedores',
    columnDefs: fornecedoresGestaoColumns,
    icon: '🏭',
    category: 'Gestão Financeira'
  },
  {
    id: 'gestao-contas',
    name: 'Contas Bancárias',
    description: 'Contas bancárias e saldos',
    tableName: 'gestaofinanceira.contas',
    columnDefs: contasGestaoColumns,
    icon: '🏦',
    category: 'Gestão Financeira'
  },
  {
    id: 'gestao-contas-a-pagar',
    name: 'Contas a Pagar',
    description: 'Contas a pagar e despesas',
    tableName: 'gestaofinanceira.contas_a_pagar',
    columnDefs: contasAPagarGestaoColumns,
    icon: '💸',
    category: 'Gestão Financeira'
  },
  {
    id: 'gestao-contas-a-receber',
    name: 'Contas a Receber',
    description: 'Contas a receber e receitas',
    tableName: 'gestaofinanceira.contas_a_receber',
    columnDefs: contasAReceberGestaoColumns,
    icon: '💰',
    category: 'Gestão Financeira'
  },
  {
    id: 'gestao-conciliacao',
    name: 'Conciliação Bancária',
    description: 'Conciliação de extratos bancários',
    tableName: 'gestaofinanceira.conciliacao_bancaria',
    columnDefs: conciliacaoBancariaColumns,
    icon: '⚖️',
    category: 'Gestão Financeira'
  },
  {
    id: 'gestao-movimentos',
    name: 'Movimentos Financeiros',
    description: 'Histórico de movimentações',
    tableName: 'gestaofinanceira.movimentos',
    columnDefs: movimentosGestaoColumns,
    icon: '📊',
    category: 'Gestão Financeira'
  }
];
