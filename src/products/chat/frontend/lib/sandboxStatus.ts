export type SandboxStatus = 'off' | 'starting' | 'resuming' | 'running' | 'error'

export function getSandboxStatusLabel(status: SandboxStatus): string {
  if (status === 'starting') return 'Iniciando'
  if (status === 'resuming') return 'Retomando'
  if (status === 'running') return 'Ativa'
  if (status === 'error') return 'Erro'
  return 'Desligada'
}

export function getSandboxStatusClasses(status: SandboxStatus): string {
  if (status === 'starting') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }
  if (status === 'resuming') {
    return 'border-sky-200 bg-sky-50 text-sky-700'
  }
  if (status === 'running') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
  if (status === 'error') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }
  return 'border-gray-200 bg-gray-50 text-gray-600'
}
