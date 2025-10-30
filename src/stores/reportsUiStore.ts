import { atom } from 'nanostores'

export type ReportsCommands = {
  expandAllCounter: number
  exportCounter: number
}

export const $reportsCommands = atom<ReportsCommands>({ expandAllCounter: 0, exportCounter: 0 })

export const reportsUiActions = {
  expandAll: () => {
    const cur = $reportsCommands.get()
    $reportsCommands.set({ ...cur, expandAllCounter: cur.expandAllCounter + 1 })
  },
  exportCurrent: () => {
    const cur = $reportsCommands.get()
    $reportsCommands.set({ ...cur, exportCounter: cur.exportCounter + 1 })
  }
}

