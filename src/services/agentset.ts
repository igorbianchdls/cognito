import { Agentset } from 'agentset';

// Type for search result items
interface SearchResult {
  content?: string;
  text?: string;
  metadata?: Record<string, unknown>;
  score?: number;
  [key: string]: unknown;
}

// Type for namespace operations based on Agentset documentation
interface AgentsetNamespace {
  search: (
    query: string,
    params?: {
      topK?: number;
      rerank?: boolean;
      includeMetadata?: boolean;
    }
  ) => Promise<SearchResult[]>;
  ingestion: {
    create: (params: {
      payload: {
        type: string;
        fileUrl: string;
        name: string;
      };
      config?: {
        metadata?: Record<string, unknown>;
      };
    }) => Promise<{ id: string }>;
  };
}

class AgentsetService {
  private client: Agentset | null = null;
  private defaultNamespaceId: string | null = null;

  /**
   * Initialize the Agentset client
   */
  async initialize(): Promise<void> {
    if (this.client) return;

    const apiKey = process.env.AGENTSET_API_KEY;
    if (!apiKey) {
      throw new Error('AGENTSET_API_KEY is not configured in environment variables');
    }

    try {
      this.client = new Agentset({
        apiKey: apiKey
      });

      console.log('✅ Agentset service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Agentset service:', error);
      throw error;
    }
  }

