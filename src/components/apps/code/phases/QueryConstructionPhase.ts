/**
 * QueryConstructionPhase - Responsible for building SQL queries for BigQuery
 * 
 * This phase contains pure functions that generate SQL query strings
 * based on widget parameters. All functions are stateless and side-effect free.
 */

export type AggregationFunction = 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'COUNT_DISTINCT'

export class QueryConstructionPhase {
  
  private static readonly PROJECT_ID = 'creatto-463117'
  private static readonly DATASET_ID = 'biquery_data'

  /**
   * Build a fully qualified table reference
   */
  private static buildTableReference(tableName: string): string {
    return `\`${this.PROJECT_ID}.${this.DATASET_ID}.${tableName}\``
  }

  /**
   * Sanitize field names to prevent SQL injection and handle spaces
   */
  private static sanitizeFieldName(fieldName: string): string {
    // Remove any potentially dangerous characters and wrap in backticks if needed
    const cleaned = fieldName.replace(/[`'"\\]/g, '')
    
    // If field name contains spaces or special chars, wrap in backticks
    if (/[^a-zA-Z0-9_]/.test(cleaned)) {
      return `\`${cleaned}\``
    }
    
    return cleaned
  }

  /**
   * Build SQL query for KPI widgets
   * 
   * @param table - BigQuery table name
   * @param field - Field to aggregate
   * @param calculation - Aggregation function (SUM, COUNT, etc.)
   * @returns SQL query string
   */
  static buildKPIQuery(table: string, field: string, calculation: string): string {
    const tableRef = this.buildTableReference(table)
    const sanitizedField = this.sanitizeFieldName(field)
    const upperCalculation = calculation.toUpperCase()

    return `SELECT ${upperCalculation}(${sanitizedField}) as value FROM ${tableRef}`
  }

  /**
   * Build SQL query for Chart widgets
   * 
   * @param table - BigQuery table name  
   * @param xField - X-axis field (dimension)
   * @param yField - Y-axis field (measure)
   * @param aggregation - Aggregation function for y-axis
   * @param limit - Maximum number of rows (default: 20)
   * @returns SQL query string
   */
  static buildChartQuery(
    table: string, 
    xField: string, 
    yField: string, 
    aggregation: string,
    limit: number = 20
  ): string {
    const tableRef = this.buildTableReference(table)
    const sanitizedXField = this.sanitizeFieldName(xField)
    const sanitizedYField = this.sanitizeFieldName(yField)
    const upperAggregation = aggregation.toUpperCase()

    return `SELECT ${sanitizedXField}, ${upperAggregation}(${sanitizedYField}) as ${sanitizedYField} FROM ${tableRef} GROUP BY ${sanitizedXField} ORDER BY ${sanitizedYField} DESC LIMIT ${limit}`
  }

  /**
   * Build SQL query for Table widgets
   * 
   * @param table - BigQuery table name
   * @param columns - Array of column names to select  
   * @param limit - Maximum number of rows (default: 100)
   * @returns SQL query string
   */
  static buildTableQuery(table: string, columns: string[], limit: number = 100): string {
    const tableRef = this.buildTableReference(table)
    const sanitizedColumns = columns.map(col => this.sanitizeFieldName(col))

    return `SELECT ${sanitizedColumns.join(', ')} FROM ${tableRef} LIMIT ${limit}`
  }

  /**
   * Build a simple SELECT * query for exploring table structure
   * 
   * @param table - BigQuery table name
   * @param limit - Maximum number of rows (default: 10)
   * @returns SQL query string
   */
  static buildExploreQuery(table: string, limit: number = 10): string {
    const tableRef = this.buildTableReference(table)
    return `SELECT * FROM ${tableRef} LIMIT ${limit}`
  }

  /**
   * Build a query to get table schema information
   * 
   * @param table - BigQuery table name
   * @returns SQL query string to get column information
   */
  static buildSchemaQuery(table: string): string {
    return `SELECT column_name, data_type, is_nullable 
            FROM \`${this.PROJECT_ID}.${this.DATASET_ID}.INFORMATION_SCHEMA.COLUMNS\`
            WHERE table_name = '${table}'
            ORDER BY ordinal_position`
  }

  /**
   * Build a query with WHERE clause for filtering
   * 
   * @param table - BigQuery table name
   * @param columns - Array of column names to select
   * @param whereClause - SQL WHERE condition (already sanitized)
   * @param limit - Maximum number of rows (default: 100)
   * @returns SQL query string
   */
  static buildFilteredQuery(
    table: string, 
    columns: string[], 
    whereClause: string, 
    limit: number = 100
  ): string {
    const tableRef = this.buildTableReference(table)
    const sanitizedColumns = columns.map(col => this.sanitizeFieldName(col))

    return `SELECT ${sanitizedColumns.join(', ')} FROM ${tableRef} WHERE ${whereClause} LIMIT ${limit}`
  }

  /**
   * Validate that a field name is safe for SQL queries
   * 
   * @param fieldName - Field name to validate
   * @returns true if field name is safe, false otherwise
   */
  static isValidFieldName(fieldName: string): boolean {
    // Check for basic SQL injection patterns
    const dangerousPatterns = [
      /;\s*(drop|delete|update|insert|create|alter)/i,
      /--/,
      /\/\*/,
      /\*\//,
      /xp_/i,
      /sp_/i
    ]

    return !dangerousPatterns.some(pattern => pattern.test(fieldName))
  }

  /**
   * Get the project and dataset configuration
   */
  static getConfig() {
    return {
      projectId: this.PROJECT_ID,
      datasetId: this.DATASET_ID
    }
  }
}