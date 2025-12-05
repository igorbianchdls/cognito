'use client'

import { atom } from 'nanostores'

export type KPISparklineSeries = {
  id: string
  data: number[]
  // quando verdadeiro, inverte a semântica de cor (subir = vermelho)
  invert?: boolean
  colorUp?: string
  colorDown?: string
}

export type KPISparklinesState = Record<string, KPISparklineSeries>

export const $kpiSparklines = atom<KPISparklinesState>({})

export const kpiSparklineActions = {
  setSeries: (
    id: string,
    data: number[],
    opts?: Omit<Partial<KPISparklineSeries>, 'id' | 'data'>
  ) => {
    const curr = $kpiSparklines.get()
    $kpiSparklines.set({
      ...curr,
      [id]: {
        id,
        data,
        ...curr[id],
        ...(opts || {}),
      },
    })
  },
  remove: (id: string) => {
    const curr = $kpiSparklines.get()
    const { [id]: _omit, ...rest } = curr
    $kpiSparklines.set(rest)
  },
  reset: () => $kpiSparklines.set({}),
}

