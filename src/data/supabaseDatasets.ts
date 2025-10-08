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

    // Determinar coluna de ordenação baseado no schema e tabela
    let orderColumn = 'created_at';
    if (schema === 'gestaofinanceira') {
      orderColumn = 'criado_em';
    } else if (schema === 'marketing_organico') {
      // marketing_organico usa diferentes colunas por tabela
      if (table === 'publicacoes') {
        orderColumn = 'criado_em';
      } else if (table === 'contas_sociais') {
        orderColumn = 'conectado_em';
      } else if (table === 'metricas_publicacoes' || table === 'resumos_conta') {
        orderColumn = 'registrado_em';
      }
    } else if (schema === 'trafego_pago') {
      // trafego_pago usa diferentes colunas por tabela
      if (table === 'contas_ads') {
        orderColumn = 'conectado_em';
      } else if (table === 'campanhas') {
        orderColumn = 'inicio';
      } else if (table === 'grupos_de_anuncios') {
        orderColumn = 'id'; // Sem timestamp, ordenar por ID
      } else if (table === 'anuncios_criacao') {
        orderColumn = 'criado_em';
      } else if (table === 'anuncios_colaboradores') {
        orderColumn = 'registrado_em';
      } else if (table === 'anuncios_publicados') {
        orderColumn = 'publicado_em';
      } else if (table === 'metricas_anuncios') {
        orderColumn = 'data';
      } else if (table === 'resumos_campanhas') {
        orderColumn = 'registrado_em';
      }
    } else if (schema === 'gestaoestoque') {
      // gestaoestoque - todas as tabelas usam created_at
      orderColumn = 'created_at';
    } else if (schema === 'gestaologistica') {
      // gestaologistica - ordenação específica por tabela
      if (table === 'envios') {
        orderColumn = 'data_postagem';
      } else if (table === 'eventos_rastreio') {
        orderColumn = 'data_evento';
      } else if (table === 'logistica_reversa') {
        orderColumn = 'created_at';
      } else if (table === 'pacotes') {
        orderColumn = 'id'; // Sem timestamp específico
      } else if (table === 'transportadoras') {
        orderColumn = 'created_at';
      }
    } else if (schema === 'gestaoanalytics') {
      // gestaoanalytics - ordenação específica por tabela
      if (table === 'agregado_diario_por_fonte' || table === 'agregado_diario_por_pagina') {
        orderColumn = 'data';
      } else if (table === 'consentimentos_visitante') {
        orderColumn = 'timestamp_consentimento';
      } else if (table === 'eventos') {
        orderColumn = 'timestamp_evento';
      } else if (table === 'itens_transacao') {
        orderColumn = 'id';
      } else if (table === 'metas') {
        orderColumn = 'id';
      } else if (table === 'propriedades') {
        orderColumn = 'created_at';
      } else if (table === 'propriedades_visitante') {
        orderColumn = 'updated_at';
      } else if (table === 'sessoes') {
        orderColumn = 'timestamp_inicio_sessao';
      } else if (table === 'transacoes') {
        orderColumn = 'timestamp_transacao';
      } else if (table === 'visitantes') {
        orderColumn = 'primeira_visita_timestamp';
      }
    }

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
export const categoriasColumns: ColDef[] = [
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

// Configurações de colunas para Contas (Gestão Financeira)
export const contasColumns: ColDef[] = [
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
export const contasAPagarColumns: ColDef[] = [
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
    field: 'documento_id',
    headerName: 'Documento ID',
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
export const contasAReceberColumns: ColDef[] = [
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
    field: 'documento_id',
    headerName: 'Documento ID',
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
export const movimentosColumns: ColDef[] = [
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

// Configurações de colunas para Contratos (Gestão Financeira)
export const contratosColumns: ColDef[] = [
  {
    field: 'documento_id',
    headerName: 'Documento ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'objeto_contrato',
    headerName: 'Objeto do Contrato',
    width: 300,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'data_inicio_vigencia',
    headerName: 'Início Vigência',
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
    field: 'data_fim_vigencia',
    headerName: 'Fim Vigência',
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
    field: 'valor_parcela',
    headerName: 'Valor Parcela',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params) => {
      if (!params.value && params.value !== 0) return '';
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.value);
    }
  },
  {
    field: 'periodicidade',
    headerName: 'Periodicidade',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'dia_vencimento_parcela',
    headerName: 'Dia Vencimento',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter'
  },
  {
    field: 'indice_reajuste',
    headerName: 'Índice Reajuste',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'status_contrato',
    headerName: 'Status',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    cellStyle: (params) => {
      const status = String(params.value || '').toLowerCase();
      if (status === 'ativo') return { color: '#2e7d32', fontWeight: 'bold' };
      if (status === 'encerrado') return { color: '#c62828', fontWeight: 'bold' };
      if (status === 'suspenso') return { color: '#f57c00', fontWeight: 'bold' };
      return { color: '#000000', fontWeight: 'normal' };
    }
  }
];

// Configurações de colunas para Documento Itens (Gestão Financeira)
export const documentoItensColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'documento_id',
    headerName: 'Documento ID',
    width: 280,
    editable: false,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'descricao',
    headerName: 'Descrição',
    width: 250,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'quantidade',
    headerName: 'Quantidade',
    width: 110,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params) => {
      if (!params.value && params.value !== 0) return '';
      return params.value.toLocaleString('pt-BR');
    }
  },
  {
    field: 'valor_unitario',
    headerName: 'Valor Unitário',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params) => {
      if (!params.value && params.value !== 0) return '';
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.value);
    }
  },
  {
    field: 'valor_total_item',
    headerName: 'Valor Total',
    width: 130,
    editable: false,
    sortable: true,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params) => {
      if (!params.value && params.value !== 0) return '';
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.value);
    },
    cellStyle: { fontWeight: 'bold', color: '#2e7d32' }
  },
  {
    field: 'codigo_produto',
    headerName: 'Código Produto',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
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
    field: 'ncm',
    headerName: 'NCM',
    width: 110,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'cfop',
    headerName: 'CFOP',
    width: 90,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'codigo_servico',
    headerName: 'Código Serviço',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'aliquota_iss',
    headerName: 'Alíquota ISS',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params) => {
      if (!params.value && params.value !== 0) return '';
      return `${params.value.toLocaleString('pt-BR')}%`;
    }
  }
];

// Configurações de colunas para Documentos (Gestão Financeira)
export const documentosColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'emitente_id',
    headerName: 'Emitente ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'destinatario_id',
    headerName: 'Destinatário ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'tipo_documento',
    headerName: 'Tipo',
    width: 140,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    cellStyle: { fontWeight: 'bold' }
  },
  {
    field: 'numero',
    headerName: 'Número',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'serie',
    headerName: 'Série',
    width: 90,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'chave_acesso',
    headerName: 'Chave de Acesso',
    width: 350,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'data_emissao',
    headerName: 'Data Emissão',
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
    field: 'data_competencia',
    headerName: 'Data Competência',
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
    field: 'valor_total',
    headerName: 'Valor Total',
    width: 140,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params) => {
      if (!params.value && params.value !== 0) return '';
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.value);
    },
    cellStyle: { fontWeight: 'bold', color: '#2e7d32' }
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 110,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    cellStyle: (params) => {
      const status = String(params.value || '').toLowerCase();
      if (status === 'ativo') return { color: '#2e7d32', fontWeight: 'bold' };
      if (status === 'cancelado') return { color: '#c62828', fontWeight: 'bold' };
      return { color: '#000000', fontWeight: 'normal' };
    }
  },
  {
    field: 'arquivo_xml',
    headerName: 'Arquivo XML',
    width: 300,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'arquivo_pdf_url',
    headerName: 'PDF URL',
    width: 300,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
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
  },
  {
    field: 'relatorio_despesa_id',
    headerName: 'Relatório Despesa ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  }
];

// Configurações de colunas para Entidades (Gestão Financeira)
export const entidadesColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'nome_razao_social',
    headerName: 'Razão Social',
    width: 250,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true,
    cellStyle: { fontWeight: 'bold' }
  },
  {
    field: 'nome_fantasia',
    headerName: 'Nome Fantasia',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'cpf_cnpj',
    headerName: 'CPF/CNPJ',
    width: 160,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace' }
  },
  {
    field: 'tipo_entidade',
    headerName: 'Tipo',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true
  },
  {
    field: 'inscricao_estadual',
    headerName: 'Inscrição Estadual',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'inscricao_municipal',
    headerName: 'Inscrição Municipal',
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
    field: 'endereco_logradouro',
    headerName: 'Logradouro',
    width: 250,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'endereco_numero',
    headerName: 'Número',
    width: 90,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'endereco_complemento',
    headerName: 'Complemento',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'endereco_bairro',
    headerName: 'Bairro',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'endereco_cidade',
    headerName: 'Cidade',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'endereco_uf',
    headerName: 'UF',
    width: 70,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'endereco_cep',
    headerName: 'CEP',
    width: 110,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace' }
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

// ============================================
// GESTÃO DE COMPRAS - Schema: gestaocompras
// ============================================

// Configurações de colunas para Fornecedores (Gestão de Compras)
export const fornecedoresColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    cellDataType: 'text'
  },
  {
    field: 'entidade_id',
    headerName: 'Entidade',
    width: 280,
    cellDataType: 'text'
  },
  {
    field: 'codigo_fornecedor',
    headerName: 'Código',
    width: 150,
    cellDataType: 'text'
  },
  {
    field: 'prazo_entrega_medio_dias',
    headerName: 'Prazo Entrega (dias)',
    width: 180,
    cellDataType: 'number'
  },
  {
    field: 'avaliacao_fornecedor',
    headerName: 'Avaliação',
    width: 150,
    cellDataType: 'number',
    cellRenderer: (params: { value: number }) => {
      if (!params.value) return '';
      const stars = '⭐'.repeat(params.value);
      return `<span>${stars}</span>`;
    }
  },
  {
    field: 'criado_em',
    headerName: 'Criado em',
    width: 200,
    cellDataType: 'date'
  }
];

// Configurações de colunas para Pedidos de Compra (Gestão de Compras)
export const pedidosCompraColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    cellDataType: 'text'
  },
  {
    field: 'numero_pedido',
    headerName: 'Nº Pedido',
    width: 150,
    cellDataType: 'text'
  },
  {
    field: 'fornecedor_id',
    headerName: 'Fornecedor',
    width: 280,
    cellDataType: 'text'
  },
  {
    field: 'solicitante_id',
    headerName: 'Solicitante',
    width: 280,
    cellDataType: 'text'
  },
  {
    field: 'data_emissao',
    headerName: 'Data Emissão',
    width: 150,
    cellDataType: 'date'
  },
  {
    field: 'data_previsao_entrega',
    headerName: 'Previsão Entrega',
    width: 170,
    cellDataType: 'date'
  },
  {
    field: 'valor_total',
    headerName: 'Valor Total',
    width: 150,
    cellDataType: 'number',
    valueFormatter: (params: { value: number }) => {
      if (params.value == null) return '';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(params.value);
    }
  },
  {
    field: 'status_pedido',
    headerName: 'Status',
    width: 150,
    cellDataType: 'text',
    cellRenderer: (params: { value: string }) => {
      const statusColors: Record<string, string> = {
        'Rascunho': 'bg-gray-100 text-gray-800',
        'Enviado': 'bg-blue-100 text-blue-800',
        'Aprovado': 'bg-green-100 text-green-800',
        'Recebido': 'bg-purple-100 text-purple-800',
        'Cancelado': 'bg-red-100 text-red-800'
      };
      const colorClass = statusColors[params.value] || 'bg-gray-100 text-gray-800';
      return `<span class="px-2 py-1 rounded-full text-xs font-medium ${colorClass}">${params.value}</span>`;
    }
  },
  {
    field: 'condicao_pagamento',
    headerName: 'Condição Pagamento',
    width: 200,
    cellDataType: 'text'
  },
  {
    field: 'observacoes',
    headerName: 'Observações',
    width: 250,
    cellDataType: 'text'
  },
  {
    field: 'criado_em',
    headerName: 'Criado em',
    width: 200,
    cellDataType: 'date'
  }
];

