'use client'

import type { HeroWidget as HeroWidgetType } from '@/types/shopifyWidgets'

interface HeroWidgetProps {
  widget: HeroWidgetType
}

export default function HeroWidget({ widget }: HeroWidgetProps) {
  const { config } = widget

  const backgroundStyle: React.CSSProperties = {
    backgroundColor: config.backgroundColor || '#7C3AED',
    height: config.height || 400,
    color: config.textColor || '#ffffff'
  }

  if (config.backgroundImage) {
    backgroundStyle.backgroundImage = `url(${config.backgroundImage})`
    backgroundStyle.backgroundSize = 'cover'
    backgroundStyle.backgroundPosition = 'center'
  }

  return (
    <section 
      className="relative w-full flex items-center justify-center"
      style={backgroundStyle}
    >
      {/* Overlay */}
      {config.overlay && (
        <div 
          className="absolute inset-0"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, ' + (config.overlayOpacity || 0.4) + ')'
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {config.title && (
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {config.title}
          </h1>
        )}
        
        {config.subtitle && (
          <p className="text-lg md:text-xl mb-8 opacity-90">
            {config.subtitle}
          </p>
        )}
        
        {config.ctaText && (
          <a
            href={config.ctaUrl || '#'}
            className="inline-block bg-white text-purple-600 px-8 py-3 rounded-lg font-medium text-lg hover:bg-gray-100 transition-colors"
          >
            {config.ctaText}
          </a>
        )}
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-white opacity-10 rounded-full"></div>
      <div className="absolute bottom-10 right-10 w-16 h-16 bg-white opacity-10 rounded-full"></div>
      <div className="absolute top-1/2 right-20 w-12 h-12 bg-white opacity-10 rounded-full"></div>
    </section>
  )
}