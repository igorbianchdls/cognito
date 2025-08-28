export interface SQLEditorProps {
  initialSQL?: string;
  onSQLChange?: (sql: string) => void;
  autoExecute?: boolean;
  immediateExecute?: boolean;
  height?: string;
  readOnly?: boolean;
  onAnalyzeWithAI?: (data: Record<string, unknown>[], query: string) => void;
}

export interface QueryResult {
  sqlQuery: string;
  datasetId?: string;
  queryType?: string;
  dryRun?: boolean;
  data: Record<string, unknown>[];
  schema: QuerySchema[];
  rowsReturned: number;
  rowsAffected?: number;
  totalRows?: number;
  executionTime: number;
  bytesProcessed?: number;
  success: boolean;
  validationErrors?: string[];
  error?: string;
}

export interface QuerySchema {
  name: string;
  type: string;
  mode: string;
}

export interface ExecuteSQLRequest {
  sqlQuery: string;
}

export type ExecuteSQLResponse = QueryResult;