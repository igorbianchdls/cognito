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
        return { backgroundColor: '#fff3e0', color: '#f57c00', fontWeight: 'normal' };
      }
      return { backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 'normal' };
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

// Configurações de colunas para Sales Calls
export const salesCallsColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 80,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'call_date',
    headerName: 'Data',
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
    field: 'sales_rep',
    headerName: 'Vendedor',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'cliente_nome',
    headerName: 'Cliente',
    width: 180,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true,
    cellStyle: (params) => {
      switch (params.value) {
        case 'closed-won': return { color: '#2e7d32', fontWeight: 'bold' };
        case 'closed-lost': return { color: '#c62828', fontWeight: 'bold' };
        case 'negotiation': return { color: '#f57c00', fontWeight: 'bold' };
        case 'proposal': return { color: '#1976d2', fontWeight: 'bold' };
        case 'qualification': return { color: '#7b1fa2', fontWeight: 'bold' };
        default: return undefined;
      }
    }
  },
  {
    field: 'duracao_minutos',
    headerName: 'Duração (min)',
    width: 120,
    editable: false,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'avg'
  },
  {
    field: 'transcricao',
    headerName: 'Transcrição',
    width: 250,
    editable: false,
    sortable: false,
    filter: 'agTextColumnFilter'
  }
];

// Configurações de colunas para RH Candidates
export const rhCandidatesColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 80,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'nome_candidato',
    headerName: 'Candidato',
    width: 180,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'vaga',
    headerName: 'Vaga',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true,
    enablePivot: true
  },
  {
    field: 'data_entrevista',
    headerName: 'Entrevista',
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
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true,
    cellStyle: (params) => {
      switch (params.value) {
        case 'aprovado': return { color: '#2e7d32', fontWeight: 'bold' };
        case 'reprovado': return { color: '#c62828', fontWeight: 'bold' };
        case 'em_analise': return { color: '#f57c00', fontWeight: 'bold' };
        default: return undefined;
      }
    }
  },
  {
    field: 'entrevistador',
    headerName: 'Entrevistador',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'nivel_experiencia',
    headerName: 'Experiência',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'observacoes',
    headerName: 'Observações',
    width: 250,
    editable: true,
    sortable: false,
    filter: 'agTextColumnFilter'
  }
];

// Configurações de colunas para Service Orders
export const serviceOrdersColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 80,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'numero_os',
    headerName: 'Nº OS',
    width: 100,
    editable: false,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'cliente_nome',
    headerName: 'Cliente',
    width: 180,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'tipo_servico',
    headerName: 'Tipo',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true,
    cellStyle: (params) => {
      switch (params.value) {
        case 'concluida': return { color: '#2e7d32', fontWeight: 'bold' };
        case 'cancelada': return { color: '#757575', fontWeight: 'bold' };
        case 'em_andamento': return { color: '#1976d2', fontWeight: 'bold' };
        case 'aguardando_pecas': return { color: '#f57c00', fontWeight: 'bold' };
        case 'aberta': return { color: '#9c27b0', fontWeight: 'bold' };
        default: return undefined;
      }
    }
  },
  {
    field: 'tecnico_responsavel',
    headerName: 'Técnico',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'data_abertura',
    headerName: 'Abertura',
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
    field: 'data_conclusao',
    headerName: 'Conclusão',
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
    field: 'valor_servico',
    headerName: 'Valor (R$)',
    width: 120,
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
  }
];

// Configurações de colunas para Receipts
export const receiptsColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 80,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'solicitante_nome',
    headerName: 'Solicitante',
    width: 180,
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
    enablePivot: true
  },
  {
    field: 'valor',
    headerName: 'Valor (R$)',
    width: 120,
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
    field: 'data_envio',
    headerName: 'Envio',
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
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true,
    cellStyle: (params) => {
      switch (params.value) {
        case 'reembolsado': return { color: '#2e7d32', fontWeight: 'bold' };
        case 'aprovado': return { color: '#1976d2', fontWeight: 'bold' };
        case 'reprovado': return { color: '#c62828', fontWeight: 'bold' };
        case 'pendente': return { color: '#f57c00', fontWeight: 'bold' };
        default: return undefined;
      }
    }
  },
  {
    field: 'descricao',
    headerName: 'Descrição',
    width: 250,
    editable: true,
    sortable: false,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'categoria',
    headerName: 'Categoria',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true
  }
];

