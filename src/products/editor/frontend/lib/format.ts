const MB = 1024 * 1024

export function formatSize(bytes: number) {
  if (bytes >= 1024 * MB) return `${(bytes / (1024 * MB)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} GB`
  if (bytes >= MB) return `${(bytes / MB).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
  return bytes ? `${Math.max(1, Math.round(bytes / 1024))} KB` : '0 KB'
}
export const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`
export const formatDate = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00` : iso).toLocaleDateString('pt-BR')
export const formatDateTime = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace('.', '')