// Configurações de colunas para Itens de Pedido de Compra (Gestão de Compras)
export const pedidoCompraItensColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    cellDataType: 'text'
  },
  {
    field: 'pedido_compra_id',
    headerName: 'Pedido de Compra',
    width: 280,
    cellDataType: 'text'
  },
  {
    field: 'descricao',
    headerName: 'Descrição',
    width: 300,
    cellDataType: 'text'
  },
  {
    field: 'codigo_produto_fornecedor',
    headerName: 'Código Produto',
    width: 180,
    cellDataType: 'text'
  },
  {
    field: 'quantidade_solicitada',
    headerName: 'Quantidade',
    width: 130,
    cellDataType: 'number',
    valueFormatter: (params: { value: number }) => {
      if (params.value == null) return '';
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(params.value);
    }
  },
  {
    field: 'valor_unitario',
    headerName: 'Valor Unitário',
    width: 150,
    cellDataType: 'number',
    valueFormatter: (params: { value: number }) => {
      if (params.value == null) return '';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(params.value);
    }
  },
  {
    field: 'valor_total_item',
    headerName: 'Valor Total',
    width: 150,
    cellDataType: 'number',
    valueFormatter: (params: { value: number }) => {
      if (params.value == null) return '';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(params.value);
    }
  },
  {
    field: 'criado_em',
    headerName: 'Criado em',
    width: 200,
    cellDataType: 'date'
  }
];

// ============================================
// GESTÃO DE PROJETOS - Schema: gestaodeprojetos
// ============================================

// Configurações de colunas para Projects (Gestão de Projetos)
export const projectsColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    cellDataType: 'text'
  },
  {
    field: 'name',
    headerName: 'Nome do Projeto',
    width: 250,
    cellDataType: 'text'
  },
  {
    field: 'description',
    headerName: 'Descrição',
    width: 300,
    cellDataType: 'text'
  },
  {
    field: 'owner_id',
    headerName: 'Responsável',
    width: 200,
    cellDataType: 'text'
  },
  {
    field: 'team_id',
    headerName: 'Equipe',
    width: 280,
    cellDataType: 'text'
  },
  {
    field: 'start_date',
    headerName: 'Data Início',
    width: 150,
    cellDataType: 'date'
  },
  {
    field: 'end_date',
    headerName: 'Data Fim',
    width: 150,
    cellDataType: 'date'
  },
  {
    field: 'created_at',
    headerName: 'Criado em',
    width: 200,
    cellDataType: 'date'
  },
  {
    field: 'updated_at',
    headerName: 'Atualizado em',
    width: 200,
    cellDataType: 'date'
  }
];

// Configurações de colunas para Status Types (Gestão de Projetos)
export const statusTypesColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 100,
    cellDataType: 'number'
  },
  {
    field: 'name',
    headerName: 'Nome do Status',
    width: 200,
    cellDataType: 'text',
    cellRenderer: (params: { value: string }) => {
      const statusColors: Record<string, string> = {
        'To Do': 'bg-gray-100 text-gray-800',
        'In Progress': 'bg-blue-100 text-blue-800',
        'Done': 'bg-green-100 text-green-800',
        'Blocked': 'bg-red-100 text-red-800',
        'Review': 'bg-purple-100 text-purple-800',
        'Testing': 'bg-yellow-100 text-yellow-800'
      };
      const colorClass = statusColors[params.value] || 'bg-gray-100 text-gray-800';
      return `<span class="px-2 py-1 rounded-full text-xs font-medium ${colorClass}">${params.value}</span>`;
    }
  }
];

// Configurações de colunas para Tasks (Gestão de Projetos)
export const tasksColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    cellDataType: 'text'
  },
  {
    field: 'title',
    headerName: 'Título',
    width: 250,
    cellDataType: 'text'
  },
  {
    field: 'description',
    headerName: 'Descrição',
    width: 300,
    cellDataType: 'text'
  },
  {
    field: 'status_id',
    headerName: 'Status',
    width: 100,
    cellDataType: 'number',
    cellRenderer: (params: { value: number }) => {
      const statusMap: Record<number, { label: string; color: string }> = {
        1: { label: 'To Do', color: 'bg-gray-100 text-gray-800' },
        2: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
        3: { label: 'Done', color: 'bg-green-100 text-green-800' },
        4: { label: 'Blocked', color: 'bg-red-100 text-red-800' }
      };
      const status = statusMap[params.value] || { label: `Status ${params.value}`, color: 'bg-gray-100 text-gray-800' };
      return `<span class="px-2 py-1 rounded-full text-xs font-medium ${status.color}">${status.label}</span>`;
    }
  },
  {
    field: 'project_id',
    headerName: 'Projeto',
    width: 280,
    cellDataType: 'text'
  },
  {
    field: 'assignee_id',
    headerName: 'Responsável',
    width: 200,
    cellDataType: 'text'
  },
  {
    field: 'due_date',
    headerName: 'Prazo',
    width: 200,
    cellDataType: 'date',
    cellRenderer: (params: { value: string }) => {
      if (!params.value) return '';
      const dueDate = new Date(params.value);
      const today = new Date();
      const isOverdue = dueDate < today;
      const dateStr = dueDate.toLocaleDateString('pt-BR');

      if (isOverdue) {
        return `<span class="text-red-600 font-semibold">⚠️ ${dateStr}</span>`;
      }
      return dateStr;
    }
  },
  {
    field: 'created_at',
    headerName: 'Criado em',
    width: 200,
    cellDataType: 'date'
  },
  {
    field: 'updated_at',
    headerName: 'Atualizado em',
    width: 200,
    cellDataType: 'date'
  }
];

// ============================================
// VENDAS E-COMMERCE - Schema: vendasecommerce
// ============================================

