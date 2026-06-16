export const SYNC_FREQUENCY_OPTIONS = [
  {
    value: 'manual',
    label: 'Manual',
    description: 'Os dados só rodam quando alguém aciona a sincronização.',
  },
  {
    value: 'hourly',
    label: 'A cada hora',
    description: 'Bom para dados operacionais usados durante o dia.',
  },
  {
    value: 'every_6_hours',
    label: 'A cada 6 horas',
    description: 'Equilíbrio entre frescor e custo para a maioria dos ERPs.',
  },
  {
    value: 'every_12_hours',
    label: 'A cada 12 horas',
    description: 'Para dados que não mudam com tanta frequência.',
  },
  {
    value: 'daily',
    label: 'Diário',
    description: 'Atualiza uma vez por dia.',
  },
] as const

export type SyncFrequencyOption = typeof SYNC_FREQUENCY_OPTIONS[number]['value']

export function isSupportedSyncFrequency(value: unknown): value is SyncFrequencyOption {
  return SYNC_FREQUENCY_OPTIONS.some((option) => option.value === value)
}
