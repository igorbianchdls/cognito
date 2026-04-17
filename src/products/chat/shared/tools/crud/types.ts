"use client"

export type CrudRow = Record<string, unknown>

export type CrudToolViewModel = {
  ok: boolean
  title: string
  message: string | null
  rows: CrudRow[]
  columns: string[]
  count: number
  sqlQuery: string | null
  error: string | null
}
