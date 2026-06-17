import { interpolate, useCurrentFrame } from 'remotion'

import type { AnalysisStructuredContent, DataResultStructuredContent } from '@/products/plugin/web/src/types/toolResult'
import { AnimatedMcpAnalysisView } from '@/assets/remotion/components/AnimatedMcpAnalysisView'
import { AnimatedMcpTableView } from '@/assets/remotion/components/AnimatedMcpTableView'
import {
  ChatGptActionRow,
  ChatGptFlowAssistantText,
  ChatGptFlowUserBubble,
  ChatGptMobileShell,
  ChatGptToolResultCard,
  chatGptSequenceStyle,
} from '@/assets/remotion/compositions/ChatGptMobileBase'

const chatGptReconciliationBankStatementData = {
  ok: true,
  tool: 'bank_statement',
  view: 'table',
  title: 'Extrato bancario',
  resource: 'extrato-bancario',
  count: 4,
  columns: ['Data', 'Historico', 'Documento', 'Valor', 'Saldo'],
  rows: [
    { Data: '03 jun', Historico: 'PIX Cliente Norte', Documento: 'E2E90318471', Valor: '+R$ 42.100', Saldo: 'R$ 184.920' },
    { Data: '03 jun', Historico: 'Cartao Stone', Documento: 'LOTE-552', Valor: '+R$ 68.900', Saldo: 'R$ 176.480' },
    { Data: '04 jun', Historico: 'Pagamento Frete Sul', Documento: 'TED-774012', Valor: '-R$ 8.420', Saldo: 'R$ 151.900' },
    { Data: '04 jun', Historico: 'Tarifa bancaria', Documento: 'TAR-0421', Valor: '-R$ 189', Saldo: 'R$ 149.870' },
  ],
} satisfies DataResultStructuredContent

const chatGptReconciliationErpData = {
  ok: true,
  tool: 'erp',
  view: 'table',
  title: 'Lancamentos do ERP',
  resource: 'financeiro/lancamentos',
  count: 4,
  columns: ['Titulo', 'Cliente/fornecedor', 'Vencimento', 'Valor', 'Status'],
  rows: [
    { Titulo: 'NF-9031', 'Cliente/fornecedor': 'Cliente Norte', Vencimento: '03 jun', Valor: 'R$ 42.100', Status: 'Aberto' },
    { Titulo: 'Lote-552', 'Cliente/fornecedor': 'Stone', Vencimento: '03 jun', Valor: 'R$ 68.900', Status: 'Aberto' },
    { Titulo: 'CTR-210', 'Cliente/fornecedor': 'Frete Sul', Vencimento: '04 jun', Valor: 'R$ 8.420', Status: 'Divergente' },
    { Titulo: 'Regra pendente', 'Cliente/fornecedor': 'Banco', Vencimento: '04 jun', Valor: 'R$ 189', Status: 'Sem regra' },
  ],
} satisfies DataResultStructuredContent

const chatGptReconciliationSummaryData = {
  ok: true,
  tool: 'analysis',
  view: 'analysis',
  type: 'reconciliation_summary',
  title: 'Resumo da conciliacao',
  subtitle: 'Antes de executar',
  summary: 'Comparei o extrato bancario com os lancamentos do ERP. Ha 14 movimentos com alta confianca, 3 divergencias para revisar e 1 tarifa sem lancamento correspondente.',
  metrics: [
    { label: 'Prontos', value: '14', tone: 'positive' },
    { label: 'Revisar', value: '3', tone: 'warning' },
    { label: 'Sem ERP', value: '1', tone: 'neutral' },
  ],
  next_steps: ['Conciliar 14 matches com alta confianca', 'Manter divergencias pendentes', 'Sugerir regra para tarifa bancaria'],
} satisfies AnalysisStructuredContent

const chatGptReconciliationResultData = {
  ok: true,
  tool: 'erp_acoes',
  view: 'table',
  title: 'Conciliacao executada',
  resource: 'financeiro/conciliacao',
  count: 4,
  columns: ['Movimento', 'ERP encontrado', 'Acao', 'Status'],
  rows: [
    { Movimento: 'PIX Cliente Norte', 'ERP encontrado': 'NF-9031 99%', Acao: 'Baixar titulo', Status: 'Conciliado' },
    { Movimento: 'Cartao Stone', 'ERP encontrado': 'Lote-552 98%', Acao: 'Marcar recebido', Status: 'Conciliado' },
    { Movimento: 'Pagamento Frete Sul', 'ERP encontrado': 'CTR-210 72%', Acao: 'Aguardar ajuste', Status: 'Pendente' },
    { Movimento: 'Tarifa bancaria', 'ERP encontrado': 'Sem lancamento', Acao: 'Sugerir despesa', Status: 'Pendente' },
  ],
} satisfies DataResultStructuredContent

