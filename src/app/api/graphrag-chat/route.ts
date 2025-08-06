import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

export async function POST(req: Request) {
  console.log('=== GRAPHRAG CHAT API DEBUG ===');
  console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
  console.log('API Key length:', process.env.ANTHROPIC_API_KEY?.length || 0);
  console.log('API Key starts with:', process.env.ANTHROPIC_API_KEY?.substring(0, 15) || 'N/A');
  
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

    const result = await streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: 4096,
    });

    console.log('GraphRAG stream result created successfully');
    return result.toDataStreamResponse();

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