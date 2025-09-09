// Canvas configuration types for customizable dashboard canvas
// Includes background, dimensions, grid settings, and styling options
// Updated: 2025-08-19
export interface CanvasConfig {
  // Background styling
  backgroundColor: string
  backgroundImage?: string
  backgroundSize: 'cover' | 'contain' | 'auto' | 'stretch'
  backgroundPosition: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  backgroundRepeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y'
  
  // Canvas dimensions
  canvasMode: 'responsive' | 'fixed'
  width: number | 'auto' | '100%'
  height: number | 'auto' | '100vh'
  minHeight: number
  maxWidth?: number
  
  // Grid configuration
  rowHeight: number
  containerPadding: [number, number] // [x, y]
  margin: [number, number] // [x, y] spacing between widgets
  
  // Responsive columns
  breakpoints: {
    lg: number // > 1200px
    md: number // 996-1200px  
    sm: number // 768-996px
    xs: number // 480-768px
    xxs: number // < 480px
  }
  
  // Additional styling
  borderRadius: number
  boxShadow: boolean
  overflow: 'visible' | 'hidden' | 'scroll' | 'auto'
  
  // Aspect ratio
  maintain16by9: boolean
  
  // Responsive height control
  responsiveHeight: number | 'auto' | 'viewport'
  responsiveHeightValue: number
  
  // Grid layout control
  maxRows: number
}

// Default configuration with sensible values for a dashboard canvas
export const defaultCanvasConfig: CanvasConfig = {
  backgroundColor: '#ffffff',
  backgroundImage: undefined,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  
  canvasMode: 'responsive',
  width: 'auto',
  height: 880,
  minHeight: 800,
  maxWidth: undefined,
  
  rowHeight: 5,
  containerPadding: [20, 20],
  margin: [10, 10],
  
  breakpoints: {
    lg: 12,
    md: 10,
    sm: 6,
    xs: 4,
    xxs: 2
  },
  
  borderRadius: 8,
  boxShadow: false,
  overflow: 'visible',
  
  maintain16by9: false,
  
  responsiveHeight: 800,
  responsiveHeightValue: 800,
  
  maxRows: 120
}