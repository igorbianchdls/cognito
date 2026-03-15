'use client'

export interface ReportPreviewData {
  html: string
}

export type ReportPreviewMap = Record<string, ReportPreviewData>

export type ReportPreviewStatus = 'idle' | 'capturing' | 'ready' | 'error'

export type ReportPreviewStatusMap = Record<string, ReportPreviewStatus>
