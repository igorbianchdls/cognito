'use client'

import { atom } from 'nanostores'

export type KPISparklineSeries = {
  id: string
  data: number[]
  // quando verdadeiro, inverte a semântica de cor (subir = vermelho)
  invert?: boolean
  colorUp?: string
  colorDown?: string
  // comparação explícita (total do período atual vs período anterior)
  currentTotal?: number
  previousTotal?: number
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
    const prev = curr[id]
    const next: KPISparklineSeries = {
      id,
      data,
      invert: opts?.invert ?? prev?.invert,
      colorUp: opts?.colorUp ?? prev?.colorUp,
      colorDown: opts?.colorDown ?? prev?.colorDown,
      currentTotal: opts?.currentTotal ?? prev?.currentTotal,
      previousTotal: opts?.previousTotal ?? prev?.previousTotal,
    }
    $kpiSparklines.set({
      ...curr,
      [id]: next,
    })
  },
  remove: (id: string) => {
    const curr = $kpiSparklines.get()
    const { [id]: _omit, ...rest } = curr
    $kpiSparklines.set(rest)
  },
  reset: () => $kpiSparklines.set({}),
}