// Configurações de colunas para Channels (Vendas E-commerce)
export const channelsColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'name',
    headerName: 'Nome',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'type',
    headerName: 'Tipo',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true
  },
  {
    field: 'is_active',
    headerName: 'Ativo',
    width: 100,
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
        : { color: '#9e9e9e', fontWeight: 'normal' };
    }
  },
  {
    field: 'config',
    headerName: 'Configuração',
    width: 300,
    editable: true,
    sortable: false,
    valueFormatter: (params) => {
      if (!params.value) return '';
      return typeof params.value === 'object' ? JSON.stringify(params.value) : params.value;
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

// Configurações de colunas para Coupons (Vendas E-commerce)
export const couponsColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'code',
    headerName: 'Código',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true,
    cellStyle: { fontWeight: 'bold', fontFamily: 'monospace' }
  },
  {
    field: 'type',
    headerName: 'Tipo',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true
  },
  {
    field: 'value',
    headerName: 'Valor',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(params.value);
    }
  },
  {
    field: 'min_purchase',
    headerName: 'Compra Mínima (R$)',
    width: 160,
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
    field: 'max_discount',
    headerName: 'Desconto Máx (R$)',
    width: 160,
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
    field: 'start_date',
    headerName: 'Início',
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
    field: 'end_date',
    headerName: 'Fim',
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
    field: 'usage_limit',
    headerName: 'Limite de Uso',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter'
  },
  {
    field: 'used_count',
    headerName: 'Vezes Usado',
    width: 120,
    editable: false,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum'
  },
  {
    field: 'is_active',
    headerName: 'Ativo',
    width: 100,
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
        : { color: '#9e9e9e', fontWeight: 'normal' };
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

// Configurações de colunas para Customers (Vendas E-commerce)
export const customersColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'name',
    headerName: 'Nome',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
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
    field: 'phone',
    headerName: 'Telefone',
    width: 140,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'cpf',
    headerName: 'CPF',
    width: 140,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'birth_date',
    headerName: 'Data de Nascimento',
    width: 160,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleDateString('pt-BR');
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

// Configurações de colunas para Loyalty Points (Vendas E-commerce)
export const loyaltyPointsColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'customer_id',
    headerName: 'Cliente ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'points_balance',
    headerName: 'Saldo de Pontos',
    width: 140,
    editable: false,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    cellStyle: (params) => {
      const points = params.value || 0;
      return points > 0
        ? { color: '#2e7d32', fontWeight: 'bold' }
        : { color: '#9e9e9e', fontWeight: 'normal' };
    }
  },
  {
    field: 'total_earned',
    headerName: 'Total Ganho',
    width: 130,
    editable: false,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum'
  },
  {
    field: 'total_redeemed',
    headerName: 'Total Resgatado',
    width: 140,
    editable: false,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum'
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

// Configurações de colunas para Loyalty Rewards (Vendas E-commerce)
export const loyaltyRewardsColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'name',
    headerName: 'Nome',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'description',
    headerName: 'Descrição',
    width: 300,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'points_required',
    headerName: 'Pontos Necessários',
    width: 160,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true
  },
  {
    field: 'stock_quantity',
    headerName: 'Estoque',
    width: 100,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    cellStyle: (params) => {
      const stock = params.value || 0;
      if (stock === 0) return { color: '#c62828', fontWeight: 'bold' };
      if (stock < 10) return { color: '#f57c00', fontWeight: 'bold' };
      return { color: '#2e7d32', fontWeight: 'normal' };
    }
  },
  {
    field: 'is_active',
    headerName: 'Ativo',
    width: 100,
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
        : { color: '#9e9e9e', fontWeight: 'normal' };
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

// Configurações de colunas para Order Items (Vendas E-commerce)
export const orderItemsColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'order_id',
    headerName: 'Pedido ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'product_id',
    headerName: 'Produto ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'quantity',
    headerName: 'Quantidade',
    width: 110,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum'
  },
  {
    field: 'unit_price',
    headerName: 'Preço Unitário (R$)',
    width: 150,
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
    field: 'discount',
    headerName: 'Desconto (R$)',
    width: 130,
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
    field: 'total',
    headerName: 'Total (R$)',
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
    cellStyle: { fontWeight: 'bold' }
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

// Configurações de colunas para Orders (Vendas E-commerce)
export const ordersColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'customer_id',
    headerName: 'Cliente ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'channel_id',
    headerName: 'Canal ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'coupon_id',
    headerName: 'Cupom ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
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
        case 'completed': return { color: '#2e7d32', fontWeight: 'bold' };
        case 'processing': return { color: '#1976d2', fontWeight: 'bold' };
        case 'pending': return { color: '#f57c00', fontWeight: 'bold' };
        case 'cancelled': return { color: '#c62828', fontWeight: 'bold' };
        default: return undefined;
      }
    }
  },
  {
    field: 'subtotal',
    headerName: 'Subtotal (R$)',
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
    field: 'discount',
    headerName: 'Desconto (R$)',
    width: 130,
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
    field: 'shipping_cost',
    headerName: 'Frete (R$)',
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
    field: 'total',
    headerName: 'Total (R$)',
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
    cellStyle: { fontWeight: 'bold', color: '#1976d2' }
  },
  {
    field: 'payment_status',
    headerName: 'Status Pagamento',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    cellStyle: (params) => {
      switch (params.value) {
        case 'paid': return { color: '#2e7d32', fontWeight: 'bold' };
        case 'pending': return { color: '#f57c00', fontWeight: 'bold' };
        case 'failed': return { color: '#c62828', fontWeight: 'bold' };
        default: return undefined;
      }
    }
  },
  {
    field: 'shipping_address',
    headerName: 'Endereço de Entrega',
    width: 350,
    editable: true,
    sortable: false,
    valueFormatter: (params) => {
      if (!params.value) return '';
      return typeof params.value === 'object' ? JSON.stringify(params.value) : params.value;
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

// Configurações de colunas para Payments (Vendas E-commerce)
export const paymentsColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'order_id',
    headerName: 'Pedido ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'method',
    headerName: 'Método',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true
  },
  {
    field: 'amount',
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
    },
    cellStyle: { fontWeight: 'bold' }
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
        case 'approved': return { color: '#2e7d32', fontWeight: 'bold' };
        case 'pending': return { color: '#f57c00', fontWeight: 'bold' };
        case 'failed': return { color: '#c62828', fontWeight: 'bold' };
        case 'refunded': return { color: '#9c27b0', fontWeight: 'bold' };
        default: return undefined;
      }
    }
  },
  {
    field: 'transaction_id',
    headerName: 'ID da Transação',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.9em' }
  },
  {
    field: 'paid_at',
    headerName: 'Pago em',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleString('pt-BR');
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

// Configurações de colunas para Products (Vendas E-commerce)
export const productsColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'name',
    headerName: 'Nome',
    width: 250,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'description',
    headerName: 'Descrição',
    width: 300,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'sku',
    headerName: 'SKU',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontWeight: 'bold' }
  },
  {
    field: 'category',
    headerName: 'Categoria',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true
  },
  {
    field: 'price',
    headerName: 'Preço (R$)',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(params.value);
    },
    cellStyle: { fontWeight: 'bold', color: '#1976d2' }
  },
  {
    field: 'cost',
    headerName: 'Custo (R$)',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(params.value);
    }
  },
  {
    field: 'stock_quantity',
    headerName: 'Estoque',
    width: 100,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    cellStyle: (params) => {
      const stock = params.value || 0;
      if (stock === 0) return { color: '#c62828', fontWeight: 'bold' };
      if (stock < 10) return { color: '#f57c00', fontWeight: 'bold' };
      return { color: '#2e7d32', fontWeight: 'normal' };
    }
  },
  {
    field: 'is_active',
    headerName: 'Ativo',
    width: 100,
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
        : { color: '#9e9e9e', fontWeight: 'normal' };
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

// Configurações de colunas para Returns (Vendas E-commerce)
export const returnsColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'order_id',
    headerName: 'Pedido ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'reason',
    headerName: 'Motivo',
    width: 300,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
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
        case 'approved': return { color: '#2e7d32', fontWeight: 'bold' };
        case 'pending': return { color: '#f57c00', fontWeight: 'bold' };
        case 'rejected': return { color: '#c62828', fontWeight: 'bold' };
        default: return undefined;
      }
    }
  },
  {
    field: 'refund_amount',
    headerName: 'Valor Reembolso (R$)',
    width: 170,
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
    cellStyle: { fontWeight: 'bold', color: '#c62828' }
  },
  {
    field: 'requested_at',
    headerName: 'Solicitado em',
    width: 150,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleString('pt-BR');
    }
  },
  {
    field: 'processed_at',
    headerName: 'Processado em',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleString('pt-BR');
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

// ============================================
// SUPPLY CHAIN - Schema: supplychainecommerce
// ============================================

// Configurações de colunas para Warehouses (Supply Chain)
export const warehousesColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'name',
    headerName: 'Nome',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'location',
    headerName: 'Localização',
    width: 250,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'manager',
    headerName: 'Gerente',
    width: 180,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'capacity',
    headerName: 'Capacidade',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum'
  },
  {
    field: 'created_at',
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

// Configurações de colunas para Suppliers (Supply Chain)
export const suppliersColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'name',
    headerName: 'Nome',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'contact_name',
    headerName: 'Contato',
    width: 180,
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
    field: 'phone',
    headerName: 'Telefone',
    width: 140,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'address',
    headerName: 'Endereço',
    width: 300,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'rating',
    headerName: 'Avaliação',
    width: 110,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    cellStyle: (params) => {
      const rating = params.value || 0;
      if (rating >= 4) return { color: '#2e7d32', fontWeight: 'bold' };
      if (rating >= 3) return { color: '#f57c00', fontWeight: 'bold' };
      return { color: '#c62828', fontWeight: 'bold' };
    }
  },
  {
    field: 'active',
    headerName: 'Ativo',
    width: 100,
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
        : { color: '#9e9e9e', fontWeight: 'normal' };
    }
  },
  {
    field: 'created_at',
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

// Configurações de colunas para Purchases (Supply Chain)
export const purchasesColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'supplier_id',
    headerName: 'Fornecedor ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'warehouse_id',
    headerName: 'Armazém ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'order_number',
    headerName: 'Nº Pedido',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontWeight: 'bold' }
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
        case 'received': return { color: '#2e7d32', fontWeight: 'bold' };
        case 'in_transit': return { color: '#1976d2', fontWeight: 'bold' };
        case 'pending': return { color: '#f57c00', fontWeight: 'bold' };
        case 'cancelled': return { color: '#c62828', fontWeight: 'bold' };
        default: return undefined;
      }
    }
  },
  {
    field: 'total_amount',
    headerName: 'Valor Total (R$)',
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
    cellStyle: { fontWeight: 'bold' }
  },
  {
    field: 'expected_delivery',
    headerName: 'Entrega Prevista',
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
    field: 'received_at',
    headerName: 'Recebido em',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleString('pt-BR');
    }
  },
  {
    field: 'created_at',
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

// Configurações de colunas para Purchase Items (Supply Chain)
export const purchaseItemsColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'purchase_id',
    headerName: 'Compra ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'product_id',
    headerName: 'Produto ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'quantity_ordered',
    headerName: 'Qtd Pedida',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum'
  },
  {
    field: 'quantity_received',
    headerName: 'Qtd Recebida',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum'
  },
  {
    field: 'unit_price',
    headerName: 'Preço Unit (R$)',
    width: 140,
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
    field: 'total_price',
    headerName: 'Total (R$)',
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
    cellStyle: { fontWeight: 'bold' }
  },
  {
    field: 'created_at',
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

// Configurações de colunas para Inventory (Supply Chain)
export const inventoryColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'product_id',
    headerName: 'Produto ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'warehouse_id',
    headerName: 'Armazém ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'channel_id',
    headerName: 'Canal ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'quantity',
    headerName: 'Quantidade',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    cellStyle: (params) => {
      const qty = params.value || 0;
      if (qty === 0) return { color: '#c62828', fontWeight: 'bold' };
      if (qty < 10) return { color: '#f57c00', fontWeight: 'bold' };
      return { color: '#2e7d32', fontWeight: 'normal' };
    }
  },
  {
    field: 'updated_at',
    headerName: 'Atualizado em',
    width: 150,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleString('pt-BR');
    }
  },
  {
    field: 'created_at',
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

// Configurações de colunas para Inventory Movements (Supply Chain)
export const inventoryMovementsColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'product_id',
    headerName: 'Produto ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'warehouse_id',
    headerName: 'Armazém ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'movement_type',
    headerName: 'Tipo',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true,
    cellStyle: (params) => {
      switch (params.value) {
        case 'in': return { color: '#2e7d32', fontWeight: 'bold' };
        case 'out': return { color: '#c62828', fontWeight: 'bold' };
        case 'adjustment': return { color: '#f57c00', fontWeight: 'bold' };
        default: return undefined;
      }
    }
  },
  {
    field: 'quantity',
    headerName: 'Quantidade',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum'
  },
  {
    field: 'order_id',
    headerName: 'Pedido ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'return_id',
    headerName: 'Devolução ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'purchase_id',
    headerName: 'Compra ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'created_at',
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

// Configurações de colunas para Shipments (Supply Chain)
export const shipmentsColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'order_id',
    headerName: 'Pedido ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'carrier',
    headerName: 'Transportadora',
    width: 180,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'tracking_number',
    headerName: 'Código Rastreio',
    width: 180,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontWeight: 'bold' }
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
        case 'delivered': return { color: '#2e7d32', fontWeight: 'bold' };
        case 'in_transit': return { color: '#1976d2', fontWeight: 'bold' };
        case 'pending': return { color: '#f57c00', fontWeight: 'bold' };
        case 'failed': return { color: '#c62828', fontWeight: 'bold' };
        default: return undefined;
      }
    }
  },
  {
    field: 'shipped_at',
    headerName: 'Enviado em',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleString('pt-BR');
    }
  },
  {
    field: 'delivered_at',
    headerName: 'Entregue em',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleString('pt-BR');
    }
  },
  {
    field: 'created_at',
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

// Configurações de colunas para Shipment Events (Supply Chain)
export const shipmentEventsColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'shipment_id',
    headerName: 'Envio ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'event_type',
    headerName: 'Tipo de Evento',
    width: 180,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true
  },
  {
    field: 'location',
    headerName: 'Localização',
    width: 250,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'event_time',
    headerName: 'Data/Hora do Evento',
    width: 170,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleString('pt-BR');
    }
  },
  {
    field: 'created_at',
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
// ============================================
// TRÁFEGO PAGO - Schema: trafego_pago
// ============================================

// Configurações de colunas para Contas Ads
export const contasAdsColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'plataforma',
    headerName: 'Plataforma',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    cellStyle: (params) => {
      const plataforma = String(params.value || '').toLowerCase();
      if (plataforma.includes('google')) return { color: '#4285F4', fontWeight: 'bold' };
      if (plataforma.includes('meta') || plataforma.includes('facebook')) return { color: '#1877F2', fontWeight: 'bold' };
      if (plataforma.includes('tiktok')) return { color: '#000000', fontWeight: 'bold' };
      if (plataforma.includes('linkedin')) return { color: '#0A66C2', fontWeight: 'bold' };
      return { color: '#000000', fontWeight: 'normal' };
    }
  },
  {
    field: 'nome_conta',
    headerName: 'Nome da Conta',
    width: 250,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontWeight: 'bold' }
  },
  {
    field: 'conectado_em',
    headerName: 'Conectado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleDateString('pt-BR');
    }
  }
];

// Configurações de colunas para Campanhas (Tráfego Pago)
export const campanhasTrafegoPagoColumns: ColDef[] = [
  { field: 'id', headerName: 'ID', width: 280, pinned: 'left', editable: false, sortable: true },
  { field: 'conta_ads_id', headerName: 'Conta Ads', width: 280, editable: true, sortable: true, filter: 'agTextColumnFilter' },
  { field: 'nome', headerName: 'Nome', width: 300, editable: true, sortable: true, filter: 'agTextColumnFilter', cellStyle: { fontWeight: 'bold' } },
  { field: 'objetivo', headerName: 'Objetivo', width: 180, editable: true, sortable: true, filter: 'agSetColumnFilter', enableRowGroup: true },
  { field: 'orcamento_total', headerName: 'Orçamento Total', width: 160, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'sum', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.value) : String(params.value); }, cellStyle: { textAlign: 'right', fontWeight: 'bold' } },
  { field: 'status', headerName: 'Status', width: 130, editable: true, sortable: true, filter: 'agSetColumnFilter', enableRowGroup: true, cellStyle: (params) => { const status = String(params.value || '').toLowerCase(); if (status === 'ativa' || status === 'ativo') return { color: '#2e7d32', fontWeight: 'bold' }; if (status === 'pausada' || status === 'pausado') return { color: '#f57c00', fontWeight: 'bold' }; if (status === 'encerrada' || status === 'encerrado') return { color: '#c62828', fontWeight: 'bold' }; return { color: '#000000', fontWeight: 'normal' }; } },
  { field: 'inicio', headerName: 'Início', width: 130, editable: true, sortable: true, filter: 'agDateColumnFilter', valueFormatter: (params) => { if (!params.value) return ''; const date = new Date(params.value as string); return isNaN(date.getTime()) ? String(params.value) : date.toLocaleDateString('pt-BR'); } },
  { field: 'fim', headerName: 'Fim', width: 130, editable: true, sortable: true, filter: 'agDateColumnFilter', valueFormatter: (params) => { if (!params.value) return ''; const date = new Date(params.value as string); return isNaN(date.getTime()) ? String(params.value) : date.toLocaleDateString('pt-BR'); } }
];

// Configurações de colunas para Grupos de Anúncios
export const gruposDeAnunciosColumns: ColDef[] = [
  { field: 'id', headerName: 'ID', width: 280, pinned: 'left', editable: false, sortable: true },
  { field: 'campanha_id', headerName: 'Campanha', width: 280, editable: true, sortable: true, filter: 'agTextColumnFilter' },
  { field: 'nome', headerName: 'Nome', width: 300, editable: true, sortable: true, filter: 'agTextColumnFilter', cellStyle: { fontWeight: 'bold' } },
  { field: 'publico_alvo', headerName: 'Público-Alvo', width: 200, editable: true, sortable: false, valueFormatter: (params) => { if (!params.value) return ''; try { const json = typeof params.value === 'string' ? JSON.parse(params.value) : params.value; return JSON.stringify(json); } catch { return String(params.value); } } },
  { field: 'orcamento_diario', headerName: 'Orçamento Diário', width: 160, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'sum', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.value) : String(params.value); }, cellStyle: { textAlign: 'right', fontWeight: 'bold' } },
  { field: 'status', headerName: 'Status', width: 130, editable: true, sortable: true, filter: 'agSetColumnFilter', enableRowGroup: true, cellStyle: (params) => { const status = String(params.value || '').toLowerCase(); if (status === 'ativa' || status === 'ativo') return { color: '#2e7d32', fontWeight: 'bold' }; if (status === 'pausada' || status === 'pausado') return { color: '#f57c00', fontWeight: 'bold' }; if (status === 'encerrada' || status === 'encerrado') return { color: '#c62828', fontWeight: 'bold' }; return { color: '#000000', fontWeight: 'normal' }; } }
];

