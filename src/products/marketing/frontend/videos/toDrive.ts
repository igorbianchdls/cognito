import { childFolders, createFolder, getDriveState, liveFiles, uploadFiles } from '@/products/drive/frontend/store'

/** Pasta do primeiro drive da empresa onde os vídeos gerados são copiados (para o Editor e o Postar). */
export const VIDEOS_FOLDER = 'Vídeos gerados'

/** Copia um vídeo gerado para o Drive, uma vez; devolve o id do arquivo no Drive. */
export async function copyVideoToDrive(url: string, name: string): Promise<string> {
  const d = getDriveState()
  const drive = d.drives[0]
  if (!drive) throw new Error('Nenhum drive na empresa')
  const folderId = childFolders(d, drive.id, null).find(f => f.name === VIDEOS_FOLDER && !f.trashedAt)?.id ?? createFolder(drive.id, null, VIDEOS_FOLDER)
  const existing = liveFiles(getDriveState()).find(f => f.folderId === folderId && f.name === name)
  if (existing) return existing.id
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const [id] = await uploadFiles([new File([await response.blob()], name, { type: 'video/mp4' })], drive.id, folderId)
  return id
}
