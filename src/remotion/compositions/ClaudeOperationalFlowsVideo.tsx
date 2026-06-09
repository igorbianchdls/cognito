import { interpolate, useCurrentFrame } from 'remotion'

import type { AnalysisStructuredContent, DataResultStructuredContent } from '@/products/plugin/web/src/types/toolResult'
import { AnimatedMcpAnalysisView } from '@/remotion/components/AnimatedMcpAnalysisView'
import { AnimatedMcpTableView } from '@/remotion/components/AnimatedMcpTableView'
import {
  ClaudeActionRow,
  ClaudeFlowAssistantText,
  ClaudeFlowUserBubble,
  ClaudeMobileShell,
  ClaudeToolResultCard,
  claudeSequenceStyle,
} from '@/remotion/compositions/ClaudeMobileBase'

type ClaudeOperationalFlow = {
  start: number
  user: string
  intro: string
  table: DataResultStructuredContent
  planText: string
  plan: AnalysisStructuredContent
  confirm: string
  result: DataResultStructuredContent
}

const claudeOperationalFlows: ClaudeOperationalFlow[] = [
  {
    start: 10,
    user: 'Concilie banco e ERP',
    intro: 'Li o extrato e comparei os movimentos com os lancamentos abertos no ERP.',
    table: {
      ok: true,
      tool: 'erp',
      view: 'table',
      title: 'Conciliação bancária',
      resource: 'financeiro/conciliacao',
      count: 4,
      columns: ['Movimento', 'ERP encontrado', 'Confianca', 'Status'],
      rows: [
        { Movimento: 'PIX Cliente Norte', 'ERP encontrado': 'NF-9031', Confianca: '99%', Status: 'Match' },
        { Movimento: 'Cartao Stone', 'ERP encontrado': 'Lote-552', Confianca: '98%', Status: 'Match' },
        { Movimento: 'Pagamento Frete Sul', 'ERP encontrado': 'CTR-210', Confianca: '72%', Status: 'Revisar' },
        { Movimento: 'Tarifa bancaria', 'ERP encontrado': 'Sem lancamento', Confianca: '-', Status: 'Pendente' },
      ],
    },
    planText: 'Separei os itens seguros dos casos que precisam de revisão humana.',
    plan: {
      ok: true,
      tool: 'analysis',
      view: 'analysis',
      title: 'Plano de conciliação',
      subtitle: 'Antes da execução',
      summary: 'Há 14 movimentos com alta confiança, 3 divergências para revisar e 1 tarifa sem lançamento correspondente.',
      metrics: [
        { label: 'Conciliar', value: '14', tone: 'positive' },
        { label: 'Revisar', value: '3', tone: 'warning' },
        { label: 'Sem ERP', value: '1', tone: 'neutral' },
      ],
      next_steps: ['Baixar títulos seguros', 'Manter divergências pendentes', 'Sugerir regra para tarifa'],
    },
    confirm: 'Pode conciliar os seguros',
    result: {
      ok: true,
      tool: 'erp_acoes',
      view: 'table',
      title: 'Conciliação executada',
      resource: 'financeiro/conciliacao',
      count: 4,
      columns: ['Ação', 'Referência', 'Status'],
      rows: [
        { Ação: 'Baixar título', Referência: 'NF-9031', Status: 'Conciliado' },
        { Ação: 'Marcar recebido', Referência: 'Lote-552', Status: 'Conciliado' },
        { Ação: 'Aguardar ajuste', Referência: 'CTR-210', Status: 'Pendente' },
        { Ação: 'Sugerir despesa', Referência: 'Tarifa', Status: 'Pendente' },
      ],
    },
  },
  {
    start: 650,
    user: 'Mostre despesas pendentes de lançamento',
    intro: 'Encontrei despesas que aparecem em canais externos e ainda não viraram lançamento financeiro.',
    table: {
      ok: true,
      tool: 'erp',
      view: 'table',
      title: 'Despesas pendentes',
      resource: 'financeiro/pendencias',
      count: 3,
      columns: ['Origem', 'Descrição', 'Valor', 'Ação'],
      rows: [
        { Origem: 'Extrato', Descrição: 'Frete Sul', Valor: 'R$ 8.420', Ação: 'Criar conta a pagar' },
        { Origem: 'Email', Descrição: 'AWS Brasil', Valor: 'R$ 12.790', Ação: 'Validar nota' },
        { Origem: 'Cartão', Descrição: 'Google Ads BR', Valor: 'R$ 18.400', Ação: 'Classificar' },
      ],
    },
    planText: 'A despesa de frete tem fornecedor, categoria e centro de custo com boa confiança.',
    plan: {
      ok: true,
      tool: 'analysis',
      view: 'analysis',
      title: 'Conta a pagar preparada',
      subtitle: 'Aguardando confirmação',
      summary: 'Fornecedor Frete Sul localizado. Sugiro criar a conta a pagar de R$ 8.420 com vencimento em 12 jun.',
      metrics: [
        { label: 'Valor', value: 'R$ 8.420', tone: 'neutral' },
        { label: 'Match', value: '99%', tone: 'positive' },
        { label: 'Vencimento', value: '12 jun', tone: 'neutral' },
      ],
      next_steps: ['Criar conta a pagar', 'Status aberto', 'Origem Claude'],
    },
    confirm: 'Prepare o lançamento',
    result: {
      ok: true,
      tool: 'erp_acoes',
      view: 'table',
      title: 'Lançamento preparado',
      resource: 'contas-a-pagar',
      count: 1,
      columns: ['ID', 'Fornecedor', 'Valor', 'Status'],
      rows: [{ ID: 'CP-1048', Fornecedor: 'Frete Sul Logística', Valor: 'R$ 8.420', Status: 'Rascunho' }],
    },
  },
  {
    start: 1290,
    user: 'Busque contas a receber em atraso',
    intro: 'Priorizei os recebíveis vencidos por valor, atraso e histórico do cliente.',
    table: {
      ok: true,
      tool: 'erp',
      view: 'table',
      title: 'Recebíveis em atraso',
      resource: 'contas-a-receber',
      count: 3,
      columns: ['Cliente', 'Documento', 'Valor', 'Atraso'],
      rows: [
        { Cliente: 'Cliente Norte', Documento: 'NF-2041', Valor: 'R$ 12.400', Atraso: '7 dias' },
        { Cliente: 'Mercado Alfa', Documento: 'NF-2038', Valor: 'R$ 8.900', Atraso: '4 dias' },
        { Cliente: 'Delta Foods', Documento: 'NF-2029', Valor: 'R$ 6.180', Atraso: '2 dias' },
      ],
    },
    planText: 'A melhor ação é cobrar o maior atraso com PIX, boleto e mensagem objetiva.',
    plan: {
      ok: true,
      tool: 'analysis',
      view: 'analysis',
      title: 'Cobrança sugerida',
      subtitle: 'Antes de enviar',
      summary: 'Sugiro cobrar a NF-2041 com PIX + boleto e encaminhar a mensagem para WhatsApp e email.',
      metrics: [
        { label: 'Valor', value: 'R$ 12.400', tone: 'neutral' },
        { label: 'Atraso', value: '7 dias', tone: 'warning' },
        { label: 'Forma', value: 'PIX + boleto', tone: 'positive' },
      ],
      next_steps: ['Gerar PIX', 'Gerar boleto', 'Preparar mensagem'],
    },
    confirm: 'Prepare a cobrança',
    result: {
      ok: true,
      tool: 'erp_acoes',
      view: 'table',
      title: 'Cobrança preparada',
      resource: 'contas-a-receber',
      count: 4,
      columns: ['Etapa', 'Canal', 'Status'],
      rows: [
        { Etapa: 'PIX', Canal: 'ERP', Status: 'Gerado' },
        { Etapa: 'Boleto', Canal: 'ERP', Status: 'Gerado' },
        { Etapa: 'Mensagem', Canal: 'WhatsApp', Status: 'Rascunho' },
        { Etapa: 'Email', Canal: 'Email', Status: 'Rascunho' },
      ],
    },
  },
  {
    start: 1930,
    user: 'Classifique essas despesas',
    intro: 'Li as despesas sem categoria e identifiquei padrões por fornecedor, origem e centro de custo.',
    table: {
      ok: true,
      tool: 'erp',
      view: 'table',
      title: 'Despesas encontradas',
      resource: 'financeiro/despesas',
      count: 4,
      columns: ['Descrição', 'Valor', 'Origem', 'Status'],
      rows: [
        { Descrição: 'Google Ads BR', Valor: 'R$ 18.400', Origem: 'Cartão', Status: 'Sem categoria' },
        { Descrição: 'AWS Brasil', Valor: 'R$ 12.790', Origem: 'Boleto', Status: 'Sem categoria' },
        { Descrição: 'Tarifa bancária', Valor: 'R$ 189', Origem: 'Extrato', Status: 'Sem regra' },
        { Descrição: 'Frete Sul', Valor: 'R$ 8.420', Origem: 'TED', Status: 'Revisar' },
      ],
    },
    planText: 'Três classificações têm confiança suficiente para aplicar sem alterar o item duvidoso.',
    plan: {
      ok: true,
      tool: 'analysis',
      view: 'analysis',
      title: 'Classificação sugerida',
      subtitle: 'Critério conservador',
      summary: 'Aplicaria automaticamente 3 despesas acima de 90% e manteria Frete Sul em revisão.',
      metrics: [
        { label: 'Aplicar', value: '3', tone: 'positive' },
        { label: 'Revisar', value: '1', tone: 'warning' },
        { label: 'Regra nova', value: 'Tarifa', tone: 'neutral' },
      ],
      next_steps: ['Atualizar categorias', 'Criar regra de tarifa', 'Manter Frete Sul pendente'],
    },
    confirm: 'Aplique as confiáveis',
    result: {
      ok: true,
      tool: 'erp_acoes',
      view: 'table',
      title: 'Classificações preparadas',
      resource: 'financeiro/despesas',
      count: 4,
      columns: ['Despesa', 'Categoria', 'Status'],
      rows: [
        { Despesa: 'Google Ads BR', Categoria: 'Marketing pago', Status: 'Preparada' },
        { Despesa: 'AWS Brasil', Categoria: 'Software e cloud', Status: 'Preparada' },
        { Despesa: 'Tarifa bancária', Categoria: 'Tarifas bancárias', Status: 'Regra sugerida' },
        { Despesa: 'Frete Sul', Categoria: 'Logística', Status: 'Revisar' },
      ],
    },
  },
  {
    start: 2570,
    user: 'Mostre chamados pendentes de hoje',
    intro: 'Analisei os chamados por prioridade, SLA e impacto no cliente.',
    table: {
      ok: true,
      tool: 'crm',
      view: 'table',
      title: 'Chamados pendentes',
      resource: 'operacao/ordens-servico',
      count: 3,
      columns: ['Cliente', 'Chamado', 'Prioridade', 'SLA'],
      rows: [
        { Cliente: 'Cliente Norte', Chamado: 'Manutenção preventiva', Prioridade: 'Alta', SLA: '24h' },
        { Cliente: 'Mercado Alfa', Chamado: 'Visita técnica', Prioridade: 'Média', SLA: '48h' },
        { Cliente: 'Delta Foods', Chamado: 'Inspeção mensal', Prioridade: 'Baixa', SLA: '72h' },
      ],
    },
    planText: 'Cliente Norte exige ação hoje; montei uma ordem com técnico, agenda e checklist.',
    plan: {
      ok: true,
      tool: 'analysis',
      view: 'analysis',
      title: 'Ordem de serviço',
      subtitle: 'Recomendação',
      summary: 'Sugiro alocar Bruno Lima às 14h e avisar o cliente com checklist de manutenção preventiva.',
      metrics: [
        { label: 'Prioridade', value: 'Alta', tone: 'warning' },
        { label: 'Técnico', value: 'Bruno', tone: 'positive' },
        { label: 'SLA', value: '24h', tone: 'neutral' },
      ],
      next_steps: ['Criar OS', 'Alocar técnico', 'Avisar cliente'],
    },
    confirm: 'Prepare a ordem',
    result: {
      ok: true,
      tool: 'operacao',
      view: 'table',
      title: 'Ordem preparada',
      resource: 'operacao/ordens-servico',
      count: 4,
      columns: ['Etapa', 'Referência', 'Status'],
      rows: [
        { Etapa: 'Ordem', Referência: '1842', Status: 'Rascunho' },
        { Etapa: 'Técnico', Referência: 'Bruno Lima', Status: 'Alocado' },
        { Etapa: 'Checklist', Referência: 'Preventiva', Status: 'Gerado' },
        { Etapa: 'Aviso', Referência: 'Cliente Norte', Status: 'Rascunho' },
      ],
    },
  },
  {
    start: 3210,
    user: 'Mostre oportunidades prontas para proposta',
    intro: 'Filtrei oportunidades com diagnóstico concluído e próxima ação comercial clara.',
    table: {
      ok: true,
      tool: 'crm',
      view: 'table',
      title: 'Oportunidades prontas',
      resource: 'crm/oportunidades',
      count: 3,
      columns: ['Cliente', 'Etapa', 'Valor', 'Próxima ação'],
      rows: [
        { Cliente: 'Cliente Norte', Etapa: 'Diagnóstico feito', Valor: 'R$ 48.000', 'Próxima ação': 'Proposta' },
        { Cliente: 'Mercado Alfa', Etapa: 'Reunião marcada', Valor: 'R$ 32.000', 'Próxima ação': 'Follow-up' },
        { Cliente: 'Delta Foods', Etapa: 'Qualificação', Valor: 'R$ 22.000', 'Próxima ação': 'Diagnóstico' },
      ],
    },
    planText: 'Cliente Norte é o caso mais maduro; recomendo proposta com validade curta e follow-up em D+2.',
    plan: {
      ok: true,
      tool: 'analysis',
      view: 'analysis',
      title: 'Proposta recomendada',
      subtitle: 'Cliente Norte',
      summary: 'A oportunidade tem dor validada, decisor identificado e budget estimado.',
      metrics: [
        { label: 'Valor', value: 'R$ 48.000', tone: 'positive' },
        { label: 'Validade', value: '7 dias', tone: 'neutral' },
        { label: 'Chance', value: '82%', tone: 'positive' },
      ],
      next_steps: ['Criar proposta', 'Mover etapa CRM', 'Preparar email e WhatsApp'],
    },
    confirm: 'Prepare a proposta',
    result: {
      ok: true,
      tool: 'crm',
      view: 'table',
      title: 'Proposta preparada',
      resource: 'crm/propostas',
      count: 4,
      columns: ['Etapa', 'Referência', 'Status'],
      rows: [
        { Etapa: 'Proposta', Referência: 'PROP-882', Status: 'Rascunho' },
        { Etapa: 'Oportunidade', Referência: 'Cliente Norte', Status: 'Proposta' },
        { Etapa: 'Email', Referência: 'decisor@norte.com', Status: 'Rascunho' },
        { Etapa: 'Follow-up', Referência: 'D+2', Status: 'Agendado' },
      ],
    },
  },
  {
    start: 3850,
    user: 'Analise tráfego pago de hoje',
    intro: 'Comparei gasto, CPA e ROAS das campanhas ativas.',
    table: {
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
    },
    planText: 'A verba pode migrar da campanha com CPA alto para as duas campanhas com melhor retorno.',
    plan: {
      ok: true,
      tool: 'analysis',
      view: 'analysis',
      title: 'Redistribuição sugerida',
      subtitle: 'Otimização conservadora',
      summary: 'Reduziria R$ 300/dia da Prospecting Broad e aumentaria Retargeting 7d e Lookalike Premium.',
      metrics: [
        { label: 'Cortar', value: 'R$ 300', tone: 'warning' },
        { label: 'Aumentar', value: 'R$ 300', tone: 'positive' },
        { label: 'ROAS alvo', value: '4.0x', tone: 'positive' },
      ],
      next_steps: ['Atualizar budgets', 'Criar alerta de CPA', 'Preparar resumo'],
    },
    confirm: 'Prepare a otimização',
    result: {
      ok: true,
      tool: 'marketing_acoes',
      view: 'table',
      title: 'Otimização preparada',
      resource: 'marketing/campanhas',
      count: 4,
      columns: ['Ação', 'Campanha', 'Status'],
      rows: [
        { Ação: 'Reduzir budget', Campanha: 'Prospecting Broad', Status: 'Rascunho' },
        { Ação: 'Aumentar budget', Campanha: 'Retargeting 7d', Status: 'Rascunho' },
        { Ação: 'Aumentar budget', Campanha: 'Lookalike Premium', Status: 'Rascunho' },
        { Ação: 'Alerta', Campanha: 'CPA > R$ 75', Status: 'Preparado' },
      ],
    },
  },
  {
    start: 4490,
    user: 'Analise risco de ruptura no estoque',
    intro: 'Cruzei estoque disponível, reservas, giro recente e compras em aberto.',
    table: {
      ok: true,
      tool: 'erp',
      view: 'table',
      title: 'Risco de estoque',
      resource: 'estoque/estoque-atual',
      count: 4,
      columns: ['Produto', 'Disponível', 'Dias restantes', 'Risco'],
      rows: [
        { Produto: 'Kit Premium 500ml', Disponível: '42', 'Dias restantes': '3', Risco: 'Alto' },
        { Produto: 'Refil Essencial', Disponível: '128', 'Dias restantes': '16', Risco: 'Baixo' },
        { Produto: 'Combo Profissional', Disponível: '16', 'Dias restantes': '2', Risco: 'Alto' },
        { Produto: 'Acessório Pro', Disponível: '210', 'Dias restantes': '58', Risco: 'Baixo' },
      ],
    },
    planText: 'Dois produtos podem romper antes da próxima entrega; a ação deve evitar compra duplicada.',
    plan: {
      ok: true,
      tool: 'analysis',
      view: 'analysis',
      title: 'Plano de estoque',
      subtitle: 'Risco de ruptura',
      summary: 'Sugiro antecipar Kit Premium, comprar Combo Profissional extra e pausar campanhas dos itens críticos.',
      metrics: [
        { label: 'Críticos', value: '2', tone: 'warning' },
        { label: 'Receita em risco', value: 'R$ 38 mil', tone: 'warning' },
        { label: 'Ação', value: 'Reposição', tone: 'positive' },
      ],
      next_steps: ['Antecipar pedido', 'Comprar extra', 'Pausar campanhas críticas'],
    },
    confirm: 'Prepare a reposição',
    result: {
      ok: true,
      tool: 'erp',
      view: 'table',
      title: 'Reposição preparada',
      resource: 'compras/requisicoes',
      count: 4,
      columns: ['Produto', 'Ação', 'Status'],
      rows: [
        { Produto: 'Kit Premium 500ml', Ação: 'Antecipar entrega', Status: 'Rascunho' },
        { Produto: 'Combo Profissional', Ação: 'Comprar 80', Status: 'Rascunho' },
        { Produto: 'Acessório Pro', Ação: 'Transferir 40', Status: 'Sugerido' },
        { Produto: 'Kit Premium 500ml', Ação: 'Pausar anúncio', Status: 'Sugerido' },
      ],
    },
  },
  {
    start: 5130,
    user: 'Analise os atendimentos de hoje',
    intro: 'Li WhatsApp, Instagram e email, depois agrupei por urgência, intenção e responsável.',
    table: {
      ok: true,
      tool: 'atendimento',
      view: 'table',
      title: 'Atendimento omnichannel',
      resource: 'atendimento/mensagens',
      count: 12,
      columns: ['Canal', 'Assunto', 'Urgência', 'Intenção'],
      rows: [
        { Canal: 'WhatsApp', Assunto: 'Status do pedido', Urgência: 'Alta', Intenção: 'Suporte' },
        { Canal: 'Instagram', Assunto: 'Troca de produto', Urgência: 'Alta', Intenção: 'SAC' },
        { Canal: 'Email', Assunto: 'Pedido B2B', Urgência: 'Média', Intenção: 'Comercial' },
        { Canal: 'WhatsApp', Assunto: 'Preço atacado', Urgência: 'Média', Intenção: 'Lead' },
      ],
    },
    planText: 'Separei respostas simples, casos críticos e oportunidades comerciais para encaminhamento.',
    plan: {
      ok: true,
      tool: 'analysis',
      view: 'analysis',
      title: 'Plano omnichannel',
      subtitle: 'Sugestão de atendimento',
      summary: 'Sugiro preparar respostas por canal, abrir tickets críticos e encaminhar oportunidades para vendas.',
      metrics: [
        { label: 'Mensagens', value: '12', tone: 'neutral' },
        { label: 'Urgentes', value: '4', tone: 'warning' },
        { label: 'Comerciais', value: '3', tone: 'positive' },
      ],
      next_steps: ['Preparar respostas', 'Abrir tickets', 'Encaminhar leads'],
    },
    confirm: 'Prepare as respostas',
    result: {
      ok: true,
      tool: 'atendimento',
      view: 'table',
      title: 'Respostas preparadas',
      resource: 'atendimento/rascunhos',
      count: 4,
      columns: ['Canal', 'Destino', 'Status'],
      rows: [
        { Canal: 'WhatsApp', Destino: 'Cliente Norte', Status: 'Rascunho' },
        { Canal: 'Instagram', Destino: '@loja.norte', Status: 'Ticket sugerido' },
        { Canal: 'Email', Destino: 'compras@alfa.com', Status: 'Rascunho' },
        { Canal: 'WhatsApp', Destino: 'Delta Foods', Status: 'Escalar' },
      ],
    },
  },
]

