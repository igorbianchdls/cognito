import { Agentset } from 'agentset';

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
      // Try to create or get existing namespace
      const namespaceName = 'cognito-knowledge-base';
      
      console.log('🔍 Creating/getting default namespace:', namespaceName);
      
      const namespace = await this.client!.namespaces.create({
        name: namespaceName,
        description: 'Knowledge base for Cognito application'
      });

      this.defaultNamespaceId = namespace.id;
      console.log('✅ Default namespace ready:', this.defaultNamespaceId);
      
      return this.defaultNamespaceId;
    } catch (error) {
      console.error('❌ Error creating/getting default namespace:', error);
      throw error;
    }
  }

  /**
   * Get a namespace instance for operations
   */
  async getNamespace(namespaceId?: string): Promise<unknown> {
    if (!this.client) {
      await this.initialize();
    }

    const nsId = namespaceId || await this.getDefaultNamespace();
    return this.client!.namespace(nsId);
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
    results?: unknown[];
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

      const searchResults = await namespace.search({
        query: params.query,
        topK: params.topK || 10,
        rerank: params.rerank !== false,
        ...(params.metadata && { metadata: params.metadata })
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
    sources?: unknown[];
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
    namespaces?: unknown[];
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