const chatGptPayablePendingData = {
  ok: true,
  tool: 'erp',
  view: 'table',
  title: 'Despesas a lancar',
  resource: 'financeiro/pendencias',
  count: 3,
  columns: ['Origem', 'Descricao', 'Valor', 'Acao'],
  rows: [
    { Origem: 'Extrato', Descricao: 'Frete Sul', Valor: 'R$ 8.420', Acao: 'Criar conta a pagar' },
    { Origem: 'Email', Descricao: 'AWS Brasil', Valor: 'R$ 12.790', Acao: 'Validar nota' },
    { Origem: 'Cartao', Descricao: 'Google Ads BR', Valor: 'R$ 18.400', Acao: 'Classificar despesa' },
  ],
} satisfies DataResultStructuredContent

const chatGptPayableDraftData = {
  ok: true,
  tool: 'analysis',
  view: 'analysis',
  type: 'erp_action_preview',
  title: 'Conta a pagar preparada',
  subtitle: 'Aguardando confirmacao',
  summary: 'Fornecedor Frete Sul localizado. Categoria Frete e Logistica, centro Operacoes e conta Banco Stone. Posso criar a conta a pagar de R$ 8.420?',
  metrics: [
    { label: 'Valor', value: 'R$ 8.420', tone: 'neutral' },
    { label: 'Vencimento', value: '12 jun', tone: 'neutral' },
    { label: 'Match', value: '99%', tone: 'positive' },
  ],
  next_steps: ['Criar conta a pagar no ERP', 'Status aberto', 'Origem ChatGPT'],
} satisfies AnalysisStructuredContent

const chatGptPayableResultData = {
  ok: true,
  tool: 'erp_acoes',
  view: 'table',
  title: 'Conta a pagar criada',
  resource: 'contas-a-pagar',
  count: 1,
  columns: ['ID', 'Fornecedor', 'Valor', 'Vencimento', 'Status'],
  rows: [
    { ID: 'CP-1048', Fornecedor: 'Frete Sul Logistica', Valor: 'R$ 8.420', Vencimento: '12 jun', Status: 'Aberta' },
  ],
} satisfies DataResultStructuredContent

const chatGptCollectionOverdueData = {
  ok: true,
  tool: 'erp',
  view: 'table',
  title: 'Contas em atraso',
  resource: 'contas-a-receber',
  count: 3,
  columns: ['Cliente', 'Documento', 'Valor', 'Atraso'],
  rows: [
    { Cliente: 'Cliente Norte Ltda', Documento: 'NF-2041', Valor: 'R$ 12.400', Atraso: '7 dias' },
    { Cliente: 'Mercado Alfa', Documento: 'NF-2038', Valor: 'R$ 8.900', Atraso: '4 dias' },
    { Cliente: 'Delta Foods', Documento: 'NF-2029', Valor: 'R$ 6.180', Atraso: '2 dias' },
  ],
} satisfies DataResultStructuredContent

const chatGptCollectionDraftData = {
  ok: true,
  tool: 'analysis',
  view: 'analysis',
  type: 'collection_preview',
  title: 'Cobranca sugerida',
  subtitle: 'Aguardando confirmacao',
  summary: 'Sugiro cobrar a NF-2041 do Cliente Norte com PIX + boleto, mensagem amigavel e envio por WhatsApp e email para o financeiro.',
  metrics: [
    { label: 'Valor', value: 'R$ 12.400', tone: 'neutral' },
    { label: 'Atraso', value: '7 dias', tone: 'warning' },
    { label: 'Forma', value: 'PIX + boleto', tone: 'positive' },
  ],
  next_steps: ['Gerar PIX e boleto', 'Enviar WhatsApp', 'Enviar email de cobranca'],
} satisfies AnalysisStructuredContent

const chatGptCollectionResultData = {
  ok: true,
  tool: 'erp_acoes',
  view: 'table',
  title: 'Cobranca realizada',
  resource: 'contas-a-receber',
  count: 4,
  columns: ['Etapa', 'Canal', 'Referencia', 'Status'],
  rows: [
    { Etapa: 'PIX', Canal: 'ERP', Referencia: 'CR-2041', Status: 'Gerado' },
    { Etapa: 'Boleto', Canal: 'ERP', Referencia: 'BOL-2041', Status: 'Gerado' },
    { Etapa: 'Mensagem', Canal: 'WhatsApp', Referencia: '+55 81 98461-0519', Status: 'Enviada' },
    { Etapa: 'Email', Canal: 'Email', Referencia: 'financeiro@norte.com', Status: 'Enviado' },
  ],
} satisfies DataResultStructuredContent