// Configurações de colunas para Notas Fiscais
export const notasFiscaisColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 80,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'numero_nfe',
    headerName: 'Nº NFe',
    width: 120,
    editable: false,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'tipo',
    headerName: 'Tipo',
    width: 100,
    editable: false,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true,
    cellStyle: (params) => {
      return params.value === 'entrada'
        ? { color: '#1976d2', fontWeight: 'bold' }
        : { color: '#f57c00', fontWeight: 'bold' };
    }
  },
  {
    field: 'emitente_nome',
    headerName: 'Emitente',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'emitente_cnpj',
    headerName: 'CNPJ Emitente',
    width: 150,
    editable: false,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'destinatario_nome',
    headerName: 'Destinatário',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'destinatario_cnpj',
    headerName: 'CNPJ Destinatário',
    width: 150,
    editable: false,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'valor_total',
    headerName: 'Valor (R$)',
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
    field: 'status',
    headerName: 'Status',
    width: 120,
    editable: false,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true,
    cellStyle: (params) => {
      switch (params.value) {
        case 'autorizada': return { color: '#2e7d32', fontWeight: 'bold' };
        case 'cancelada': return { color: '#c62828', fontWeight: 'bold' };
        case 'denegada': return { color: '#d32f2f', fontWeight: 'bold' };
        case 'inutilizada': return { color: '#757575', fontWeight: 'bold' };
        default: return undefined;
      }
    }
  }
];

// Configurações de colunas para YouTube Content
export const youtubeContentColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 80,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'titulo',
    headerName: 'Título',
    width: 250,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'categoria',
    headerName: 'Categoria',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true,
    cellStyle: (params) => {
      switch (params.value) {
        case 'published': return { color: '#2e7d32', fontWeight: 'bold' };
        case 'draft': return { color: '#f57c00', fontWeight: 'bold' };
        case 'archived': return { color: '#757575', fontWeight: 'bold' };
        default: return undefined;
      }
    }
  },
  {
    field: 'hook',
    headerName: 'Hook',
    width: 200,
    editable: true,
    sortable: false,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'intro',
    headerName: 'Intro',
    width: 200,
    editable: true,
    sortable: false,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'value_proposition',
    headerName: 'Value Proposition',
    width: 200,
    editable: true,
    sortable: false,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'script',
    headerName: 'Script',
    width: 250,
    editable: true,
    sortable: false,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'created_at',
    headerName: 'Criado em',
    width: 120,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleDateString('pt-BR');
    }
  }
];

// Configurações de colunas para Reels Content
export const reelsContentColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 80,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'titulo',
    headerName: 'Título',
    width: 250,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true,
    cellStyle: (params) => {
      switch (params.value) {
        case 'published': return { color: '#2e7d32', fontWeight: 'bold' };
        case 'draft': return { color: '#f57c00', fontWeight: 'bold' };
        case 'archived': return { color: '#757575', fontWeight: 'bold' };
        default: return undefined;
      }
    }
  },
  {
    field: 'hook',
    headerName: 'Hook',
    width: 200,
    editable: true,
    sortable: false,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'hook_expansion',
    headerName: 'Hook Expansion',
    width: 200,
    editable: true,
    sortable: false,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'script',
    headerName: 'Script',
    width: 250,
    editable: true,
    sortable: false,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'duracao_segundos',
    headerName: 'Duração (s)',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'avg'
  },
  {
    field: 'created_at',
    headerName: 'Criado em',
    width: 120,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleDateString('pt-BR');
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
  },
  {
    id: 'sales-calls',
    name: 'Chamadas de Vendas',
    description: 'Gravações e transcrições de calls',
    tableName: 'sales_calls',
    columnDefs: salesCallsColumns,
    icon: '📞'
  },
  {
    id: 'rh-candidates',
    name: 'Candidatos RH',
    description: 'Entrevistas e candidatos',
    tableName: 'rh_candidates',
    columnDefs: rhCandidatesColumns,
    icon: '👥'
  },
  {
    id: 'service-orders',
    name: 'Ordens de Serviço',
    description: 'Ordens de serviço e manutenções',
    tableName: 'service_orders',
    columnDefs: serviceOrdersColumns,
    icon: '🔧'
  },
  {
    id: 'receipts',
    name: 'Recibos',
    description: 'Solicitações de reembolso',
    tableName: 'receipts',
    columnDefs: receiptsColumns,
    icon: '🧾'
  },
  {
    id: 'notas-fiscais',
    name: 'Notas Fiscais',
    description: 'NFe de entrada e saída',
    tableName: 'notas_fiscais',
    columnDefs: notasFiscaisColumns,
    icon: '📄'
  },
  {
    id: 'youtube-content',
    name: 'Conteúdo YouTube',
    description: 'Scripts e roteiros de vídeos',
    tableName: 'youtube_content',
    columnDefs: youtubeContentColumns,
    icon: '📺'
  },
  {
    id: 'reels-content',
    name: 'Conteúdo Reels',
    description: 'Scripts de Reels Instagram',
    tableName: 'reels_content',
    columnDefs: reelsContentColumns,
    icon: '📱'
  }
];
