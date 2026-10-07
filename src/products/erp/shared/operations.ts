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
    moduleId: 'posicao-estoque', resource: 'posicao-estoque', title: 'Situação do estoque',
    description: 'Saldo físico, reservas, disponibilidade, custo médio e necessidade de reposicao por local.',
    columns: [
      { key: 'produto', label: 'Produto' }, { key: 'sku', label: 'SKU' }, { key: 'local_estoque', label: 'Local' },
      { key: 'quantidade_fisica', label: 'Físico', kind: 'number' }, { key: 'quantidade_reservada', label: 'Reservado', kind: 'number' },
      { key: 'quantidade_disponivel', label: 'Disponível', kind: 'number' }, { key: 'custo_medio', label: 'Custo médio', kind: 'currency' },
      { key: 'valor_estoque', label: 'Valor', kind: 'currency' }, { key: 'situacao', label: 'Situação', kind: 'status' },
    ],
  },
  movimentacoes: {
    moduleId: 'movimentacoes', resource: 'movimentacoes', title: 'Movimentações de estoque',
    description: 'Razão imutavel de entradas, saídas, ajustes, transferências e estornos.', primaryAction: 'Novo ajuste',
    columns: [
      { key: 'data', label: 'Data', kind: 'date' }, { key: 'produto', label: 'Produto' }, { key: 'local', label: 'Local' },
      { key: 'tipo', label: 'Tipo', kind: 'status' }, { key: 'quantidade', label: 'Quantidade', kind: 'number' },
      { key: 'custo_unitario', label: 'Custo', kind: 'currency' }, { key: 'saldo_apos', label: 'Saldo após', kind: 'number' },
    ],
    fields: [
      { key: 'produto_id', label: 'Produto', type: 'select', optionSource: 'products', required: true },
      { key: 'local_estoque_id', label: 'Local', type: 'select', optionSource: 'locations', required: true },
      { key: 'tipo', label: 'Tipo', type: 'select', required: true, options: [
        { value: 'entrada', label: 'Entrada' }, { value: 'saida', label: 'Saída' },
        { value: 'ajuste_entrada', label: 'Ajuste de entrada' }, { value: 'ajuste_saida', label: 'Ajuste de saída' },
      ] },
      { key: 'quantidade', label: 'Quantidade', type: 'number', required: true },
        { key: 'custo_unitario', label: 'Custo unitário', type: 'number' },
        { key: 'unidade', label: 'Unidade informada (opcional)', type: 'text', placeholder: 'Vazio: unidade base do produto' },
        { key: 'motivo', label: 'Motivo do ajuste', type: 'text' },
    ],
  },
  'locais-estoque': {
    moduleId: 'locais-estoque', resource: 'locais-estoque', title: 'Locais de estoque',
    description: 'Depositos, lojas e outros pontos que mantem saldo físico.', primaryAction: 'Novo local',
    columns: [
      { key: 'nome', label: 'Local' }, { key: 'codigo', label: 'Código' }, { key: 'tipo', label: 'Tipo' },
      { key: 'permite_venda', label: 'Vendas' }, { key: 'permite_compra', label: 'Compras' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true }, { key: 'codigo', label: 'Código', type: 'text', required: true },
      { key: 'descricao', label: 'Descrição', type: 'text' },
      { key: 'padrao', label: 'Local padrão', type: 'select', options: [{ value: 'nao', label: 'Não' }, { value: 'sim', label: 'Sim' }] },
      { key: 'permite_venda', label: 'Usar em vendas', type: 'select', options: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }] },
      { key: 'permite_compra', label: 'Usar em compras', type: 'select', options: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }] },
    ],
  },
  inventarios: {
    moduleId: 'inventarios', resource: 'inventarios', title: 'Inventários',
    description: 'Contagens fisicas com ajuste rastreavel da diferenca encontrada.', primaryAction: 'Nova contagem',
    columns: [
      { key: 'numero', label: 'Número' }, { key: 'local', label: 'Local' }, { key: 'data', label: 'Data', kind: 'date' },
      { key: 'tipo', label: 'Tipo' }, { key: 'itens', label: 'Itens', kind: 'number' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    fields: [
      { key: 'numero', label: 'Número', type: 'text', placeholder: 'Gerado automaticamente se vazio' },
      { key: 'data', label: 'Data da contagem', type: 'date' },
      { key: 'local_estoque_id', label: 'Local', type: 'select', optionSource: 'locations', required: true },
      { key: 'produto_id', label: 'Produto', type: 'select', optionSource: 'products', required: true },
        { key: 'quantidade_contada', label: 'Quantidade contada', type: 'number', required: true },
        { key: 'motivo', label: 'Motivo da contagem', type: 'text', required: true },
    ],
  },
  transferencias: {
    moduleId: 'transferencias', resource: 'transferencias', title: 'Transferências de estoque',
    description: 'Movimente produtos entre locais sem alterar o saldo total da empresa.', primaryAction: 'Nova transferência',
    columns: [
      { key: 'numero', label: 'Número' }, { key: 'origem', label: 'Origem' }, { key: 'destino', label: 'Destino' },
      { key: 'data', label: 'Data', kind: 'date' }, { key: 'itens', label: 'Itens', kind: 'number' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    fields: [
      { key: 'numero', label: 'Número', type: 'text', placeholder: 'Gerado automaticamente se vazio' },
      { key: 'data', label: 'Data', type: 'date' },
      { key: 'local_origem_id', label: 'Local de origem', type: 'select', optionSource: 'locations', required: true },
      { key: 'local_destino_id', label: 'Local de destino', type: 'select', optionSource: 'locations', required: true },
      { key: 'produto_id', label: 'Produto', type: 'select', optionSource: 'products', required: true },
      { key: 'quantidade', label: 'Quantidade', type: 'number', required: true },
    ],
  },
  kits: {
    moduleId: 'kits', resource: 'kits', title: 'Kits de produtos',
    description: 'Defina componentes para que as reservas e saídas ocorram nos itens do kit.', primaryAction: 'Adicionar componente',
    columns: [
      { key: 'produto', label: 'Kit' }, { key: 'codigo', label: 'Código' },
      { key: 'componentes', label: 'Componentes', kind: 'number' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    fields: [
      { key: 'produto_id', label: 'Produto vendido como kit', type: 'select', optionSource: 'products', required: true },
      { key: 'produto_componente_id', label: 'Componente', type: 'select', optionSource: 'products', required: true },
      { key: 'quantidade', label: 'Quantidade no kit', type: 'number', required: true },
    ],
  },
  'conversoes-unidades': {
    moduleId: 'conversoes-unidades', resource: 'conversoes-unidades', title: 'Conversões de unidades',
    description: 'Converta caixas, fardos e outras unidades de compra para a unidade controlada no estoque.', primaryAction: 'Nova conversão',
    columns: [
      { key: 'produto', label: 'Produto' }, { key: 'unidade_origem', label: 'Unidade de origem' },
      { key: 'unidade_destino', label: 'Unidade de destino' }, { key: 'fator', label: 'Fator', kind: 'number' },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    fields: [
      { key: 'produto_id', label: 'Produto', type: 'select', optionSource: 'products', required: true },
      { key: 'unidade_origem', label: 'Unidade de origem', type: 'text', placeholder: 'CX', required: true },
      { key: 'unidade_destino', label: 'Unidade de estoque', type: 'text', placeholder: 'UN', required: true },
      { key: 'fator', label: 'Fator de conversão', type: 'number', required: true },
    ],
  },
  contratos: {
    moduleId: 'contratos', resource: 'contratos', title: 'Contratos e vendas recorrentes',
    description: 'Contratos ativos geram vendas em rascunho de forma idempotente na competência prevista.',
    primaryAction: 'Novo contrato', processAction: { label: 'Gerar vendas vencidas', endpoint: '/api/erp/contratos/processar' },
    columns: [
      { key: 'numero', label: 'Número' }, { key: 'cliente', label: 'Cliente' }, { key: 'descricao', label: 'Descrição' },
      { key: 'periodicidade', label: 'Periodicidade' }, { key: 'proxima_geracao_em', label: 'Próxima geração', kind: 'date' },
      { key: 'valor', label: 'Valor', kind: 'currency' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    fields: [
      { key: 'numero', label: 'Número', type: 'text', placeholder: 'Gerado automaticamente se vazio' },
      { key: 'cliente_id', label: 'Cliente', type: 'select', optionSource: 'customers', required: true },
      { key: 'descricao', label: 'Descrição', type: 'text', required: true },
      { key: 'produto_id', label: 'Produto', type: 'select', optionSource: 'products' },
      { key: 'servico_id', label: 'Serviço', type: 'select', optionSource: 'services' },
      { key: 'quantidade', label: 'Quantidade', type: 'number', required: true },
      { key: 'valor_unitario', label: 'Valor unitário', type: 'number', required: true },
      { key: 'data_inicio', label: 'Início', type: 'date', required: true },
      { key: 'data_fim', label: 'Fim', type: 'date' },
      { key: 'periodicidade', label: 'Periodicidade', type: 'select', required: true, options: [
        { value: 'mensal', label: 'Mensal' }, { value: 'trimestral', label: 'Trimestral' },
        { value: 'semestral', label: 'Semestral' }, { value: 'anual', label: 'Anual' },
      ] },
      { key: 'dia_vencimento', label: 'Dia de vencimento', type: 'number' },
    ],
  },
  'conciliacao-bancaria': {
    moduleId: 'conciliacao-bancaria', resource: 'conciliacao-bancaria', title: 'Conciliação bancária',
    description: 'Transacoes do extrato comparadas com recebimentos e pagamentos do ERP.', primaryAction: 'Adicionar transacao',
    columns: [
      { key: 'data', label: 'Data', kind: 'date' }, { key: 'conta', label: 'Conta' }, { key: 'descricao', label: 'Descrição' },
      { key: 'tipo', label: 'Tipo', kind: 'status' }, { key: 'valor', label: 'Valor', kind: 'currency' },
      { key: 'contraparte', label: 'Contraparte' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    fields: [
      { key: 'conta_financeira_id', label: 'Conta financeira', type: 'select', optionSource: 'accounts', required: true },
      { key: 'data', label: 'Data', type: 'date', required: true },
      { key: 'tipo', label: 'Tipo', type: 'select', required: true, options: [{ value: 'credito', label: 'Crédito' }, { value: 'debito', label: 'Débito' }] },
      { key: 'valor', label: 'Valor', type: 'number', required: true },
      { key: 'descricao', label: 'Descrição', type: 'text', required: true },
      { key: 'contraparte', label: 'Contraparte', type: 'text' },
    ],
    rowAction: {
      label: 'Conciliar', resource: 'conciliar-transacao', fields: [
        { key: 'pagamento_id', label: 'Recebimento ou pagamento', type: 'select', optionSource: 'payments', required: true },
      ],
    },
  },
  'transferencias-financeiras': {
    moduleId: 'transferencias-financeiras', resource: 'transferencias-financeiras', title: 'Transferências financeiras',
    description: 'Transferências realizadas entre caixas e contas bancárias.', primaryAction: 'Nova transferência',
    columns: [
      { key: 'data', label: 'Data', kind: 'date' }, { key: 'origem', label: 'Origem' }, { key: 'destino', label: 'Destino' },
      { key: 'valor', label: 'Valor', kind: 'currency' }, { key: 'descricao', label: 'Descrição' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    fields: [
      { key: 'conta_origem_id', label: 'Conta de origem', type: 'select', optionSource: 'accounts', required: true },
      { key: 'conta_destino_id', label: 'Conta de destino', type: 'select', optionSource: 'accounts', required: true },
      { key: 'data', label: 'Data', type: 'date', required: true }, { key: 'valor', label: 'Valor', type: 'number', required: true },
      { key: 'descricao', label: 'Descrição', type: 'text' },
    ],
  },
  'giro-estoque': {
    moduleId: 'giro-estoque', resource: 'giro-estoque', title: 'Saídas e estoque atual',
    description: 'Movimentos negativos dos últimos 90 dias divididos pelo saldo atual. Inclui vendas, transferências, ajustes e estornos de entradas.',
    columns: [
      { key: 'produto', label: 'Produto' }, { key: 'local', label: 'Local' },
      { key: 'quantidade_fisica', label: 'Saldo', kind: 'number' }, { key: 'saidas_90_dias', label: 'Saídas em 90 dias', kind: 'number' },
      { key: 'giro_90_dias', label: 'Saídas / saldo atual', kind: 'number' },
      { key: 'referencia', label: 'Base de cálculo' },
    ],
  },
}
