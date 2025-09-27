'use client';

import InsightsCard from '@/components/widgets/InsightsCard';
import AlertasCard from '@/components/widgets/AlertasCard';
import RecomendacoesCard from '@/components/widgets/RecomendacoesCard';

export default function InsightsTestPage() {
  // Mock data - 5 insights
  const mockInsights = [
    {
      id: 'insight_1',
      titulo: "Conversão mobile aumentou 15%",
      descricao: "Durante a última semana, observamos um aumento significativo nas conversões mobile, especialmente no período noturno entre 20h-22h.",
      dados: "Mobile: 23.4% vs 20.1% (semana anterior)",
      importancia: 'alta' as const,
      timestamp: new Date(),
      source: 'analytics-test'
    },
    {
      id: 'insight_2',
      titulo: "Pico de tráfego às 20h identificado",
      descricao: "Análise de sessões revela concentração de 35% do tráfego diário entre 19h-21h, oportunidade para campanhas direcionadas.",
      dados: "Sessions: 2.847 (pico) vs 1.230 (média)",
      importancia: 'media' as const,
      timestamp: new Date(),
      source: 'analytics-test'
    },
    {
      id: 'insight_3',
      titulo: "Bounce rate melhorou 8%",
      descricao: "Otimizações de UX implementadas na página inicial resultaram em maior engajamento e permanência dos usuários.",
      dados: "Bounce rate: 42% vs 50% (mês anterior)",
      importancia: 'baixa' as const,
      timestamp: new Date(),
      source: 'analytics-test'
    },
    {
      id: 'insight_4',
      titulo: "SEO ranking subiu para posição 3",
      descricao: "Palavra-chave principal atingiu posição 3 no Google, aumentando tráfego orgânico em 28% comparado ao trimestre anterior.",
      dados: "Posição: #3 vs #7 (trimestre anterior)",
      importancia: 'alta' as const,
      timestamp: new Date(),
      source: 'analytics-test'
    },
    {
      id: 'insight_5',
      titulo: "Tempo de carregamento otimizado",
      descricao: "Implementação de CDN e compressão de imagens reduziu tempo de carregamento, melhorando Core Web Vitals.",
      dados: "LCP: 1.2s vs 2.8s (antes da otimização)",
      importancia: 'media' as const,
      timestamp: new Date(),
      source: 'analytics-test'
    }
  ];

  // Mock data - 5 alertas
  const mockAlertas = [
    {
      id: 'alerta_1',
      titulo: "Taxa de abandono crítica no checkout",
      descricao: "Cart abandonment atingiu 78% nas últimas 24h, muito acima do limite aceitável de 70%. Necessária intervenção imediata.",
      dados: "Abandono: 78% vs 65% (média mensal)",
      nivel: 'critico' as const,
      acao: "Revisar processo de checkout e identificar friction points",
      timestamp: new Date(),
      source: 'monitoring-test'
    },
    {
      id: 'alerta_2',
      titulo: "Servidor sobrecarregado em horário de pico",
      descricao: "CPU atingindo 95% de uso durante picos de tráfego, causando lentidão e possíveis timeouts para usuários.",
      dados: "CPU: 95% vs 60% (uso normal)",
      nivel: 'alto' as const,
      acao: "Implementar auto-scaling ou upgrade de infraestrutura",
      timestamp: new Date(),
      source: 'monitoring-test'
    },
    {
      id: 'alerta_3',
      titulo: "Estoque baixo em produtos populares",
      descricao: "5 produtos best-sellers com estoque abaixo de 10 unidades. Risco de perda de vendas e insatisfação do cliente.",
      dados: "Produtos críticos: 5 itens com <10 unidades",
      nivel: 'medio' as const,
      acao: "Contatar fornecedores e acelerar reposição",
      timestamp: new Date(),
      source: 'monitoring-test'
    },
    {
      id: 'alerta_4',
      titulo: "Certificado SSL expira em 15 dias",
      descricao: "Certificado de segurança do site principal vence em 15 dias. Necessário renovar para evitar warnings de segurança.",
      dados: "Expira em: 15 dias (12/01/2024)",
      nivel: 'baixo' as const,
      acao: "Renovar certificado SSL através do provedor",
      timestamp: new Date(),
      source: 'monitoring-test'
    },
    {
      id: 'alerta_5',
      titulo: "Cache não otimizado afeta performance",
      descricao: "Taxa de cache hit está em 65%, abaixo do ideal de 85%. Impacta tempo de resposta e experiência do usuário.",
      dados: "Cache hit: 65% vs 85% (recomendado)",
      nivel: 'medio' as const,
      acao: "Revisar configurações de cache e TTL",
      timestamp: new Date(),
      source: 'monitoring-test'
    }
  ];

  // Mock data - 5 recomendações
  const mockRecomendacoes = [
    {
      id: 'recomendacao_1',
      titulo: "Implementar checkout expresso",
      descricao: "Adicionar opção de compra com 1-click para usuários logados, reduzindo friction e aumentando conversões.",
      impacto: 'alto' as const,
      facilidade: 'medio' as const,
      categoria: "UX/UI",
      proximosPassos: ["Analisar fluxo atual", "Prototipar nova interface", "Implementar backend", "Testes A/B"],
      estimativaResultado: "Aumento de 12-18% na conversão",
      timestamp: new Date(),
      source: 'optimization-test'
    },
    {
      id: 'recomendacao_2',
      titulo: "Sistema de carrinho persistente",
      descricao: "Salvar itens do carrinho entre sessões para reduzir abandono e melhorar experiência do usuário.",
      impacto: 'medio' as const,
      facilidade: 'facil' as const,
      categoria: "Funcionalidade",
      proximosPassos: ["Configurar localStorage", "Sincronizar com backend", "Testar cross-device"],
      estimativaResultado: "Redução de 8-12% no abandono de carrinho",
      timestamp: new Date(),
      source: 'optimization-test'
    },
    {
      id: 'recomendacao_3',
      titulo: "Integração de live chat",
      descricao: "Adicionar chat em tempo real para suporte ao cliente, melhorando satisfação e reduzindo dúvidas pré-compra.",
      impacto: 'alto' as const,
      facilidade: 'dificil' as const,
      categoria: "Atendimento",
      proximosPassos: ["Escolher plataforma", "Treinar equipe", "Integrar com CRM", "Definir horários"],
      estimativaResultado: "Aumento de 15% na satisfação do cliente",
      timestamp: new Date(),
      source: 'optimization-test'
    },
    {
      id: 'recomendacao_4',
      titulo: "Sistema de reviews de produtos",
      descricao: "Permitir avaliações e comentários de clientes nos produtos para aumentar confiança e conversões.",
      impacto: 'medio' as const,
      facilidade: 'facil' as const,
      categoria: "Social Proof",
      proximosPassos: ["Criar interface de review", "Sistema de moderação", "Integrar com email", "Incentivar reviews"],
      estimativaResultado: "Aumento de 10-15% na confiança do cliente",
      timestamp: new Date(),
      source: 'optimization-test'
    },
    {
      id: 'recomendacao_5',
      titulo: "Funcionalidade de wishlist",
      descricao: "Permitir que usuários salvem produtos favoritos para compra futura, aumentando retorno e engajamento.",
      impacto: 'baixo' as const,
      facilidade: 'medio' as const,
      categoria: "Engajamento",
      proximosPassos: ["Desenhar interface", "Implementar persistência", "Email de lembrete", "Análise de uso"],
      estimativaResultado: "Aumento de 5-8% no retorno de usuários",
      timestamp: new Date(),
      source: 'optimization-test'
    }
  ];
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          🔍 Teste de Widgets: Insights, Alertas e Recomendações
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Insights - Props Mode */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              💡 Insights (Props)
            </h2>
            <InsightsCard insights={mockInsights} />
          </div>

          {/* Alertas - Props Mode */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              ⚠️ Alertas (Props)
            </h2>
            <AlertasCard alertas={mockAlertas} />
          </div>

          {/* Recomendações - Props Mode */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              🎯 Recomendações (Props)
            </h2>
            <RecomendacoesCard recomendacoes={mockRecomendacoes} />
          </div>
        </div>
      </div>
    </div>
  );
}