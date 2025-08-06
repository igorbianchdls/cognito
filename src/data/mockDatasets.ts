import { ColDef } from 'ag-grid-community';

// Interfaces para diferentes tipos de dados
export interface ProdutoData {
  id: number;
  produto: string;
  categoria: string;
  preco: number;
  estoque: number;
  vendas: number;
  ativo: boolean;
  dataLancamento: string;
}

export interface FuncionarioData {
  id: number;
  nome: string;
  cargo: string;
  salario: number;
  departamento: string;
  dataContratacao: string;
  ativo: boolean;
}

export interface VendaData {
  id: number;
  data: string;
  vendedor: string;
  produto: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  comissao: number;
}

export interface ClienteData {
  id: number;
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  cidade: string;
  status: string;
  ultimaCompra: string;
}

export interface EstoqueData {
  id: number;
  item: string;
  fornecedor: string;
  categoria: string;
  quantidade: number;
  localizacao: string;
  dataValidade: string;
  preco: number;
}

export interface DatasetInfo {
  id: string;
  name: string;
  description: string;
  rows: number;
  columns: number;
  size: string;
  type: 'grid' | 'csv' | 'excel' | 'json';
  lastModified: Date;
  data: Array<Record<string, unknown>>;
  columnDefs: ColDef[];
}

// Dados simulados - Produtos
const produtosData: ProdutoData[] = [
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
  }
];

// Dados simulados - Funcionários
const funcionariosData: FuncionarioData[] = [
  {
    id: 1,
    nome: "Ana Silva",
    cargo: "Desenvolvedora Senior",
    salario: 12000.00,
    departamento: "Tecnologia",
    dataContratacao: "2022-03-15",
    ativo: true
  },
  {
    id: 2,
    nome: "Carlos Santos",
    cargo: "Gerente de Vendas",
    salario: 15000.00,
    departamento: "Vendas",
    dataContratacao: "2021-07-10",
    ativo: true
  },
  {
    id: 3,
    nome: "Maria Oliveira",
    cargo: "Analista de Marketing",
    salario: 8500.00,
    departamento: "Marketing",
    dataContratacao: "2023-01-20",
    ativo: true
  },
  {
    id: 4,
    nome: "João Pereira",
    cargo: "Designer UX/UI",
    salario: 9500.00,
    departamento: "Tecnologia",
    dataContratacao: "2022-11-05",
    ativo: true
  },
  {
    id: 5,
    nome: "Lucia Costa",
    cargo: "Coordenadora RH",
    salario: 10500.00,
    departamento: "Recursos Humanos",
    dataContratacao: "2020-05-12",
    ativo: true
  },
  {
    id: 6,
    nome: "Pedro Lima",
    cargo: "Analista Financeiro",
    salario: 7500.00,
    departamento: "Financeiro",
    dataContratacao: "2023-08-18",
    ativo: true
  },
  {
    id: 7,
    nome: "Sandra Rocha",
    cargo: "Desenvolvedora Junior",
    salario: 6500.00,
    departamento: "Tecnologia",
    dataContratacao: "2024-02-01",
    ativo: true
  },
  {
    id: 8,
    nome: "Roberto Mendes",
    cargo: "Consultor de Vendas",
    salario: 5500.00,
    departamento: "Vendas",
    dataContratacao: "2023-06-30",
    ativo: false
  }
];

// Dados simulados - Vendas
const vendasData: VendaData[] = [
  {
    id: 1,
    data: "2024-01-15",
    vendedor: "Carlos Santos",
    produto: "iPhone 15 Pro",
    quantidade: 3,
    valorUnitario: 7999.99,
    valorTotal: 23999.97,
    comissao: 1199.99
  },
  {
    id: 2,
    data: "2024-01-16",
    vendedor: "Roberto Mendes",
    produto: "Samsung Galaxy S24",
    quantidade: 2,
    valorUnitario: 6999.99,
    valorTotal: 13999.98,
    comissao: 699.99
  },
  {
    id: 3,
    data: "2024-01-17",
    vendedor: "Carlos Santos",
    produto: "MacBook Air M3",
    quantidade: 1,
    valorUnitario: 12999.99,
    valorTotal: 12999.99,
    comissao: 1299.99
  },
  {
    id: 4,
    data: "2024-01-18",
    vendedor: "Roberto Mendes",
    produto: "AirPods Pro 2",
    quantidade: 5,
    valorUnitario: 2299.99,
    valorTotal: 11499.95,
    comissao: 574.99
  },
  {
    id: 5,
    data: "2024-01-19",
    vendedor: "Carlos Santos",
    produto: "iPad Air",
    quantidade: 2,
    valorUnitario: 4999.99,
    valorTotal: 9999.98,
    comissao: 499.99
  },
  {
    id: 6,
    data: "2024-01-20",
    vendedor: "Roberto Mendes",
    produto: "Dell XPS 13",
    quantidade: 1,
    valorUnitario: 8999.99,
    valorTotal: 8999.99,
    comissao: 899.99
  },
  {
    id: 7,
    data: "2024-01-21",
    vendedor: "Carlos Santos",
    produto: "Nintendo Switch OLED",
    quantidade: 4,
    valorUnitario: 2499.99,
    valorTotal: 9999.96,
    comissao: 999.99
  }
];

