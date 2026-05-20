export interface LegendConfig {
  enabled?: boolean
  anchor?: 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left'
  direction?: 'row' | 'column'
  translateX?: number
  translateY?: number
  itemWidth?: number
  itemHeight?: number
  itemsSpacing?: number
  symbolSize?: number
  symbolShape?: 'circle' | 'square' | 'triangle'
  itemDirection?: string
}
