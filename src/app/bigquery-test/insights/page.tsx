'use client';

import InsightsCard from '@/components/widgets/InsightsCard';
import AlertasCard from '@/components/widgets/AlertasCard';
import RecomendacoesCard from '@/components/widgets/RecomendacoesCard';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Virtual, Navigation, Pagination } from 'swiper/modules';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/virtual';

export default function InsightsTestPage() {
  const [expandedSliderCards, setExpandedSliderCards] = useState<Record<string, boolean>>({})

  const toggleSliderExpanded = (id: string) => {
    setExpandedSliderCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          🔍 Teste de Widgets: Insights, Alertas e Recomendações
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Insights - Props Mode */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              💡 Insights (Props)
            </h2>
            <InsightsCard insights={mockInsights} />
          </div>

          {/* Alertas - Props Mode */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              ⚠️ Alertas (Props)
            </h2>
            <AlertasCard alertas={mockAlertas} />
          </div>

          {/* Recomendações - Props Mode */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              🎯 Recomendações (Props)
            </h2>
            <RecomendacoesCard recomendacoes={mockRecomendacoes} />
          </div>
        </div>

        {/* Nova Seção: Sliders Horizontais */}
        <div className="mt-16 space-y-12">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            🎠 Visualização em Sliders Horizontais
          </h1>

          {/* Slider de Insights */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
              💡 Insights
            </h2>
            <Swiper
              modules={[Navigation, Pagination]}
              navigation
              pagination={{ clickable: true }}
              spaceBetween={15}
              slidesPerView={1}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                },
                768: {
                  slidesPerView: 3,
                },
                1024: {
                  slidesPerView: 4,
                },
              }}
              className="w-full"
            >
              {mockInsights.map((insight, index) => {
                const styles = {
                  alta: { border: 'border-blue-300', bg: 'bg-blue-100', badge: 'bg-blue-200 text-blue-900' },
                  media: { border: 'border-indigo-200', bg: 'bg-indigo-50', badge: 'bg-indigo-100 text-indigo-800' },
                  baixa: { border: 'border-slate-200', bg: 'bg-slate-50', badge: 'bg-slate-100 text-slate-800' }
                }[insight.importancia];

                const cardId = `insight-slider-${index}`;
                const isExpanded = expandedSliderCards[cardId] || false;

                return (
                  <SwiperSlide key={index}>
                    <div className={`${styles.bg} ${styles.border} border rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${isExpanded ? 'shadow-xl' : 'hover:shadow-md'}`}>
                      {/* Header (sempre visível) */}
                      <div
                        className="p-3 cursor-pointer flex items-center justify-between"
                        onClick={() => toggleSliderExpanded(cardId)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-xs leading-tight truncate">
                            {insight.titulo}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`${styles.badge} px-2 py-1 text-xs font-medium rounded-full ${insight.importancia === 'alta' ? 'animate-pulse' : ''}`}>
                            {insight.importancia}
                          </span>
                          <ChevronDown
                            className={`h-3 w-3 text-gray-500 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Content (colapsável) */}
                      <div className={`transition-all duration-300 ease-out ${
                        isExpanded
                          ? 'max-h-96 opacity-100'
                          : 'max-h-0 opacity-0'
                      }`}>
                        <div className="px-3 pb-3 border-t border-gray-100">
                          <div className="pt-3">
                            <p className="text-gray-700 text-xs mb-3 leading-relaxed">
                              {insight.descricao}
                            </p>

                            {insight.dados && (
                              <div className="bg-white/50 rounded p-2 text-xs text-gray-600 font-mono border border-gray-200">
                                📊 {insight.dados}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>

          {/* Slider de Alertas */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
              ⚠️ Alertas
            </h2>
            <Swiper
              modules={[Navigation, Pagination]}
              navigation
              pagination={{ clickable: true }}
              spaceBetween={15}
              slidesPerView={1}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                },
                768: {
                  slidesPerView: 3,
                },
                1024: {
                  slidesPerView: 4,
                },
              }}
              className="w-full"
            >
              {mockAlertas.map((alerta, index) => {
                const styles = {
                  critico: { border: 'border-red-300', bg: 'bg-red-100', badge: 'bg-red-200 text-red-900' },
                  alto: { border: 'border-red-200', bg: 'bg-red-50', badge: 'bg-red-100 text-red-800' },
                  medio: { border: 'border-orange-200', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800' },
                  baixo: { border: 'border-red-300', bg: 'bg-red-200', badge: 'bg-red-300 text-red-900' }
                }[alerta.nivel];

                const cardId = `alerta-slider-${index}`;
                const isExpanded = expandedSliderCards[cardId] || false;

                return (
                  <SwiperSlide key={index}>
                    <div className={`${styles.bg} ${styles.border} border rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${alerta.nivel === 'critico' ? 'ring-2 ring-red-300 shadow-red-500/20' : ''} ${isExpanded ? 'shadow-xl' : 'hover:shadow-md'}`}>
                      {/* Header (sempre visível) */}
                      <div
                        className="p-3 cursor-pointer flex items-center justify-between"
                        onClick={() => toggleSliderExpanded(cardId)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-xs leading-tight truncate">
                            {alerta.titulo}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`${styles.badge} px-2 py-1 text-xs font-medium rounded-full ${alerta.nivel === 'critico' ? 'animate-pulse' : ''}`}>
                            {alerta.nivel}
                          </span>
                          <ChevronDown
                            className={`h-3 w-3 text-gray-500 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Content (colapsável) */}
                      <div className={`transition-all duration-300 ease-out ${
                        isExpanded
                          ? 'max-h-96 opacity-100'
                          : 'max-h-0 opacity-0'
                      }`}>
                        <div className="px-3 pb-3 border-t border-gray-100">
                          <div className="pt-3">
                            <p className="text-gray-700 text-xs mb-3 leading-relaxed">
                              {alerta.descricao}
                            </p>

                            {alerta.dados && (
                              <div className="bg-white/50 rounded p-2 text-xs text-gray-600 font-mono mb-2 border border-gray-200">
                                📊 {alerta.dados}
                              </div>
                            )}

                            {alerta.acao && (
                              <div className="bg-white/70 rounded p-2 text-xs text-gray-700 border-l-2 border-indigo-400">
                                <span className="font-medium text-indigo-800">💡 Ação:</span> {alerta.acao}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>

          {/* Slider de Recomendações */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
              🎯 Recomendações
            </h2>
            <Swiper
              modules={[Navigation, Pagination]}
              navigation
              pagination={{ clickable: true }}
              spaceBetween={15}
              slidesPerView={1}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                },
                768: {
                  slidesPerView: 3,
                },
                1024: {
                  slidesPerView: 4,
                },
              }}
              className="w-full"
            >
              {mockRecomendacoes.map((recomendacao, index) => {
                const impactoStyles = {
                  alto: { border: 'border-green-300', bg: 'bg-green-100', badge: 'bg-green-200 text-green-900' },
                  medio: { border: 'border-yellow-200', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800' },
                  baixo: { border: 'border-gray-200', bg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-800' }
                }[recomendacao.impacto];

                const facilidadeStyles = {
                  facil: 'bg-emerald-100 text-emerald-800',
                  medio: 'bg-amber-100 text-amber-800',
                  dificil: 'bg-rose-100 text-rose-800'
                }[recomendacao.facilidade];

                const cardId = `recomendacao-slider-${index}`;
                const isExpanded = expandedSliderCards[cardId] || false;

                return (
                  <SwiperSlide key={index}>
                    <div className={`${impactoStyles.bg} ${impactoStyles.border} border rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${isExpanded ? 'shadow-xl' : 'hover:shadow-md'}`}>
                      {/* Header (sempre visível) */}
                      <div
                        className="p-3 cursor-pointer flex items-center justify-between"
                        onClick={() => toggleSliderExpanded(cardId)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-xs leading-tight truncate">
                            {recomendacao.titulo}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="flex gap-1">
                            <span className={`${impactoStyles.badge} px-1.5 py-0.5 text-xs font-medium rounded-full ${recomendacao.impacto === 'alto' ? 'animate-pulse' : ''}`}>
                              {recomendacao.impacto}
                            </span>
                            <span className={`${facilidadeStyles} px-1.5 py-0.5 text-xs font-medium rounded-full`}>
                              {recomendacao.facilidade}
                            </span>
                          </div>
                          <ChevronDown
                            className={`h-3 w-3 text-gray-500 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Content (colapsável) */}
                      <div className={`transition-all duration-300 ease-out ${
                        isExpanded
                          ? 'max-h-96 opacity-100'
                          : 'max-h-0 opacity-0'
                      }`}>
                        <div className="px-3 pb-3 border-t border-gray-100">
                          <div className="pt-3">
                            <p className="text-gray-700 text-xs mb-3 leading-relaxed">
                              {recomendacao.descricao}
                            </p>

                            {recomendacao.categoria && (
                              <div className="bg-white/50 rounded p-2 text-xs text-gray-600 mb-2 border border-gray-200">
                                🏷️ {recomendacao.categoria}
                              </div>
                            )}

                            {recomendacao.estimativaResultado && (
                              <div className="bg-white/70 rounded p-2 text-xs text-gray-700 border-l-2 border-purple-400">
                                <span className="font-medium text-purple-800">📈 Resultado:</span> {recomendacao.estimativaResultado}
                              </div>
                            )}

                            {recomendacao.proximosPassos && recomendacao.proximosPassos.length > 0 && (
                              <div className="bg-white/50 rounded p-2 text-xs text-gray-600 mt-2 border border-gray-200">
                                <span className="font-medium">📝 Próximos Passos:</span>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                  {recomendacao.proximosPassos.slice(0, 2).map((passo, i) => (
                                    <li key={i}>{passo}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        </div>
      </div>
    </div>
  );
}