const chatGptExpenseRawData = {
  ok: true,
  tool: 'erp',
  view: 'table',
  title: 'Despesas encontradas',
  resource: 'financeiro/despesas',
  count: 4,
  columns: ['Descricao', 'Data', 'Valor', 'Origem'],
  rows: [
    { Descricao: 'Google Ads BR', Data: '03 jun', Valor: 'R$ 18.400', Origem: 'Cartao' },
    { Descricao: 'AWS Brasil', Data: '04 jun', Valor: 'R$ 12.790', Origem: 'Boleto' },
    { Descricao: 'Tarifa bancaria', Data: '04 jun', Valor: 'R$ 189', Origem: 'Extrato' },
    { Descricao: 'Frete Sul', Data: '05 jun', Valor: 'R$ 8.420', Origem: 'TED' },
  ],
} satisfies DataResultStructuredContent

const chatGptExpenseDraftData = {
  ok: true,
  tool: 'analysis',
  view: 'analysis',
  type: 'expense_classification_preview',
  title: 'Classificacao sugerida',
  subtitle: 'Aguardando confirmacao',
  summary: 'Encontrei 4 despesas. Posso aplicar automaticamente as 3 classificacoes acima de 90% e deixar Frete Sul pendente para revisao?',
  metrics: [
    { label: 'Aplicar', value: '3', tone: 'positive' },
    { label: 'Revisar', value: '1', tone: 'warning' },
    { label: 'Regra nova', value: 'Tarifa', tone: 'neutral' },
  ],
  next_steps: ['Atualizar categoria e centro no ERP', 'Criar regra para tarifa bancaria', 'Manter Frete Sul em revisao'],
} satisfies AnalysisStructuredContent

const chatGptExpenseResultData = {
  ok: true,
  tool: 'erp_acoes',
  view: 'table',
  title: 'Classificacoes aplicadas',
  resource: 'financeiro/despesas',
  count: 4,
  columns: ['Despesa', 'Categoria', 'Centro', 'Status'],
  rows: [
    { Despesa: 'Google Ads BR', Categoria: 'Marketing pago', Centro: 'Marketing', Status: 'Aplicada' },
    { Despesa: 'AWS Brasil', Categoria: 'Software e cloud', Centro: 'TI', Status: 'Aplicada' },
    { Despesa: 'Tarifa bancaria', Categoria: 'Tarifas bancarias', Centro: 'Financeiro', Status: 'Regra criada' },
    { Despesa: 'Frete Sul', Categoria: 'Logistica', Centro: 'Operacoes', Status: 'Revisar' },
  ],
} satisfies DataResultStructuredContent

const chatGptServiceOrderContextData = {
  ok: true,
  tool: 'crm',
  view: 'table',
  title: 'Chamados pendentes',
  resource: 'operacao/ordens-servico',
  count: 3,
  columns: ['Cliente', 'Chamado', 'Prioridade', 'SLA'],
  rows: [
    { Cliente: 'Cliente Norte Ltda', Chamado: 'Manutencao preventiva', Prioridade: 'Alta', SLA: '24h' },
    { Cliente: 'Mercado Alfa', Chamado: 'Visita tecnica', Prioridade: 'Media', SLA: '48h' },
    { Cliente: 'Delta Foods', Chamado: 'Inspecao mensal', Prioridade: 'Baixa', SLA: '72h' },
  ],
} satisfies DataResultStructuredContent

const chatGptServiceOrderDraftData = {
  ok: true,
  tool: 'analysis',
  view: 'analysis',
  type: 'service_order_preview',
  title: 'Ordem de servico preparada',
  subtitle: 'Aguardando confirmacao',
  summary: 'Cliente Norte tem chamado prioritario e SLA de 24h. Preparei a ordem de servico com tecnico Bruno Lima as 14h e checklist de manutencao preventiva.',
  metrics: [
    { label: 'Prioridade', value: 'Alta', tone: 'warning' },
    { label: 'Tecnico', value: 'Bruno', tone: 'positive' },
    { label: 'SLA', value: '24h', tone: 'neutral' },
  ],
  next_steps: ['Criar ordem de servico', 'Alocar tecnico', 'Avisar cliente'],
} satisfies AnalysisStructuredContent

const chatGptServiceOrderResultData = {
  ok: true,
  tool: 'operacao',
  view: 'table',
  title: 'Ordem de servico criada',
  resource: 'operacao/ordens-servico',
  count: 4,
  columns: ['Etapa', 'Responsavel', 'Referencia', 'Status'],
  rows: [
    { Etapa: 'Ordem de servico', Responsavel: 'Operacoes', Referencia: '1842', Status: 'Criada' },
    { Etapa: 'Tecnico', Responsavel: 'Bruno Lima', Referencia: '14h', Status: 'Alocado' },
    { Etapa: 'Checklist', Responsavel: 'Sistema', Referencia: 'Preventiva', Status: 'Gerado' },
    { Etapa: 'Aviso', Responsavel: 'WhatsApp', Referencia: 'Cliente Norte', Status: 'Enviado' },
  ],
} satisfies DataResultStructuredContent