export function ClaudeOperationalFlowsVideo() {
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
    <ClaudeMobileShell conversationY={conversationY}>
      {claudeOperationalFlows.map((flow) => (
        <FragmentFlow flow={flow} frame={frame} key={flow.user} />
      ))}
      <div style={claudeSequenceStyle(frame, 5750, 14)}>
        <div style={{ padding: '10px 0 0 52px' }}>
          <ClaudeActionRow second />
        </div>
      </div>
    </ClaudeMobileShell>
  )
}

function FragmentFlow({ flow, frame }: { flow: ClaudeOperationalFlow; frame: number }) {
  const start = flow.start

  return (
    <>
      <ClaudeFlowUserBubble style={claudeSequenceStyle(frame, start, 18)}>{flow.user}</ClaudeFlowUserBubble>
      <ClaudeFlowAssistantText style={claudeSequenceStyle(frame, start + 38, 22)}>{flow.intro}</ClaudeFlowAssistantText>
      <ClaudeToolResultCard style={claudeSequenceStyle(frame, start + 68, 22)}>
        <AnimatedMcpTableView data={flow.table} startFrame={start + 68} />
      </ClaudeToolResultCard>
      <ClaudeFlowAssistantText style={claudeSequenceStyle(frame, start + 180, 22)}>{flow.planText}</ClaudeFlowAssistantText>
      <ClaudeToolResultCard style={claudeSequenceStyle(frame, start + 210, 22)}>
        <AnimatedMcpAnalysisView data={flow.plan} startFrame={start + 210} />
      </ClaudeToolResultCard>
      <ClaudeFlowUserBubble style={claudeSequenceStyle(frame, start + 332, 18)}>{flow.confirm}</ClaudeFlowUserBubble>
      <ClaudeToolResultCard style={claudeSequenceStyle(frame, start + 372, 22)}>
        <AnimatedMcpTableView data={flow.result} startFrame={start + 372} />
      </ClaudeToolResultCard>
    </>
  )
}