// Configurações de colunas para Anúncios Criação
export const anunciosCriacaoColumns: ColDef[] = [
  { field: 'id', headerName: 'ID', width: 280, pinned: 'left', editable: false, sortable: true },
  { field: 'grupo_id', headerName: 'Grupo', width: 280, editable: true, sortable: true, filter: 'agTextColumnFilter' },
  { field: 'titulo', headerName: 'Título', width: 250, editable: true, sortable: true, filter: 'agTextColumnFilter', cellStyle: { fontWeight: 'bold' } },
  { field: 'hook', headerName: 'Hook', width: 300, editable: true, sortable: true, filter: 'agTextColumnFilter', wrapText: true, autoHeight: true },
  { field: 'expansao_hook', headerName: 'Expansão do Hook', width: 300, editable: true, sortable: true, filter: 'agTextColumnFilter', wrapText: true, autoHeight: true },
  { field: 'copy_completo', headerName: 'Copy Completo', width: 400, editable: true, sortable: true, filter: 'agTextColumnFilter', wrapText: true, autoHeight: true },
  { field: 'legenda', headerName: 'Legenda', width: 300, editable: true, sortable: true, filter: 'agTextColumnFilter', wrapText: true, autoHeight: true },
  { field: 'explicacao', headerName: 'Explicação', width: 300, editable: true, sortable: true, filter: 'agTextColumnFilter', wrapText: true, autoHeight: true },
  { field: 'hashtags', headerName: 'Hashtags', width: 200, editable: true, sortable: false, valueFormatter: (params) => { if (!params.value) return ''; try { const tags = Array.isArray(params.value) ? params.value : JSON.parse(params.value as string); return tags.length > 0 ? tags.join(', ') : ''; } catch { return String(params.value); } } },
  { field: 'criativo_status', headerName: 'Status', width: 130, editable: true, sortable: true, filter: 'agSetColumnFilter', enableRowGroup: true, cellStyle: (params) => { const status = String(params.value || '').toLowerCase(); if (status === 'aprovado') return { color: '#2e7d32', fontWeight: 'bold' }; if (status === 'rascunho') return { color: '#f57c00', fontWeight: 'bold' }; if (status === 'em_revisao') return { color: '#1976d2', fontWeight: 'bold' }; if (status === 'rejeitado') return { color: '#c62828', fontWeight: 'bold' }; return { color: '#000000', fontWeight: 'normal' }; } },
  { field: 'criado_por', headerName: 'Criado Por', width: 280, editable: false, sortable: true, filter: 'agTextColumnFilter' },
  { field: 'atualizado_por', headerName: 'Atualizado Por', width: 280, editable: false, sortable: true, filter: 'agTextColumnFilter' },
  { field: 'criado_em', headerName: 'Criado em', width: 180, editable: false, sortable: true, filter: 'agDateColumnFilter', valueFormatter: (params) => { if (!params.value) return ''; const date = new Date(params.value as string); return isNaN(date.getTime()) ? String(params.value) : date.toLocaleDateString('pt-BR'); } },
  { field: 'atualizado_em', headerName: 'Atualizado em', width: 180, editable: false, sortable: true, filter: 'agDateColumnFilter', valueFormatter: (params) => { if (!params.value) return ''; const date = new Date(params.value as string); return isNaN(date.getTime()) ? String(params.value) : date.toLocaleDateString('pt-BR'); } }
];

// Configurações de colunas para Anúncios Colaboradores
export const anunciosColaboradoresColumns: ColDef[] = [
  { field: 'id', headerName: 'ID', width: 280, pinned: 'left', editable: false, sortable: true },
  { field: 'anuncio_criacao_id', headerName: 'Anúncio', width: 280, editable: true, sortable: true, filter: 'agTextColumnFilter' },
  { field: 'usuario_id', headerName: 'Usuário', width: 280, editable: true, sortable: true, filter: 'agTextColumnFilter' },
  { field: 'acao', headerName: 'Ação', width: 150, editable: true, sortable: true, filter: 'agSetColumnFilter', enableRowGroup: true },
  { field: 'comentario', headerName: 'Comentário', width: 400, editable: true, sortable: true, filter: 'agTextColumnFilter', wrapText: true, autoHeight: true },
  { field: 'registrado_em', headerName: 'Registrado em', width: 180, editable: false, sortable: true, filter: 'agDateColumnFilter', valueFormatter: (params) => { if (!params.value) return ''; const date = new Date(params.value as string); return isNaN(date.getTime()) ? String(params.value) : date.toLocaleDateString('pt-BR'); } }
];

// Configurações de colunas para Anúncios Publicados
export const anunciosPublicadosColumns: ColDef[] = [
  { field: 'id', headerName: 'ID', width: 280, pinned: 'left', editable: false, sortable: true },
  { field: 'anuncio_criacao_id', headerName: 'Criativo', width: 280, editable: true, sortable: true, filter: 'agTextColumnFilter' },
  { field: 'conta_ads_id', headerName: 'Conta Ads', width: 280, editable: true, sortable: true, filter: 'agTextColumnFilter' },
  { field: 'grupo_id', headerName: 'Grupo', width: 280, editable: true, sortable: true, filter: 'agTextColumnFilter' },
  { field: 'anuncio_id_plataforma', headerName: 'ID na Plataforma', width: 200, editable: true, sortable: true, filter: 'agTextColumnFilter', cellStyle: { fontFamily: 'monospace' } },
  { field: 'titulo', headerName: 'Título', width: 250, editable: true, sortable: true, filter: 'agTextColumnFilter', cellStyle: { fontWeight: 'bold' } },
  { field: 'plataforma', headerName: 'Plataforma', width: 130, editable: true, sortable: true, filter: 'agSetColumnFilter', enableRowGroup: true },
  { field: 'status', headerName: 'Status', width: 130, editable: true, sortable: true, filter: 'agSetColumnFilter', enableRowGroup: true, cellStyle: (params) => { const status = String(params.value || '').toLowerCase(); if (status === 'ativo') return { color: '#2e7d32', fontWeight: 'bold' }; if (status === 'pausado') return { color: '#f57c00', fontWeight: 'bold' }; if (status === 'rejeitado') return { color: '#c62828', fontWeight: 'bold' }; return { color: '#000000', fontWeight: 'normal' }; } },
  { field: 'publicado_em', headerName: 'Publicado em', width: 180, editable: false, sortable: true, filter: 'agDateColumnFilter', valueFormatter: (params) => { if (!params.value) return ''; const date = new Date(params.value as string); return isNaN(date.getTime()) ? String(params.value) : date.toLocaleDateString('pt-BR'); } },
  { field: 'data_criacao', headerName: 'Data Criação', width: 150, editable: true, sortable: true, filter: 'agDateColumnFilter', valueFormatter: (params) => { if (!params.value) return ''; const date = new Date(params.value as string); return isNaN(date.getTime()) ? String(params.value) : date.toLocaleDateString('pt-BR'); } }
];

// Configurações de colunas para Métricas de Anúncios
export const metricasAnunciosColumns: ColDef[] = [
  { field: 'id', headerName: 'ID', width: 280, pinned: 'left', editable: false, sortable: true },
  { field: 'anuncio_publicado_id', headerName: 'Anúncio', width: 280, editable: true, sortable: true, filter: 'agTextColumnFilter' },
  { field: 'conta_ads_id', headerName: 'Conta Ads', width: 280, editable: true, sortable: true, filter: 'agTextColumnFilter' },
  { field: 'data', headerName: 'Data', width: 130, editable: true, sortable: true, filter: 'agDateColumnFilter', valueFormatter: (params) => { if (!params.value) return ''; const date = new Date(params.value as string); return isNaN(date.getTime()) ? String(params.value) : date.toLocaleDateString('pt-BR'); } },
  { field: 'plataforma', headerName: 'Plataforma', width: 120, editable: true, sortable: true, filter: 'agSetColumnFilter', enableRowGroup: true },
  { field: 'impressao', headerName: 'Impressões', width: 130, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'sum', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? params.value.toLocaleString('pt-BR') : String(params.value); }, cellStyle: { textAlign: 'right' } },
  { field: 'cliques', headerName: 'Cliques', width: 110, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'sum', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? params.value.toLocaleString('pt-BR') : String(params.value); }, cellStyle: { textAlign: 'right', fontWeight: 'bold' } },
  { field: 'ctr', headerName: 'CTR', width: 100, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'avg', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? `${(params.value * 100).toFixed(2)}%` : String(params.value); }, cellStyle: { textAlign: 'right' } },
  { field: 'cpc', headerName: 'CPC', width: 110, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'avg', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.value) : String(params.value); }, cellStyle: { textAlign: 'right' } },
  { field: 'conversao', headerName: 'Conversões', width: 120, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'sum', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? params.value.toLocaleString('pt-BR') : String(params.value); }, cellStyle: { textAlign: 'right', fontWeight: 'bold', color: '#2e7d32' } },
  { field: 'gasto', headerName: 'Gasto', width: 120, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'sum', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.value) : String(params.value); }, cellStyle: { textAlign: 'right', fontWeight: 'bold', color: '#c62828' } },
  { field: 'receita', headerName: 'Receita', width: 120, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'sum', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.value) : String(params.value); }, cellStyle: { textAlign: 'right', fontWeight: 'bold', color: '#2e7d32' } },
  { field: 'cpa', headerName: 'CPA', width: 110, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'avg', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.value) : String(params.value); }, cellStyle: { textAlign: 'right' } },
  { field: 'roas', headerName: 'ROAS', width: 100, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'avg', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? `${params.value.toFixed(2)}x` : String(params.value); }, cellStyle: (params) => { const value = params.value as number; if (value >= 3) return { color: '#2e7d32', fontWeight: 'bold', textAlign: 'right' }; if (value >= 1.5) return { color: '#f57c00', fontWeight: 'bold', textAlign: 'right' }; return { color: '#c62828', fontWeight: 'normal', textAlign: 'right' }; } },
  { field: 'view_content', headerName: 'View Content', width: 130, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'sum', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? params.value.toLocaleString('pt-BR') : String(params.value); }, cellStyle: { textAlign: 'right' } },
  { field: 'add_to_cart', headerName: 'Add to Cart', width: 130, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'sum', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? params.value.toLocaleString('pt-BR') : String(params.value); }, cellStyle: { textAlign: 'right' } },
  { field: 'begin_checkout', headerName: 'Begin Checkout', width: 140, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'sum', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? params.value.toLocaleString('pt-BR') : String(params.value); }, cellStyle: { textAlign: 'right' } },
  { field: 'visualizacoes_video', headerName: 'Visualizações Vídeo', width: 160, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'sum', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? params.value.toLocaleString('pt-BR') : String(params.value); }, cellStyle: { textAlign: 'right' } },
  { field: 'likes', headerName: 'Likes', width: 100, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'sum', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? params.value.toLocaleString('pt-BR') : String(params.value); }, cellStyle: { textAlign: 'right' } },
  { field: 'compartilhamentos', headerName: 'Compartilhamentos', width: 160, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'sum', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? params.value.toLocaleString('pt-BR') : String(params.value); }, cellStyle: { textAlign: 'right' } },
  { field: 'comentarios', headerName: 'Comentários', width: 130, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'sum', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? params.value.toLocaleString('pt-BR') : String(params.value); }, cellStyle: { textAlign: 'right' } },
  { field: 'salvos', headerName: 'Salvos', width: 100, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'sum', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? params.value.toLocaleString('pt-BR') : String(params.value); }, cellStyle: { textAlign: 'right' } },
  { field: 'ctr_video', headerName: 'CTR Vídeo', width: 110, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'avg', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? `${(params.value * 100).toFixed(2)}%` : String(params.value); }, cellStyle: { textAlign: 'right' } },
  { field: 'tempo_medio_visualizacao', headerName: 'Tempo Médio', width: 130, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'avg', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? `${params.value.toFixed(1)}s` : String(params.value); }, cellStyle: { textAlign: 'right' } },
  { field: 'frequencia', headerName: 'Frequência', width: 120, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'avg', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? params.value.toFixed(2) : String(params.value); }, cellStyle: { textAlign: 'right' } },
  { field: 'cpm_real', headerName: 'CPM', width: 110, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'avg', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.value) : String(params.value); }, cellStyle: { textAlign: 'right' } },
  { field: 'dispositivo', headerName: 'Dispositivo', width: 120, editable: true, sortable: true, filter: 'agSetColumnFilter', enableRowGroup: true },
  { field: 'localizacao', headerName: 'Localização', width: 150, editable: true, sortable: true, filter: 'agSetColumnFilter', enableRowGroup: true },
  { field: 'horario', headerName: 'Horário', width: 110, editable: true, sortable: true, filter: 'agTextColumnFilter' },
  { field: 'observacoes', headerName: 'Observações', width: 300, editable: true, sortable: true, filter: 'agTextColumnFilter', wrapText: true, autoHeight: true }
];