const chatGptCrmOpportunitiesData = {
  ok: true,
  tool: 'crm',
  view: 'table',
  title: 'Oportunidades prontas',
  resource: 'crm/oportunidades',
  count: 3,
  columns: ['Cliente', 'Etapa', 'Valor', 'Proxima acao'],
  rows: [
    { Cliente: 'Cliente Norte', Etapa: 'Diagnostico feito', Valor: 'R$ 48.000', 'Proxima acao': 'Proposta' },
    { Cliente: 'Mercado Alfa', Etapa: 'Reuniao marcada', Valor: 'R$ 32.000', 'Proxima acao': 'Follow-up' },
    { Cliente: 'Delta Foods', Etapa: 'Qualificacao', Valor: 'R$ 22.000', 'Proxima acao': 'Diagnostico' },
  ],
} satisfies DataResultStructuredContent

const chatGptProposalDraftData = {
  ok: true,
  tool: 'analysis',
  view: 'analysis',
  type: 'proposal_preview',
  title: 'Proposta recomendada',
  subtitle: 'Cliente Norte pronto para proposta',
  summary: 'A oportunidade tem dor validada, decisor identificado e budget estimado. Vou gerar proposta com escopo operacional, prazo de 30 dias e pagamento em 2 parcelas.',
  metrics: [
    { label: 'Valor', value: 'R$ 48.000', tone: 'positive' },
    { label: 'Validade', value: '7 dias', tone: 'neutral' },
    { label: 'Chance', value: '82%', tone: 'positive' },
  ],
  next_steps: ['Criar proposta', 'Mover CRM para Proposta enviada', 'Enviar email e WhatsApp'],
} satisfies AnalysisStructuredContent

const chatGptProposalResultData = {
  ok: true,
  tool: 'crm',
  view: 'table',
  title: 'Proposta enviada',
  resource: 'crm/propostas',
  count: 5,
  columns: ['Etapa', 'Referencia', 'Canal', 'Status'],
  rows: [
    { Etapa: 'Proposta', Referencia: 'PROP-882', Canal: 'CRM', Status: 'Criada' },
    { Etapa: 'Oportunidade', Referencia: 'Cliente Norte', Canal: 'CRM', Status: 'Proposta enviada' },
    { Etapa: 'Email', Referencia: 'decisor@norte.com', Canal: 'Email', Status: 'Enviado' },
    { Etapa: 'WhatsApp', Referencia: '+55 81 98461-0519', Canal: 'WhatsApp', Status: 'Enviado' },
    { Etapa: 'Follow-up', Referencia: 'D+2', Canal: 'CRM', Status: 'Agendado' },
  ],
} satisfies DataResultStructuredContent

const chatGptPaidTrafficCampaignsData = {
  ok: true,
  tool: 'marketing',
  view: 'table',
  title: 'Campanhas de hoje',
  resource: 'marketing/campanhas',
  count: 4,
  columns: ['Campanha', 'Gasto', 'CPA', 'ROAS'],
  rows: [
    { Campanha: 'Prospecting Broad', Gasto: 'R$ 1.840', CPA: 'R$ 128', ROAS: '0.9x' },
    { Campanha: 'Retargeting 7d', Gasto: 'R$ 920', CPA: 'R$ 42', ROAS: '4.8x' },
    { Campanha: 'Lookalike Premium', Gasto: 'R$ 1.220', CPA: 'R$ 61', ROAS: '3.6x' },
    { Campanha: 'Creative Test A', Gasto: 'R$ 680', CPA: 'R$ 97', ROAS: '1.4x' },
  ],
} satisfies DataResultStructuredContent

const chatGptPaidTrafficDraftData = {
  ok: true,
  tool: 'analysis',
  view: 'analysis',
  type: 'paid_traffic_optimization',
  title: 'Redistribuicao sugerida',
  subtitle: 'Otimizar verba de hoje',
  summary: 'Sugiro reduzir R$ 300/dia da Prospecting Broad, aumentar R$ 220/dia em Retargeting 7d e mover R$ 80/dia para Lookalike Premium.',
  metrics: [
    { label: 'Cortar', value: 'R$ 300', tone: 'warning' },
    { label: 'Aumentar', value: 'R$ 220', tone: 'positive' },
    { label: 'ROAS alvo', value: '4.0x', tone: 'positive' },
  ],
  next_steps: ['Atualizar budgets no Meta Ads', 'Criar alerta de CPA', 'Enviar resumo ao time'],
} satisfies AnalysisStructuredContent

const chatGptPaidTrafficResultData = {
  ok: true,
  tool: 'marketing_acoes',
  view: 'table',
  title: 'Trafego pago ajustado',
  resource: 'marketing/campanhas',
  count: 4,
  columns: ['Acao', 'Campanha', 'Ajuste', 'Status'],
  rows: [
    { Acao: 'Reduzir budget', Campanha: 'Prospecting Broad', Ajuste: '-R$ 300/dia', Status: 'Aplicado' },
    { Acao: 'Aumentar budget', Campanha: 'Retargeting 7d', Ajuste: '+R$ 220/dia', Status: 'Aplicado' },
    { Acao: 'Aumentar budget', Campanha: 'Lookalike Premium', Ajuste: '+R$ 80/dia', Status: 'Aplicado' },
    { Acao: 'Alerta', Campanha: 'Todas', Ajuste: 'CPA > R$ 75', Status: 'Criado' },
  ],
} satisfies DataResultStructuredContent

