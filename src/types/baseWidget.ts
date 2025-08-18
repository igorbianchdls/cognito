// Base interface shared by all widget types
export interface BaseWidget {
  // Unique identifiers
  id: string
  i: string  // Grid layout identifier
  
  // Basic metadata
  name: string
  type: string
  icon: string
  description: string
  
  // Grid position and size
  x: number
  y: number
  w: number
  h: number
  
  // Visual styling
  color?: string
  
  // Grid layout constraints
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  
  // Default dimensions (for widget creation)
  defaultWidth: number
  defaultHeight: number
}

// Grid layout item (used by react-grid-layout)
export interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}

// Position interface
export interface Position {
  x: number
  y: number
}

// Size interface
export interface Size {
  w: number
  h: number
}

// Common widget creation props
export interface CreateWidgetProps {
  name: string
  type: string
  icon: string
  description: string
  defaultWidth: number
  defaultHeight: number
  position?: Position
  size?: Size
  color?: string
}