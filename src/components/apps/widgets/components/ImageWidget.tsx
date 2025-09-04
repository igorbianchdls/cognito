'use client'

import { useState, useEffect } from 'react'
import type { DroppedWidget, ImageConfig } from '@/types/apps/droppedWidget'

interface ImageWidgetProps {
  widget: DroppedWidget
}

export default function ImageWidget({ widget }: ImageWidgetProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)

  // Get image configuration
  const imageConfig: ImageConfig = widget.config?.imageConfig || {}

  // Debug logs
  console.log('🖼️ ImageWidget render:', {
    widgetId: widget.i,
    widgetType: widget.type,
    hasConfig: !!widget.config,
    hasImageConfig: !!widget.config?.imageConfig,
    imageConfig,
    imageLoading,
    imageError
  })

  // Default values
  const {
    src = '',
    alt = 'Image',
    title,
    objectFit = 'cover',
    objectPosition = 'center',
    borderRadius = 8,
    borderWidth = 0,
    borderColor = '#e5e7eb',
    shadow = false,
    opacity = 1,
    backgroundColor = 'transparent',
    clickAction = 'none',
    linkUrl = '',
    openInNewTab = true,
    fallbackSrc,
    showPlaceholder = true,
    placeholderText = 'No image'
  } = imageConfig

  // Reset loading state when src changes
  useEffect(() => {
    console.log('🔄 ImageWidget - src changed:', src ? src.slice(0, 50) + '...' : 'empty')
    if (src) {
      setImageLoading(true)
      setImageError(false)
    } else {
      setImageLoading(false)
      setImageError(false)
    }
  }, [src])

  const handleImageLoad = () => {
    console.log('✅ ImageWidget - Image loaded successfully for:', widget.i)
    setImageLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    console.log('❌ ImageWidget - Image failed to load for:', widget.i)
    setImageLoading(false)
    setImageError(true)
  }

  const handleClick = () => {
    if (clickAction === 'link' && linkUrl) {
      if (openInNewTab) {
        window.open(linkUrl, '_blank', 'noopener,noreferrer')
      } else {
        window.location.href = linkUrl
      }
    }
  }

  // Style for the container
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor,
    borderRadius: `${borderRadius}px`,
    borderWidth: `${borderWidth}px`,
    borderStyle: 'solid',
    borderColor,
    opacity,
    boxShadow: shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none',
    overflow: 'hidden',
    cursor: clickAction === 'link' ? 'pointer' : 'default',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }

  // Style for the image
  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: objectFit as React.CSSProperties['objectFit'],
    objectPosition,
    transition: 'opacity 0.2s ease-in-out'
  }

  // Placeholder component
  const Placeholder = () => (
    <div className="flex flex-col items-center justify-center h-full w-full text-gray-400">
      <div className="text-4xl mb-2">🖼️</div>
      <div className="text-sm font-medium">{placeholderText}</div>
    </div>
  )

  // Loading component
  const Loading = () => (
    <div className="flex flex-col items-center justify-center h-full w-full text-gray-400">
      <div className="animate-spin text-2xl mb-2">⏳</div>
      <div className="text-sm">Carregando...</div>
    </div>
  )

  // Render image or fallback
  const renderContent = () => {
    // Show placeholder if no source
    if (!src) {
      return showPlaceholder ? <Placeholder /> : null
    }

    // Show image error state with fallback
    if (imageError && fallbackSrc) {
      return (
        <div className="relative w-full h-full">
          <img
            src={fallbackSrc}
            alt={alt}
            title={title}
            style={imageStyle}
            onLoad={handleImageLoad}
            onError={() => setImageError(true)}
          />
        </div>
      )
    }

    // Show error placeholder
    if (imageError) {
      return showPlaceholder ? <Placeholder /> : null
    }

    // Always render main image when src exists, with loading overlay
    return (
      <div className="relative w-full h-full">
        <img
          src={src}
          alt={alt}
          title={title}
          style={{
            ...imageStyle,
            opacity: imageLoading ? 0 : 1
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {/* Loading overlay */}
        {imageLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
            <div className="animate-spin text-2xl mb-2">⏳</div>
            <div className="text-sm">Carregando...</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      style={containerStyle}
      onClick={handleClick}
      title={clickAction === 'link' && linkUrl ? `Clique para abrir: ${linkUrl}` : title}
    >
      {renderContent()}
    </div>
  )
}