// Configurações de colunas para Resumos de Campanhas
export const resumosCampanhasColumns: ColDef[] = [
  { field: 'id', headerName: 'ID', width: 280, pinned: 'left', editable: false, sortable: true },
  { field: 'campanha_id', headerName: 'Campanha', width: 280, editable: true, sortable: true, filter: 'agTextColumnFilter' },
  { field: 'total_gasto', headerName: 'Gasto Total', width: 140, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'sum', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.value) : String(params.value); }, cellStyle: { textAlign: 'right', fontWeight: 'bold', color: '#c62828' } },
  { field: 'total_cliques', headerName: 'Cliques Totais', width: 140, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'sum', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? params.value.toLocaleString('pt-BR') : String(params.value); }, cellStyle: { textAlign: 'right', fontWeight: 'bold' } },
  { field: 'total_conversoes', headerName: 'Conversões Totais', width: 160, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'sum', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? params.value.toLocaleString('pt-BR') : String(params.value); }, cellStyle: { textAlign: 'right', fontWeight: 'bold', color: '#2e7d32' } },
  { field: 'ctr_medio', headerName: 'CTR Médio', width: 120, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'avg', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? `${(params.value * 100).toFixed(2)}%` : String(params.value); }, cellStyle: { textAlign: 'right' } },
  { field: 'cpc_medio', headerName: 'CPC Médio', width: 120, editable: true, sortable: true, filter: 'agNumberColumnFilter', enableValue: true, aggFunc: 'avg', valueFormatter: (params) => { if (params.value == null) return ''; return typeof params.value === 'number' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.value) : String(params.value); }, cellStyle: { textAlign: 'right' } },
  { field: 'registrado_em', headerName: 'Registrado em', width: 180, editable: false, sortable: true, filter: 'agDateColumnFilter', valueFormatter: (params) => { if (!params.value) return ''; const date = new Date(params.value as string); return isNaN(date.getTime()) ? String(params.value) : date.toLocaleDateString('pt-BR'); } }
];

// ============================================
// GESTÃO DE ESTOQUE - Schema: gestaoestoque
// ============================================

// Configurações de colunas para Centros de Distribuição
export const centrosDistribuicaoColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true,
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'nome',
    headerName: 'Nome',
    width: 250,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontWeight: 'bold' }
  },
  {
    field: 'endereco',
    headerName: 'Endereço',
    width: 300,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    wrapText: true
  },
  {
    field: 'ativo',
    headerName: 'Ativo',
    width: 100,
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
        : { color: '#c62828', fontWeight: 'bold' };
    }
  },
  {
    field: 'created_at',
    headerName: 'Criado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  },
  {
    field: 'updated_at',
    headerName: 'Atualizado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  }
];

// Configurações de colunas para Estoque por Canal
export const estoqueCanaisColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true,
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'product_id',
    headerName: 'Produto ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'channel_id',
    headerName: 'Canal ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'sku_channel',
    headerName: 'SKU do Canal',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontWeight: 'bold' }
  },
  {
    field: 'quantity_available',
    headerName: 'Qtd Disponível',
    width: 140,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return typeof params.value === 'number'
        ? params.value.toLocaleString('pt-BR')
        : String(params.value);
    },
    cellStyle: (params) => {
      const qty = params.value || 0;
      if (qty === 0) return { color: '#c62828', fontWeight: 'bold', textAlign: 'right' };
      if (qty < 10) return { color: '#f57c00', fontWeight: 'bold', textAlign: 'right' };
      return { color: '#2e7d32', fontWeight: 'bold', textAlign: 'right' };
    }
  },
  {
    field: 'quantity_reserved',
    headerName: 'Qtd Reservada',
    width: 140,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return typeof params.value === 'number'
        ? params.value.toLocaleString('pt-BR')
        : String(params.value);
    },
    cellStyle: { textAlign: 'right' }
  },
  {
    field: 'last_updated',
    headerName: 'Última Atualização',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  },
  {
    field: 'created_at',
    headerName: 'Criado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  },
  {
    field: 'updated_at',
    headerName: 'Atualizado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  }
];

// Configurações de colunas para Integrações de Canais
export const integracoesCanaisColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true,
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'channel_id',
    headerName: 'Canal ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'api_key',
    headerName: 'API Key',
    width: 200,
    editable: true,
    sortable: false,
    filter: 'agTextColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const key = String(params.value);
      if (key.length > 8) {
        return key.substring(0, 4) + '*****' + key.substring(key.length - 4);
      }
      return '*****';
    },
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em', color: '#666' }
  },
  {
    field: 'config',
    headerName: 'Configuração',
    width: 250,
    editable: true,
    sortable: false,
    valueFormatter: (params) => {
      if (!params.value) return '';
      try {
        const config = typeof params.value === 'string' ? JSON.parse(params.value) : params.value;
        const keys = Object.keys(config);
        return keys.length > 0 ? `${keys.length} configuração(ões)` : 'Vazio';
      } catch {
        return 'JSON inválido';
      }
    },
    cellStyle: { fontSize: '0.9em' }
  },
  {
    field: 'last_sync',
    headerName: 'Última Sincronização',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  },
  {
    field: 'created_at',
    headerName: 'Criado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  },
  {
    field: 'updated_at',
    headerName: 'Atualizado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  }
];

// Configurações de colunas para Movimentações de Estoque
export const movimentacoesEstoqueColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true,
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'product_id',
    headerName: 'Produto ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'channel_id',
    headerName: 'Canal ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'order_id',
    headerName: 'Pedido ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'type',
    headerName: 'Tipo',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true,
    cellStyle: (params) => {
      const type = String(params.value || '').toLowerCase();
      if (type.includes('entrada') || type.includes('in')) return { color: '#2e7d32', fontWeight: 'bold' };
      if (type.includes('saida') || type.includes('out')) return { color: '#c62828', fontWeight: 'bold' };
      if (type.includes('ajuste') || type.includes('adjust')) return { color: '#f57c00', fontWeight: 'bold' };
      return { color: '#000000', fontWeight: 'bold' };
    }
  },
  {
    field: 'quantity',
    headerName: 'Quantidade',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return typeof params.value === 'number'
        ? params.value.toLocaleString('pt-BR')
        : String(params.value);
    },
    cellStyle: { textAlign: 'right', fontWeight: 'bold' }
  },
  {
    field: 'reason',
    headerName: 'Motivo',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    wrapText: true
  },
  {
    field: 'created_at',
    headerName: 'Criado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  },
  {
    field: 'updated_at',
    headerName: 'Atualizado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  }
];

// Configurações de colunas para Preços por Canal
export const precosCanalColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true,
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'product_id',
    headerName: 'Produto ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'channel_id',
    headerName: 'Canal ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'price',
    headerName: 'Preço (R$)',
    width: 140,
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
    },
    cellStyle: { fontWeight: 'bold', color: '#1976d2', textAlign: 'right' }
  },
  {
    field: 'start_date',
    headerName: 'Data Início',
    width: 180,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  },
  {
    field: 'end_date',
    headerName: 'Data Fim',
    width: 180,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  },
  {
    field: 'created_at',
    headerName: 'Criado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  },
  {
    field: 'updated_at',
    headerName: 'Atualizado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  }
];

// ============================================
// GESTÃO LOGÍSTICA - Schema: gestaologistica
// ============================================

// Configurações de colunas para Envios
export const enviosColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true,
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'order_id',
    headerName: 'Pedido ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'transportadora_id',
    headerName: 'Transportadora ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'centro_distribuicao_id',
    headerName: 'Centro Distribuição ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'codigo_rastreio',
    headerName: 'Código Rastreio',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.9em' }
  },
  {
    field: 'status_atual',
    headerName: 'Status',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    cellStyle: (params) => {
      const status = String(params.value || '').toLowerCase();
      if (status.includes('entregue') || status.includes('delivered')) return { color: '#2e7d32', fontWeight: 'bold' };
      if (status.includes('transito') || status.includes('transit')) return { color: '#f57c00', fontWeight: 'bold' };
      if (status.includes('enviado') || status.includes('shipped')) return { color: '#1976d2', fontWeight: 'bold' };
      if (status.includes('cancelado') || status.includes('cancelled')) return { color: '#c62828', fontWeight: 'bold' };
      return { color: '#000000', fontWeight: 'bold' };
    }
  },
  {
    field: 'custo_frete',
    headerName: 'Custo Frete (R$)',
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
    },
    cellStyle: { fontWeight: 'bold', textAlign: 'right' }
  },
  {
    field: 'data_estimada_entrega',
    headerName: 'Entrega Estimada',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleDateString('pt-BR');
    }
  },
  {
    field: 'data_postagem',
    headerName: 'Data Postagem',
    width: 180,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  },
  {
    field: 'data_entrega_real',
    headerName: 'Entrega Real',
    width: 180,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  },
  {
    field: 'created_at',
    headerName: 'Criado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  },
  {
    field: 'updated_at',
    headerName: 'Atualizado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  }
];

// Configurações de colunas para Eventos de Rastreio
export const eventosRastreioColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true,
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'envio_id',
    headerName: 'Envio ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    cellStyle: (params) => {
      const status = String(params.value || '').toLowerCase();
      if (status.includes('entregue') || status.includes('delivered')) return { color: '#2e7d32', fontWeight: 'bold' };
      if (status.includes('transito') || status.includes('transit')) return { color: '#f57c00', fontWeight: 'bold' };
      if (status.includes('saiu') || status.includes('out')) return { color: '#1976d2', fontWeight: 'bold' };
      return { color: '#000000', fontWeight: 'normal' };
    }
  },
  {
    field: 'mensagem',
    headerName: 'Mensagem',
    width: 350,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    wrapText: true,
    autoHeight: true
  },
  {
    field: 'localizacao',
    headerName: 'Localização',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'data_evento',
    headerName: 'Data do Evento',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  }
];

// Configurações de colunas para Logística Reversa
export const logisticaReversaColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true,
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'return_id',
    headerName: 'Devolução ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'transportadora_id',
    headerName: 'Transportadora ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'codigo_rastreio_reverso',
    headerName: 'Código Rastreio',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.9em' }
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    cellStyle: (params) => {
      const status = String(params.value || '').toLowerCase();
      if (status.includes('recebido') || status.includes('received')) return { color: '#2e7d32', fontWeight: 'bold' };
      if (status.includes('transito') || status.includes('transit')) return { color: '#f57c00', fontWeight: 'bold' };
      if (status.includes('aguardando') || status.includes('pending')) return { color: '#1976d2', fontWeight: 'bold' };
      if (status.includes('cancelado') || status.includes('cancelled')) return { color: '#c62828', fontWeight: 'bold' };
      return { color: '#000000', fontWeight: 'bold' };
    }
  },
  {
    field: 'data_recebimento',
    headerName: 'Data Recebimento',
    width: 180,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  },
  {
    field: 'centro_distribuicao_id_retorno',
    headerName: 'Centro Retorno ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'created_at',
    headerName: 'Criado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  },
  {
    field: 'updated_at',
    headerName: 'Atualizado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  }
];

// Configurações de colunas para Pacotes
export const pacotesColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true,
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'envio_id',
    headerName: 'Envio ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'peso_kg',
    headerName: 'Peso (kg)',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return typeof params.value === 'number'
        ? `${params.value.toLocaleString('pt-BR')} kg`
        : String(params.value);
    },
    cellStyle: { textAlign: 'right', fontWeight: 'bold' }
  },
  {
    field: 'altura_cm',
    headerName: 'Altura (cm)',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return `${params.value} cm`;
    },
    cellStyle: { textAlign: 'right' }
  },
  {
    field: 'lar_cm',
    headerName: 'Largura (cm)',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return `${params.value} cm`;
    },
    cellStyle: { textAlign: 'right' }
  },
  {
    field: 'comprimento_cm',
    headerName: 'Comprimento (cm)',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return `${params.value} cm`;
    },
    cellStyle: { textAlign: 'right' }
  },
  {
    field: 'valor_declarado',
    headerName: 'Valor Declarado (R$)',
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
    },
    cellStyle: { fontWeight: 'bold', color: '#1976d2', textAlign: 'right' }
  }
];

