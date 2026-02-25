import type { BiDrillState } from './types'

export function drillDown(state: BiDrillState, nextValue: string | number): BiDrillState {
  return {
    ...state,
    levelIndex: state.levelIndex + 1,
    pathValues: [...state.pathValues, nextValue],
  }
}

export function drillUp(state: BiDrillState): BiDrillState {
  return {
    ...state,
    levelIndex: Math.max(0, state.levelIndex - 1),
    pathValues: state.pathValues.slice(0, -1),
  }
}

export function resetDrill(state: BiDrillState): BiDrillState {
  return {
    ...state,
    levelIndex: 0,
    pathValues: [],
  }
}

