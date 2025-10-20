/**
 * BigQueryExecutionPhase - Execute BigQuery API calls
 * 
 * Function copied exactly from CodeEditor.tsx fetch calls
 */

export class BigQueryExecutionPhase {

  /**
   * Execute BigQuery query (copied from CodeEditor fetch pattern)
   */
  static async executeQuery(query: string) {
    const response = await fetch('/api/bigquery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'execute',
        query: query 
      })
    })

    if (!response.ok) {
      const responseText = await response.text()
      throw new Error(`Query failed: ${response.statusText} - ${responseText}`)
    }

    const result = await response.json()
    return result
  }
}