const chatGptInventoryCurrentData = {
  ok: true,
  tool: 'erp',
  view: 'table',
  title: 'Estoque atual',
  resource: 'estoque/estoque-atual',
  count: 4,
  columns: ['Produto', 'Disponivel', 'Minimo', 'Reservado'],
  rows: [
    { Produto: 'Kit Premium 500ml', Disponivel: '42', Minimo: '80', Reservado: '18' },
    { Produto: 'Refil Essencial', Disponivel: '128', Minimo: '120', Reservado: '34' },
    { Produto: 'Combo Profissional', Disponivel: '16', Minimo: '45', Reservado: '9' },
    { Produto: 'Acessorio Pro', Disponivel: '210', Minimo: '90', Reservado: '22' },
  ],
} satisfies DataResultStructuredContent

const chatGptInventorySalesVelocityData = {
  ok: true,
  tool: 'ecommerce',
  view: 'table',
  title: 'Giro de vendas',
  resource: 'ecommerce/vendas-produtos',
  count: 4,
  columns: ['Produto', 'Vendas 7d', 'Media/dia', 'Dias restantes'],
  rows: [
    { Produto: 'Kit Premium 500ml', 'Vendas 7d': '96', 'Media/dia': '13,7', 'Dias restantes': '3 dias' },
    { Produto: 'Refil Essencial', 'Vendas 7d': '54', 'Media/dia': '7,7', 'Dias restantes': '16 dias' },
    { Produto: 'Combo Profissional', 'Vendas 7d': '42', 'Media/dia': '6,0', 'Dias restantes': '2 dias' },
    { Produto: 'Acessorio Pro', 'Vendas 7d': '25', 'Media/dia': '3,6', 'Dias restantes': '58 dias' },
  ],
} satisfies DataResultStructuredContent

const chatGptInventoryOpenPurchasesData = {
  ok: true,
  tool: 'erp',
  view: 'table',
  title: 'Compras em aberto',
  resource: 'compras/pedidos',
  count: 3,
  columns: ['Produto', 'Fornecedor', 'Quantidade', 'Chegada'],
  rows: [
    { Produto: 'Kit Premium 500ml', Fornecedor: 'Prime Fornecedores', Quantidade: '120', Chegada: '10 jun' },
    { Produto: 'Combo Profissional', Fornecedor: 'Sul Distribuidora', Quantidade: '60', Chegada: '14 jun' },
    { Produto: 'Refil Essencial', Fornecedor: 'Prime Fornecedores', Quantidade: '200', Chegada: '18 jun' },
  ],
} satisfies DataResultStructuredContent

const chatGptInventoryRiskPlanData = {
  ok: true,
  tool: 'analysis',
  view: 'analysis',
  type: 'inventory_rupture_plan',
  title: 'Plano de estoque',
  subtitle: 'Risco de ruptura',
  summary: 'Kit Premium e Combo Profissional podem romper antes da proxima entrega. Sugiro antecipar compra, transferir saldo parado e pausar anuncios dos itens criticos.',
  metrics: [
    { label: 'Criticos', value: '2', tone: 'warning' },
    { label: 'Receita em risco', value: 'R$ 38 mil', tone: 'warning' },
    { label: 'Acao', value: 'Reposicao', tone: 'positive' },
  ],
  next_steps: ['Antecipar pedido do Kit Premium', 'Criar compra extra do Combo Profissional', 'Pausar campanha de itens sem cobertura'],
} satisfies AnalysisStructuredContent

const chatGptInventoryReplenishmentData = {
  ok: true,
  tool: 'erp',
  view: 'table',
  title: 'Reposicao preparada',
  resource: 'compras/requisicoes',
  count: 4,
  columns: ['Produto', 'Acao', 'Quantidade', 'Status'],
  rows: [
    { Produto: 'Kit Premium 500ml', Acao: 'Antecipar entrega', Quantidade: '120', Status: 'Rascunho' },
    { Produto: 'Combo Profissional', Acao: 'Comprar extra', Quantidade: '80', Status: 'Rascunho' },
    { Produto: 'Acessorio Pro', Acao: 'Transferir saldo', Quantidade: '40', Status: 'Sugerido' },
    { Produto: 'Kit Premium 500ml', Acao: 'Pausar anuncio', Quantidade: '2 campanhas', Status: 'Sugerido' },
  ],
} satisfies DataResultStructuredContent

