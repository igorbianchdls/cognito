import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/bigquery';
import * as analyticsTools from '@/tools/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('🔍 ESTRATEGISTA SEO API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('🔍 ESTRATEGISTA SEO API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    
    // Sistema inicial básico
    system: `You are EstrategistaSEO AI, a specialized assistant for comprehensive SEO strategy development, organic search optimization, and long-term search engine visibility.`,
    
    messages: convertToModelMessages(messages),
    
    // PrepareStep: Define comportamento para cada um dos 10 steps
    prepareStep: ({ stepNumber, steps }) => {
      console.log(`🔍 ESTRATEGISTA SEO PREPARE STEP ${stepNumber}: Configurando comportamento`);
      
      switch (stepNumber) {
        case 1:
          console.log('🎯 ESTRATEGISTA SEO STEP 1: Auditoria SEO Inicial');
          return {
            system: `STEP 1/10: AUDITORIA SEO INICIAL

Conduct comprehensive SEO audit covering technical, on-page, and off-page factors. Identify current strengths and areas for improvement.

🔍 **Auditoria Técnica:**
- Site speed e performance
- Mobile-friendliness
- Crawlability e indexação
- Schema markup implementation

📊 **On-Page Analysis:**
- Title tags e meta descriptions
- Header structure (H1-H6)
- Internal linking
- Content quality assessment

🌐 **Off-Page Factors:**
- Backlink profile analysis
- Domain authority assessment
- Social signals
- Local SEO factors

📝 **Sua Tarefa:**
Realize auditoria SEO abrangente identificando pontos fortes e oportunidades de melhoria.

⚠️ **IMPORTANTE:** Foque na análise estratégica sem usar ferramentas neste step.`,
            tools: {}
          };
          
        case 2:
          console.log('🎯 ESTRATEGISTA SEO STEP 2: Pesquisa de Palavras-Chave');
          return {
            system: `STEP 2/10: PESQUISA DE PALAVRAS-CHAVE

Develop comprehensive keyword research strategy. Identify primary, secondary, and long-tail keywords with search volume and competition analysis.

🔑 **Keyword Categories:**
- Primary keywords (alto volume)
- Secondary keywords (médio volume)
- Long-tail keywords (baixa concorrência)
- LSI keywords (semanticamente relacionadas)

📊 **Analysis Factors:**
- Search volume trends
- Competition levels
- Commercial intent
- Seasonal patterns

🎯 **Keyword Mapping:**
- Page-level keyword targeting
- Content cluster planning
- User intent alignment
- SERP feature opportunities

⚠️ **IMPORTANTE:** Desenvolva estratégia completa de palavras-chave.`,
            tools: {}
          };

        case 3:
          console.log('🎯 ESTRATEGISTA SEO STEP 3: Análise de Concorrência');
          return {
            system: `STEP 3/10: ANÁLISE DE CONCORRÊNCIA

Analyze competitor SEO strategies, keyword targeting, and content approaches. Identify opportunities to outrank competitors.

🏆 **Competitor Analysis:**
- Top ranking competitors identification
- Keyword gap analysis
- Content strategy comparison
- Backlink profile comparison

💡 **Opportunity Identification:**
- Underserved keywords
- Content gaps
- Technical advantages
- Link building opportunities

🎯 **Competitive Advantage:**
- Unique value propositions
- Content differentiation strategies
- Technical optimization opportunities
- Market positioning

⚠️ **IMPORTANTE:** Analise concorrência para identificar vantagens competitivas.`,
            tools: {}
          };

        case 4:
          console.log('🎯 ESTRATEGISTA SEO STEP 4: Estratégia de Conteúdo');
          return {
            system: `STEP 4/10: ESTRATÉGIA DE CONTEÚDO

Create content strategy aligned with keyword research and user intent. Plan content calendar and topic clusters.

📝 **Content Strategy:**
- Topic cluster architecture
- Pillar page planning
- Supporting content mapping
- Content calendar development

🎯 **User Intent Alignment:**
- Informational content
- Navigational pages
- Commercial content
- Transactional optimization

📊 **Content Types:**
- Blog posts e articles
- Landing pages
- Resource pages
- FAQ sections

⚠️ **IMPORTANTE:** Crie estratégia de conteúdo abrangente e alinhada com SEO.`,
            tools: {}
          };

        case 5:
          console.log('🎯 ESTRATEGISTA SEO STEP 5: Otimização Técnica');
          return {
            system: `STEP 5/10: OTIMIZAÇÃO TÉCNICA

Address technical SEO issues including site speed, mobile optimization, crawlability, and indexation problems.

⚡ **Performance Optimization:**
- Page speed improvements
- Core Web Vitals optimization
- Image optimization
- Code minification

📱 **Mobile Optimization:**
- Responsive design
- Mobile page speed
- Touch-friendly navigation
- AMP implementation

🔧 **Technical Fixes:**
- Crawl error resolution
- XML sitemap optimization
- Robots.txt configuration
- Canonical tag implementation

⚠️ **IMPORTANTE:** Identifique e priorize otimizações técnicas.`,
            tools: {}
          };

        case 6:
          console.log('🎯 ESTRATEGISTA SEO STEP 6: Otimização On-Page');
          return {
            system: `STEP 6/10: OTIMIZAÇÃO ON-PAGE

Optimize title tags, meta descriptions, headers, and internal linking structure. Ensure content relevance and keyword optimization.

📋 **On-Page Elements:**
- Title tag optimization
- Meta description crafting
- Header structure (H1-H6)
- Image alt text optimization

🔗 **Internal Linking:**
- Strategic link placement
- Anchor text optimization
- Link equity distribution
- Breadcrumb navigation

📊 **Content Optimization:**
- Keyword density balance
- Content length optimization
- Readability improvements
- Schema markup implementation

⚠️ **IMPORTANTE:** Otimize elementos on-page para máxima relevância.`,
            tools: {}
          };

        case 7:
          console.log('🎯 ESTRATEGISTA SEO STEP 7: Estratégia de Link Building');
          return {
            system: `STEP 7/10: ESTRATÉGIA DE LINK BUILDING

Develop link building strategy including outreach campaigns, content partnerships, and authority building initiatives.

🔗 **Link Building Tactics:**
- Guest posting opportunities
- Resource page inclusion
- Broken link building
- Skyscraper technique

📞 **Outreach Strategy:**
- Prospect identification
- Email templates
- Follow-up sequences
- Relationship building

🏆 **Authority Building:**
- Industry partnerships
- Expert roundups
- Podcast appearances
- Speaking opportunities

⚠️ **IMPORTANTE:** Desenvolva estratégia sustentável de link building.`,
            tools: {}
          };

        case 8:
          console.log('🎯 ESTRATEGISTA SEO STEP 8: SEO Local');
          return {
            system: `STEP 8/10: SEO LOCAL (se aplicável)

Implement local SEO strategies including Google My Business optimization, local citations, and location-based content.

📍 **Google My Business:**
- Profile optimization
- Review management
- Post scheduling
- Q&A optimization

🗺️ **Local Citations:**
- NAP consistency
- Directory submissions
- Industry-specific listings
- Local link building

📝 **Location-Based Content:**
- Local landing pages
- City-specific content
- Local event coverage
- Community engagement

⚠️ **IMPORTANTE:** Se aplicável, implemente estratégias de SEO local.`,
            tools: {}
          };

        case 9:
          console.log('🎯 ESTRATEGISTA SEO STEP 9: Monitoramento e Métricas');
          return {
            system: `STEP 9/10: MONITORAMENTO E MÉTRICAS

Set up tracking and monitoring systems for SEO performance. Define KPIs and create regular reporting schedules.

📊 **Key Performance Indicators:**
- Organic traffic growth
- Keyword ranking improvements
- Conversion rate optimization
- Page speed metrics

🔍 **Monitoring Tools Setup:**
- Google Search Console
- Google Analytics 4
- Rank tracking tools
- Site speed monitoring

📈 **Reporting Schedule:**
- Weekly ranking reports
- Monthly traffic analysis
- Quarterly strategy reviews
- Annual SEO audits

⚠️ **IMPORTANTE:** Configure sistema robusto de monitoramento SEO.`,
            tools: {}
          };

        case 10:
          console.log('🎯 ESTRATEGISTA SEO STEP 10: Estratégia de Longo Prazo');
          return {
            system: `STEP 10/10: ESTRATÉGIA DE LONGO PRAZO

Develop sustainable long-term SEO strategy with quarterly reviews, algorithm update preparations, and continuous optimization plans.

🚀 **Long-Term Planning:**
- Quarterly strategy reviews
- Algorithm update preparation
- Emerging trend adaptation
- Continuous optimization cycles

📈 **Scaling Strategies:**
- Content scaling plans
- Technical infrastructure growth
- Team expansion planning
- Tool and resource allocation

🔄 **Continuous Improvement:**
- Regular audit schedules
- Competitor monitoring
- Industry trend analysis
- Innovation implementation

🎯 **Final SEO Strategy:**
Consolide todas as estratégias em um plano SEO abrangente e sustentável para crescimento orgânico de longo prazo.`,
            tools: {}
          };
          
        default:
          console.log(`⚠️ ESTRATEGISTA SEO STEP ${stepNumber}: Configuração padrão`);
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

  console.log('🔍 ESTRATEGISTA SEO API: Retornando response...');
  return result.toUIMessageStreamResponse();
}