// Dados simulados - Clientes
const clientesData: ClienteData[] = [
  {
    id: 1,
    nome: "Empresa Alpha Ltda",
    empresa: "Alpha Technology",
    email: "contato@alphatech.com.br",
    telefone: "(11) 9999-1111",
    cidade: "São Paulo",
    status: "Ativo",
    ultimaCompra: "2024-01-15"
  },
  {
    id: 2,
    nome: "Beta Solutions",
    empresa: "Beta Corp",
    email: "vendas@betacorp.com.br",
    telefone: "(21) 8888-2222",
    cidade: "Rio de Janeiro",
    status: "Ativo",
    ultimaCompra: "2024-01-10"
  },
  {
    id: 3,
    nome: "Gamma Innovations",
    empresa: "Gamma Inc",
    email: "compras@gamma.com.br",
    telefone: "(31) 7777-3333",
    cidade: "Belo Horizonte",
    status: "Prospecto",
    ultimaCompra: "2023-12-20"
  },
  {
    id: 4,
    nome: "Delta Systems",
    empresa: "Delta Tech",
    email: "info@deltatech.com.br",
    telefone: "(41) 6666-4444",
    cidade: "Curitiba",
    status: "Ativo",
    ultimaCompra: "2024-01-08"
  },
  {
    id: 5,
    nome: "Epsilon Digital",
    empresa: "Epsilon Group",
    email: "contato@epsilon.com.br",
    telefone: "(51) 5555-5555",
    cidade: "Porto Alegre",
    status: "Inativo",
    ultimaCompra: "2023-08-15"
  },
  {
    id: 6,
    nome: "Zeta Communications",
    empresa: "Zeta Media",
    email: "marketing@zeta.com.br",
    telefone: "(85) 4444-6666",
    cidade: "Fortaleza",
    status: "Ativo",
    ultimaCompra: "2024-01-12"
  }
];

// Dados simulados - Estoque
const estoqueData: EstoqueData[] = [
  {
    id: 1,
    item: "iPhone 15 Pro - 256GB",
    fornecedor: "Apple Brasil",
    categoria: "Smartphones",
    quantidade: 45,
    localizacao: "Setor A - Prateleira 1",
    dataValidade: "2026-09-15",
    preco: 7999.99
  },
  {
    id: 2,
    item: "Samsung Galaxy S24 - 128GB",
    fornecedor: "Samsung Electronics",
    categoria: "Smartphones",
    quantidade: 32,
    localizacao: "Setor A - Prateleira 2",
    dataValidade: "2026-01-20",
    preco: 6999.99
  },
  {
    id: 3,
    item: "MacBook Air M3 - 8GB RAM",
    fornecedor: "Apple Brasil",
    categoria: "Laptops",
    quantidade: 18,
    localizacao: "Setor B - Prateleira 1",
    dataValidade: "2027-03-10",
    preco: 12999.99
  },
  {
    id: 4,
    item: "Dell XPS 13 - 16GB RAM",
    fornecedor: "Dell Technologies",
    categoria: "Laptops",
    quantidade: 25,
    localizacao: "Setor B - Prateleira 2",
    dataValidade: "2026-11-05",
    preco: 8999.99
  },
  {
    id: 5,
    item: "iPad Air - 64GB WiFi",
    fornecedor: "Apple Brasil",
    categoria: "Tablets",
    quantidade: 67,
    localizacao: "Setor C - Prateleira 1",
    dataValidade: "2026-02-28",
    preco: 4999.99
  },
  {
    id: 6,
    item: "AirPods Pro 2ª Geração",
    fornecedor: "Apple Brasil",
    categoria: "Acessórios",
    quantidade: 120,
    localizacao: "Setor D - Prateleira 1",
    dataValidade: "2025-09-20",
    preco: 2299.99
  },
  {
    id: 7,
    item: "Sony WH-1000XM5 Wireless",
    fornecedor: "Sony Brasil",
    categoria: "Acessórios",
    quantidade: 58,
    localizacao: "Setor D - Prateleira 2",
    dataValidade: "2026-07-12",
    preco: 1899.99
  },
  {
    id: 8,
    item: "Nintendo Switch OLED",
    fornecedor: "Nintendo Brasil",
    categoria: "Games",
    quantidade: 91,
    localizacao: "Setor E - Prateleira 1",
    dataValidade: "2026-10-08",
    preco: 2499.99
  }
];

// Configurações de colunas para cada dataset
const produtosColumnDefs: ColDef[] = [
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
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'categoria',
    headerName: 'Categoria',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true
  },
  {
    field: 'preco',
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
    field: 'estoque',
    headerName: 'Estoque',
    width: 100,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
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
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum'
  },
  {
    field: 'ativo',
    headerName: 'Ativo',
    width: 80,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true,
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
];

