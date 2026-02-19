export type AutomationIdea = {
  emoji: string
  title: string
}

export const AUTOMATION_IDEAS: AutomationIdea[] = [
  { emoji: '🧾', title: 'Quando criar um pedido, gerar NF automaticamente' },
  { emoji: '📉', title: 'Me avisar no WhatsApp quando estoque baixar de 10 unidades' },
  { emoji: '⏰', title: 'Todo dia 8h me mandar um resumo do fluxo de caixa' },
  { emoji: '🛠️', title: 'Quando proposta for aceita, criar OS automaticamente' },
  { emoji: '💸', title: 'Quando conta a receber vencer, enviar cobrança no WhatsApp e registrar follow-up' },
  { emoji: '📤', title: 'Quando gerar fatura, enviar e-mail para o cliente com PDF e link de pagamento' },
  { emoji: '🤝', title: 'Quando lead chegar no WhatsApp, criar oportunidade no CRM e tarefa para vendedor' },
  { emoji: '📦', title: 'Quando fornecedor atrasar entrega, avisar compras e atualizar previsão no ERP' },
  { emoji: '📊', title: 'Toda segunda 9h consolidar DRE simplificada e indicadores de vendas da semana' },
]

export const ADVANCED_AUTOMATION_IDEAS: AutomationIdea[] = [
  { emoji: '🧮', title: 'Fechamento mensal automático: conciliar financeiro, gerar DRE e alertar desvios de margem por cliente' },
  { emoji: '🏦', title: 'Conciliação diária: importar extrato, baixar títulos automaticamente e sinalizar divergências para aprovação' },
  { emoji: '🔁', title: 'Renovação de contratos: 30 dias antes do vencimento, abrir negociação no CRM e disparar proposta de renovação' },
  { emoji: '📬', title: 'Cobrança inteligente: régua por perfil de atraso (D+1, D+3, D+7) com WhatsApp, e-mail e escalonamento' },
  { emoji: '📈', title: 'Previsão de demanda: vendas + sazonalidade + estoque para sugerir compras e evitar ruptura' },
  { emoji: '🧾', title: 'Do pedido ao faturamento: pedido aprovado -> OS -> execução -> NF -> contas a receber sem intervenção manual' },
  { emoji: '👥', title: 'Performance comercial: oportunidade parada há 7 dias cria tarefa, resumo para gestor e próxima ação sugerida' },
  { emoji: '🚨', title: 'SLA operacional: OS perto de estourar prazo gera alerta no chat, notifica responsável e replaneja agenda' },
]
