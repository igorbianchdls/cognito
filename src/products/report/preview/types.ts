'use client'

export type ReportPreviewMap = Record<string, string>

export type ReportPreviewStatus = 'idle' | 'capturing' | 'ready' | 'error'

export type ReportPreviewStatusMap = Record<string, ReportPreviewStatus>
