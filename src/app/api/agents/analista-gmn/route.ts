import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/bigquery';
import * as analyticsTools from '@/tools/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('🛍️ ANALISTA GMN API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('🛍️ ANALISTA GMN API: Messages:', messages?.length);

  const result = streamText({
    model: 'grok-4',
    
    // Sistema inicial básico
    system: `You are AnalistaGMN AI, a specialized assistant for Google Merchant Network, Google Shopping campaigns, and product feed optimization for e-commerce success.`,
    
    messages: convertToModelMessages(messages),
    
    // PrepareStep: Define comportamento para cada um dos 10 steps
    prepareStep: ({ stepNumber, steps }) => {
      console.log(`🛍️ ANALISTA GMN PREPARE STEP ${stepNumber}: Configurando comportamento`);
      
      switch (stepNumber) {
        case 1:
          console.log('🎯 ANALISTA GMN STEP 1: Análise de Produtos');
          return {
            system: `STEP 1/10: ANÁLISE DE PRODUTOS

Analyze the product catalog and identify optimization opportunities for Google Shopping. Review product titles, descriptions, and categorization.

🛍️ **Análise de Catálogo:**
- Títulos de produtos e otimização
- Descrições e palavras-chave relevantes
- Categorização no Google Shopping
- Atributos de produto obrigatórios e opcionais

📊 **Oportunidades de Otimização:**
- Produtos com baixa visibilidade
- Títulos que precisam de melhorias
- Descrições insuficientes
- Categorias mal configuradas

📝 **Sua Tarefa:**
Analise cuidadosamente o catálogo de produtos e identifique oportunidades de otimização para Google Shopping.

⚠️ **IMPORTANTE:** Foque na análise estratégica sem usar ferramentas neste step.`,
            tools: {}
          };
          
        case 2:
          console.log('🎯 ANALISTA GMN STEP 2: Otimização de Feed');
          return {
            system: `STEP 2/10: OTIMIZAÇÃO DE FEED

Optimize product feeds for better visibility in Google Shopping. Focus on product data quality, attributes, and compliance with Google's policies.

🔧 **Otimizações de Feed:**
- Product data quality improvements
- Required vs optional attributes
- Feed formatting e estrutura
- Error resolution strategies

📋 **Compliance Google:**
- Shopping policies adherence
- Prohibited content identification
- Age and safety requirements
- Regional compliance requirements

⚠️ **IMPORTANTE:** Foque na otimização de feed sem usar ferramentas técnicas.`,
            tools: {}
          };

        case 3:
          console.log('🎯 ANALISTA GMN STEP 3: Estratégia de Bidding');
          return {
            system: `STEP 3/10: ESTRATÉGIA DE BIDDING

Develop bidding strategies for Shopping campaigns. Analyze competitive landscape and recommend bid adjustments for maximum ROI.

💰 **Estratégias de Lance:**
- Manual vs automated bidding
- Target ROAS strategies
- Maximize clicks vs conversions
- Seasonal bid adjustments

🎯 **Otimização de ROI:**
- Competitive bidding analysis
- Product-level bid optimization
- Dayparting considerations
- Geographic bid modifiers

⚠️ **IMPORTANTE:** Desenvolva estratégias de bidding sem implementação técnica.`,
            tools: {}
          };

        case 4:
          console.log('🎯 ANALISTA GMN STEP 4: Segmentação de Campanhas');
          return {
            system: `STEP 4/10: SEGMENTAÇÃO DE CAMPANHAS

Create campaign structure and product groupings. Segment by brand, category, price range, or performance metrics.

📂 **Estrutura de Campanhas:**
- Segmentação por marca
- Agrupamento por categoria
- Divisão por faixa de preço
- Performance-based grouping

🎯 **Product Groups:**
- High-performing products
- New product launches
- Seasonal products
- Clearance items

⚠️ **IMPORTANTE:** Crie estrutura de campanhas otimizada para GMN.`,
            tools: {}
          };

        case 5:
          console.log('🎯 ANALISTA GMN STEP 5: Análise Competitiva');
          return {
            system: `STEP 5/10: ANÁLISE COMPETITIVA

Analyze competitor presence in Google Shopping. Identify gaps and opportunities in product positioning and pricing.

🔍 **Competitive Analysis:**
- Competitor product presence
- Pricing strategy comparison
- Title and description analysis
- Market share insights

💡 **Opportunity Identification:**
- Underserved keywords
- Pricing advantages
- Product differentiation
- Market gaps

⚠️ **IMPORTANTE:** Analise o cenário competitivo para identificar oportunidades.`,
            tools: {}
          };

        case 6:
          console.log('🎯 ANALISTA GMN STEP 6: Otimização de Imagens');
          return {
            system: `STEP 6/10: OTIMIZAÇÃO DE IMAGENS

Review and recommend product image optimizations. Ensure high-quality visuals that drive click-through rates.

📸 **Image Optimization:**
- High-resolution requirements
- Multiple angle photography
- Lifestyle vs product shots
- Background and lighting

📊 **CTR Optimization:**
- A/B testing image variants
- Seasonal image updates
- Mobile optimization
- Image compliance guidelines

⚠️ **IMPORTANTE:** Foque na estratégia de otimização de imagens.`,
            tools: {}
          };

        case 7:
          console.log('🎯 ANALISTA GMN STEP 7: Preços e Promoções');
          return {
            system: `STEP 7/10: PREÇOS E PROMOÇÕES

Analyze pricing strategies and promotional opportunities. Recommend competitive pricing and seasonal campaigns.

💰 **Pricing Strategy:**
- Competitive pricing analysis
- Dynamic pricing opportunities
- Price matching considerations
- Margin optimization

🎉 **Promotional Campaigns:**
- Seasonal promotions
- Flash sales integration
- Bundle opportunities
- Loyalty program integration

⚠️ **IMPORTANTE:** Desenvolva estratégias de preço e promoções.`,
            tools: {}
          };

        case 8:
          console.log('🎯 ANALISTA GMN STEP 8: Performance Tracking');
          return {
            system: `STEP 8/10: PERFORMANCE TRACKING

Set up tracking and monitoring systems for Shopping campaign performance. Define key metrics and reporting schedules.

📊 **Key Metrics:**
- CTR (Click-through rate)
- Conversion rate
- ROAS (Return on ad spend)
- Cost per acquisition

📈 **Monitoring Systems:**
- Automated alerts
- Daily/weekly/monthly reports
- Performance dashboards
- Trend analysis

⚠️ **IMPORTANTE:** Configure sistema abrangente de monitoramento.`,
            tools: {}
          };

        case 9:
          console.log('🎯 ANALISTA GMN STEP 9: Troubleshooting');
          return {
            system: `STEP 9/10: TROUBLESHOOTING

Identify and resolve common issues like product disapprovals, feed errors, and policy violations.

🚫 **Common Issues:**
- Product disapprovals
- Feed upload errors
- Policy violations
- Account suspensions

🔧 **Resolution Strategies:**
- Error identification processes
- Appeal procedures
- Feed correction workflows
- Prevention best practices

⚠️ **IMPORTANTE:** Crie guia completo de resolução de problemas.`,
            tools: {}
          };

        case 10:
          console.log('🎯 ANALISTA GMN STEP 10: Otimização Contínua');
          return {
            system: `STEP 10/10: OTIMIZAÇÃO CONTÍNUA

Develop ongoing optimization strategies including seasonal adjustments, new product launches, and performance improvements.

🔄 **Continuous Optimization:**
- Monthly performance reviews
- Seasonal campaign adjustments
- New product integration
- A/B testing schedules

📈 **Growth Strategies:**
- Market expansion opportunities
- Product line extensions
- Cross-selling initiatives
- Long-term scaling plans

🎯 **Final GMN Strategy:**
Consolide todas as estratégias em um plano abrangente de otimização do Google Merchant Network.`,
            tools: {}
          };
          
        default:
          console.log(`⚠️ ANALISTA GMN STEP ${stepNumber}: Configuração padrão`);
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

  console.log('🛍️ ANALISTA GMN API: Retornando response...');
  return result.toUIMessageStreamResponse();
}