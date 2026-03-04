export type SqlExecutionRowValue = string | number | boolean | null | undefined

export type SqlExecutionRow = Record<string, SqlExecutionRowValue>

export type SqlExecutionToolViewModel = {
  ok: boolean
  title: string
  rows: SqlExecutionRow[]
  columns: string[]
  count: number
  sqlQuery: string | null
  maxRows: number | null
  error: string | null
}