// Configurações de colunas para Transportadoras
export const transportadorasColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true,
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'nome',
    headerName: 'Nome',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontWeight: 'bold' }
  },
  {
    field: 'codigo_integracao',
    headerName: 'Código Integração',
    width: 180,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.9em' }
  },
  {
    field: 'ativo',
    headerName: 'Ativo',
    width: 100,
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
        : { color: '#c62828', fontWeight: 'bold' };
    }
  },
  {
    field: 'created_at',
    headerName: 'Criado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  },
  {
    field: 'updated_at',
    headerName: 'Atualizado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  }
];

// ============================================
// GESTÃO ANALYTICS - Schema: gestaoanalytics
// ============================================

// Configurações de colunas para Agregado Diário por Fonte
export const agregadoDiarioPorFonteColumns: ColDef[] = [
  {
    field: 'data',
    headerName: 'Data',
    width: 150,
    pinned: 'left',
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleDateString('pt-BR');
    }
  },
  {
    field: 'id_propriedade',
    headerName: 'Propriedade ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'canal_trafego',
    headerName: 'Canal',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    cellStyle: { fontWeight: 'bold' }
  },
  {
    field: 'utm_source',
    headerName: 'UTM Source',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontSize: '0.9em' }
  },
  {
    field: 'total_sessoes',
    headerName: 'Sessões',
    width: 120,
    editable: false,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return typeof params.value === 'number'
        ? params.value.toLocaleString('pt-BR')
        : String(params.value);
    },
    cellStyle: { textAlign: 'right', fontWeight: 'bold', color: '#1976d2' }
  },
  {
    field: 'total_visitantes',
    headerName: 'Visitantes',
    width: 120,
    editable: false,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return typeof params.value === 'number'
        ? params.value.toLocaleString('pt-BR')
        : String(params.value);
    },
    cellStyle: { textAlign: 'right', fontWeight: 'bold', color: '#2e7d32' }
  }
];

// Configurações de colunas para Agregado Diário por Página
export const agregadoDiarioPorPaginaColumns: ColDef[] = [
  {
    field: 'data',
    headerName: 'Data',
    width: 150,
    pinned: 'left',
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleDateString('pt-BR');
    }
  },
  {
    field: 'id_propriedade',
    headerName: 'Propriedade ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'url_pagina',
    headerName: 'URL',
    width: 350,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontSize: '0.85em' }
  },
  {
    field: 'total_visualizacoes',
    headerName: 'Visualizações',
    width: 140,
    editable: false,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return typeof params.value === 'number'
        ? params.value.toLocaleString('pt-BR')
        : String(params.value);
    },
    cellStyle: { textAlign: 'right', fontWeight: 'bold', color: '#1976d2' }
  },
  {
    field: 'visitantes_unicos',
    headerName: 'Visitantes Únicos',
    width: 150,
    editable: false,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return typeof params.value === 'number'
        ? params.value.toLocaleString('pt-BR')
        : String(params.value);
    },
    cellStyle: { textAlign: 'right', fontWeight: 'bold', color: '#2e7d32' }
  }
];

// Configurações de colunas para Consentimentos de Visitante
export const consentimentosVisitanteColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true,
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'id_visitante',
    headerName: 'Visitante ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'tipo_consentimento',
    headerName: 'Tipo',
    width: 180,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
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
    cellStyle: (params) => {
      const status = String(params.value || '').toLowerCase();
      if (status.includes('aceito') || status.includes('accepted')) return { color: '#2e7d32', fontWeight: 'bold' };
      if (status.includes('negado') || status.includes('denied')) return { color: '#c62828', fontWeight: 'bold' };
      if (status.includes('pendente') || status.includes('pending')) return { color: '#f57c00', fontWeight: 'bold' };
      return { color: '#000000', fontWeight: 'normal' };
    }
  },
  {
    field: 'timestamp_consentimento',
    headerName: 'Data Consentimento',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  }
];

// Configurações de colunas para Eventos
export const eventosColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 120,
    pinned: 'left',
    editable: false,
    sortable: true,
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'id_sessao',
    headerName: 'Sessão ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'id_propriedade',
    headerName: 'Propriedade ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'timestamp_evento',
    headerName: 'Timestamp',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  },
  {
    field: 'tipo_evento',
    headerName: 'Tipo',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    cellStyle: { fontWeight: 'bold', color: '#1976d2' }
  },
  {
    field: 'nome_evento',
    headerName: 'Nome do Evento',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontWeight: 'bold' }
  },
  {
    field: 'url_pagina',
    headerName: 'URL',
    width: 300,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontSize: '0.85em' }
  },
  {
    field: 'titulo_pagina',
    headerName: 'Título',
    width: 250,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'propriedades_customizadas',
    headerName: 'Propriedades Custom',
    width: 200,
    editable: true,
    sortable: false,
    valueFormatter: (params) => {
      if (!params.value) return '';
      try {
        const props = typeof params.value === 'string' ? JSON.parse(params.value) : params.value;
        const keys = Object.keys(props);
        return keys.length > 0 ? `${keys.length} propriedade(s)` : 'Vazio';
      } catch {
        return 'JSON inválido';
      }
    },
    cellStyle: { fontSize: '0.9em' }
  }
];

// Configurações de colunas para Itens de Transação
export const itensTransacaoColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true,
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'id_transacao',
    headerName: 'Transação ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'sku_produto',
    headerName: 'SKU',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontWeight: 'bold' }
  },
  {
    field: 'nome_produto',
    headerName: 'Produto',
    width: 250,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontWeight: 'bold' }
  },
  {
    field: 'categoria_produto',
    headerName: 'Categoria',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'preco_unitario',
    headerName: 'Preço Unit. (R$)',
    width: 140,
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
    },
    cellStyle: { fontWeight: 'bold', color: '#1976d2', textAlign: 'right' }
  },
  {
    field: 'quantidade',
    headerName: 'Qtd',
    width: 100,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return typeof params.value === 'number'
        ? params.value.toLocaleString('pt-BR')
        : String(params.value);
    },
    cellStyle: { textAlign: 'right', fontWeight: 'bold' }
  }
];

// Configurações de colunas para Metas
export const metasColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true,
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'id_propriedade',
    headerName: 'Propriedade ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'nome_meta',
    headerName: 'Nome da Meta',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontWeight: 'bold' }
  },
  {
    field: 'tipo_meta',
    headerName: 'Tipo',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'condicao',
    headerName: 'Condição',
    width: 300,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    wrapText: true,
    autoHeight: true
  }
];

// Configurações de colunas para Propriedades
export const propriedadesAnalyticsColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true,
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'id_rastreamento',
    headerName: 'ID Rastreamento',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.9em' }
  },
  {
    field: 'nome_propriedade',
    headerName: 'Nome',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontWeight: 'bold' }
  },
  {
    field: 'url_site',
    headerName: 'URL do Site',
    width: 300,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'created_at',
    headerName: 'Criado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  }
];

// Configurações de colunas para Propriedades de Visitante
export const propriedadesVisitanteColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true,
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'id_visitante',
    headerName: 'Visitante ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'chave_propriedade',
    headerName: 'Chave',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontWeight: 'bold' }
  },
  {
    field: 'valor_propriedade',
    headerName: 'Valor',
    width: 250,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'updated_at',
    headerName: 'Atualizado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  }
];

// Configurações de colunas para Sessões
export const sessoesColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true,
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'id_visitante',
    headerName: 'Visitante ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'timestamp_inicio_sessao',
    headerName: 'Início',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  },
  {
    field: 'timestamp_fim_sessao',
    headerName: 'Fim',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  },
  {
    field: 'ip_address',
    headerName: 'IP',
    width: 140,
    editable: false,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'user_agent',
    headerName: 'User Agent',
    width: 300,
    editable: false,
    sortable: false,
    wrapText: true,
    cellStyle: { fontSize: '0.75em' }
  },
  {
    field: 'url_referencia',
    headerName: 'Referência',
    width: 250,
    editable: false,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontSize: '0.85em' }
  },
  {
    field: 'canal_trafego',
    headerName: 'Canal',
    width: 130,
    editable: false,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    cellStyle: { fontWeight: 'bold' }
  },
  {
    field: 'utm_source',
    headerName: 'UTM Source',
    width: 130,
    editable: false,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'utm_medium',
    headerName: 'UTM Medium',
    width: 130,
    editable: false,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'utm_campaign',
    headerName: 'UTM Campaign',
    width: 150,
    editable: false,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'pais',
    headerName: 'País',
    width: 100,
    editable: false,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'cidade',
    headerName: 'Cidade',
    width: 150,
    editable: false,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'tipo_dispositivo',
    headerName: 'Dispositivo',
    width: 120,
    editable: false,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'navegador',
    headerName: 'Navegador',
    width: 120,
    editable: false,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'sistema_operacional',
    headerName: 'SO',
    width: 120,
    editable: false,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'eh_bot',
    headerName: 'Bot',
    width: 80,
    editable: false,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    valueFormatter: (params) => {
      return params.value ? 'Sim' : 'Não';
    },
    cellStyle: (params) => {
      return params.value
        ? { color: '#c62828', fontWeight: 'bold' }
        : { color: '#2e7d32', fontWeight: 'normal' };
    }
  }
];

// Configurações de colunas para Transações
export const transacoesAnalyticsColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true,
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'id_sessao',
    headerName: 'Sessão ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'id_visitante',
    headerName: 'Visitante ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'valor_total',
    headerName: 'Valor Total (R$)',
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
    },
    cellStyle: { fontWeight: 'bold', color: '#2e7d32', textAlign: 'right' }
  },
  {
    field: 'impostos',
    headerName: 'Impostos (R$)',
    width: 130,
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
    cellStyle: { textAlign: 'right' }
  },
  {
    field: 'frete',
    headerName: 'Frete (R$)',
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
    },
    cellStyle: { textAlign: 'right' }
  },
  {
    field: 'moeda',
    headerName: 'Moeda',
    width: 100,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontWeight: 'bold' }
  },
  {
    field: 'timestamp_transacao',
    headerName: 'Data Transação',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  }
];

// Configurações de colunas para Visitantes
export const visitantesColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true,
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'id_propriedade',
    headerName: 'Propriedade ID',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'id_visitante_persistente',
    headerName: 'ID Persistente',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontFamily: 'monospace', fontSize: '0.85em' }
  },
  {
    field: 'primeira_visita_timestamp',
    headerName: 'Primeira Visita',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  },
  {
    field: 'ultima_visita_timestamp',
    headerName: 'Última Visita',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleString('pt-BR');
    }
  }
];

// ============================================
// MARKETING ORGÂNICO - Schema: marketing_organico
// ============================================

// Configurações de colunas para Contas Sociais
export const contasSociaisColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'plataforma',
    headerName: 'Plataforma',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    cellStyle: (params) => {
      const plataforma = String(params.value || '').toLowerCase();
      if (plataforma.includes('instagram')) return { color: '#E4405F', fontWeight: 'bold' };
      if (plataforma.includes('facebook')) return { color: '#1877F2', fontWeight: 'bold' };
      if (plataforma.includes('linkedin')) return { color: '#0A66C2', fontWeight: 'bold' };
      if (plataforma.includes('twitter') || plataforma.includes('x')) return { color: '#000000', fontWeight: 'bold' };
      if (plataforma.includes('youtube')) return { color: '#FF0000', fontWeight: 'bold' };
      return { color: '#000000', fontWeight: 'normal' };
    }
  },
  {
    field: 'nome_conta',
    headerName: 'Nome da Conta',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'conectado_em',
    headerName: 'Conectado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleDateString('pt-BR');
    }
  }
];

