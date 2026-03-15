'use client'

export type SlidePreviewMap = Record<string, string>

export type SlidePreviewStatus = 'idle' | 'capturing' | 'ready' | 'error'

export type SlidePreviewStatusMap = Record<string, SlidePreviewStatus>
