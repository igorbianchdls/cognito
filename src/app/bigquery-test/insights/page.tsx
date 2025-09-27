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

  // Funções para ícones (copiadas dos componentes)
  function getImportanceIcon(importancia: 'alta' | 'media' | 'baixa') {
    switch (importancia) {
      case 'alta':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l1.09 3.26L16 9l-2.91 1.74L12 21l-1.09-3.26L8 15l2.91-1.74L12 3z" />
          </svg>
        );
      case 'media':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'baixa':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      default:
        return null;
    }
  }

  function getNivelIcon(nivel: 'critico' | 'alto' | 'medio' | 'baixo') {
    switch (nivel) {
      case 'critico':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'alto':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'medio':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'baixo':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
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
                  slidesPerView: 1.5,
                },
                768: {
                  slidesPerView: 2,
                },
                1024: {
                  slidesPerView: 3,
                },
              }}
              className="w-full"
            >
              {mockInsights.map((insight, index) => {
                const styles = {
                  alta: { border: 'border-blue-300', bg: 'bg-blue-100', icon: 'text-blue-600', badge: 'bg-blue-200 text-blue-900' },
                  media: { border: 'border-indigo-200', bg: 'bg-indigo-50', icon: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-800' },
                  baixa: { border: 'border-slate-200', bg: 'bg-slate-50', icon: 'text-slate-600', badge: 'bg-slate-100 text-slate-800' }
                }[insight.importancia];

                const cardId = `insight-slider-${index}`;
                const isExpanded = expandedSliderCards[cardId] || false;
                const icon = getImportanceIcon(insight.importancia);

                return (
                  <SwiperSlide key={index}>
                    <div className={`${styles.bg} ${styles.border} border rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${isExpanded ? 'shadow-xl' : 'hover:shadow-md'}`}>
                      {/* Header (sempre visível) */}
                      <div
                        className="p-4 cursor-pointer flex items-center justify-between"
                        onClick={() => toggleSliderExpanded(cardId)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`${styles.icon} flex-shrink-0`}>
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-gray-900 text-sm truncate">
                              {insight.titulo}
                            </h5>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`${styles.badge} px-2 py-1 text-xs font-medium rounded-full ${insight.importancia === 'alta' ? 'animate-pulse' : ''}`}>
                            {insight.importancia}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Content (colapsável) */}
                      <div className={`transition-all duration-300 ease-out ${
                        isExpanded
                          ? 'max-h-screen opacity-100'
                          : 'max-h-0 opacity-0'
                      }`}>
                        <div className="px-4 pb-4 border-t border-gray-100">
                          <div className="pt-3">
                            <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                              {insight.descricao}
                            </p>

                            {insight.dados && (
                              <div className="bg-white/50 rounded p-3 text-xs text-gray-600 font-mono mb-3 border border-gray-200">
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
                  slidesPerView: 1.5,
                },
                768: {
                  slidesPerView: 2,
                },
                1024: {
                  slidesPerView: 3,
                },
              }}
              className="w-full"
            >
              {mockAlertas.map((alerta, index) => {
                const styles = {
                  critico: { border: 'border-red-300', bg: 'bg-red-100', icon: 'text-red-600', badge: 'bg-red-200 text-red-900' },
                  alto: { border: 'border-red-200', bg: 'bg-red-50', icon: 'text-red-600', badge: 'bg-red-100 text-red-800' },
                  medio: { border: 'border-orange-200', bg: 'bg-orange-50', icon: 'text-orange-600', badge: 'bg-orange-100 text-orange-800' },
                  baixo: { border: 'border-red-300', bg: 'bg-red-200', icon: 'text-red-900', badge: 'bg-red-300 text-red-900' }
                }[alerta.nivel];

                const cardId = `alerta-slider-${index}`;
                const isExpanded = expandedSliderCards[cardId] || false;
                const icon = getNivelIcon(alerta.nivel);

                return (
                  <SwiperSlide key={index}>
                    <div className={`${styles.bg} ${styles.border} border rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${alerta.nivel === 'critico' ? 'ring-2 ring-red-300 shadow-red-500/20' : ''} ${isExpanded ? 'shadow-xl' : 'hover:shadow-md'}`}>
                      {/* Header (sempre visível) */}
                      <div
                        className="p-4 cursor-pointer flex items-center justify-between"
                        onClick={() => toggleSliderExpanded(cardId)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`${styles.icon} flex-shrink-0`}>
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-gray-900 text-sm truncate">
                              {alerta.titulo}
                            </h5>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`${styles.badge} px-2 py-1 text-xs font-medium rounded-full ${alerta.nivel === 'critico' ? 'animate-pulse' : ''}`}>
                            {alerta.nivel}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Content (colapsável) */}
                      <div className={`transition-all duration-300 ease-out ${
                        isExpanded
                          ? 'max-h-screen opacity-100'
                          : 'max-h-0 opacity-0'
                      }`}>
                        <div className="px-4 pb-4 border-t border-gray-100">
                          <div className="pt-3">
                            <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                              {alerta.descricao}
                            </p>

                            {alerta.dados && (
                              <div className="bg-white/50 rounded p-3 text-xs text-gray-600 font-mono mb-3 border border-gray-200">
                                📊 {alerta.dados}
                              </div>
                            )}

                            {alerta.acao && (
                              <div className="bg-white/70 rounded p-3 text-xs text-gray-700 border-l-4 border-indigo-400 mb-3">
                                <div className="font-medium text-indigo-800 mb-1">💡 Ação:</div>
                                <div>{alerta.acao}</div>
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
                  slidesPerView: 1.5,
                },
                768: {
                  slidesPerView: 2,
                },
                1024: {
                  slidesPerView: 3,
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
                        className="p-4 cursor-pointer flex items-center justify-between"
                        onClick={() => toggleSliderExpanded(cardId)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-shrink-0">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-gray-900 text-sm truncate">
                              {recomendacao.titulo}
                            </h5>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`${impactoStyles.badge} px-2 py-1 text-xs font-medium rounded-full ${recomendacao.impacto === 'alto' ? 'animate-pulse' : ''}`}>
                            {recomendacao.impacto}
                          </span>
                          <span className={`${facilidadeStyles} px-2 py-1 text-xs font-medium rounded-full`}>
                            {recomendacao.facilidade}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Content (colapsável) */}
                      <div className={`transition-all duration-300 ease-out ${
                        isExpanded
                          ? 'max-h-screen opacity-100'
                          : 'max-h-0 opacity-0'
                      }`}>
                        <div className="px-4 pb-4 border-t border-gray-100">
                          <div className="pt-3">
                            <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                              {recomendacao.descricao}
                            </p>

                            {recomendacao.categoria && (
                              <div className="bg-white/50 rounded p-3 text-xs text-gray-600 mb-3 border border-gray-200">
                                🏷️ {recomendacao.categoria}
                              </div>
                            )}

                            {recomendacao.estimativaResultado && (
                              <div className="bg-white/70 rounded p-3 text-xs text-gray-700 border-l-4 border-purple-400 mb-3">
                                <div className="font-medium text-purple-800 mb-1">📈 Resultado:</div>
                                <div>{recomendacao.estimativaResultado}</div>
                              </div>
                            )}

                            {recomendacao.proximosPassos && recomendacao.proximosPassos.length > 0 && (
                              <div className="bg-white/50 rounded p-3 text-xs text-gray-600 border border-gray-200">
                                <div className="font-medium mb-2">📝 Próximos Passos:</div>
                                <ul className="list-disc list-inside space-y-1">
                                  {recomendacao.proximosPassos.map((passo, i) => (
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