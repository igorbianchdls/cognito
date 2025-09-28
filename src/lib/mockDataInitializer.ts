import { addInsights } from '@/stores/widgets/insightsStore'
import { addAlertas } from '@/stores/widgets/alertasStore'
import { addRecomendacoes } from '@/stores/widgets/recomendacoesStore'

// Mock data para insights
const mockInsights = [
  {
    titulo: "Conversões aumentaram 15%",
    descricao: "Campanhas de retargeting no Instagram e Facebook mostraram excelente performance nas últimas 2 semanas.",
    dados: "CTR: 3.2% | CPM: R$12,50 | ROAS: 4.8x",
    importancia: 'alta' as const,
    source: 'optimization-test'
  },
  {
    titulo: "Bounce rate melhorou 8%",
    descricao: "Otimizações de UX implementadas na página inicial resultaram em maior engajamento e permanência dos usuários.",
    dados: "Bounce rate: 42% vs 50% (mês anterior)",
    importancia: 'baixa' as const,
    source: 'optimization-test'
  },
  {
    titulo: "ROI do email marketing subiu 22%",
    descricao: "Segmentação mais precisa e subject lines personalizadas aumentaram significativamente as taxas de abertura.",
    dados: "Open rate: 28% | Click rate: 6.5% | ROI: 122%",
    importancia: 'media' as const,
    source: 'optimization-test'
  }
]

// Mock data para alertas
const mockAlertas = [
  {
    titulo: "Orçamento Google Ads próximo do limite",
    descricao: "Campaign 'Black Friday 2024' está com 85% do orçamento consumido. Considere aumentar o budget ou pausar ads de baixa performance.",
    dados: "Gasto: R$8.500 / R$10.000 | CPA atual: R$45",
    acao: "Revisar palavras-chave com CPC alto e pausar anúncios com CTR < 1%",
    nivel: 'critico' as const,
    source: 'optimization-test'
  },
  {
    titulo: "CTR do Facebook abaixo da média",
    descricao: "Campanha 'Promoção Verão' apresenta CTR de 0.8%, bem abaixo da média de 2.1% do segmento.",
    dados: "CTR: 0.8% vs 2.1% (benchmark) | Impressões: 45k",
    acao: "Testar novos criativos e revisar targeting de audiência",
    nivel: 'alto' as const,
    source: 'optimization-test'
  },
  {
    titulo: "Landing page com alta taxa de saída",
    descricao: "Página de checkout está com 65% de abandono, indicando possíveis problemas de UX ou performance.",
    dados: "Taxa de saída: 65% | Tempo na página: 1m23s",
    acao: "Implementar testes A/B no formulário de checkout",
    nivel: 'medio' as const,
    source: 'optimization-test'
  }
]

// Mock data para recomendações
const mockRecomendacoes = [
  {
    titulo: "Implementar pixel de conversão avançado",
    descricao: "Configurar tracking de eventos personalizados para melhor atribuição e otimização automática das campanhas.",
    impacto: 'alto' as const,
    facilidade: 'medio' as const,
    categoria: "Tracking",
    proximosPassos: ["Mapear eventos de conversão", "Configurar GTM", "Testar implementação", "Validar dados"],
    estimativaResultado: "Melhoria de 20-30% na otimização de campanhas",
    source: 'optimization-test'
  },
  {
    titulo: "Sistema de reviews de produtos",
    descricao: "Permitir avaliações e comentários de clientes nos produtos para aumentar confiança e conversões.",
    impacto: 'medio' as const,
    facilidade: 'facil' as const,
    categoria: "Social Proof",
    proximosPassos: ["Criar interface de review", "Sistema de moderação", "Integrar com email", "Incentivar reviews"],
    estimativaResultado: "Aumento de 10-15% na confiança do cliente",
    source: 'optimization-test'
  },
  {
    titulo: "Funcionalidade de wishlist",
    descricao: "Permitir que usuários salvem produtos favoritos para compra futura, aumentando retorno e engajamento.",
    impacto: 'baixo' as const,
    facilidade: 'medio' as const,
    categoria: "Engajamento",
    proximosPassos: ["Desenhar interface", "Implementar persistência", "Email de lembrete", "Análise de uso"],
    estimativaResultado: "Aumento de 5-8% no retorno de usuários",
    source: 'optimization-test'
  }
]

export function initializeMockData() {
  // Só inicializa se os stores estiverem vazios
  if (typeof window !== 'undefined') {
    // Verificar se já tem dados nos stores
    const hasInsights = localStorage.getItem('cognito-insights')
    const hasAlertas = localStorage.getItem('cognito-alertas')
    const hasRecomendacoes = localStorage.getItem('cognito-recomendacoes')

    // Popular stores vazios com dados mockados
    if (!hasInsights) {
      console.log('📊 Initializing mock insights data...')
      addInsights(mockInsights)
    }

    if (!hasAlertas) {
      console.log('⚠️ Initializing mock alerts data...')
      addAlertas(mockAlertas)
    }

    if (!hasRecomendacoes) {
      console.log('🎯 Initializing mock recommendations data...')
      addRecomendacoes(mockRecomendacoes)
    }
  }
}