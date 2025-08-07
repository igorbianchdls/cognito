import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import axios from 'axios';

export async function POST(req: Request) {
  console.log('🌟🌟🌟 GRAPHRAG CHAT API CALLED 🌟🌟🌟');
  console.log('=== GRAPHRAG CHAT API DEBUG ===');
  console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
  console.log('API Key length:', process.env.ANTHROPIC_API_KEY?.length || 0);
  console.log('API Key starts with:', process.env.ANTHROPIC_API_KEY?.substring(0, 15) || 'N/A');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  
  try {
    const { messages, files } = await req.json();
    console.log('Messages received:', messages?.length || 0);
    console.log('Files received:', files?.length || 0);

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('Missing ANTHROPIC_API_KEY environment variable');
      return new Response(JSON.stringify({ 
        error: 'Anthropic API key not configured',
        details: 'Please set ANTHROPIC_API_KEY in your environment variables'
      }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    let systemPrompt = `Você é um especialista em GraphRAG (Graph-based Retrieval Augmented Generation) e sistemas de IA baseados em grafos de conhecimento. Seu expertise inclui:

## 🔗 **Grafos de Conhecimento:**
- Modelagem de entidades e relacionamentos
- Ontologias e taxonomias
- Bases de conhecimento estruturadas (Neo4j, ArangoDB, etc.)
- Algoritmos de grafos (PageRank, community detection, path finding)

## 🧠 **RAG Avançado:**
- Retrieval Augmented Generation tradicional vs GraphRAG
- Embedding de grafos e representação vetorial de nós
- Técnicas de retrieval baseadas em estrutura e semântica
- Fusão de informações de múltiplos caminhos no grafo

## 🏗️ **Arquiteturas GraphRAG:**
- Pipelines de processamento: Document → Graph → Retrieval → Generation
- Integração com LLMs para geração aumentada por grafos
- Sistemas híbridos (texto + grafo + vetorial)
- Frameworks: LangChain + Neo4j, Microsoft GraphRAG, etc.

## 📊 **Casos de Uso:**
- Sistemas de recomendação baseados em grafos
- Q&A sobre domínios complexos e interconectados
- Análise de relacionamentos em grandes corpora
- Descoberta de conhecimento e insights ocultos

## 🛠️ **Implementação Prática:**
- Extração de entidades e relacionamentos de texto
- Construção automatizada de grafos de conhecimento
- Otimização de queries em grafos para RAG
- Métricas de avaliação específicas para GraphRAG

## 🐍 **ANÁLISE DE DADOS PYTHON COM DAYTONA:**
Você também tem acesso a um sandbox Python seguro via Daytona para análise de dados avançada:

**Comandos especiais que você pode detectar:**
- "analisar vendas" ou "análise python" → Chame a API Daytona
- "gráficos" ou "visualização" → Execute análise com matplotlib  
- "dados" ou "estatísticas" → Análise pandas completa

**Quando detectar solicitação de análise de dados:**
1. Responda que vai executar análise Python no Daytona
2. Chame a API interna para análise
3. Apresente os resultados com insights

Forneça respostas técnicas, práticas e com exemplos de código quando apropriado. Foque em soluções reais e implementáveis.`;

    // Add file context if files are provided
    if (files && files.length > 0) {
      const fileContext = files.map((file: { name?: string; fileType?: string; summary?: string; rowCount?: number; columnCount?: number; content?: string }) => {
        let context = `\n\n**Arquivo: ${file.name}** (${file.fileType?.toUpperCase() || 'UNKNOWN'})`;
        
        if (file.summary) {
          context += `\nResumo: ${file.summary}`;
        }
        
        if (file.rowCount && file.columnCount) {
          context += `\nDimensões: ${file.rowCount} linhas x ${file.columnCount} colunas`;
        }
        
        if (file.content) {
          context += `\nConteúdo (para análise de grafos):\n${file.content.substring(0, 3000)}${file.content.length > 3000 ? '...' : ''}`;
        }
        
        return context;
      }).join('\n');
      
      systemPrompt += `\n\n**CONTEXTO DOS ARQUIVOS PARA ANÁLISE DE GRAFOS:**${fileContext}`;
      systemPrompt += `\n\n*Analise os arquivos fornecidos sob a perspectiva de extração de entidades, relacionamentos e possível modelagem em grafos de conhecimento.*`;
    }

    console.log('System prompt length:', systemPrompt.length);
    console.log('System prompt preview:', systemPrompt.substring(0, 200) + '...');

    // Detectar se o usuário está pedindo análise de dados
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage?.content?.toLowerCase() || '';
    
    console.log('=== DAYTONA DETECTION DEBUG ===');
    console.log('Original message:', lastMessage?.content);
    console.log('Normalized message:', userMessage);
    console.log('Message length:', userMessage.length);
    
    // Palavras-chave para detecção mais flexível
    const analysisKeywords = [
      'analis', 'python', 'dados', 'estatistic', 'vendas', 'grafico', 
      'visualiz', 'pandas', 'matplotlib', 'csv', 'tabela', 'relatorio'
    ];
    
    // Comando de teste forçado
    const isTestCommand = userMessage.includes('daytona_test') || userMessage.includes('teste_python');
    
    // Verificar cada palavra-chave
    const detectedKeywords = analysisKeywords.filter(keyword => userMessage.includes(keyword));
    console.log('Detected keywords:', detectedKeywords);
    console.log('Is test command:', isTestCommand);
    
    const shouldAnalyzeData = isTestCommand || detectedKeywords.length > 0;
    
    console.log('Should analyze data:', shouldAnalyzeData);
    console.log('Reason:', isTestCommand ? 'Test command detected' : `Keywords: ${detectedKeywords.join(', ')}`);

    if (shouldAnalyzeData) {
      console.log('🚀🚀🚀 DAYTONA ANALYSIS TRIGGERED 🚀🚀🚀');
      console.log('=== DAYTONA INTEGRATION DEBUG ===');
      console.log('User message:', userMessage);
      console.log('Should analyze data:', shouldAnalyzeData);
      console.log('Request URL:', req.url);
      console.log('🔥 ABOUT TO CALL DAYTONA API 🔥');
      
      try {
        // Construir URL correta para API Daytona
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://your-domain.com' 
          : 'http://localhost:3000';
        
        const daytonaApiUrl = `${baseUrl}/api/daytona-analysis`;
        console.log('Calling Daytona API at:', daytonaApiUrl);
        
        // Chamar nossa API Daytona
        const daytonaResponse = await axios.post(
          daytonaApiUrl,
          { prompt: userMessage },
          { 
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000 // 1 minuto timeout
          }
        );
        
        console.log('Daytona API response status:', daytonaResponse.status);
        console.log('Daytona API response data:', daytonaResponse.data);

        const analysisResult = daytonaResponse.data;
        console.log('Analysis result parsed:', analysisResult);
        
        // Verificar se a análise foi bem-sucedida
        if (!analysisResult || !analysisResult.success) {
          console.error('Daytona analysis failed:', analysisResult);
          throw new Error(`Daytona analysis failed: ${analysisResult?.error || 'Unknown error'}`);
        }
        
        // Resposta customizada com resultados da análise
        const analysisResponse = `# 🐍 Análise Python Executada no Daytona

Executei uma análise completa dos dados de vendas usando Python com pandas e matplotlib no sandbox Daytona:

## 📊 Resultados da Análise:

${analysisResult.analysis.output}

## 💡 Insights Principais:

${analysisResult.insights.map((insight: string) => `- ${insight}`).join('\n')}

## ⚡ Detalhes Técnicos:
- **Sandbox ID**: ${analysisResult.analysis.sandboxId}
- **Tempo de Execução**: ${analysisResult.analysis.executionTime || 'N/A'}
- **Gráficos Gerados**: ${analysisResult.analysis.charts?.length || 0} visualizações

A análise foi executada de forma segura no ambiente isolado Daytona, utilizando dados de vendas representativos com informações sobre diferentes regiões e produtos ao longo de 6 meses.

---

*Esta análise demonstra a integração entre GraphRAG e processamento Python seguro via Daytona para análises de dados avançadas.*`;

        console.log('Sending analysis response:', analysisResponse.substring(0, 200) + '...');

        // Retornar resposta direta ao invés de stream
        return new Response(analysisResponse, {
          status: 200,
          headers: { 
            'Content-Type': 'text/plain; charset=utf-8',
          }
        });

      } catch (daytonaError: unknown) {
        console.error('=== DAYTONA ERROR DEBUG ===');
        console.error('Error type:', (daytonaError as Error)?.constructor?.name);
        console.error('Error message:', (daytonaError as Error)?.message);
        if (axios.isAxiosError(daytonaError)) {
          console.error('Response status:', daytonaError.response?.status);
          console.error('Response data:', daytonaError.response?.data);
          console.error('Request config:', daytonaError.config);
        }
        console.error('Full error:', daytonaError);
        
        // Continuar com resposta normal do GraphRAG em caso de erro
        console.log('Falling back to normal GraphRAG response');
      }
    }

    const result = await streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxRetries: 3,
    });

    console.log('GraphRAG stream result created successfully');
    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Detailed error in graphrag-chat API:', error);
    console.error('Error stack:', (error as Error).stack);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error in GraphRAG chat',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}