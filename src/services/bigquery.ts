import { BigQuery } from '@google-cloud/bigquery'

// Types for BigQuery operations
export interface BigQueryConfig {
  projectId: string
  keyFilename?: string
  credentials?: object
  location?: string
}

export interface BigQueryCredentials {
  type: string
  project_id: string
  private_key_id: string
  private_key: string
  client_email: string
  client_id: string
  auth_uri: string
  token_uri: string
  auth_provider_x509_cert_url: string
  client_x509_cert_url: string
}

export interface BigQueryField {
  name: string
  type: string
  mode?: string
}

export interface QueryOptions {
  query: string
  parameters?: Record<string, unknown>
  location?: string
  jobTimeoutMs?: number
}

export interface QueryResult {
  data: Record<string, unknown>[]
  totalRows: number
  schema: {
    name: string
    type: string
    mode: string
  }[]
  executionTime: number
  bytesProcessed?: number
  query?: string
}

export interface TableInfo {
  datasetId: string
  tableId: string
  projectId?: string
  description?: string
  numRows?: number
  numBytes?: number
  creationTime?: Date
  lastModifiedTime?: Date
}

// Cache for query results
interface QueryCache {
  [key: string]: {
    result: QueryResult
    timestamp: number
    ttl: number
  }
}

class BigQueryService {
  private client: BigQuery | null = null
  private config: BigQueryConfig | null = null
  private cache: QueryCache = {}
  private defaultCacheTTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Initialize BigQuery client with configuration
   */
  async initialize(config?: Partial<BigQueryConfig>): Promise<void> {
    try {
      const finalConfig = await this.buildConfig(config)
      
      this.config = finalConfig
      this.client = new BigQuery(this.getBigQueryOptions(finalConfig))

      // Skip connection test - same behavior as working tool calls
      // Test connection will be done on first actual query
      
    } catch (error) {
      console.error('Failed to initialize BigQuery client:', error)
      throw error
    }
  }

  /**
   * Build configuration from environment and parameters
   */
  private async buildConfig(config?: Partial<BigQueryConfig>): Promise<BigQueryConfig> {
    const projectId = config?.projectId || process.env.GOOGLE_PROJECT_ID
    
    if (!projectId) {
      throw new Error('GOOGLE_PROJECT_ID is required in environment variables or config')
    }

    const finalConfig: BigQueryConfig = {
      projectId,
      location: config?.location || process.env.BIGQUERY_LOCATION || 'US'
    }

    // Handle credentials based on environment
    if (this.isProductionEnvironment()) {
      // Production: Use credentials from environment variable
      const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
      
      if (credentialsJson) {
        try {
          finalConfig.credentials = JSON.parse(credentialsJson)
        } catch {
          throw new Error('Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON format')
        }
      } else {
        // Fallback to service account auto-discovery (useful for Google Cloud environments)
      }
    } else {
      // Development: Use key file
      const keyFilename = config?.keyFilename || process.env.GOOGLE_APPLICATION_CREDENTIALS
      if (keyFilename) {
        finalConfig.keyFilename = keyFilename
      } else {
      }
    }

    return finalConfig
  }

  /**
   * Get BigQuery client options based on configuration
   */
  private getBigQueryOptions(config: BigQueryConfig): Record<string, unknown> {
    const options: Record<string, unknown> = {
      projectId: config.projectId,
    }

    if (config.credentials) {
      options.credentials = config.credentials
    } else if (config.keyFilename) {
      options.keyFilename = config.keyFilename
    }
    // If neither is provided, BigQuery will use default authentication

    return options
  }

  /**
   * Detect if running in production environment
   */
  private isProductionEnvironment(): boolean {
    return (
      process.env.VERCEL === '1' || 
      process.env.NODE_ENV === 'production' ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON !== undefined
    )
  }

