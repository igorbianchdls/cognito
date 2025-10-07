import { ColDef } from 'ag-grid-community';
import type { SupabaseDatasetConfig } from './types';

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

// Definição de datasets do Vendas E-commerce
export const VENDAS_ECOMMERCE_DATASETS: SupabaseDatasetConfig[] = [
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
  }
];
