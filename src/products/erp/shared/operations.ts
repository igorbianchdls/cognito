export type ErpOperationField = {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'select'
  required?: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  optionSource?: 'products' | 'services' | 'customers' | 'accounts' | 'locations' | 'payments'
}

export type ErpOperationColumn = {
  key: string
  label: string
  kind?: 'currency' | 'number' | 'date' | 'status'
}

export type ErpOperationConfig = {
  moduleId: string
  resource: string
  title: string
  description: string
  primaryAction?: string
  columns: ErpOperationColumn[]
  fields?: ErpOperationField[]
  rowAction?: { label: string; resource: string; fields: ErpOperationField[] }
  processAction?: { label: string; endpoint: string }
}

export const ERP_OPERATION_CONFIGS: Record<string, ErpOperationConfig> = {
  'posicao-estoque': {
    moduleId: 'posicao-estoque', resource: 'posicao-estoque', title: 'Situacao do estoque',
    description: 'Saldo fisico, reservas, disponibilidade, custo medio e necessidade de reposicao por local.',
    columns: [
      { key: 'produto', label: 'Produto' }, { key: 'sku', label: 'SKU' }, { key: 'local_estoque', label: 'Local' },
      { key: 'quantidade_fisica', label: 'Fisico', kind: 'number' }, { key: 'quantidade_reservada', label: 'Reservado', kind: 'number' },
      { key: 'quantidade_disponivel', label: 'Disponivel', kind: 'number' }, { key: 'custo_medio', label: 'Custo medio', kind: 'currency' },
      { key: 'valor_estoque', label: 'Valor', kind: 'currency' }, { key: 'situacao', label: 'Situacao', kind: 'status' },
    ],
  },
  movimentacoes: {
    moduleId: 'movimentacoes', resource: 'movimentacoes', title: 'Movimentacoes de estoque',
    description: 'Razao imutavel de entradas, saidas, ajustes, transferencias e estornos.', primaryAction: 'Novo ajuste',
    columns: [
      { key: 'data', label: 'Data', kind: 'date' }, { key: 'produto', label: 'Produto' }, { key: 'local', label: 'Local' },
      { key: 'tipo', label: 'Tipo', kind: 'status' }, { key: 'quantidade', label: 'Quantidade', kind: 'number' },
      { key: 'custo_unitario', label: 'Custo', kind: 'currency' }, { key: 'saldo_apos', label: 'Saldo apos', kind: 'number' },
    ],
    fields: [
      { key: 'produto_id', label: 'Produto', type: 'select', optionSource: 'products', required: true },
      { key: 'local_estoque_id', label: 'Local', type: 'select', optionSource: 'locations', required: true },
      { key: 'tipo', label: 'Tipo', type: 'select', required: true, options: [
        { value: 'entrada', label: 'Entrada' }, { value: 'saida', label: 'Saida' },
        { value: 'ajuste_entrada', label: 'Ajuste de entrada' }, { value: 'ajuste_saida', label: 'Ajuste de saida' },
      ] },
      { key: 'quantidade', label: 'Quantidade', type: 'number', required: true },
      { key: 'custo_unitario', label: 'Custo unitario', type: 'number' },
    ],
  },
  'locais-estoque': {
    moduleId: 'locais-estoque', resource: 'locais-estoque', title: 'Locais de estoque',
    description: 'Depositos, lojas e outros pontos que mantem saldo fisico.', primaryAction: 'Novo local',
    columns: [
      { key: 'nome', label: 'Local' }, { key: 'codigo', label: 'Codigo' }, { key: 'tipo', label: 'Tipo' },
      { key: 'permite_venda', label: 'Vendas' }, { key: 'permite_compra', label: 'Compras' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true }, { key: 'codigo', label: 'Codigo', type: 'text', required: true },
      { key: 'descricao', label: 'Descricao', type: 'text' },
      { key: 'padrao', label: 'Local padrao', type: 'select', options: [{ value: 'nao', label: 'Nao' }, { value: 'sim', label: 'Sim' }] },
      { key: 'permite_venda', label: 'Usar em vendas', type: 'select', options: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Nao' }] },
      { key: 'permite_compra', label: 'Usar em compras', type: 'select', options: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Nao' }] },
    ],
  },
  inventarios: {
    moduleId: 'inventarios', resource: 'inventarios', title: 'Inventarios',
    description: 'Contagens fisicas com ajuste rastreavel da diferenca encontrada.', primaryAction: 'Nova contagem',
    columns: [
      { key: 'numero', label: 'Numero' }, { key: 'local', label: 'Local' }, { key: 'data', label: 'Data', kind: 'date' },
      { key: 'tipo', label: 'Tipo' }, { key: 'itens', label: 'Itens', kind: 'number' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    fields: [
      { key: 'numero', label: 'Numero', type: 'text', placeholder: 'Gerado automaticamente se vazio' },
      { key: 'data', label: 'Data da contagem', type: 'date' },
      { key: 'local_estoque_id', label: 'Local', type: 'select', optionSource: 'locations', required: true },
      { key: 'produto_id', label: 'Produto', type: 'select', optionSource: 'products', required: true },
      { key: 'quantidade_contada', label: 'Quantidade contada', type: 'number', required: true },
    ],
  },
  transferencias: {
    moduleId: 'transferencias', resource: 'transferencias', title: 'Transferencias de estoque',
    description: 'Movimente produtos entre locais sem alterar o saldo total da empresa.', primaryAction: 'Nova transferencia',
    columns: [
      { key: 'numero', label: 'Numero' }, { key: 'origem', label: 'Origem' }, { key: 'destino', label: 'Destino' },
      { key: 'data', label: 'Data', kind: 'date' }, { key: 'itens', label: 'Itens', kind: 'number' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    fields: [
      { key: 'numero', label: 'Numero', type: 'text', placeholder: 'Gerado automaticamente se vazio' },
      { key: 'data', label: 'Data', type: 'date' },
      { key: 'local_origem_id', label: 'Local de origem', type: 'select', optionSource: 'locations', required: true },
      { key: 'local_destino_id', label: 'Local de destino', type: 'select', optionSource: 'locations', required: true },
      { key: 'produto_id', label: 'Produto', type: 'select', optionSource: 'products', required: true },
      { key: 'quantidade', label: 'Quantidade', type: 'number', required: true },
    ],
  },
  kits: {
    moduleId: 'kits', resource: 'kits', title: 'Kits de produtos',
    description: 'Defina componentes para que as reservas e saidas ocorram nos itens do kit.', primaryAction: 'Adicionar componente',
    columns: [
      { key: 'produto', label: 'Kit' }, { key: 'codigo', label: 'Codigo' },
      { key: 'componentes', label: 'Componentes', kind: 'number' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    fields: [
      { key: 'produto_id', label: 'Produto vendido como kit', type: 'select', optionSource: 'products', required: true },
      { key: 'produto_componente_id', label: 'Componente', type: 'select', optionSource: 'products', required: true },
      { key: 'quantidade', label: 'Quantidade no kit', type: 'number', required: true },
    ],
  },
  'conversoes-unidades': {
    moduleId: 'conversoes-unidades', resource: 'conversoes-unidades', title: 'Conversoes de unidades',
    description: 'Converta caixas, fardos e outras unidades de compra para a unidade controlada no estoque.', primaryAction: 'Nova conversao',
    columns: [
      { key: 'produto', label: 'Produto' }, { key: 'unidade_origem', label: 'Unidade de origem' },
      { key: 'unidade_destino', label: 'Unidade de destino' }, { key: 'fator', label: 'Fator', kind: 'number' },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    fields: [
      { key: 'produto_id', label: 'Produto', type: 'select', optionSource: 'products', required: true },
      { key: 'unidade_origem', label: 'Unidade de origem', type: 'text', placeholder: 'CX', required: true },
      { key: 'unidade_destino', label: 'Unidade de estoque', type: 'text', placeholder: 'UN', required: true },
      { key: 'fator', label: 'Fator de conversao', type: 'number', required: true },
    ],
  },
  contratos: {
    moduleId: 'contratos', resource: 'contratos', title: 'Contratos e vendas recorrentes',
    description: 'Contratos ativos geram vendas em rascunho de forma idempotente na competencia prevista.',
    primaryAction: 'Novo contrato', processAction: { label: 'Gerar vendas vencidas', endpoint: '/api/erp/contratos/processar' },
    columns: [
      { key: 'numero', label: 'Numero' }, { key: 'cliente', label: 'Cliente' }, { key: 'descricao', label: 'Descricao' },
      { key: 'periodicidade', label: 'Periodicidade' }, { key: 'proxima_geracao_em', label: 'Proxima geracao', kind: 'date' },
      { key: 'valor', label: 'Valor', kind: 'currency' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    fields: [
      { key: 'numero', label: 'Numero', type: 'text', placeholder: 'Gerado automaticamente se vazio' },
      { key: 'cliente_id', label: 'Cliente', type: 'select', optionSource: 'customers', required: true },
      { key: 'descricao', label: 'Descricao', type: 'text', required: true },
      { key: 'produto_id', label: 'Produto', type: 'select', optionSource: 'products' },
      { key: 'servico_id', label: 'Servico', type: 'select', optionSource: 'services' },
      { key: 'quantidade', label: 'Quantidade', type: 'number', required: true },
      { key: 'valor_unitario', label: 'Valor unitario', type: 'number', required: true },
      { key: 'data_inicio', label: 'Inicio', type: 'date', required: true },
      { key: 'data_fim', label: 'Fim', type: 'date' },
      { key: 'periodicidade', label: 'Periodicidade', type: 'select', required: true, options: [
        { value: 'mensal', label: 'Mensal' }, { value: 'trimestral', label: 'Trimestral' },
        { value: 'semestral', label: 'Semestral' }, { value: 'anual', label: 'Anual' },
      ] },
      { key: 'dia_vencimento', label: 'Dia de vencimento', type: 'number' },
    ],
  },
  'fluxo-de-caixa': {
    moduleId: 'fluxo-de-caixa', resource: 'fluxo-de-caixa', title: 'Fluxo de caixa',
    description: 'Entradas, saidas e variacao diaria realizadas por conta financeira.',
    columns: [
      { key: 'data', label: 'Data', kind: 'date' }, { key: 'conta', label: 'Conta' },
      { key: 'entradas', label: 'Entradas', kind: 'currency' }, { key: 'saidas', label: 'Saidas', kind: 'currency' },
      { key: 'saldo', label: 'Saldo do dia', kind: 'currency' },
    ],
  },
  'conciliacao-bancaria': {
    moduleId: 'conciliacao-bancaria', resource: 'conciliacao-bancaria', title: 'Conciliacao bancaria',
    description: 'Transacoes do extrato comparadas com recebimentos e pagamentos do ERP.', primaryAction: 'Adicionar transacao',
    columns: [
      { key: 'data', label: 'Data', kind: 'date' }, { key: 'conta', label: 'Conta' }, { key: 'descricao', label: 'Descricao' },
      { key: 'tipo', label: 'Tipo', kind: 'status' }, { key: 'valor', label: 'Valor', kind: 'currency' },
      { key: 'contraparte', label: 'Contraparte' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    fields: [
      { key: 'conta_financeira_id', label: 'Conta financeira', type: 'select', optionSource: 'accounts', required: true },
      { key: 'data', label: 'Data', type: 'date', required: true },
      { key: 'tipo', label: 'Tipo', type: 'select', required: true, options: [{ value: 'credito', label: 'Credito' }, { value: 'debito', label: 'Debito' }] },
      { key: 'valor', label: 'Valor', type: 'number', required: true },
      { key: 'descricao', label: 'Descricao', type: 'text', required: true },
      { key: 'contraparte', label: 'Contraparte', type: 'text' },
    ],
    rowAction: {
      label: 'Conciliar', resource: 'conciliar-transacao', fields: [
        { key: 'pagamento_id', label: 'Recebimento ou pagamento', type: 'select', optionSource: 'payments', required: true },
      ],
    },
  },
  'transferencias-financeiras': {
    moduleId: 'transferencias-financeiras', resource: 'transferencias-financeiras', title: 'Transferencias financeiras',
    description: 'Transferencias realizadas entre caixas e contas bancarias.', primaryAction: 'Nova transferencia',
    columns: [
      { key: 'data', label: 'Data', kind: 'date' }, { key: 'origem', label: 'Origem' }, { key: 'destino', label: 'Destino' },
      { key: 'valor', label: 'Valor', kind: 'currency' }, { key: 'descricao', label: 'Descricao' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    fields: [
      { key: 'conta_origem_id', label: 'Conta de origem', type: 'select', optionSource: 'accounts', required: true },
      { key: 'conta_destino_id', label: 'Conta de destino', type: 'select', optionSource: 'accounts', required: true },
      { key: 'data', label: 'Data', type: 'date', required: true }, { key: 'valor', label: 'Valor', type: 'number', required: true },
      { key: 'descricao', label: 'Descricao', type: 'text' },
    ],
  },
  dre: {
    moduleId: 'dre', resource: 'dre', title: 'DRE gerencial',
    description: 'Receitas e despesas por competencia e categoria gerencial.',
    columns: [
      { key: 'competencia', label: 'Competencia', kind: 'date' }, { key: 'categoria', label: 'Categoria' },
      { key: 'tipo', label: 'Tipo', kind: 'status' }, { key: 'valor', label: 'Valor', kind: 'currency' },
    ],
  },
  'aging-receber': {
    moduleId: 'aging-receber', resource: 'aging-receber', title: 'Aging de recebimentos',
    description: 'Titulos a receber classificados por faixa de atraso.',
    columns: [
      { key: 'cliente', label: 'Cliente' }, { key: 'vencimento', label: 'Vencimento', kind: 'date' },
      { key: 'saldo', label: 'Saldo', kind: 'currency' }, { key: 'dias_atraso', label: 'Dias', kind: 'number' }, { key: 'status', label: 'Faixa', kind: 'status' },
    ],
  },
  'aging-pagar': {
    moduleId: 'aging-pagar', resource: 'aging-pagar', title: 'Aging de pagamentos',
    description: 'Titulos a pagar classificados por faixa de atraso.',
    columns: [
      { key: 'fornecedor', label: 'Fornecedor' }, { key: 'vencimento', label: 'Vencimento', kind: 'date' },
      { key: 'saldo', label: 'Saldo', kind: 'currency' }, { key: 'dias_atraso', label: 'Dias', kind: 'number' }, { key: 'status', label: 'Faixa', kind: 'status' },
    ],
  },
  'giro-estoque': {
    moduleId: 'giro-estoque', resource: 'giro-estoque', title: 'Giro de estoque',
    description: 'Saidas e giro dos ultimos 90 dias por produto e local.',
    columns: [
      { key: 'produto', label: 'Produto' }, { key: 'local', label: 'Local' },
      { key: 'quantidade_fisica', label: 'Saldo', kind: 'number' }, { key: 'saidas_90_dias', label: 'Saidas em 90 dias', kind: 'number' },
      { key: 'giro_90_dias', label: 'Giro', kind: 'number' },
    ],
  },
}
