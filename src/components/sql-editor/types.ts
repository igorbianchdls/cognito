export interface SQLEditorProps {
  initialSQL?: string;
  onSQLChange?: (sql: string) => void;
  autoExecute?: boolean;
  height?: string;
  readOnly?: boolean;
}

export interface QueryResult {
  data: Record<string, unknown>[];
  schema: QuerySchema[];
  rowsReturned: number;
  executionTime: number;
  bytesProcessed?: number;
  success: boolean;
  error?: string;
  sqlQuery?: string;
}

export interface QuerySchema {
  name: string;
  type: string;
  mode: string;
}

export interface ExecuteSQLRequest {
  sqlQuery: string;
}

export interface ExecuteSQLResponse extends QueryResult {}