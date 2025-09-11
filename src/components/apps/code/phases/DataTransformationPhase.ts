/**
 * DataTransformationPhase - Transform raw BigQuery data for widgets
 * 
 * All functions copied exactly from CodeEditor.tsx
 */

export class DataTransformationPhase {

  /**
   * Transform KPI data (copied from CodeEditor line 93 and 452)
   */
  static transformKPIData(rawData: Record<string, unknown>[]): number {
    return rawData[0]?.value as number || 0
  }

  /**
   * Transform Chart data (copied from CodeEditor - data is already in correct format)
   */
  static transformChartData(rawData: Record<string, unknown>[]): Record<string, unknown>[] {
    return rawData // Already in correct format
  }

  /**
   * Transform Table data (copied from CodeEditor - data is already in correct format)
   */
  static transformTableData(rawData: Record<string, unknown>[]): Record<string, unknown>[] {
    return rawData // Already in correct format
  }
}