const funcionariosColumnDefs: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 80,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'nome',
    headerName: 'Nome',
    width: 180,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'cargo',
    headerName: 'Cargo',
    width: 160,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true,
    enablePivot: true
  },
  {
    field: 'salario',
    headerName: 'Salário (R$)',
    width: 130,
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
    field: 'departamento',
    headerName: 'Departamento',
    width: 140,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true
  },
  {
    field: 'dataContratacao',
    headerName: 'Data Contratação',
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
    field: 'ativo',
    headerName: 'Status',
    width: 80,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true,
    cellRenderer: (params: { value: boolean }) => {
      return params.value ? '✓ Ativo' : '✗ Inativo';
    },
    cellStyle: (params) => {
      return params.value 
        ? { color: '#2e7d32', fontWeight: 'bold' }
        : { color: '#c62828', fontWeight: 'bold' };
    }
  }
];

const vendasColumnDefs: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 80,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'data',
    headerName: 'Data',
    width: 120,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    enableRowGroup: true,
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleDateString('pt-BR');
    }
  },
  {
    field: 'vendedor',
    headerName: 'Vendedor',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true,
    enablePivot: true
  },
  {
    field: 'produto',
    headerName: 'Produto',
    width: 180,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'quantidade',
    headerName: 'Qtd',
    width: 80,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum'
  },
  {
    field: 'valorUnitario',
    headerName: 'Valor Unit. (R$)',
    width: 130,
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
    field: 'valorTotal',
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
    }
  },
  {
    field: 'comissao',
    headerName: 'Comissão (R$)',
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
  }
];

const clientesColumnDefs: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 80,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'nome',
    headerName: 'Nome',
    width: 180,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'empresa',
    headerName: 'Empresa',
    width: 150,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'email',
    headerName: 'Email',
    width: 200,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'telefone',
    headerName: 'Telefone',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'cidade',
    headerName: 'Cidade',
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
    width: 100,
    editable: true,
    sortable: true,
    filter: 'agSetColumnFilter',
    enableRowGroup: true,
    enablePivot: true,
    cellStyle: (params) => {
      switch (params.value) {
        case 'Ativo': return { color: '#2e7d32', fontWeight: 'bold' };
        case 'Inativo': return { color: '#c62828', fontWeight: 'bold' };
        case 'Prospecto': return { color: '#f57c00', fontWeight: 'bold' };
        default: return undefined;
      }
    }
  },
  {
    field: 'ultimaCompra',
    headerName: 'Última Compra',
    width: 130,
    editable: true,
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleDateString('pt-BR');
    }
  }
];

const estoqueColumnDefs: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 80,
    pinned: 'left',
    editable: false,
    sortable: true
  },
  {
    field: 'item',
    headerName: 'Item',
    width: 200,
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
    enableRowGroup: true,
    enablePivot: true
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
    field: 'quantidade',
    headerName: 'Quantidade',
    width: 100,
    editable: true,
    sortable: true,
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: 'sum',
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
    field: 'localizacao',
    headerName: 'Localização',
    width: 180,
    editable: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    enableRowGroup: true
  },
  {
    field: 'dataValidade',
    headerName: 'Validade',
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
    field: 'preco',
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
  }
];

// Datasets disponíveis
export const MOCK_DATASETS: DatasetInfo[] = [
  {
    id: 'produtos',
    name: 'Produtos',
    description: 'Catálogo de produtos eletrônicos',
    rows: produtosData.length,
    columns: produtosColumnDefs.length,
    size: '2.4 KB',
    type: 'grid',
    lastModified: new Date('2024-01-15'),
    data: produtosData as unknown as Array<Record<string, unknown>>,
    columnDefs: produtosColumnDefs
  },
  {
    id: 'funcionarios',
    name: 'Funcionários',
    description: 'Base de dados de colaboradores',
    rows: funcionariosData.length,
    columns: funcionariosColumnDefs.length,
    size: '1.8 KB',
    type: 'csv',
    lastModified: new Date('2024-01-10'),
    data: funcionariosData as unknown as Array<Record<string, unknown>>,
    columnDefs: funcionariosColumnDefs
  },
  {
    id: 'vendas',
    name: 'Vendas',
    description: 'Histórico de vendas mensais',
    rows: vendasData.length,
    columns: vendasColumnDefs.length,
    size: '1.5 KB',
    type: 'excel',
    lastModified: new Date('2024-01-20'),
    data: vendasData as unknown as Array<Record<string, unknown>>,
    columnDefs: vendasColumnDefs
  },
  {
    id: 'clientes',
    name: 'Clientes',
    description: 'Base de dados de clientes corporativos',
    rows: clientesData.length,
    columns: clientesColumnDefs.length,
    size: '1.2 KB',
    type: 'json',
    lastModified: new Date('2024-01-08'),
    data: clientesData as unknown as Array<Record<string, unknown>>,
    columnDefs: clientesColumnDefs
  },
  {
    id: 'estoque',
    name: 'Estoque',
    description: 'Controle de inventário do almoxarifado',
    rows: estoqueData.length,
    columns: estoqueColumnDefs.length,
    size: '2.1 KB',
    type: 'csv',
    lastModified: new Date('2024-01-12'),
    data: estoqueData as unknown as Array<Record<string, unknown>>,
    columnDefs: estoqueColumnDefs
  }
];