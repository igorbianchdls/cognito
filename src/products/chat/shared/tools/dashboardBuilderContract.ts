export const DASHBOARD_BUILDER_TOOL_DESCRIPTION =
  'Constrói dashboards JSONR de forma incremental e previsível, reduzindo erros de estrutura versus escrever o arquivo inteiro manualmente. Fluxo recomendado: (1) create_dashboard para iniciar Theme+Header e estado; (2) add_widgets_batch para montar blocos iniciais; (3) add_widget para ajustes pontuais/substituições; (4) get_dashboard para retornar árvore final + parser_state para inspeção. Persistência automática: create_dashboard, add_widget e add_widgets_batch salvam o arquivo em /vercel/sandbox/dashboard/<dashboard_name>.jsonr e retornam file_path (com file_persisted=true quando houve escrita). get_dashboard é leitura do estado atual (sem escrita). Regras: widgets com mesmo container ficam na mesma row; se container não for informado, usa "principal". Estado pode ser stateful (backend mantém por chat_id + dashboard_name) ou stateless (enviando parser_state). Em modo stateless, reenviar sempre o parser_state mais recente retornado pela chamada anterior. Tipos suportados: kpi, chart, filtro, insights. Regra de formato numérico: use sempre formato em enum (currency|percent|number); não usar códigos de moeda em formato (ex.: BRL). Layout de BarChart: padrão automático (temporal->vertical, categórico->horizontal); envie layout apenas para override manual. Contrato query-first: kpi/chart aceitam SQL puro em payload.query (chart exige xField e yField; keyField opcional). Importante: payload.query é persistido no JSONR e executado no runtime do dashboard (não é executado pela tool dashboard_builder). Compatibilidade legada continua disponível com payload.tabela/payload.medida/payload.dimensao.'

export const DASHBOARD_BUILDER_TOOL_PARAMETERS = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['create_dashboard', 'add_widget', 'add_widgets_batch', 'get_dashboard'],
      description:
        'Operação do parser. create_dashboard inicializa e persiste arquivo; add_widget adiciona/atualiza um widget e persiste arquivo; add_widgets_batch processa vários widgets e persiste arquivo; get_dashboard retorna estado atual sem escrita.',
    },
    dashboard_name: {
      type: 'string',
      description:
        'Nome técnico do dashboard (chave de estado). Use o mesmo dashboard_name em todas as chamadas do mesmo dashboard.',
    },
    title: {
      type: 'string',
      description: 'Título do dashboard (obrigatório em create_dashboard).',
    },
    subtitle: {
      type: 'string',
      description: 'Subtítulo opcional (create_dashboard).',
    },
    theme: {
      type: 'string',
      description: 'Tema opcional (ex.: light).',
    },
    widget_id: {
      type: 'string',
      description:
        'ID estável do widget (add_widget). Se já existir, o widget é atualizado/reposicionado em vez de duplicado.',
    },
    widget_type: {
      type: 'string',
      enum: ['kpi', 'chart', 'filtro', 'insights'],
      description: 'Tipo do widget em add_widget: kpi, chart, filtro ou insights.',
    },
    container: {
      type: 'string',
      description:
        'Container/row de destino (opcional; default: principal). Widgets com mesmo container ficam na mesma row.',
    },
    payload: {
      type: 'object',
      additionalProperties: true,
      description:
        'Payload do widget conforme widget_type. query-first (recomendado): kpi {title,query,fr?,formato?,filtros?,yField?,xField?,keyField?}; chart {chart_type,title,query,xField,yField,keyField?,layout?(auto|vertical|horizontal),fr?,formato?,filtros?,limit?,ordem?,height?}. Compatibilidade legada: kpi {title,tabela,medida,...}; chart {chart_type,title,tabela,dimensao,medida,dimension_expr?|dimensionExpr?,...}. Em chart, ordem aceita "field:dir" (ex.: "measure:desc") ou {field,dir}. layout é focado em BarChart: quando omitido/auto, a tool decide automaticamente (temporal->vertical, categórico->horizontal). filtro: {title,campo,tabela,tipo?,chave?,fr?}, onde chave é opcional (se omitida deriva de campo resolvido). Em filtro, prefira campo de filtro real (ex.: vendedor_id); aliases como vendedor/cliente/canal_venda são normalizados para *_id quando aplicável. insights: {title,items,fr?}. formato (quando presente) deve ser exatamente: "currency" | "percent" | "number".',
    },
    widgets: {
      type: 'array',
      items: { type: 'object', additionalProperties: true },
      description:
        'Lista de widgets para add_widgets_batch. Cada item segue o contrato de add_widget: {widget_id,widget_type,container?,payload}.',
    },
    parser_state: {
      type: 'object',
      additionalProperties: true,
      description:
        'Estado opcional do parser para execução stateless. Quando informado, tem prioridade sobre a sessão stateful do backend. Em modo stateless, use sempre o parser_state mais recente retornado pela chamada imediatamente anterior.',
    },
  },
  required: ['action', 'dashboard_name'],
  additionalProperties: true,
} as const
