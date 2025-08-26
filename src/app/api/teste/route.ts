import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as testeTools from '@/tools/testeTools';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('🧪 TESTE API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('🧪 TESTE API: Messages:', messages?.length);

  const result = streamText({
    model: 'openai/gpt-5-mini',
    
    // Sistema inicial básico
    system: `Você é um assistente de teste para workflow de 6 steps.
    
Você deve executar as ferramentas em sequência conforme instruído em cada step.`,
    
    messages: convertToModelMessages(messages),
    
    // PrepareStep: Define comportamento para cada um dos 6 steps
    prepareStep: ({ stepNumber, steps }) => {
      console.log(`📊 PREPARE STEP ${stepNumber}: Configurando comportamento`);
      
      switch (stepNumber) {
        case 1:
          console.log('🎯 STEP 1: Configurando para coleta de dados');
          return {
            system: `STEP 1/6: COLETA DE DADOS
            
Você deve executar a ferramenta 'coletarDados' para iniciar o processo.
            
Use parâmetros apropriados:
- fonte: defina uma fonte de dados relevante
- periodo: opcional, mas recomendado
            
Após executar, explique brevemente o que foi coletado.`
          };
          
        case 2:
          console.log('🎯 STEP 2: Configurando para processamento');
          return {
            system: `STEP 2/6: PROCESSAMENTO DE DADOS
            
Agora execute 'processarDados' usando os dados coletados no step anterior.
            
Use:
- dados: referencie os dados coletados
- metodo: escolha um método adequado
            
Explique brevemente o processamento realizado.`
          };
          
        case 3:
          console.log('🎯 STEP 3: Configurando para análise de padrões');
          return {
            system: `STEP 3/6: ANÁLISE DE PADRÕES
            
Execute 'analisarPadroes' nos dados processados.
            
Use:
- dadosProcessados: referencie dados do step anterior
- algoritmo: escolha algoritmo apropriado
            
Descreva os padrões encontrados.`
          };
          
        case 4:
          console.log('🎯 STEP 4: Configurando para geração de insights');
          return {
            system: `STEP 4/6: GERAÇÃO DE INSIGHTS
            
Execute 'gerarInsights' baseado nos padrões encontrados.
            
Use:
- padroes: referencie padrões do step anterior
- contexto: adicione contexto relevante
            
Explique os insights gerados.`
          };
          
        case 5:
          console.log('🎯 STEP 5: Configurando para criação de relatório');
          return {
            system: `STEP 5/6: CRIAÇÃO DE RELATÓRIO
            
Execute 'criarRelatorio' com todos os insights.
            
Use:
- insights: compile insights dos steps anteriores
- formato: escolha formato adequado
            
Descreva o relatório criado.`
          };
          
        case 6:
          console.log('🎯 STEP 6: Configurando para análise final');
          const allSteps = steps;
          const executedTools: string[] = [];
          
          // Verifica quais tools foram executadas
          allSteps.forEach(step => {
            step.toolResults?.forEach(result => {
              if (!executedTools.includes(result.toolName)) {
                executedTools.push(result.toolName);
              }
            });
          });
          
          console.log('🔍 Tools executadas até agora:', executedTools);
          
          return {
            system: `STEP 6/6: ANÁLISE FINAL OBRIGATÓRIA
            
IMPORTANTE: NÃO execute mais ferramentas. Forneça apenas análise textual.
            
Você deve fornecer uma análise COMPLETA do workflow executado:
            
1. RESUMO DO PROCESSO: Descreva todas as etapas realizadas
2. RESULTADOS OBTIDOS: Compile todos os resultados importantes
3. INSIGHTS PRINCIPAIS: Liste os insights mais relevantes
4. CONCLUSÕES: Forneça conclusões baseadas em todo o processo
5. RECOMENDAÇÕES: Sugira próximos passos ou melhorias
            
A análise deve ter pelo menos 200 palavras e ser detalhada.
            
Tools executadas: ${executedTools.join(', ')}`,
            tools: {} // Remove todas as tools no step final
          };
          
        default:
          console.log(`⚠️ STEP ${stepNumber}: Configuração padrão`);
          return {};
      }
    },
    
    // StopWhen customizado para 6 steps
    stopWhen: [
      stepCountIs(6), // Limite máximo de segurança
      (step) => {
        const currentStep = step.steps.length;
        console.log(`🔍 STOP CHECK: Step atual ${currentStep}`);
        
        // Se chegou no step 6, verifica se análise foi fornecida
        if (currentStep === 6) {
          const lastStep = step.steps[step.steps.length - 1];
          const hasAnalysis = lastStep?.text && lastStep.text.trim().length > 200;
          const hasNoToolCalls = !lastStep?.toolCalls || lastStep.toolCalls.length === 0;
          
          console.log(`📊 ANÁLISE CHECK: Texto: ${lastStep?.text?.length || 0} chars, Sem tools: ${hasNoToolCalls}`);
          
          if (hasAnalysis && hasNoToolCalls) {
            console.log('✅ WORKFLOW COMPLETO: Parando no step 6 com análise');
            return true;
          } else {
            console.log('⏳ AGUARDANDO: Análise insuficiente no step 6');
            return false;
          }
        }
        
        // Continua para steps < 6
        console.log(`🔄 CONTINUANDO: Ainda no step ${currentStep}/6`);
        return false;
      }
    ],
    
    providerOptions: {
      openai: {
        reasoningSummary: 'detailed'
      }
    },
    
    // Tools simuladas para teste
    tools: {
      ...testeTools
    },
  });

  console.log('🧪 TESTE API: Retornando response...');
  return result.toUIMessageStreamResponse();
}