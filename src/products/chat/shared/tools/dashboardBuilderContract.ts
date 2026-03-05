export const DASHBOARD_BUILDER_TOOL_DESCRIPTION =
  'Constrói dashboards JSONR de forma incremental e previsível. Fluxo recomendado: create_dashboard -> add_widgets_batch -> add_widget -> get_dashboard. Persistência automática em /vercel/sandbox/dashboard/<dashboard_name>.jsonr para create_dashboard/add_widget/add_widgets_batch; get_dashboard é somente leitura. Em create_dashboard: dashboard_name define nome técnico/chave/caminho do arquivo; title define o texto visível no Header.title (podem ser diferentes). Campos obrigatórios por ação: create_dashboard => dashboard_name,title; add_widget => dashboard_name,widget_id,widget_type,payload; add_widgets_batch => dashboard_name,widgets; get_dashboard => dashboard_name. Widgets com mesmo container ficam na mesma row (default: principal). Suporta modo stateful (sessão por chat_id+dashboard_name) e stateless (parser_state enviado no input, sempre reutilizando o mais recente). Prioridade de estado: parser_state > sessão. Tipos de widget: kpi, chart, filtro, insights. Formato numérico permitido: currency | percent | number. query-first é o padrão: payload.query em kpi/chart (kpi deve retornar coluna numérica AS value; chart exige xField e yField; keyField opcional). Em filtro, payload.tipo aceito: list | dropdown | multi. Se payload.tipo vier ausente, vazio ou inválido, o fallback padrão deve ser list. Não usar "date-range" em SlicerCard; para intervalo de datas usar Header.datePicker.mode="range". Importante: payload.query é apenas persistido no JSONR e executado no runtime do dashboard; dashboard_builder não executa SQL. Compatibilidade legada (tabela/medida/dimensao) existe como fallback.'

export const DASHBOARD_BUILDER_TOOL_PARAMETERS = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['create_dashboard', 'add_widget', 'add_widgets_batch', 'get_dashboard'],
      description:
        'Ação da tool: create_dashboard inicializa o dashboard (obrigatórios: dashboard_name,title; dashboard_name = nome técnico/arquivo, title = Header.title visível); add_widget adiciona/atualiza um widget (obrigatórios: dashboard_name,widget_id,widget_type,payload); add_widgets_batch aplica múltiplos widgets (obrigatórios: dashboard_name,widgets); get_dashboard retorna estado atual (obrigatório: dashboard_name; sem escrita).',
    },
    dashboard_name: {
      type: 'string',
      description:
        'Nome técnico do dashboard (chave de estado e nome do arquivo em /vercel/sandbox/dashboard/<dashboard_name>.jsonr). Use o mesmo dashboard_name em todas as chamadas do mesmo dashboard.',
    },
    title: {
      type: 'string',
      description: 'Título exibido no Header.title do dashboard (obrigatório em create_dashboard).',
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
        'Payload do widget conforme widget_type. Padrão query-first: kpi => {title,query,...} (query deve retornar coluna numérica AS value; não enviar xField/yField/keyField em kpi); chart => {chart_type,title,query,xField,yField,keyField?,layout?,...}; filtro => {title,campo,tabela,tipo?,chave?,...}; insights => {title,items,...}. Em filtro, tipo permitido: list|dropdown|multi; se tipo estiver ausente, vazio ou inválido, usar fallback list. Exemplo: tipo=\"list\" (válido), tipo=\"date-range\" (inválido em SlicerCard). Para filtro de período usar Header.datePicker.mode=\"range\". Em chart, layout aceito: auto|vertical|horizontal (auto recomendado). ordem aceita \"field:dir\" ou {field,dir}. Compatibilidade legada (tabela/medida/dimensao) é fallback. formato, quando informado, deve ser exatamente: currency | percent | number. Evite chaves fora do contrato suportado.',
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
        'Estado opcional para modo stateless. Quando informado, tem prioridade sobre sessão stateful (parser_state > sessão). Em modo stateless, reenviar sempre o parser_state mais recente retornado pela chamada anterior.',
    },
  },
  required: ['action', 'dashboard_name'],
  additionalProperties: true,
} as const