const chatGptSupportWhatsappData = {
  ok: true,
  tool: 'atendimento',
  view: 'table',
  title: 'WhatsApp pendente',
  resource: 'atendimento/whatsapp',
  count: 4,
  columns: ['Cliente', 'Assunto', 'Espera', 'Prioridade'],
  rows: [
    { Cliente: 'Cliente Norte', Assunto: 'Status do pedido', Espera: '42 min', Prioridade: 'Alta' },
    { Cliente: 'Mercado Alfa', Assunto: 'Segunda via', Espera: '18 min', Prioridade: 'Media' },
    { Cliente: 'Delta Foods', Assunto: 'Reclamacao entrega', Espera: '1h12', Prioridade: 'Alta' },
    { Cliente: 'Lead Recife', Assunto: 'Preco atacado', Espera: '9 min', Prioridade: 'Comercial' },
  ],
} satisfies DataResultStructuredContent

const chatGptSupportInstagramData = {
  ok: true,
  tool: 'atendimento',
  view: 'table',
  title: 'Instagram',
  resource: 'atendimento/instagram',
  count: 4,
  columns: ['Perfil', 'Tipo', 'Assunto', 'Urgencia'],
  rows: [
    { Perfil: '@loja.norte', Tipo: 'DM', Assunto: 'Troca de produto', Urgencia: 'Alta' },
    { Perfil: '@clientevip', Tipo: 'Comentario', Assunto: 'Cupom expirado', Urgencia: 'Media' },
    { Perfil: '@revenda.pe', Tipo: 'DM', Assunto: 'Proposta revenda', Urgencia: 'Comercial' },
    { Perfil: '@comprador24', Tipo: 'DM', Assunto: 'Prazo entrega', Urgencia: 'Baixa' },
  ],
} satisfies DataResultStructuredContent

const chatGptSupportEmailData = {
  ok: true,
  tool: 'atendimento',
  view: 'table',
  title: 'Email pendente',
  resource: 'atendimento/email',
  count: 4,
  columns: ['Remetente', 'Categoria', 'Prazo', 'Responsavel'],
  rows: [
    { Remetente: 'financeiro@norte.com', Categoria: 'Boleto', Prazo: 'Hoje', Responsavel: 'Financeiro' },
    { Remetente: 'compras@alfa.com', Categoria: 'Pedido B2B', Prazo: 'Hoje', Responsavel: 'Comercial' },
    { Remetente: 'sac@delta.com', Categoria: 'Reclamacao', Prazo: '2h', Responsavel: 'Suporte' },
    { Remetente: 'lead@recife.com', Categoria: 'Proposta', Prazo: 'Amanha', Responsavel: 'Vendas' },
  ],
} satisfies DataResultStructuredContent

const chatGptSupportOmnichannelPlanData = {
  ok: true,
  tool: 'analysis',
  view: 'analysis',
  type: 'support_omnichannel_plan',
  title: 'Plano omnichannel',
  subtitle: 'Sugestao de atendimento',
  summary: 'Analisei WhatsApp, Instagram e email. Sugiro responder duvidas simples, abrir tickets para reclamacoes e encaminhar oportunidades comerciais para o time de vendas.',
  metrics: [
    { label: 'Mensagens', value: '12', tone: 'neutral' },
    { label: 'Urgentes', value: '4', tone: 'warning' },
    { label: 'Comerciais', value: '3', tone: 'positive' },
  ],
  next_steps: ['Preparar respostas por canal', 'Abrir tickets criticos', 'Encaminhar oportunidades para vendas'],
} satisfies AnalysisStructuredContent

const chatGptSupportResponsesData = {
  ok: true,
  tool: 'atendimento',
  view: 'table',
  title: 'Respostas preparadas',
  resource: 'atendimento/rascunhos',
  count: 4,
  columns: ['Canal', 'Destino', 'Acao sugerida', 'Status'],
  rows: [
    { Canal: 'WhatsApp', Destino: 'Cliente Norte', 'Acao sugerida': 'Enviar status do pedido', Status: 'Rascunho' },
    { Canal: 'Instagram', Destino: '@loja.norte', 'Acao sugerida': 'Abrir ticket de troca', Status: 'Rascunho' },
    { Canal: 'Email', Destino: 'compras@alfa.com', 'Acao sugerida': 'Enviar proposta B2B', Status: 'Rascunho' },
    { Canal: 'WhatsApp', Destino: 'Delta Foods', 'Acao sugerida': 'Escalar reclamacao', Status: 'Rascunho' },
  ],
} satisfies DataResultStructuredContent