// Configurações de colunas para Publicações
export const publicacoesColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'conta_social_id',
    headerName: 'Conta Social',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'titulo',
    headerName: 'Título',
    width: 250,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    cellStyle: { fontWeight: 'bold' }
  },
  {
    field: 'hook',
    headerName: 'Hook',
    width: 300,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    wrapText: true,
    autoHeight: true
  },
  {
    field: 'expansao_hook',
    headerName: 'Expansão do Hook',
    width: 300,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    wrapText: true,
    autoHeight: true
  },
  {
    field: 'copy_completo',
    headerName: 'Copy Completo',
    width: 400,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    wrapText: true,
    autoHeight: true
  },
  {
    field: 'legenda',
    headerName: 'Legenda',
    width: 300,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    wrapText: true,
    autoHeight: true
  },
  {
    field: 'url_midia',
    headerName: 'URLs de Mídia',
    width: 200,
    editable: true,
    sortable: false,
    valueFormatter: (params) => {
      if (!params.value) return '';
      try {
        const urls = Array.isArray(params.value) ? params.value : JSON.parse(params.value as string);
        return urls.length > 0 ? `${urls.length} arquivo(s)` : '';
      } catch {
        return String(params.value);
      }
    }
  },
  {
    field: 'links',
    headerName: 'Links',
    width: 200,
    editable: true,
    sortable: false,
    valueFormatter: (params) => {
      if (!params.value) return '';
      try {
        const links = Array.isArray(params.value) ? params.value : JSON.parse(params.value as string);
        return links.length > 0 ? `${links.length} link(s)` : '';
      } catch {
        return String(params.value);
      }
    }
  },
  {
    field: 'tipo_post',
    headerName: 'Tipo de Post',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'hashtags',
    headerName: 'Hashtags',
    width: 200,
    editable: true,
    sortable: false,
    valueFormatter: (params) => {
      if (!params.value) return '';
      try {
        const tags = Array.isArray(params.value) ? params.value : JSON.parse(params.value as string);
        return tags.length > 0 ? tags.join(', ') : '';
      } catch {
        return String(params.value);
      }
    }
  },
  {
    field: 'explicacao',
    headerName: 'Explicação',
    width: 300,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    wrapText: true,
    autoHeight: true
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    cellStyle: (params) => {
      const status = String(params.value || '').toLowerCase();
      if (status === 'publicado') return { color: '#2e7d32', fontWeight: 'bold' };
      if (status === 'rascunho') return { color: '#f57c00', fontWeight: 'bold' };
      if (status === 'agendado') return { color: '#1976d2', fontWeight: 'bold' };
      return { color: '#000000', fontWeight: 'normal' };
    }
  },
  {
    field: 'criado_em',
    headerName: 'Criado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleDateString('pt-BR');
    }
  }
];

// Configurações de colunas para Métricas de Publicações
export const metricasPublicacoesColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'publicacao_id',
    headerName: 'Publicação',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'curtidas',
    headerName: 'Curtidas',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return typeof params.value === 'number'
        ? params.value.toLocaleString('pt-BR')
        : String(params.value);
    },
    cellStyle: { textAlign: 'right', fontWeight: 'bold' }
  },
  {
    field: 'comentarios',
    headerName: 'Comentários',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return typeof params.value === 'number'
        ? params.value.toLocaleString('pt-BR')
        : String(params.value);
    },
    cellStyle: { textAlign: 'right' }
  },
  {
    field: 'compartilhamentos',
    headerName: 'Compartilhamentos',
    width: 160,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return typeof params.value === 'number'
        ? params.value.toLocaleString('pt-BR')
        : String(params.value);
    },
    cellStyle: { textAlign: 'right' }
  },
  {
    field: 'visualizacoes',
    headerName: 'Visualizações',
    width: 140,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return typeof params.value === 'number'
        ? params.value.toLocaleString('pt-BR')
        : String(params.value);
    },
    cellStyle: { textAlign: 'right' }
  },
  {
    field: 'impressoes',
    headerName: 'Impressões',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return typeof params.value === 'number'
        ? params.value.toLocaleString('pt-BR')
        : String(params.value);
    },
    cellStyle: { textAlign: 'right' }
  },
  {
    field: 'registrado_em',
    headerName: 'Registrado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleDateString('pt-BR');
    }
  }
];

