import { tool } from 'ai';
import { z } from 'zod';
import { agentsetService } from '@/services/agentset';

export const retrieveResult = tool({
  description: 'Retrieve results from RAG search - searches documents in vector database with real semantic search',
  inputSchema: z.object({
    query: z.string().describe('Search query to find relevant documents'),
    topK: z.number().optional().default(10).describe('Number of most relevant documents to retrieve (1-20)'),
    namespaceId: z.string().optional().describe('Optional specific namespace ID to search in')
  }),
  execute: async ({ query, topK = 10, namespaceId }) => {
    console.log('🔍 RAG search tool executed (Nexus):', { query, topK, namespaceId });
    
    try {
      // Initialize agentset service if not already done
      if (!agentsetService['client']) {
        console.log('⚡ Initializing Agentset service...');
        await agentsetService.initialize();
      }

      // Generate answer using RAG real
      console.log('🤖 Generating RAG answer for query:', query);
      
      const result = await agentsetService.generateAnswer({
        query,
        topK,
        namespaceId
      });

      if (!result.success) {
        console.log('❌ RAG search failed:', result.error);
        return {
          resultId: `rag_${Date.now()}`,
          resultType: 'rag',
          result: {
            type: 'rag',
            query,
            response: `Não foi possível encontrar informações relevantes para "${query}".`,
            documentsFound: 0,
            data: {
              message: result.error || 'Failed to search knowledge base',
              searchQuery: query,
              totalDocuments: 0,
              relevantDocuments: 0
            }
          },
          sources: [],
          retrievedAt: new Date().toISOString(),
          success: false,
          error: result.error
        };
      }

      console.log('✅ RAG search completed successfully:', {
        query,
        sourcesCount: result.sources?.length || 0,
        hasAnswer: !!result.answer
      });

      return {
        resultId: `rag_${Date.now()}`,
        resultType: 'rag',
        result: {
          type: 'rag',
          query,
          response: result.answer,
          documentsFound: result.sources?.length || 0,
          data: {
            message: result.answer,
            searchQuery: query,
            totalDocuments: result.sources?.length || 0,
            relevantDocuments: result.sources?.length || 0
          }
        },
        sources: result.sources?.map(source => ({
          id: `src_${Date.now()}_${Math.random()}`,
          title: source.metadata?.title || 'Document',
          url: source.metadata?.url || '#',
          snippet: source.content || source.text || '',
          relevanceScore: source.score || 0
        })) || [],
        retrievedAt: new Date().toISOString(),
        success: true,
        sourcesCount: result.sources?.length || 0
      };

    } catch (error) {
      console.error('❌ Error in RAG search tool:', error);
      return {
        resultId: `rag_${Date.now()}`,
        resultType: 'rag',
        result: {
          type: 'rag',
          query,
          response: `Erro interno ao buscar informações para "${query}".`,
          documentsFound: 0,
          data: {
            message: 'Internal error occurred during search',
            searchQuery: query,
            totalDocuments: 0,
            relevantDocuments: 0
          }
        },
        sources: [],
        retrievedAt: new Date().toISOString(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

export const webPreview = tool({
  description: 'Generate web preview of a URL with iframe and navigation controls',
  inputSchema: z.object({
    url: z.string().describe('The URL to preview'),
  }),
  execute: async ({ url }) => {
    // Mock web preview data
    const mockPreviewData = {
      'ai-sdk.dev': {
        title: 'AI SDK by Vercel',
        description: 'The AI SDK is a TypeScript toolkit designed to help developers build AI-powered applications with React.',
        favicon: 'https://ai-sdk.dev/favicon.ico',
        screenshot: null,
      },
      'github.com': {
        title: 'GitHub',
        description: 'GitHub is where over 100 million developers shape the future of software, together.',
        favicon: 'https://github.githubassets.com/favicons/favicon.svg',
        screenshot: null,
      },
      'google.com': {
        title: 'Google',
        description: 'Search the world\'s information, including webpages, images, videos and more.',
        favicon: 'https://www.google.com/favicon.ico',
        screenshot: null,
      }
    };

    // Extract domain from URL for mock lookup
    const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    const previewData = mockPreviewData[domain as keyof typeof mockPreviewData] || {
      title: 'Web Preview',
      description: `Preview of ${url}`,
      favicon: null,
      screenshot: null,
    };

    // Validate URL format
    const isValidUrl = /^https?:\/\/.+/.test(url);
    
    return {
      url,
      title: previewData.title,
      description: previewData.description,
      favicon: previewData.favicon,
      screenshot: previewData.screenshot,
      isValidUrl,
      previewAvailable: isValidUrl,
      generatedAt: new Date().toISOString(),
      success: true
    };
  },
});

export const displayWeather = tool({
  description: 'Get weather information for a specific location and display it in a beautiful weather card',
  inputSchema: z.object({
    location: z.string().describe('The location to get the weather for'),
  }),
  execute: async ({ location }) => {
    // Simulate weather data
    const temperature = 72 + Math.floor(Math.random() * 21) - 10;
    return {
      location,
      temperature
    };
  },
});