export function ChatGptOperationalFlowsVideo() {
  const frame = useCurrentFrame()
  const conversationY = interpolate(
    frame,
    [0, 170, 340, 540, 740, 960, 1160, 1380, 1600, 1820, 2040, 2260, 2480, 2700, 2920, 3140, 3360, 3580, 3820, 4100, 4320, 4540, 4760, 4980, 5200, 5420, 5640, 5900],
    [0, 0, -620, -1300, -1980, -2700, -3380, -4080, -4780, -5480, -6180, -6880, -7580, -8280, -8980, -9680, -10360, -11040, -11720, -12400, -13080, -13760, -14440, -15120, -15800, -16480, -17160, -17840],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  )

  return (
    <ChatGptMobileShell conversationY={conversationY}>
      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 10, 18)}>Concilie banco e ERP</ChatGptFlowUserBubble>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 48, 22)}>Primeiro li as movimentacoes reais do extrato bancario.</ChatGptFlowAssistantText>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 78, 22)}><AnimatedMcpTableView data={chatGptReconciliationBankStatementData} startFrame={78} /></ChatGptToolResultCard>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 190, 22)}>Depois busquei os lancamentos correspondentes no ERP.</ChatGptFlowAssistantText>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 220, 22)}><AnimatedMcpTableView data={chatGptReconciliationErpData} startFrame={220} /></ChatGptToolResultCard>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 332, 22)}>Encontrei os matches e separei o que precisa de revisao. Posso conciliar os itens seguros?</ChatGptFlowAssistantText>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 362, 22)}><AnimatedMcpAnalysisView data={chatGptReconciliationSummaryData} startFrame={362} /></ChatGptToolResultCard>
      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 504, 18)}>Sim, concilie</ChatGptFlowUserBubble>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 544, 22)}><AnimatedMcpTableView data={chatGptReconciliationResultData} startFrame={544} /></ChatGptToolResultCard>

      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 696, 18)}>Mostre despesas pendentes de lancamento</ChatGptFlowUserBubble>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 734, 22)}>Encontrei uma despesa de frete que precisa virar conta a pagar.</ChatGptFlowAssistantText>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 764, 22)}><AnimatedMcpTableView data={chatGptPayablePendingData} startFrame={764} /></ChatGptToolResultCard>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 1018, 22)}>Posso criar a conta a pagar no ERP?</ChatGptFlowAssistantText>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 1048, 22)}><AnimatedMcpAnalysisView data={chatGptPayableDraftData} startFrame={1048} /></ChatGptToolResultCard>
      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 1160, 18)}>Pode criar</ChatGptFlowUserBubble>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 1200, 22)}><AnimatedMcpTableView data={chatGptPayableResultData} startFrame={1200} /></ChatGptToolResultCard>

      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 1368, 18)}>Busque contas a receber em atraso</ChatGptFlowUserBubble>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 1406, 22)}>Encontrei recebiveis vencidos e priorizei o maior atraso.</ChatGptFlowAssistantText>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 1436, 22)}><AnimatedMcpTableView data={chatGptCollectionOverdueData} startFrame={1436} /></ChatGptToolResultCard>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 1548, 22)}>Sugeri a cobranca com PIX, boleto, WhatsApp e email. Posso realizar?</ChatGptFlowAssistantText>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 1578, 22)}><AnimatedMcpAnalysisView data={chatGptCollectionDraftData} startFrame={1578} /></ChatGptToolResultCard>
      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 1690, 18)}>Sim, cobre agora</ChatGptFlowUserBubble>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 1730, 22)}><AnimatedMcpTableView data={chatGptCollectionResultData} startFrame={1730} /></ChatGptToolResultCard>

      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 1900, 18)}>Classifique essas despesas</ChatGptFlowUserBubble>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 1938, 22)}>Primeiro li as despesas sem categoria.</ChatGptFlowAssistantText>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 1968, 22)}><AnimatedMcpTableView data={chatGptExpenseRawData} startFrame={1968} /></ChatGptToolResultCard>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 2222, 22)}>Posso aplicar as classificacoes confiaveis no ERP?</ChatGptFlowAssistantText>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 2252, 22)}><AnimatedMcpAnalysisView data={chatGptExpenseDraftData} startFrame={2252} /></ChatGptToolResultCard>
      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 2364, 18)}>Sim, aplique</ChatGptFlowUserBubble>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 2404, 22)}><AnimatedMcpTableView data={chatGptExpenseResultData} startFrame={2404} /></ChatGptToolResultCard>

      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 2576, 18)}>Mostre chamados pendentes de hoje</ChatGptFlowUserBubble>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 2614, 22)}>Cliente Norte tem prioridade alta e SLA de 24h. Posso montar a ordem de servico?</ChatGptFlowAssistantText>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 2644, 22)}><AnimatedMcpTableView data={chatGptServiceOrderContextData} startFrame={2644} /></ChatGptToolResultCard>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 2786, 22)}><AnimatedMcpAnalysisView data={chatGptServiceOrderDraftData} startFrame={2786} /></ChatGptToolResultCard>
      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 2898, 18)}>Sim, pode criar</ChatGptFlowUserBubble>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 2938, 22)}><AnimatedMcpTableView data={chatGptServiceOrderResultData} startFrame={2938} /></ChatGptToolResultCard>

      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 3108, 18)}>Mostre oportunidades prontas para proposta</ChatGptFlowUserBubble>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 3146, 22)}>Encontrei oportunidades com diagnostico feito e proxima acao comercial.</ChatGptFlowAssistantText>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 3176, 22)}><AnimatedMcpTableView data={chatGptCrmOpportunitiesData} startFrame={3176} /></ChatGptToolResultCard>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 3318, 22)}><AnimatedMcpAnalysisView data={chatGptProposalDraftData} startFrame={3318} /></ChatGptToolResultCard>
      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 3430, 18)}>Sim, envie a proposta</ChatGptFlowUserBubble>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 3468, 22)}><AnimatedMcpTableView data={chatGptProposalResultData} startFrame={3468} /></ChatGptToolResultCard>

      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 3608, 18)}>Analise trafego pago de hoje</ChatGptFlowUserBubble>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 3646, 22)}>Encontrei uma campanha gastando mal e duas campanhas com ROAS forte.</ChatGptFlowAssistantText>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 3676, 22)}><AnimatedMcpTableView data={chatGptPaidTrafficCampaignsData} startFrame={3676} /></ChatGptToolResultCard>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 3818, 22)}><AnimatedMcpAnalysisView data={chatGptPaidTrafficDraftData} startFrame={3818} /></ChatGptToolResultCard>
      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 3930, 18)}>Sim, otimize</ChatGptFlowUserBubble>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 3970, 22)}><AnimatedMcpTableView data={chatGptPaidTrafficResultData} startFrame={3970} /></ChatGptToolResultCard>

      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 4138, 18)}>Analise risco de ruptura no estoque</ChatGptFlowUserBubble>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 4176, 22)}>Primeiro li o estoque atual e separei os itens abaixo do ponto de seguranca.</ChatGptFlowAssistantText>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 4206, 22)}><AnimatedMcpTableView data={chatGptInventoryCurrentData} startFrame={4206} /></ChatGptToolResultCard>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 4318, 22)}>Depois cruzei com vendas recentes para estimar quantos dias cada produto ainda dura.</ChatGptFlowAssistantText>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 4348, 22)}><AnimatedMcpTableView data={chatGptInventorySalesVelocityData} startFrame={4348} /></ChatGptToolResultCard>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 4460, 22)}>Tambem verifiquei pedidos de compra em aberto para evitar reposicao duplicada.</ChatGptFlowAssistantText>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 4490, 22)}><AnimatedMcpTableView data={chatGptInventoryOpenPurchasesData} startFrame={4490} /></ChatGptToolResultCard>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 4602, 22)}>Encontrei ruptura provavel antes da proxima entrega. Posso preparar a reposicao?</ChatGptFlowAssistantText>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 4632, 22)}><AnimatedMcpAnalysisView data={chatGptInventoryRiskPlanData} startFrame={4632} /></ChatGptToolResultCard>
      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 4750, 18)}>Prepare a reposicao</ChatGptFlowUserBubble>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 4790, 22)}><AnimatedMcpTableView data={chatGptInventoryReplenishmentData} startFrame={4790} /></ChatGptToolResultCard>

      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 4958, 18)}>Analise os atendimentos de hoje</ChatGptFlowUserBubble>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 4996, 22)}>Primeiro analisei as conversas abertas no WhatsApp.</ChatGptFlowAssistantText>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 5026, 22)}><AnimatedMcpTableView data={chatGptSupportWhatsappData} startFrame={5026} /></ChatGptToolResultCard>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 5138, 22)}>Depois li DMs e comentarios do Instagram com intencao comercial ou suporte.</ChatGptFlowAssistantText>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 5168, 22)}><AnimatedMcpTableView data={chatGptSupportInstagramData} startFrame={5168} /></ChatGptToolResultCard>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 5280, 22)}>Por fim, revisei emails que precisam de resposta ou encaminhamento.</ChatGptFlowAssistantText>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 5310, 22)}><AnimatedMcpTableView data={chatGptSupportEmailData} startFrame={5310} /></ChatGptToolResultCard>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 5422, 22)}>Cruzei os tres canais e separei prioridades, oportunidades e casos que exigem humano.</ChatGptFlowAssistantText>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 5452, 22)}><AnimatedMcpAnalysisView data={chatGptSupportOmnichannelPlanData} startFrame={5452} /></ChatGptToolResultCard>
      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 5570, 18)}>Prepare as respostas</ChatGptFlowUserBubble>
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 5610, 22)}><AnimatedMcpTableView data={chatGptSupportResponsesData} startFrame={5610} /></ChatGptToolResultCard>

      <div style={chatGptSequenceStyle(frame, 5740, 14)}>
        <div style={{ padding: '10px 0 0 45px' }}>
          <ChatGptActionRow />
        </div>
      </div>
    </ChatGptMobileShell>
  )
}
