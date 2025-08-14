export interface Widget {
  id: string
  name: string
  type: string
  icon: string
  description: string
  defaultWidth: number
  defaultHeight: number
}

export interface DroppedWidget extends Widget {
  i: string
  x: number
  y: number
  w: number
  h: number
  color?: string
}

export interface Position {
  x: number
  y: number
}

export interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
}