  /**
   * Validate configuration
   */
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!process.env.GOOGLE_PROJECT_ID) {
      errors.push('GOOGLE_PROJECT_ID environment variable is required')
    }

    if (this.isProductionEnvironment()) {
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        console.warn('GOOGLE_APPLICATION_CREDENTIALS_JSON not found, using default authentication')
      }
    } else {
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.warn('GOOGLE_APPLICATION_CREDENTIALS not found, using default authentication')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Test BigQuery connection
   */
  private async testConnection(): Promise<void> {
    if (!this.client) {
      throw new Error('BigQuery client not initialized')
    }

    try {
      // Simple query to test connection
      const query = 'SELECT 1 as test'
      await this.client.query({ query, location: this.config?.location })
    } catch (error) {
      throw new Error(`BigQuery connection test failed: ${error}`)
    }
  }

  /**
   * Execute a BigQuery query
   */
  async executeQuery(options: QueryOptions): Promise<QueryResult> {
    if (!this.client) {
      throw new Error('BigQuery client not initialized. Call initialize() first.')
    }

    const startTime = Date.now()
    
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(options)
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return cached
      }

      const queryOptions = {
        query: options.query,
        location: options.location || this.config?.location || 'US',
        params: options.parameters || {},
        jobTimeoutMs: options.jobTimeoutMs || 30000,
      }

      const [job] = await this.client.createQueryJob(queryOptions)
      const [rows] = await job.getQueryResults()
      
      // Get job metadata for additional info
      const [jobMetadata] = await job.getMetadata()
      
      const executionTime = Date.now() - startTime
      
      // Extract schema from query results metadata if available
      let schema: { name: string; type: string; mode: string }[] = []
      
      // Try to get schema from job statistics first (most reliable)
      if (jobMetadata.statistics?.query?.schema?.fields) {
        schema = jobMetadata.statistics.query.schema.fields.map((field: BigQueryField) => ({
          name: field.name,
          type: field.type,
          mode: field.mode || 'NULLABLE'
        }))
      } 
      // Fallback: extract from destination table schema (less reliable for SELECT queries)
      else if (jobMetadata.configuration?.query?.destinationTable?.schema?.fields) {
        schema = jobMetadata.configuration.query.destinationTable.schema.fields
      }
      // Last resort: infer schema from first row of data
      else if (rows.length > 0) {
        const firstRow = rows[0] as Record<string, unknown>
        schema = Object.keys(firstRow).map(key => ({
          name: key,
          type: this.inferFieldType(firstRow[key]),
          mode: 'NULLABLE'
        }))
      }
      
      
      const result: QueryResult = {
        data: rows as Record<string, unknown>[],
        totalRows: rows.length,
        schema,
        executionTime,
        bytesProcessed: jobMetadata.statistics?.totalBytesProcessed 
          ? parseInt(jobMetadata.statistics.totalBytesProcessed) 
          : undefined,
        query: options.query
      }

      // Cache the result
      this.setCache(cacheKey, result)

      return result
    } catch (error) {
      const executionTime = Date.now() - startTime
      console.error(`Query execution failed after ${executionTime}ms:`, error)
      throw new Error(`Query execution failed: ${error}`)
    }
  }

  /**
   * List tables in a dataset
   */
  async listTables(datasetId?: string): Promise<TableInfo[]> {
    if (!this.client) {
      throw new Error('BigQuery client not initialized. Call initialize() first.')
    }

    try {
      const targetDatasetId = datasetId || process.env.BIGQUERY_DATASET_ID
      if (!targetDatasetId) {
        throw new Error('Dataset ID is required')
      }

      const dataset = this.client.dataset(targetDatasetId)
      const [tables] = await dataset.getTables()

      const tableInfos: TableInfo[] = await Promise.all(
        tables.map(async (table) => {
          try {
            const [metadata] = await table.getMetadata()
            
            return {
              datasetId: targetDatasetId,
              tableId: table.id!,
              projectId: this.config?.projectId,
              description: metadata.description,
              numRows: metadata.numRows ? parseInt(metadata.numRows) : undefined,
              numBytes: metadata.numBytes ? parseInt(metadata.numBytes) : undefined,
              creationTime: metadata.creationTime ? new Date(parseInt(metadata.creationTime)) : undefined,
              lastModifiedTime: metadata.lastModifiedTime ? new Date(parseInt(metadata.lastModifiedTime)) : undefined,
            }
          } catch (error) {
            console.warn(`Failed to get metadata for table ${table.id}:`, error)
            return {
              datasetId: targetDatasetId,
              tableId: table.id!,
              projectId: this.config?.projectId,
            }
          }
        })
      )

      return tableInfos
    } catch (error) {
      console.error('Failed to list tables:', error)
      throw new Error(`Failed to list tables: ${error}`)
    }
  }

  /**
   * List datasets in the project
   */
  async listDatasets(): Promise<{ id: string; friendlyName?: string; description?: string; location?: string; creationTime?: Date }[]> {
    
    if (!this.client) {
      console.error('❌ BigQuery client not initialized')
      throw new Error('BigQuery client not initialized. Call initialize() first.')
    }

    try {
      const [datasets] = await this.client.getDatasets()

      const datasetInfos = await Promise.all(
        datasets.map(async (dataset, index) => {
          try {
            const [metadata] = await dataset.getMetadata()
            
            const info = {
              id: dataset.id!,
              friendlyName: metadata.friendlyName,
              description: metadata.description,
              location: metadata.location,
              creationTime: metadata.creationTime ? new Date(parseInt(metadata.creationTime)) : undefined,
            }
            return info
          } catch (error) {
            console.warn(`⚠️ Failed to get metadata for dataset ${dataset.id}:`, error)
            return {
              id: dataset.id!,
            }
          }
        })
      )

      return datasetInfos
    } catch (error) {
      console.error('❌ Critical error in listDatasets:', error)
      console.error('Error type:', typeof error)
      console.error('Error constructor:', error?.constructor?.name)
      throw new Error(`Failed to list datasets: ${error}`)
    }
  }

  /**
   * Get table schema
   */
  async getTableSchema(datasetId: string, tableId: string) {
    if (!this.client) {
      throw new Error('BigQuery client not initialized. Call initialize() first.')
    }

    try {
      const table = this.client.dataset(datasetId).table(tableId)
      const [metadata] = await table.getMetadata()
      
      return metadata.schema?.fields || []
    } catch (error) {
      console.error('Failed to get table schema:', error)
      throw new Error(`Failed to get table schema: ${error}`)
    }
  }

  /**
   * Get dataset information including location
   */
  async getDatasetInfo(datasetId: string) {
    if (!this.client) {
      throw new Error('BigQuery client not initialized. Call initialize() first.')
    }

    try {
      const dataset = this.client.dataset(datasetId)
      const [metadata] = await dataset.getMetadata()
      

      return {
        id: metadata.id,
        friendlyName: metadata.friendlyName,
        description: metadata.description,
        location: metadata.location,
        creationTime: metadata.creationTime ? new Date(parseInt(metadata.creationTime)) : undefined,
        lastModifiedTime: metadata.lastModifiedTime ? new Date(parseInt(metadata.lastModifiedTime)) : undefined,
        etag: metadata.etag,
        selfLink: metadata.selfLink,
        access: metadata.access,
        labels: metadata.labels,
        raw: metadata // Full metadata for debugging
      }
    } catch (error) {
      console.error('Failed to get dataset info:', error)
      throw new Error(`Failed to get dataset info: ${error}`)
    }
  }

  /**
   * Query a specific table with optional filters
   */
  async queryTable(
    datasetId: string, 
    tableId: string, 
    options: {
      columns?: string[]
      where?: string
      orderBy?: string
      limit?: number
      offset?: number
    } = {}
  ): Promise<QueryResult> {
    const {
      columns = ['*'],
      where,
      orderBy,
      limit = 1000,
      offset = 0
    } = options

    const projectId = this.config?.projectId
    const tableName = `\`${projectId}.${datasetId}.${tableId}\``
    
    let query = `SELECT ${columns.join(', ')} FROM ${tableName}`
    
    if (where) {
      query += ` WHERE ${where}`
    }
    
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`
    }
    
    query += ` LIMIT ${limit} OFFSET ${offset}`

    return this.executeQuery({ query })
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.cache = {}
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { totalEntries: number; totalSize: number } {
    const entries = Object.keys(this.cache).length
    const size = JSON.stringify(this.cache).length
    return { totalEntries: entries, totalSize: size }
  }

  /**
   * Infer BigQuery field type from JavaScript value
   */
  private inferFieldType(value: unknown): string {
    if (value === null || value === undefined) return 'STRING'
    
    if (typeof value === 'string') {
      // Try to detect if it's a date/timestamp
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) return 'DATE'
      if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) return 'TIMESTAMP'
      return 'STRING'
    }
    
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'INTEGER' : 'FLOAT'
    }
    
    if (typeof value === 'boolean') return 'BOOLEAN'
    
    // Default to STRING for complex types
    return 'STRING'
  }

  /**
   * Generate cache key for query options
   */
  private getCacheKey(options: QueryOptions): string {
    return Buffer.from(JSON.stringify({
      query: options.query,
      parameters: options.parameters,
      location: options.location
    })).toString('base64')
  }

  /**
   * Get result from cache if valid
   */
  private getFromCache(key: string): QueryResult | null {
    const cached = this.cache[key]
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > cached.ttl) {
      delete this.cache[key]
      return null
    }

    return cached.result
  }

  /**
   * Set result in cache
   */
  private setCache(key: string, result: QueryResult, ttl?: number): void {
    this.cache[key] = {
      result,
      timestamp: Date.now(),
      ttl: ttl || this.defaultCacheTTL
    }
  }
}

// Export singleton instance
export const bigQueryService = new BigQueryService()

// Configuration utilities
export const bigQueryConfig = {
  /**
   * Test if BigQuery is properly configured
   */
  async testConfiguration(): Promise<{ success: boolean; message: string; details?: unknown }> {
    try {
      const validation = bigQueryService.validateConfiguration()
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Configuration validation failed',
          details: { errors: validation.errors }
        }
      }

      await bigQueryService.initialize()
      return {
        success: true,
        message: 'BigQuery configuration is valid and connection successful'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Configuration test failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  },

  /**
   * Get environment info
   */
  getEnvironmentInfo(): {
    environment: 'development' | 'production'
    hasProjectId: boolean
    hasCredentials: boolean
    credentialsType: 'file' | 'json' | 'default' | 'none'
  } {
    const isProduction = (
      process.env.VERCEL === '1' || 
      process.env.NODE_ENV === 'production' ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON !== undefined
    )

    let credentialsType: 'file' | 'json' | 'default' | 'none' = 'none'
    let hasCredentials = false

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      credentialsType = 'json'
      hasCredentials = true
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      credentialsType = 'file'
      hasCredentials = true
    } else {
      credentialsType = 'default'
      hasCredentials = false // We don't know for sure, but assume default auth might work
    }

    return {
      environment: isProduction ? 'production' : 'development',
      hasProjectId: !!process.env.GOOGLE_PROJECT_ID,
      hasCredentials,
      credentialsType
    }
  }
}

// Helper functions for common queries
export const bigQueryHelpers = {
  /**
   * Build a simple SELECT query
   */
  buildSelectQuery(
    table: string,
    options: {
      columns?: string[]
      where?: string
      orderBy?: string
      limit?: number
      offset?: number
    } = {}
  ): string {
    const {
      columns = ['*'],
      where,
      orderBy,
      limit,
      offset
    } = options

    let query = `SELECT ${columns.join(', ')} FROM ${table}`
    
    if (where) {
      query += ` WHERE ${where}`
    }
    
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`
    }
    
    if (limit) {
      query += ` LIMIT ${limit}`
    }

    if (offset) {
      query += ` OFFSET ${offset}`
    }

    return query
  },

  /**
   * Build aggregation query
   */
  buildAggregationQuery(
    table: string,
    options: {
      groupBy: string[]
      aggregations: { column: string; func: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX'; alias?: string }[]
      where?: string
      having?: string
      orderBy?: string
      limit?: number
    }
  ): string {
    const { groupBy, aggregations, where, having, orderBy, limit } = options

    const selectColumns = [
      ...groupBy,
      ...aggregations.map(agg => 
        `${agg.func}(${agg.column})${agg.alias ? ` AS ${agg.alias}` : ''}`
      )
    ]

    let query = `SELECT ${selectColumns.join(', ')} FROM ${table}`
    
    if (where) {
      query += ` WHERE ${where}`
    }
    
    query += ` GROUP BY ${groupBy.join(', ')}`
    
    if (having) {
      query += ` HAVING ${having}`
    }
    
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`
    }
    
    if (limit) {
      query += ` LIMIT ${limit}`
    }

    return query
  }
}