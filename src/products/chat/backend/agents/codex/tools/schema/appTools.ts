import {
  ARTIFACT_PATCH_TOOL_DESCRIPTION,
  ARTIFACT_PATCH_TOOL_PARAMETERS,
  ARTIFACT_READ_TOOL_DESCRIPTION,
  ARTIFACT_READ_TOOL_PARAMETERS,
  ARTIFACT_WRITE_TOOL_DESCRIPTION,
  ARTIFACT_WRITE_TOOL_PARAMETERS,
} from '@/products/chat/shared/tools/artifactToolsContract'

export const codexAppFunctionTools = [
  {
    type: 'function',
    name: 'crud',
    description:
      'Tool ERP canônica para listar/criar/atualizar/deletar/aprovar/concluir/cancelar/reabrir/baixar/estornar recursos de negócio. Use somente resource canônico (com hífen, nunca underscore). Resources suportados: financeiro/contas-financeiras, financeiro/categorias-despesa, financeiro/categorias-receita, financeiro/clientes, financeiro/centros-custo, financeiro/centros-lucro, vendas/pedidos, compras/pedidos, contas-a-pagar, contas-a-receber, crm/contas, crm/contatos, crm/leads, crm/oportunidades, crm/atividades, estoque/almoxarifados, estoque/movimentacoes, estoque/estoque-atual, estoque/tipos-movimentacao. Matriz prática: vendas/pedidos -> aprovar|concluir|cancelar|reabrir; compras/pedidos -> aprovar|cancelar|reabrir|marcar_como_recebido|marcar_recebimento_parcial; contas-a-pagar/contas-a-receber -> baixar|estornar|cancelar|reabrir. Em recursos transacionais, prefira ações de negócio em vez de deletar. Para consultas, prefira action="listar" com filtros em params.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['listar', 'criar', 'atualizar', 'deletar', 'aprovar', 'concluir', 'cancelar', 'reabrir', 'baixar', 'estornar', 'marcar_como_recebido', 'marcar_recebimento_parcial'],
          description: 'Operação principal. Use ações de negócio por recurso (ex.: vendas/pedidos: aprovar/concluir/cancelar/reabrir; compras/pedidos: aprovar/cancelar/reabrir/marcar_como_recebido/marcar_recebimento_parcial; contas-*: baixar/estornar/cancelar/reabrir).',
        },
        resource: {
          type: 'string',
          description: 'Resource ERP canônico exato (use um dos resources listados na descrição da tool).',
        },
        params: {
          type: 'object',
          additionalProperties: true,
          description: 'Filtros/parâmetros de consulta (normalmente com action="listar").',
        },
        data: {
          type: 'object',
          additionalProperties: true,
          description: 'Payload para criar/atualizar/deletar e ações de negócio (aprovar/concluir/cancelar/reabrir/baixar/estornar etc.) quando necessário.',
        },
        actionSuffix: {
          type: 'string',
          description:
            'Sufixo de rota opcional. Padrões: listar|criar|atualizar|deletar|aprovar|concluir|cancelar|reabrir|baixar|estornar|marcar_como_recebido|marcar_recebimento_parcial. Só use customizado se tiver certeza do endpoint.',
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST'],
          description: 'Método HTTP opcional para bridge de rota.',
        },
      },
      required: ['action', 'resource'],
      additionalProperties: true,
    },
  },
  {
    type: 'function',
    name: 'artifact_read',
    description: ARTIFACT_READ_TOOL_DESCRIPTION,
    parameters: ARTIFACT_READ_TOOL_PARAMETERS,
  },
  {
    type: 'function',
    name: 'artifact_write',
    description: ARTIFACT_WRITE_TOOL_DESCRIPTION,
    parameters: ARTIFACT_WRITE_TOOL_PARAMETERS,
  },
  {
    type: 'function',
    name: 'artifact_patch',
    description: ARTIFACT_PATCH_TOOL_DESCRIPTION,
    parameters: ARTIFACT_PATCH_TOOL_PARAMETERS,
  },
  {
    type: 'function',
    name: 'sql_execution',
    description:
      'Executa SQL de leitura com segurança e retorna tabela para Artifact Data Table. Também pode configurar 1 gráfico de barras no mesmo artifact via chart={xField,valueField}. Aceita apenas SELECT/CTE (WITH), uma única instrução e sem placeholders posicionais ($1, $2, ...). Placeholder suportado nesta tool: somente {{tenant_id}} (bind automático do tenant atual). Placeholders como {{de}}/{{ate}} não são suportados aqui. Limite interno: 1000 linhas por execução.',
    parameters: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description:
            'SQL obrigatório. Regras: SELECT/CTE (WITH) apenas, sem múltiplas instruções e sem placeholders posicionais. Placeholder suportado: {{tenant_id}}. Para filtros de data/status nesta tool, use valores literais no SQL.',
        },
        title: {
          type: 'string',
          description: 'Título opcional do artifact (recomendado em consultas analíticas).',
        },
        chart: {
          type: 'object',
          description:
            'Configuração opcional de gráfico de barras no artifact. Use nomes de colunas retornadas pela própria query.',
          properties: {
            xField: {
              type: 'string',
              description: 'Coluna para eixo X (categoria). Ex.: label, mes, canal.',
            },
            valueField: {
              type: 'string',
              description: 'Coluna numérica para eixo Y (métrica). Ex.: value, total, pedidos.',
            },
            xLabel: {
              type: 'string',
              description: 'Legenda opcional do eixo X.',
            },
            yLabel: {
              type: 'string',
              description: 'Legenda opcional do eixo Y.',
            },
          },
          required: ['xField', 'valueField'],
          additionalProperties: false,
        },
      },
      required: ['sql'],
      additionalProperties: true,
    },
  },
  {
    type: 'function',
    name: 'ecommerce',
    description:
      'Tool analítica canônica de ecommerce por actions fixas (sem SQL livre). Quando usar: KPIs e cortes padrão de operação/comercial (resumo, canal, status, mês, produto e frete). Quando não usar: perguntas customizadas, joins ad-hoc ou métricas fora das actions disponíveis (nesses casos use sql_execution). Entrada: action obrigatória + params opcionais. Datas no formato YYYY-MM-DD. tenant_id é aplicado automaticamente no backend. Saída padronizada para UI: rows, columns, count, chart, sql_query e sql_params.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'kpis_resumo',
            'vendas_por_canal',
            'pedidos_por_status',
            'faturamento_por_mes',
            'top_produtos_receita',
            'frete_por_transportadora',
          ],
          description:
            'Ação analítica de ecommerce. Mapa: kpis_resumo (pedidos/receita/ticket/clientes), vendas_por_canal, pedidos_por_status, faturamento_por_mes, top_produtos_receita, frete_por_transportadora.',
        },
        params: {
          type: 'object',
          additionalProperties: false,
          properties: {
            de: { type: 'string', description: 'Data inicial (YYYY-MM-DD).' },
            ate: { type: 'string', description: 'Data final (YYYY-MM-DD).' },
            plataforma: { type: 'string', description: 'Filtro por plataforma (ex.: shopify).' },
            canal_conta_id: { type: 'string', description: 'Filtro por canal/conta de venda.' },
            loja_id: { type: 'string', description: 'Filtro por loja.' },
            status: { type: 'string', description: 'Filtro por status do pedido.' },
            status_pagamento: { type: 'string', description: 'Filtro por status de pagamento.' },
            status_fulfillment: { type: 'string', description: 'Filtro por status de fulfillment/logística.' },
            limit: { type: 'integer', description: 'Limite de linhas para rankings/séries (máximo 200).' },
          },
          description:
            'Filtros opcionais da action. Use somente campos listados. Os filtros são opcionais e cumulativos.',
        },
      },
      required: ['action'],
      additionalProperties: true,
    },
  },
  {
    type: 'function',
    name: 'marketing',
    description:
      'Tool analítica canônica de marketing/tráfego pago por actions fixas (sem SQL livre). Quando usar: KPIs e cortes padrão de mídia (resumo, série diária, campanha, conta e anúncios). Quando não usar: análises customizadas fora dessas actions (nesses casos use sql_execution). Entrada: action obrigatória + params opcionais. Datas no formato YYYY-MM-DD. tenant_id é aplicado automaticamente no backend. Saída padronizada para UI: rows, columns, count, chart, sql_query e sql_params.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'kpis_resumo',
            'desempenho_diario',
            'gasto_por_campanha',
            'roas_por_campanha',
            'gasto_por_conta',
            'top_anuncios',
          ],
          description:
            'Ação analítica de marketing. Mapa: kpis_resumo, desempenho_diario, gasto_por_campanha, roas_por_campanha, gasto_por_conta e top_anuncios.',
        },
        params: {
          type: 'object',
          additionalProperties: false,
          properties: {
            de: { type: 'string', description: 'Data inicial (YYYY-MM-DD).' },
            ate: { type: 'string', description: 'Data final (YYYY-MM-DD).' },
            plataforma: { type: 'string', description: 'Filtro por plataforma (ex.: meta_ads, google_ads).' },
            nivel: { type: 'string', description: 'Filtro por nível analítico do dado.' },
            conta_id: { type: 'string', description: 'Filtro por conta de mídia.' },
            campanha_id: { type: 'string', description: 'Filtro por campanha.' },
            grupo_id: { type: 'string', description: 'Filtro por grupo/conjunto.' },
            anuncio_id: { type: 'string', description: 'Filtro por anúncio.' },
            limit: { type: 'integer', description: 'Limite de linhas para rankings/séries (máximo 200).' },
          },
          description:
            'Filtros opcionais da action. Use somente campos listados. Os filtros são opcionais e cumulativos.',
        },
      },
      required: ['action'],
      additionalProperties: true,
    },
  },
] as const