  /**
   * Get or create the default namespace for the application
   */
  async getDefaultNamespace(): Promise<string> {
    if (!this.client) {
      await this.initialize();
    }

    if (this.defaultNamespaceId) {
      return this.defaultNamespaceId;
    }

    try {
      const namespaceName = 'cognito-knowledge-base';
      const namespaceSlug = namespaceName.toLowerCase().replace(/\s+/g, '-');
      
      console.log('🔍 Looking for existing namespace:', namespaceName);
      
      // First, try to list existing namespaces
      const existingNamespaces = await this.client!.namespaces.list();
      console.log('📋 Found', existingNamespaces.length, 'existing namespaces');
      
      // Look for our namespace by slug
      const existingNamespace = existingNamespaces.find(
        (ns: { id: string; name: string; slug: string }) => ns.slug === namespaceSlug || ns.name === namespaceName
      );
      
      if (existingNamespace) {
        console.log('✅ Using existing namespace:', {
          id: existingNamespace.id,
          name: existingNamespace.name,
          slug: existingNamespace.slug
        });
        this.defaultNamespaceId = existingNamespace.id;
        return this.defaultNamespaceId;
      }
      
      // If namespace doesn't exist, create it
      console.log('🆕 Creating new namespace:', namespaceName);
      const namespace = await this.client!.namespaces.create({
        name: namespaceName,
        slug: namespaceSlug
      });

      this.defaultNamespaceId = namespace.id;
      console.log('✅ New namespace created:', {
        id: namespace.id,
        name: namespaceName,
        slug: namespaceSlug
      });
      
      return this.defaultNamespaceId;
    } catch (error) {
      console.error('❌ Error with default namespace:', error);
      
      // If error contains "already in use", try to find the existing namespace
      if (error instanceof Error && error.message.includes('already in use')) {
        console.log('⚠️ Namespace already exists, attempting to find it...');
        try {
          const existingNamespaces = await this.client!.namespaces.list();
          const existingNamespace = existingNamespaces.find(
            (ns: { id: string; name: string; slug: string }) => ns.slug === 'cognito-knowledge-base' || ns.name === 'cognito-knowledge-base'
          );
          
          if (existingNamespace) {
            console.log('✅ Found existing namespace after error:', existingNamespace.id);
            this.defaultNamespaceId = existingNamespace.id;
            return this.defaultNamespaceId;
          }
        } catch (listError) {
          console.error('❌ Failed to list namespaces after slug error:', listError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Get a namespace instance for operations
   */
  async getNamespace(namespaceId?: string): Promise<AgentsetNamespace> {
    if (!this.client) {
      await this.initialize();
    }

    const nsId = namespaceId || await this.getDefaultNamespace();
    return this.client!.namespace(nsId) as unknown as AgentsetNamespace;
  }

  /**
   * Perform semantic search in the knowledge base
   */
  async search(params: {
    query: string;
    namespaceId?: string;
    topK?: number;
    rerank?: boolean;
    metadata?: Record<string, unknown>;
  }): Promise<{
    success: boolean;
    results?: SearchResult[];
    error?: string;
  }> {
    try {
      if (!this.client) {
        await this.initialize();
      }

      const namespace = await this.getNamespace(params.namespaceId);
      
      console.log('🔍 Performing RAG search:', {
        query: params.query,
        topK: params.topK || 10,
        rerank: params.rerank || true
      });

      const searchResults = await namespace.search(params.query, {
        topK: params.topK || 10,
        rerank: params.rerank !== false,
        includeMetadata: true
      });

      console.log('✅ RAG search completed:', {
        resultsCount: searchResults.length,
        query: params.query
      });

      return {
        success: true,
        results: searchResults
      };
    } catch (error) {
      console.error('❌ RAG search failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown search error'
      };
    }
  }

  /**
   * Generate contextual answer using AgenticEngine
   */
  async generateAnswer(params: {
    query: string;
    namespaceId?: string;
    model?: unknown;
    topK?: number;
  }): Promise<{
    success: boolean;
    answer?: string;
    sources?: SearchResult[];
    error?: string;
  }> {
    try {
      if (!this.client) {
        await this.initialize();
      }

      await this.getNamespace(params.namespaceId);
      
      console.log('🤖 Generating RAG answer:', {
        query: params.query,
        topK: params.topK || 10
      });

      // Note: AgenticEngine integration would go here
      // For now, we'll use basic search + simple processing
      const searchResult = await this.search({
        query: params.query,
        namespaceId: params.namespaceId,
        topK: params.topK
      });

      if (!searchResult.success || !searchResult.results?.length) {
        return {
          success: false,
          error: 'No relevant documents found for the query'
        };
      }

      // Extract context from search results
      const context = searchResult.results
        .map((result, index) => `[${index + 1}] ${result.content || result.text}`)
        .join('\n\n');

      const answer = `Based on the available documents, here's what I found:\n\n${context}`;

      return {
        success: true,
        answer,
        sources: searchResult.results
      };
    } catch (error) {
      console.error('❌ RAG answer generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown generation error'
      };
    }
  }

  /**
   * Upload a document to the knowledge base
   */
  async uploadDocument(params: {
    fileUrl: string;
    name: string;
    namespaceId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{
    success: boolean;
    jobId?: string;
    error?: string;
  }> {
    try {
      if (!this.client) {
        await this.initialize();
      }

      const namespace = await this.getNamespace(params.namespaceId);
      
      console.log('📄 Uploading document:', {
        name: params.name,
        fileUrl: params.fileUrl
      });

      const ingestJob = await namespace.ingestion.create({
        payload: {
          type: 'FILE',
          fileUrl: params.fileUrl,
          name: params.name
        },
        config: {
          ...(params.metadata && { metadata: params.metadata })
        }
      });

      console.log('✅ Document upload initiated:', {
        jobId: ingestJob.id,
        name: params.name
      });

      return {
        success: true,
        jobId: ingestJob.id
      };
    } catch (error) {
      console.error('❌ Document upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * List all namespaces
   */
  async listNamespaces(): Promise<{
    success: boolean;
    namespaces?: Array<{ id: string; name: string; slug: string }>;
    error?: string;
  }> {
    try {
      if (!this.client) {
        await this.initialize();
      }

      const namespaces = await this.client!.namespaces.list();
      
      return {
        success: true,
        namespaces
      };
    } catch (error) {
      console.error('❌ Failed to list namespaces:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown list error'
      };
    }
  }

  /**
   * Get the raw client for advanced operations
   */
  async getClient(): Promise<Agentset> {
    if (!this.client) {
      await this.initialize();
    }
    return this.client!;
  }
}

// Export singleton instance
export const agentsetService = new AgentsetService();