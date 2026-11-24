import { childFolders, createFolder, getDriveState, liveFiles, uploadFiles } from '@/products/drive/frontend/store'

/** Folder of the first drive where sound effects are copied to be used in the editor. */
export const SFX_FOLDER = 'Sound effects'

/** Copies an effect to the Drive (folder "Sound effects"), once; returns the Drive file id. */
export async function copySoundEffectToDrive(url: string, name: string): Promise<string> {
  const d = getDriveState()
  const drive = d.drives[0]
  if (!drive) throw new Error('Nenhum drive na empresa')
  const folderId = childFolders(d, drive.id, null).find(f => f.name === SFX_FOLDER && !f.trashedAt)?.id ?? createFolder(drive.id, null, SFX_FOLDER)
  const existing = liveFiles(getDriveState()).find(f => f.folderId === folderId && f.name === name)
  if (existing) return existing.id
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const [id] = await uploadFiles([new File([await response.blob()], name, { type: 'audio/mpeg' })], drive.id, folderId)
  return id
}
