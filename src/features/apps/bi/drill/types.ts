export type BiHierarchyLevel = {
  id: string
  label: string
  field: string
}

export type BiHierarchy = {
  id: string
  label: string
  model: string
  levels: BiHierarchyLevel[]
}

export type BiDrillState = {
  visualId: string
  hierarchyId: string
  levelIndex: number
  pathValues: Array<string | number>
}