// Configurações de colunas para Resumos de Conta
export const resumosContaColumns: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 280,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'conta_social_id',
    headerName: 'Conta Social',
    width: 280,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'seguidores',
    headerName: 'Seguidores',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'avg',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return typeof params.value === 'number'
        ? params.value.toLocaleString('pt-BR')
        : String(params.value);
    },
    cellStyle: { textAlign: 'right', fontWeight: 'bold' }
  },
  {
    field: 'seguindo',
    headerName: 'Seguindo',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'avg',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return typeof params.value === 'number'
        ? params.value.toLocaleString('pt-BR')
        : String(params.value);
    },
    cellStyle: { textAlign: 'right' }
  },
  {
    field: 'total_publicacoes',
    headerName: 'Total de Publicações',
    width: 180,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return typeof params.value === 'number'
        ? params.value.toLocaleString('pt-BR')
        : String(params.value);
    },
    cellStyle: { textAlign: 'right' }
  },
  {
    field: 'taxa_engajamento',
    headerName: 'Taxa de Engajamento',
    width: 180,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'avg',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return typeof params.value === 'number'
        ? `${(params.value * 100).toFixed(2)}%`
        : String(params.value);
    },
    cellStyle: (params) => {
      const value = params.value as number;
      if (value > 0.05) return { color: '#2e7d32', fontWeight: 'bold', textAlign: 'right' };
      if (value > 0.02) return { color: '#f57c00', fontWeight: 'bold', textAlign: 'right' };
      return { color: '#c62828', fontWeight: 'normal', textAlign: 'right' };
    }
  },
  {
    field: 'registrado_em',
    headerName: 'Registrado em',
    width: 180,
    editable: false,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      const date = new Date(params.value as string);
      return isNaN(date.getTime()) ? String(params.value) : date.toLocaleDateString('pt-BR');
    }
  }
];

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
    columnDefs: categoriasColumns,
    icon: '🏷️',
    category: 'Gestão Financeira'
  },
  {
    id: 'gestao-contas',
    name: 'Contas Bancárias',
    description: 'Contas bancárias e saldos',
    tableName: 'gestaofinanceira.contas',
    columnDefs: contasColumns,
    icon: '🏦',
    category: 'Gestão Financeira'
  },
  {
    id: 'gestao-contas-a-pagar',
    name: 'Contas a Pagar',
    description: 'Contas a pagar e despesas',
    tableName: 'gestaofinanceira.contas_a_pagar',
    columnDefs: contasAPagarColumns,
    icon: '💸',
    category: 'Gestão Financeira'
  },
  {
    id: 'gestao-contas-a-receber',
    name: 'Contas a Receber',
    description: 'Contas a receber e receitas',
    tableName: 'gestaofinanceira.contas_a_receber',
    columnDefs: contasAReceberColumns,
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
    columnDefs: movimentosColumns,
    icon: '📊',
    category: 'Gestão Financeira'
  },
  {
    id: 'gestao-contratos',
    name: 'Contratos',
    description: 'Contratos recorrentes e parcelados',
    tableName: 'gestaofinanceira.contratos',
    columnDefs: contratosColumns,
    icon: '📝',
    category: 'Gestão Financeira'
  },
  {
    id: 'gestao-documento-itens',
    name: 'Documento Itens',
    description: 'Itens de documentos fiscais',
    tableName: 'gestaofinanceira.documento_itens',
    columnDefs: documentoItensColumns,
    icon: '📋',
    category: 'Gestão Financeira'
  },
  {
    id: 'gestao-documentos',
    name: 'Documentos Fiscais',
    description: 'Notas fiscais e documentos',
    tableName: 'gestaofinanceira.documentos',
    columnDefs: documentosColumns,
    icon: '🧾',
    category: 'Gestão Financeira'
  },
  {
    id: 'gestao-entidades',
    name: 'Entidades',
    description: 'Cadastro de clientes e fornecedores',
    tableName: 'gestaofinanceira.entidades',
    columnDefs: entidadesColumns,
    icon: '🏢',
    category: 'Gestão Financeira'
  },
  {
    id: 'compras-fornecedores',
    name: 'Fornecedores',
    description: 'Cadastro e avaliação de fornecedores',
    tableName: 'gestaocompras.fornecedores',
    columnDefs: fornecedoresColumns,
    icon: '🏭',
    category: 'Gestão de Compras'
  },
  {
    id: 'compras-pedidos',
    name: 'Pedidos de Compra',
    description: 'Pedidos de compra e solicitações',
    tableName: 'gestaocompras.pedidos_compra',
    columnDefs: pedidosCompraColumns,
    icon: '🛒',
    category: 'Gestão de Compras'
  },
  {
    id: 'compras-itens-pedido',
    name: 'Itens de Pedido',
    description: 'Itens e linhas dos pedidos de compra',
    tableName: 'gestaocompras.pedido_compra_itens',
    columnDefs: pedidoCompraItensColumns,
    icon: '📦',
    category: 'Gestão de Compras'
  },
  {
    id: 'projetos-projects',
    name: 'Projetos',
    description: 'Projetos e cronogramas',
    tableName: 'gestaodeprojetos.projects',
    columnDefs: projectsColumns,
    icon: '📊',
    category: 'Gestão de Projetos'
  },
  {
    id: 'projetos-status-types',
    name: 'Status Types',
    description: 'Tipos de status para tarefas',
    tableName: 'gestaodeprojetos.status_types',
    columnDefs: statusTypesColumns,
    icon: '🏷️',
    category: 'Gestão de Projetos'
  },
  {
    id: 'projetos-tasks',
    name: 'Tarefas',
    description: 'Tarefas e atribuições',
    tableName: 'gestaodeprojetos.tasks',
    columnDefs: tasksColumns,
    icon: '✅',
    category: 'Gestão de Projetos'
  },
  {
    id: 'ecommerce-channels',
    name: 'Canais de Venda',
    description: 'Canais de venda (marketplace, site, app)',
    tableName: 'vendasecommerce.channels',
    columnDefs: channelsColumns,
    icon: '📱',
    category: 'Vendas E-commerce'
  },
  {
    id: 'ecommerce-coupons',
    name: 'Cupons',
    description: 'Cupons de desconto',
    tableName: 'vendasecommerce.coupons',
    columnDefs: couponsColumns,
    icon: '🎫',
    category: 'Vendas E-commerce'
  },
  {
    id: 'ecommerce-customers',
    name: 'Clientes',
    description: 'Cadastro de clientes do e-commerce',
    tableName: 'vendasecommerce.customers',
    columnDefs: customersColumns,
    icon: '👤',
    category: 'Vendas E-commerce'
  },
  {
    id: 'ecommerce-loyalty-points',
    name: 'Pontos de Fidelidade',
    description: 'Saldo de pontos dos clientes',
    tableName: 'vendasecommerce.loyalty_points',
    columnDefs: loyaltyPointsColumns,
    icon: '⭐',
    category: 'Vendas E-commerce'
  },
  {
    id: 'ecommerce-loyalty-rewards',
    name: 'Recompensas',
    description: 'Catálogo de recompensas para resgate',
    tableName: 'vendasecommerce.loyalty_rewards',
    columnDefs: loyaltyRewardsColumns,
    icon: '🎁',
    category: 'Vendas E-commerce'
  },
  {
    id: 'ecommerce-order-items',
    name: 'Itens de Pedido',
    description: 'Produtos dos pedidos',
    tableName: 'vendasecommerce.order_items',
    columnDefs: orderItemsColumns,
    icon: '📦',
    category: 'Vendas E-commerce'
  },
  {
    id: 'ecommerce-orders',
    name: 'Pedidos',
    description: 'Pedidos de venda',
    tableName: 'vendasecommerce.orders',
    columnDefs: ordersColumns,
    icon: '🛒',
    category: 'Vendas E-commerce'
  },
  {
    id: 'ecommerce-payments',
    name: 'Pagamentos',
    description: 'Transações de pagamento',
    tableName: 'vendasecommerce.payments',
    columnDefs: paymentsColumns,
    icon: '💳',
    category: 'Vendas E-commerce'
  },
  {
    id: 'ecommerce-products',
    name: 'Produtos',
    description: 'Catálogo de produtos',
    tableName: 'vendasecommerce.products',
    columnDefs: productsColumns,
    icon: '🏷️',
    category: 'Vendas E-commerce'
  },
  {
    id: 'ecommerce-returns',
    name: 'Devoluções',
    description: 'Solicitações de devolução e reembolso',
    tableName: 'vendasecommerce.returns',
    columnDefs: returnsColumns,
    icon: '↩️',
    category: 'Vendas E-commerce'
  },
  {
    id: 'supply-warehouses',
    name: 'Armazéns',
    description: 'Armazéns e centros de distribuição',
    tableName: 'supplychainecommerce.warehouses',
    columnDefs: warehousesColumns,
    icon: '🏭',
    category: 'Supply Chain'
  },
  {
    id: 'supply-suppliers',
    name: 'Fornecedores',
    description: 'Fornecedores e parceiros',
    tableName: 'supplychainecommerce.suppliers',
    columnDefs: suppliersColumns,
    icon: '🤝',
    category: 'Supply Chain'
  },
  {
    id: 'supply-purchases',
    name: 'Ordens de Compra',
    description: 'Pedidos de compra aos fornecedores',
    tableName: 'supplychainecommerce.purchases',
    columnDefs: purchasesColumns,
    icon: '📋',
    category: 'Supply Chain'
  },
  {
    id: 'supply-purchase-items',
    name: 'Itens de Compra',
    description: 'Produtos nas ordens de compra',
    tableName: 'supplychainecommerce.purchase_items',
    columnDefs: purchaseItemsColumns,
    icon: '📦',
    category: 'Supply Chain'
  },
  {
    id: 'supply-inventory',
    name: 'Estoque',
    description: 'Níveis de estoque por produto/armazém',
    tableName: 'supplychainecommerce.inventory',
    columnDefs: inventoryColumns,
    icon: '📊',
    category: 'Supply Chain'
  },
  {
    id: 'supply-inventory-movements',
    name: 'Movimentações de Estoque',
    description: 'Histórico de entradas e saídas',
    tableName: 'supplychainecommerce.inventory_movements',
    columnDefs: inventoryMovementsColumns,
    icon: '🔄',
    category: 'Supply Chain'
  },
  {
    id: 'supply-shipments',
    name: 'Envios',
    description: 'Envios e entregas',
    tableName: 'supplychainecommerce.shipments',
    columnDefs: shipmentsColumns,
    icon: '🚚',
    category: 'Supply Chain'
  },
  {
    id: 'supply-shipment-events',
    name: 'Eventos de Rastreamento',
    description: 'Histórico de rastreamento dos envios',
    tableName: 'supplychainecommerce.shipment_events',
    columnDefs: shipmentEventsColumns,
    icon: '📍',
    category: 'Supply Chain'
  },
  {
    id: 'marketing-contas-sociais',
    name: 'Contas Sociais',
    description: 'Contas de redes sociais conectadas',
    tableName: 'marketing_organico.contas_sociais',
    columnDefs: contasSociaisColumns,
    icon: '🔗',
    category: 'Marketing Orgânico'
  },
  {
    id: 'marketing-publicacoes',
    name: 'Publicações',
    description: 'Publicações nas redes sociais',
    tableName: 'marketing_organico.publicacoes',
    columnDefs: publicacoesColumns,
    icon: '📝',
    category: 'Marketing Orgânico'
  },
  {
    id: 'marketing-metricas',
    name: 'Métricas de Publicações',
    description: 'Métricas e engajamento das publicações',
    tableName: 'marketing_organico.metricas_publicacoes',
    columnDefs: metricasPublicacoesColumns,
    icon: '📊',
    category: 'Marketing Orgânico'
  },
  {
    id: 'marketing-resumos-conta',
    name: 'Resumos de Conta',
    description: 'Resumos estatísticos das contas sociais',
    tableName: 'marketing_organico.resumos_conta',
    columnDefs: resumosContaColumns,
    icon: '📈',
    category: 'Marketing Orgânico'
  },
  {
    id: 'trafego-contas-ads',
    name: 'Contas de Anúncios',
    description: 'Contas publicitárias (Google Ads, Meta Ads, etc.)',
    tableName: 'trafego_pago.contas_ads',
    columnDefs: contasAdsColumns,
    icon: '🔑',
    category: 'Tráfego Pago'
  },
  {
    id: 'trafego-campanhas',
    name: 'Campanhas',
    description: 'Campanhas de tráfego pago',
    tableName: 'trafego_pago.campanhas',
    columnDefs: campanhasTrafegoPagoColumns,
    icon: '🎯',
    category: 'Tráfego Pago'
  },
  {
    id: 'trafego-grupos-anuncios',
    name: 'Grupos de Anúncios',
    description: 'Conjuntos de anúncios / Ad Sets',
    tableName: 'trafego_pago.grupos_de_anuncios',
    columnDefs: gruposDeAnunciosColumns,
    icon: '📂',
    category: 'Tráfego Pago'
  },
  {
    id: 'trafego-anuncios-criacao',
    name: 'Criativos em Desenvolvimento',
    description: 'Anúncios em processo de criação',
    tableName: 'trafego_pago.anuncios_criacao',
    columnDefs: anunciosCriacaoColumns,
    icon: '✏️',
    category: 'Tráfego Pago'
  },
  {
    id: 'trafego-anuncios-colaboradores',
    name: 'Histórico de Colaboração',
    description: 'Ações e comentários nos criativos',
    tableName: 'trafego_pago.anuncios_colaboradores',
    columnDefs: anunciosColaboradoresColumns,
    icon: '👥',
    category: 'Tráfego Pago'
  },
  {
    id: 'trafego-anuncios-publicados',
    name: 'Anúncios Publicados',
    description: 'Anúncios ativos nas plataformas',
    tableName: 'trafego_pago.anuncios_publicados',
    columnDefs: anunciosPublicadosColumns,
    icon: '🚀',
    category: 'Tráfego Pago'
  },
  {
    id: 'trafego-metricas',
    name: 'Métricas de Anúncios',
    description: 'Performance detalhada dos anúncios',
    tableName: 'trafego_pago.metricas_anuncios',
    columnDefs: metricasAnunciosColumns,
    icon: '📊',
    category: 'Tráfego Pago'
  },
  {
    id: 'trafego-resumos-campanhas',
    name: 'Resumos de Campanhas',
    description: 'Consolidação de resultados por campanha',
    tableName: 'trafego_pago.resumos_campanhas',
    columnDefs: resumosCampanhasColumns,
    icon: '📈',
    category: 'Tráfego Pago'
  },

  // ============================================
  // GESTÃO DE ESTOQUE - Schema: gestaoestoque
  // ============================================
  {
    id: 'estoque-centros-distribuicao',
    name: 'Centros de Distribuição',
    description: 'Gestão de centros de distribuição',
    tableName: 'gestaoestoque.centros_distribuicao',
    columnDefs: centrosDistribuicaoColumns,
    icon: '🏭',
    category: 'Gestão de Estoque'
  },
  {
    id: 'estoque-estoque-canal',
    name: 'Estoque por Canal',
    description: 'Controle de estoque por canal de venda',
    tableName: 'gestaoestoque.estoque_canal',
    columnDefs: estoqueCanaisColumns,
    icon: '📊',
    category: 'Gestão de Estoque'
  },
  {
    id: 'estoque-integracoes-canais',
    name: 'Integrações de Canais',
    description: 'Configuração de integrações com canais',
    tableName: 'gestaoestoque.integracoes_canais',
    columnDefs: integracoesCanaisColumns,
    icon: '🔗',
    category: 'Gestão de Estoque'
  },
  {
    id: 'estoque-movimentacoes',
    name: 'Movimentações de Estoque',
    description: 'Histórico de entradas e saídas',
    tableName: 'gestaoestoque.movimentacoes_estoque',
    columnDefs: movimentacoesEstoqueColumns,
    icon: '📋',
    category: 'Gestão de Estoque'
  },
  {
    id: 'estoque-precos-canais',
    name: 'Preços por Canal',
    description: 'Gestão de preços por canal de venda',
    tableName: 'gestaoestoque.precos_canais',
    columnDefs: precosCanalColumns,
    icon: '💰',
    category: 'Gestão de Estoque'
  },

  // ============================================
  // GESTÃO LOGÍSTICA - Schema: gestaologistica
  // ============================================
  {
    id: 'logistica-envios',
    name: 'Envios',
    description: 'Gerenciamento de envios e entregas',
    tableName: 'gestaologistica.envios',
    columnDefs: enviosColumns,
    icon: '📦',
    category: 'Gestão Logística'
  },
  {
    id: 'logistica-eventos-rastreio',
    name: 'Eventos de Rastreio',
    description: 'Histórico de rastreamento dos envios',
    tableName: 'gestaologistica.eventos_rastreio',
    columnDefs: eventosRastreioColumns,
    icon: '📍',
    category: 'Gestão Logística'
  },
  {
    id: 'logistica-reversa',
    name: 'Logística Reversa',
    description: 'Gestão de devoluções e retornos',
    tableName: 'gestaologistica.logistica_reversa',
    columnDefs: logisticaReversaColumns,
    icon: '↩️',
    category: 'Gestão Logística'
  },
  {
    id: 'logistica-pacotes',
    name: 'Pacotes',
    description: 'Informações de dimensões e peso dos pacotes',
    tableName: 'gestaologistica.pacotes',
    columnDefs: pacotesColumns,
    icon: '📐',
    category: 'Gestão Logística'
  },
  {
    id: 'logistica-transportadoras',
    name: 'Transportadoras',
    description: 'Cadastro de transportadoras e integrações',
    tableName: 'gestaologistica.transportadoras',
    columnDefs: transportadorasColumns,
    icon: '🚚',
    category: 'Gestão Logística'
  },

  // ============================================
  // GESTÃO ANALYTICS - Schema: gestaoanalytics
  // ============================================
  {
    id: 'analytics-agregado-fonte',
    name: 'Agregado Diário por Fonte',
    description: 'Dados agregados de tráfego por fonte e canal',
    tableName: 'gestaoanalytics.agregado_diario_por_fonte',
    columnDefs: agregadoDiarioPorFonteColumns,
    icon: '📊',
    category: 'Gestão Analytics'
  },
  {
    id: 'analytics-agregado-pagina',
    name: 'Agregado Diário por Página',
    description: 'Dados agregados de visualizações por página',
    tableName: 'gestaoanalytics.agregado_diario_por_pagina',
    columnDefs: agregadoDiarioPorPaginaColumns,
    icon: '📄',
    category: 'Gestão Analytics'
  },
  {
    id: 'analytics-consentimentos',
    name: 'Consentimentos',
    description: 'Gestão de consentimentos de privacidade',
    tableName: 'gestaoanalytics.consentimentos_visitante',
    columnDefs: consentimentosVisitanteColumns,
    icon: '✅',
    category: 'Gestão Analytics'
  },
  {
    id: 'analytics-eventos',
    name: 'Eventos',
    description: 'Rastreamento de eventos personalizados',
    tableName: 'gestaoanalytics.eventos',
    columnDefs: eventosColumns,
    icon: '🎯',
    category: 'Gestão Analytics'
  },
  {
    id: 'analytics-itens-transacao',
    name: 'Itens de Transação',
    description: 'Produtos e itens das transações',
    tableName: 'gestaoanalytics.itens_transacao',
    columnDefs: itensTransacaoColumns,
    icon: '🛒',
    category: 'Gestão Analytics'
  },
  {
    id: 'analytics-metas',
    name: 'Metas',
    description: 'Configuração de metas e objetivos',
    tableName: 'gestaoanalytics.metas',
    columnDefs: metasColumns,
    icon: '🎯',
    category: 'Gestão Analytics'
  },
  {
    id: 'analytics-propriedades',
    name: 'Propriedades',
    description: 'Propriedades e sites rastreados',
    tableName: 'gestaoanalytics.propriedades',
    columnDefs: propriedadesAnalyticsColumns,
    icon: '🌐',
    category: 'Gestão Analytics'
  },
  {
    id: 'analytics-propriedades-visitante',
    name: 'Propriedades de Visitante',
    description: 'Atributos personalizados dos visitantes',
    tableName: 'gestaoanalytics.propriedades_visitante',
    columnDefs: propriedadesVisitanteColumns,
    icon: '👤',
    category: 'Gestão Analytics'
  },
  {
    id: 'analytics-sessoes',
    name: 'Sessões',
    description: 'Sessões de navegação dos visitantes',
    tableName: 'gestaoanalytics.sessoes',
    columnDefs: sessoesColumns,
    icon: '🔄',
    category: 'Gestão Analytics'
  },
  {
    id: 'analytics-transacoes',
    name: 'Transações',
    description: 'Transações e conversões de e-commerce',
    tableName: 'gestaoanalytics.transacoes',
    columnDefs: transacoesAnalyticsColumns,
    icon: '💳',
    category: 'Gestão Analytics'
  },
  {
    id: 'analytics-visitantes',
    name: 'Visitantes',
    description: 'Visitantes únicos e histórico',
    tableName: 'gestaoanalytics.visitantes',
    columnDefs: visitantesColumns,
    icon: '👥',
    category: 'Gestão Analytics'
  }
];
