import { createOpenAI } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  headers: {
    'User-Agent': 'MetaAnalyst-Agent'
  }
});
import * as bigqueryTools from '@/tools/bigquery';
import * as analyticsTools from '@/tools/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('🔍 METAANALYST API: Request recebido!');
  
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    console.log('🔍 METAANALYST API: Messages:', messages?.length);

    console.log('🔍 METAANALYST API: Iniciando Agent SDK OpenAI...');
    const result = streamText({
      model: openai('gpt-5'),
    
    // Sistema inicial básico
    system: `You are MetaAnalyst AI, a specialized assistant for analyzing metadata, data structures, and providing insights about data organization and patterns.`,
    
    messages: convertToModelMessages(messages),
    
    // GPT-5 optimized configuration
    providerOptions: {
      openai: {
        textVerbosity: 'medium',
        reasoningEffort: 'medium'
      }
    },
    
    // PrepareStep: Define comportamento para cada um dos 5 steps
    prepareStep: ({ stepNumber, steps }) => {
      console.log(`🔍 METAANALYST PREPARE STEP ${stepNumber}: Configurando comportamento`);
      
      switch (stepNumber) {
        case 1:
          console.log('🎯 METAANALYST STEP 1: Análise da pergunta');
          return {
            system: `STEP 1/5: ANÁLISE DA PERGUNTA
            
Analise cuidadosamente o que o usuário está pedindo. Como MetaAnalyst, foque em aspectos de metadata e estrutura de dados:
            
🔍 **Foco da Análise:**
- Que insights de metadata eles estão buscando?
- Que estruturas de dados precisam ser examinadas?
- Que padrões na organização de dados eles querem entender?
- Que análise de schema seria útil?
- Estão perguntando sobre qualidade de dados, relacionamentos ou padrões estruturais?
            
📝 **Sua Tarefa:**
Forneça uma análise reflexiva da solicitação do usuário de uma perspectiva de metadata. Explique o que você entende que eles querem e delineie sua abordagem.
            
⚠️ **IMPORTANTE:** NÃO use ferramentas ainda. Foque apenas em entender e planejar.`,
            tools: {} // Remove todas as tools - só análise textual
          };
          
        case 2:
          console.log('🎯 METAANALYST STEP 2: Pegar as colunas');
          return {
            system: `STEP 2/5: PEGAR AS COLUNAS
            
Agora execute APENAS a query para obter informações sobre as colunas da tabela car_prices.
            
🎯 **Sua Tarefa OBRIGATÓRIA:**
Use APENAS a ferramenta executarSQL para executar EXATAMENTE esta query:
            
SELECT 
  column_name,
  data_type
FROM \`creatto-463117.biquery_data.INFORMATION_SCHEMA.COLUMNS\`
WHERE table_name = 'car_prices';
            
📊 **Foco:**
- Execute APENAS a query exata fornecida acima
- NÃO use outras ferramentas como getDatasets, getTables ou outras
- Identifique todas as colunas disponíveis na tabela car_prices
- Analise os tipos de dados de cada coluna
- Prepare contexto para a próxima query de dados
            
🚫 **PROIBIDO ABSOLUTO:**
- NÃO use bigquery-public-data
- NÃO use bigquery-public-data.cars.car_prices  
- NÃO explore outros datasets públicos
            
⚠️ **CRÍTICO:** Use EXCLUSIVAMENTE o dataset \`creatto-463117.biquery_data\` e tabela \`car_prices\`. Este é o ÚNICO dataset permitido.`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };
          
        case 3:
          console.log('🎯 METAANALYST STEP 3: Fazer a query');
          return {
            system: `STEP 3/5: FAZER A QUERY PRINCIPAL
            
Agora execute APENAS uma query SQL para extrair os dados principais da tabela car_prices.
            
🎯 **Sua Tarefa OBRIGATÓRIA:**
Use APENAS a ferramenta executarSQL para recuperar dados da tabela car_prices baseado na solicitação do usuário.
            
📊 **Diretrizes Obrigatórias:**
- SEMPRE use: \`creatto-463117.biquery_data.car_prices\`
- Dataset fixo: creatto-463117.biquery_data
- Tabela fixa: car_prices
- NÃO use ferramentas como getDatasets, getTables, ou outras
- Crie queries que revelem padrões e estruturas dos dados
- Foque em queries relevantes para metadata (distribuições, insights de schema)
- Use as colunas identificadas no step anterior
            
🚫 **PROIBIDO ABSOLUTO:**
- NÃO use bigquery-public-data
- NÃO use bigquery-public-data.cars.car_prices
- NÃO use nenhum dataset público
- NUNCA explore fora de creatto-463117.biquery_data
            
💡 **Exemplos de Abordagens CORRETAS:**
- "SELECT * FROM \`creatto-463117.biquery_data.car_prices\` LIMIT 100"
- "SELECT column1, COUNT(*) FROM \`creatto-463117.biquery_data.car_prices\` GROUP BY column1"
- Analise distribuições e padrões de qualidade dos dados
            
⚠️ **CRÍTICO:** Execute APENAS queries SQL no dataset \`creatto-463117.biquery_data\`. Este é o ÚNICO dataset autorizado.`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };
          
        case 4:
          console.log('🎯 METAANALYST STEP 4: Fazer um gráfico');
          return {
            system: `STEP 4/5: FAZER UM GRÁFICO
            
Crie uma visualização que represente os padrões de metadata e estruturas identificados.
            
🎯 **Sua Tarefa:**
Crie um gráfico que melhor represente os insights de metadata dos steps anteriores.
            
📊 **Diretrizes do Gráfico:**
- Escolha gráficos que mostrem padrões estruturais (gráficos de barras para distribuições, etc.)
- Foque em aspectos de metadata: tipos de campo, qualidade de dados, padrões de schema
- Use dados da query SQL do step 3
- Certifique-se de que a visualização suporte sua análise de metadata
            
⚡ **CRÍTICO: MANIPULAÇÃO EFICIENTE DE DADOS**
Otimize a transferência de dados para economizar tokens:
            
1. **FILTRAR DADOS:** Inclua apenas colunas necessárias para visualização de metadata
2. **LIMITAR REGISTROS:** Use máximo de 50-100 registros para gráficos
3. **Foque em:** agregações e padrões relevantes para metadata`,
            tools: {
              criarGrafico: analyticsTools.criarGrafico
            }
          };
          
        case 5:
          console.log('🎯 METAANALYST STEP 5: Fazer resumo');
          return {
            system: `STEP 5/5: FAZER RESUMO FINAL
            
CRÍTICO: Você executou queries SQL e criou visualizações nos steps anteriores. Agora DEVE fornecer análise abrangente de metadata.
            
📊 **Análise de Metadata Obrigatória:**
- **Padrões de Estrutura de Dados:** Que padrões estruturais emergem dos dados?
- **Insights de Schema:** O que o schema revela sobre a organização dos dados?
- **Indicadores de Qualidade de Dados:** Que padrões de qualidade você pode identificar?
- **Relacionamentos de Metadata:** Como diferentes elementos de dados se relacionam?
- **Padrões Organizacionais:** Que padrões existem na nomenclatura, tipos e estruturas dos dados?
            
🎯 **Áreas de Foco Específicas:**
- Convenções de nomenclatura de campos e consistência
- Distribuições de tipos de dados e adequação
- Padrões de dados ausentes e completude
- Estrutura relacional e padrões de chave estrangeira
- Insights de validação e restrição de dados
            
⚠️ **IMPORTANTE:** 
- Foque em insights de metadata e estruturais ao invés de insights de negócio
- NÃO execute mais ferramentas - foque apenas em analisar dados existentes
- Forneça recomendações técnicas para otimização da estrutura de dados
            
🎨 **Toque Final:**
Forneça recomendações finais de metadata e insights estruturais baseados na análise completa e visualização.`,
            tools: {} // Remove todas as tools - força análise textual apenas
          };
          
        default:
          console.log(`⚠️ METAANALYST STEP ${stepNumber}: Configuração padrão`);
          return {};
      }
    },
    
    // StopWhen simples - máximo 5 steps
    stopWhen: stepCountIs(5),
    tools: {
      // Apenas tools específicas necessárias
      executarSQL: bigqueryTools.executarSQL,
      criarGrafico: analyticsTools.criarGrafico,
    },
  });

    console.log('🔍 METAANALYST API: Agent SDK criado, retornando response...');
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('❌ METAANALYST API ERROR:', error);
    console.error('❌ ERROR STACK:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(`Error: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
  }
}