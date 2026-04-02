'use client'

export type ArtifactPreviewMap = Record<string, string>

export type ArtifactPreviewStatus = 'idle' | 'capturing' | 'ready' | 'error'

export type ArtifactPreviewStatusMap = Record<string, ArtifactPreviewStatus>
