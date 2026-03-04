export const DASHBOARD_BUILDER_TOOL_DESCRIPTION =
  'Constrói dashboards JSONR de forma incremental e previsível. Fluxo recomendado: create_dashboard -> add_widgets_batch -> add_widget -> get_dashboard. Persistência automática em /vercel/sandbox/dashboard/<dashboard_name>.jsonr para create_dashboard/add_widget/add_widgets_batch; get_dashboard é somente leitura. Widgets com mesmo container ficam na mesma row (default: principal). Suporta modo stateful (sessão por chat_id+dashboard_name) e stateless (parser_state enviado no input, sempre reutilizando o mais recente). Tipos de widget: kpi, chart, filtro, insights. Formato numérico permitido: currency | percent | number. query-first é o padrão: payload.query em kpi/chart (chart exige xField e yField; keyField opcional). Importante: payload.query é apenas persistido no JSONR e executado no runtime do dashboard; dashboard_builder não executa SQL. Compatibilidade legada (tabela/medida/dimensao) existe como fallback.'

export const DASHBOARD_BUILDER_TOOL_PARAMETERS = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['create_dashboard', 'add_widget', 'add_widgets_batch', 'get_dashboard'],
      description:
        'Ação da tool: create_dashboard inicializa o dashboard; add_widget adiciona/atualiza um widget; add_widgets_batch aplica múltiplos widgets; get_dashboard retorna estado atual (sem escrita).',
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
        'Payload do widget conforme widget_type. Padrão query-first: kpi => {title,query,...}; chart => {chart_type,title,query,xField,yField,keyField?,layout?,...}; filtro => {title,campo,tabela,tipo?,chave?,...}; insights => {title,items,...}. Em chart, layout aceito: auto|vertical|horizontal (auto recomendado). ordem aceita "field:dir" ou {field,dir}. Compatibilidade legada (tabela/medida/dimensao) é fallback. formato, quando informado, deve ser exatamente: currency | percent | number.',
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
        'Estado opcional para modo stateless. Quando informado, tem prioridade sobre sessão stateful. Em modo stateless, reenviar sempre o parser_state mais recente retornado pela chamada anterior.',
    },
  },
  required: ['action', 'dashboard_name'],
  additionalProperties: true,
} as const
