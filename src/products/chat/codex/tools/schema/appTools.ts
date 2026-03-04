import {
  DASHBOARD_BUILDER_TOOL_DESCRIPTION,
  DASHBOARD_BUILDER_TOOL_PARAMETERS,
} from '@/products/chat/shared/tools/dashboardBuilderContract'

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
    name: 'drive',
    description:
      'Tool de Drive para listar/gerenciar arquivos e pastas, obter URL assinada, ler conteúdo e fazer upload. Também suporta batch (múltiplas operações em sequência). Prefira resource="drive/files/upload-base64" quando já tiver conteúdo em base64 (ex.: saída de documento); use prepare-upload/complete-upload para fluxos binários/externos.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['request', 'read_file', 'get_file_url', 'get_drive_file_url', 'batch'],
          description:
            'request: operações por resource Drive. read_file: leitura textual/binária por file_id. get_file_url/get_drive_file_url: URL assinada por file_id. batch: executa operations[] em sequência.',
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'DELETE'],
          description: 'Método HTTP para action=request.',
        },
        resource: {
          type: 'string',
          description:
            'Resource permitido para action=request: drive, drive/folders, drive/folders/{id}, drive/files/{id}, drive/files/{id}/download, drive/files/prepare-upload, drive/files/complete-upload, drive/files/upload-base64.',
        },
        params: {
          type: 'object',
          additionalProperties: true,
          description: 'Query params para action=request.',
        },
        data: {
          type: 'object',
          additionalProperties: true,
          description:
            'Body para action=request quando method for POST/DELETE. Em uploads, o backend também aceita campos top-level e normaliza para data.',
        },
        file_id: {
          type: 'string',
          description: 'UUID do arquivo no Drive para action=read_file e action=get_file_url.',
        },
        workspace_id: {
          type: 'string',
          description: 'Workspace do Drive. Pode ser enviado top-level (backend normaliza para data/params).',
        },
        folder_id: {
          type: 'string',
          description: 'Pasta destino no Drive (opcional). Pode ser enviado top-level.',
        },
        file_name: {
          type: 'string',
          description: 'Nome do arquivo (ex.: em drive/files/upload-base64). Pode ser enviado top-level.',
        },
        mime: {
          type: 'string',
          description: 'MIME type do arquivo (ex.: application/pdf) para uploads.',
        },
        content_base64: {
          type: 'string',
          description: 'Conteúdo base64 para upload direto via resource=drive/files/upload-base64.',
        },
        storage_path: {
          type: 'string',
          description: 'Caminho no storage em fluxos avançados de upload/complete-upload.',
        },
        mode: {
          type: 'string',
          enum: ['auto', 'text', 'binary'],
          description: 'Modo de leitura em action=read_file.',
        },
        operations: {
          type: 'array',
          items: { type: 'object', additionalProperties: true },
          description: 'Lista de operações para action=batch. Cada item usa o mesmo contrato de drive (ex.: { action:\"request\", method:\"GET\", resource:\"drive\" }).',
        },
        continue_on_error: {
          type: 'boolean',
          description: 'Para action=batch: se true (default), continua executando próximas operações mesmo após erro.',
        },
      },
      required: ['action'],
      additionalProperties: true,
    },
  },
  {
    type: 'function',
    name: 'email',
    description:
      'Tool de Email para consultar inbox/messages e enviar emails. Também suporta batch (múltiplos envios/requests em sequência). Prefira anexar por drive_file_id/drive_file_ids (backend resolve URL assinada); use URL/base64 (attachments/attachment_url) como fallback. Em email/messages, filtros como subject/q/has_attachments ajudam a localizar mensagens.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['request', 'send', 'send_email', 'batch'],
          description: 'request: operações por resource de email. send/send_email: envia email. batch: executa operations[] em sequência.',
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'DELETE'],
          description: 'Método HTTP para action=request.',
        },
        resource: {
          type: 'string',
          description:
            'Resource permitido para action=request: email/inboxes, email/messages, email/messages/{id}, email/messages/{id}/attachments/{attachmentId}.',
        },
        params: {
          type: 'object',
          additionalProperties: true,
          description: 'Query params para action=request. Em email/messages, use inbox_id/inboxId e filtros como subject, q/search, has_attachments, unread, date_from/date_to, label/labels_any.',
        },
        data: {
          type: 'object',
          additionalProperties: true,
          description:
            'Body para action=request quando method for POST/DELETE. Em email/messages, inbox_id/inboxId também pode ser enviado top-level (backend normaliza).',
        },
        inbox_id: {
          type: 'string',
          description: 'Inbox para action=send.',
        },
        inboxId: {
          type: 'string',
          description: 'Alias de inbox_id (compatibilidade).',
        },
        to: {
          oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
          description: 'Destinatários para action=send (string ou array).',
        },
        cc: {
          oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
          description: 'CC opcional para action=send (string ou array).',
        },
        bcc: {
          oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
          description: 'BCC opcional para action=send (string ou array).',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Labels opcionais para action=send.',
        },
        subject: {
          type: 'string',
          description: 'Assunto para action=send.',
        },
        text: {
          type: 'string',
          description: 'Corpo texto para action=send.',
        },
        html: {
          type: 'string',
          description: 'Corpo HTML para action=send.',
        },
        attachments: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: true,
            properties: {
              filename: { type: 'string' },
              contentType: { type: 'string' },
              contentDisposition: { type: 'string' },
              contentId: { type: 'string' },
              content: { type: 'string' },
              url: { type: 'string' },
            },
          },
          description:
            'Lista de anexos para action=send. Cada item pode ter url ou content (base64), além de filename/contentType. Use quando não for usar drive_file_id(s).',
        },
        drive_file_id: {
          type: 'string',
          description: 'ID de arquivo no Drive para anexo automático (backend resolve signed_url).',
        },
        drive_file_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista de IDs de arquivos no Drive para anexos automáticos.',
        },
        attachment_url: {
          type: 'string',
          description: 'Atalho para 1 anexo por URL em action=send.',
        },
        signed_url: {
          type: 'string',
          description: 'Alias de attachment_url para action=send.',
        },
        filename: {
          type: 'string',
          description: 'Nome do arquivo para attachment_url em action=send.',
        },
        content_type: {
          type: 'string',
          description: 'MIME type para attachment_url em action=send.',
        },
        operations: {
          type: 'array',
          items: { type: 'object', additionalProperties: true },
          description: 'Lista de operações para action=batch (request/send/send_email).',
        },
        continue_on_error: {
          type: 'boolean',
          description: 'Para action=batch: se true (default), continua executando próximas operações mesmo após erro.',
        },
      },
      required: ['action'],
      additionalProperties: true,
    },
  },
  {
    type: 'function',
    name: 'documento',
    description:
      'Gera e consulta documentos operacionais (OS/proposta/NFSe/fatura/contrato), retornando PDF. Com save_to_drive=true, salva no Drive (workspace_id obrigatório na prática) e retorna metadados/drive_file_id; por padrão o payload fica enxuto (sem attachment.content/base64) quando salvo no Drive. Use include_attachment_content=true somente se precisar do PDF inline/base64.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['gerar', 'status'],
          description: 'gerar: cria documento. status: consulta documento existente.',
        },
        tipo: {
          type: 'string',
          enum: ['proposta', 'os', 'fatura', 'contrato', 'nfse'],
          description: 'Obrigatório em action=gerar.',
        },
        origem_tipo: {
          type: 'string',
          description: 'Origem do documento (ex.: ordem_servico, oportunidade). Obrigatório em action=gerar.',
        },
        origem_id: {
          type: 'integer',
          description: 'ID numérico da origem. Obrigatório em action=gerar.',
        },
        titulo: {
          type: 'string',
          description: 'Título opcional do documento.',
        },
        dados: {
          type: 'object',
          additionalProperties: true,
          description: 'Payload JSON com os dados variáveis/operacionais do documento. Obrigatório em action=gerar.',
        },
        save_to_drive: {
          type: 'boolean',
          description: 'Se true, salva no Drive e retorna metadados do arquivo. Recomendado para fluxo documento -> drive -> email.',
        },
        workspace_id: {
          type: 'string',
          description: 'Atalho para drive.workspace_id. Obrigatório na prática quando save_to_drive=true.',
        },
        folder_id: {
          type: 'string',
          description: 'Atalho para drive.folder_id (opcional).',
        },
        file_name: {
          type: 'string',
          description: 'Atalho para drive.file_name (opcional).',
        },
        drive: {
          type: 'object',
          additionalProperties: true,
          properties: {
            workspace_id: { type: 'string' },
            folder_id: { type: 'string' },
            file_name: { type: 'string' },
          },
          description:
            'Configuração opcional de destino no Drive quando save_to_drive=true (workspace obrigatório na prática para salvar).',
        },
        include_attachment_content: {
          type: 'boolean',
          description: 'Se true, inclui attachment.content (base64) no retorno. Com save_to_drive=true, o padrão recomendado é false/payload enxuto.',
        },
        template_id: {
          type: 'integer',
          description: 'Template explícito opcional para geração.',
        },
        template_version_id: {
          type: 'integer',
          description: 'Versão explícita opcional para geração.',
        },
        idempotency_key: {
          type: 'string',
          description: 'Chave opcional para evitar geração duplicada.',
        },
        documento_id: {
          type: 'integer',
          description: 'Obrigatório em action=status.',
        },
      },
      required: ['action'],
      additionalProperties: true,
    },
  },
  {
    type: 'function',
    name: 'dashboard_builder',
    description: DASHBOARD_BUILDER_TOOL_DESCRIPTION,
    parameters: DASHBOARD_BUILDER_TOOL_PARAMETERS,
  },
  {
    type: 'function',
    name: 'sql_execution',
    description:
      'Executa SQL SELECT/CTE com segurança e retorna linhas tabulares para renderização em Artifact Data Table. Input mínimo: sql. Suporta {{tenant_id}} para bind automático pelo tenant atual.',
    parameters: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description: 'Query SQL obrigatória. Permitido apenas SELECT/CTE (WITH).',
        },
        title: {
          type: 'string',
          description: 'Título opcional para o card/tabela no Artifact.',
        },
      },
      required: ['sql'],
      additionalProperties: true,
    },
  },
] as const
