export type AutomationIdea = {
  emoji: string
  title: string
}

export const AUTOMATION_IDEAS: AutomationIdea[] = [
  { emoji: '🧾', title: 'Consolidar vendas do ERP e enviar resumo diário por WhatsApp/E‑mail' },
  { emoji: '📦', title: 'Conciliar estoque ERP × e‑commerce/marketplaces e alertar divergências' },
  { emoji: '💸', title: 'Cobrança: lembrar boletos em aberto no WhatsApp e atualizar status no ERP' },
  { emoji: '📣', title: 'Avaliar Meta Ads/Google Ads e sugerir ajustes de orçamento todo dia' },
  { emoji: '🛰️', title: 'Telemetria: monitorar sensores (temperatura/GPS) e avisar desvios ao time' },
  { emoji: '🤝', title: 'Captar leads do site/WhatsApp e criar oportunidades no CRM automaticamente' },
  { emoji: '😊', title: 'Ler NPS e tickets; gerar lista de follow‑ups de pós‑venda no ERP' },
  { emoji: '🚚', title: 'Roteirizar pedidos atrasados e notificar clientes com previsão de entrega' },
  { emoji: '📊', title: 'Prever fluxo de caixa com base em vendas e contas a pagar/receber' },
]

export const ADVANCED_AUTOMATION_IDEAS: AutomationIdea[] = [
  { emoji: '🛒', title: 'Carrinho abandonado: WhatsApp + e‑mail + retargeting; reservar item no ERP e liberar ao finalizar' },
  { emoji: '🎯', title: 'Pós‑venda proativo: NPS baixo ou SLA estourado → tarefa no CRM, mensagem no WhatsApp e follow‑up do gerente' },
  { emoji: '📈', title: 'Demanda omnicanal: ERP + Analytics + clima + Ads → previsão e geração automática de pedidos ao fornecedor' },
  { emoji: '💹', title: 'Margem dinâmica: Custo ERP + frete + CPC + conversão → ajustar preço no e‑commerce/marketplaces e pausar campanhas' },
  { emoji: '🎁', title: 'Fidelização: 30 dias sem compra → segmentar LTV, enviar cupom por e‑mail/WhatsApp e criar tarefa se não abrir' },
  { emoji: '🔁', title: 'RMA/Logística: atraso no rastreio → notificar cliente, abrir ticket, ajustar ERP; devolução → gerar RMA e baixa de estoque' },
  { emoji: '🧠', title: 'Leads: unificar formulários/site/WhatsApp, deduplicar e enriquecer; priorizar e criar oportunidades + agendar ligação' },
  { emoji: '📍', title: 'Omnichannel local: footfall/telemetria + POS + campanhas → sugerir escala e aumentar budget por loja/região' },
]
