import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/bigquery';
import * as analyticsTools from '@/tools/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('📊 CRIADOR DE DASHBOARD API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('📊 CRIADOR DE DASHBOARD API: Messages:', messages?.length);

  const result = streamText({
    model: 'grok-4',
    
    // Sistema inicial básico
    system: `You are CriadorDeDashboard AI, a specialized assistant for creating comprehensive dashboards and data visualization strategies for business intelligence and analytics.`,
    
    messages: convertToModelMessages(messages),
    
    // PrepareStep: Define comportamento para cada um dos 10 steps
    prepareStep: ({ stepNumber, steps }) => {
      console.log(`📊 CRIADOR DE DASHBOARD PREPARE STEP ${stepNumber}: Configurando comportamento`);
      
      switch (stepNumber) {
        case 1:
          console.log('🎯 CRIADOR DE DASHBOARD STEP 1: Análise de Requisitos');
          return {
            system: `STEP 1/10: ANÁLISE DE REQUISITOS

Analyze the user's dashboard requirements. Understand what data they want to visualize, who the target audience is, and what business decisions this dashboard should support.

📊 **Foco da Análise:**
- Que dados precisam ser visualizados?
- Quem é o público-alvo do dashboard?
- Que decisões de negócio este dashboard deve apoiar?
- Qual a frequência de uso esperada?

📝 **Sua Tarefa:**
Analise cuidadosamente os requisitos do usuário para criação de dashboard e forneça uma compreensão clara dos objetivos.

⚠️ **IMPORTANTE:** Não use ferramentas neste step. Foque apenas na análise e compreensão dos requisitos.`,
            tools: {} // Remove todas as tools
          };
          
        case 2:
          console.log('🎯 CRIADOR DE DASHBOARD STEP 2: Definição de Métricas');
          return {
            system: `STEP 2/10: DEFINIÇÃO DE MÉTRICAS

Define the key performance indicators (KPIs) and metrics that should be displayed. Categorize them by priority and relevance to business objectives.

📊 **Métricas a Definir:**
- KPIs primários e secundários
- Métricas de performance
- Indicadores de tendência
- Alertas e limites críticos

🎯 **Categorização:**
- Por prioridade (Alta, Média, Baixa)
- Por departamento/área
- Por tipo de visualização recomendada

⚠️ **IMPORTANTE:** Foque na definição estratégica das métricas sem usar ferramentas.`,
            tools: {}
          };

        case 3:
          console.log('🎯 CRIADOR DE DASHBOARD STEP 3: Estrutura do Dashboard');
          return {
            system: `STEP 3/10: ESTRUTURA DO DASHBOARD

Design the overall structure and layout of the dashboard. Define sections, hierarchy, and information flow for optimal user experience.

🏗️ **Estrutura a Definir:**
- Layout geral (grid, seções)
- Hierarquia de informações
- Fluxo de navegação
- Posicionamento de elementos críticos

📐 **Design Principles:**
- Princípio da pirâmide invertida
- Lei de Fitts para elementos interativos
- Gestalt principles para agrupamento
- Mobile-first considerations

⚠️ **IMPORTANTE:** Descreva a estrutura detalhadamente sem usar ferramentas.`,
            tools: {}
          };

        case 4:
          console.log('🎯 CRIADOR DE DASHBOARD STEP 4: Seleção de Visualizações');
          return {
            system: `STEP 4/10: SELEÇÃO DE VISUALIZAÇÕES

Choose the most appropriate chart types and visualization methods for each metric. Consider bar charts, line graphs, pie charts, heatmaps, gauges, etc.

📈 **Tipos de Visualização:**
- Gráficos de linha para tendências temporais
- Gráficos de barras para comparações
- Gauges para KPIs em tempo real
- Heatmaps para correlações
- Tabelas para dados detalhados

🎨 **Critérios de Seleção:**
- Tipo de dado (categórico, numérico, temporal)
- Objetivo da visualização
- Audiência e expertise técnica
- Limitações de espaço

⚠️ **IMPORTANTE:** Recomende visualizações específicas para cada métrica definida.`,
            tools: {}
          };

        case 5:
          console.log('🎯 CRIADOR DE DASHBOARD STEP 5: Design de Interface');
          return {
            system: `STEP 5/10: DESIGN DE INTERFACE

Create the visual design including color schemes, typography, spacing, and overall aesthetic that aligns with brand guidelines.

🎨 **Elementos de Design:**
- Paleta de cores (primárias, secundárias, de alerta)
- Tipografia (hierarquia de fontes)
- Espaçamento e grid system
- Consistência visual

🏢 **Brand Alignment:**
- Cores da marca
- Fontes corporativas
- Elementos visuais consistentes
- Guidelines de design

⚠️ **IMPORTANTE:** Crie especificações detalhadas de design visual.`,
            tools: {}
          };

        case 6:
          console.log('🎯 CRIADOR DE DASHBOARD STEP 6: Interatividade e Filtros');
          return {
            system: `STEP 6/10: INTERATIVIDADE E FILTROS

Define interactive elements like filters, drill-downs, date ranges, and dynamic components that enhance user engagement.

🔄 **Elementos Interativos:**
- Filtros por data, categoria, região
- Drill-down capabilities
- Hover effects e tooltips
- Zoom e pan em gráficos

⚡ **Funcionalidades Dinâmicas:**
- Atualização em tempo real
- Cross-filtering entre componentes
- Export de dados e visualizações
- Bookmarking de views específicas

⚠️ **IMPORTANTE:** Defina a experiência de usuário interativa sem implementação técnica.`,
            tools: {}
          };

        case 7:
          console.log('🎯 CRIADOR DE DASHBOARD STEP 7: Responsividade');
          return {
            system: `STEP 7/10: RESPONSIVIDADE

Ensure the dashboard works across different devices and screen sizes. Plan mobile-first approach when necessary.

📱 **Breakpoints:**
- Mobile (320px-768px)
- Tablet (768px-1024px)
- Desktop (1024px+)
- Large screens (1440px+)

🔄 **Adaptações por Dispositivo:**
- Reorganização de layout
- Simplificação de visualizações
- Touch-friendly interactions
- Performance considerations

⚠️ **IMPORTANTE:** Planeje a adaptabilidade para diferentes dispositivos.`,
            tools: {}
          };

        case 8:
          console.log('🎯 CRIADOR DE DASHBOARD STEP 8: Performance e Otimização');
          return {
            system: `STEP 8/10: PERFORMANCE E OTIMIZAÇÃO

Consider data loading times, refresh rates, and performance optimization strategies for large datasets.

⚡ **Otimizações de Performance:**
- Lazy loading de componentes
- Data pagination e virtualization
- Caching strategies
- Efficient data queries

📊 **Data Management:**
- Real-time vs batch updates
- Data aggregation levels
- Historical data retention
- Error handling e fallbacks

⚠️ **IMPORTANTE:** Foque em estratégias de otimização sem implementação técnica.`,
            tools: {}
          };

        case 9:
          console.log('🎯 CRIADOR DE DASHBOARD STEP 9: Testes e Validação');
          return {
            system: `STEP 9/10: TESTES E VALIDAÇÃO

Plan user testing scenarios and validation methods to ensure the dashboard meets business requirements.

🧪 **Estratégias de Teste:**
- User acceptance testing (UAT)
- A/B testing de layouts
- Performance testing
- Accessibility testing

📝 **Validação:**
- Feedback loops com stakeholders
- Métricas de uso e adoção
- Validation against business requirements
- Iterative improvement process

⚠️ **IMPORTANTE:** Crie plano de testes e validação abrangente.`,
            tools: {}
          };

        case 10:
          console.log('🎯 CRIADOR DE DASHBOARD STEP 10: Documentação e Entrega');
          return {
            system: `STEP 10/10: DOCUMENTAÇÃO E ENTREGA

Provide comprehensive documentation including user guides, technical specifications, and maintenance procedures.

📚 **Documentação Completa:**
- User manual e guias de uso
- Especificações técnicas
- Procedimentos de manutenção
- Troubleshooting guide

🚀 **Entrega:**
- Deployment strategy
- Training materials
- Support procedures
- Future enhancement roadmap

🎯 **Final Dashboard Strategy:**
Consolide todas as especificações em uma estratégia completa de dashboard pronta para implementação.`,
            tools: {}
          };
          
        default:
          console.log(`⚠️ CRIADOR DE DASHBOARD STEP ${stepNumber}: Configuração padrão`);
          return {};
      }
    },
    
    // StopWhen simples - máximo 10 steps
    stopWhen: stepCountIs(10),
    providerOptions: {
      anthropic: {
        thinking: { type: 'enabled', budgetTokens: 15000 }
      }
    },
    headers: {
      'anthropic-beta': 'interleaved-thinking-2025-05-14'
    },
    tools: {
      // BigQuery tools
      ...bigqueryTools,
      // Analytics tools  
      ...analyticsTools,
      // Utilities tools
      ...utilitiesTools,
    },
  });

  console.log('📊 CRIADOR DE DASHBOARD API: Retornando response...');
  return result.toUIMessageStreamResponse();
}