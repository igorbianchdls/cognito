"use client"

import { createClient } from '@/lib/supabase/client'
import type { DriveItem } from '@/components/drive/types'

type PrepareUploadResponse = {
  success?: boolean
  message?: string
  upload?: {
    bucketId?: string
    path?: string
    token?: string
  }
  file?: {
    id?: string
    name?: string
    storagePath?: string
  }
}

type CompleteUploadResponse = {
  success?: boolean
  message?: string
  file?: DriveItem
}

export async function uploadDriveFileDirect({
  workspaceId,
  folderId,
  file,
}: {
  workspaceId: string
  folderId?: string
  file: File
}): Promise<DriveItem> {
  const prepRes = await fetch('/api/drive/files/prepare-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspace_id: workspaceId,
      folder_id: folderId || null,
      file_name: file.name,
    }),
  })
  const prepJson = await prepRes.json().catch(() => ({})) as PrepareUploadResponse
  if (!prepRes.ok || !prepJson?.success) {
    throw new Error(prepJson?.message || `Falha ao preparar upload de ${file.name}`)
  }

  const bucketId = prepJson.upload?.bucketId || 'drive'
  const path = prepJson.upload?.path
  const token = prepJson.upload?.token
  if (!path || !token || !prepJson.file?.id) {
    throw new Error('Resposta inválida ao preparar upload')
  }

  const supabase = createClient()
  const { error: signedUploadError } = await supabase.storage
    .from(bucketId)
    .uploadToSignedUrl(path, token, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })
  if (signedUploadError) {
    throw new Error(`Falha no upload: ${signedUploadError.message}`)
  }

  const completeRes = await fetch('/api/drive/files/complete-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspace_id: workspaceId,
      folder_id: folderId || null,
      file_id: prepJson.file.id,
      name: prepJson.file.name || file.name,
      mime: file.type || 'application/octet-stream',
      size_bytes: typeof file.size === 'number' ? file.size : 0,
      storage_path: prepJson.file.storagePath || path,
    }),
  })
  const completeJson = await completeRes.json().catch(() => ({})) as CompleteUploadResponse
  if (!completeRes.ok || !completeJson?.success || !completeJson.file) {
    throw new Error(completeJson?.message || `Falha ao finalizar upload de ${file.name}`)
  }

  return completeJson.file
}

