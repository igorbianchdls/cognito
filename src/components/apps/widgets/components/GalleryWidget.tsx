'use client'

import { useState } from 'react'
import { ExternalLink, X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { DroppedWidget, GalleryConfig } from '@/types/apps/widget'

interface GalleryItem {
  image_url: string
  title?: string
  description?: string
}

interface GalleryWidgetProps {
  widget: DroppedWidget
}

export default function GalleryWidget({ widget }: GalleryWidgetProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // Get Gallery configuration
  const galleryConfig: GalleryConfig = widget.config?.galleryConfig || {}
  
  // Get data from BigQuery
  const galleryData = widget.bigqueryData?.data || []
  
  // Fallback/simulation data if no real data
  const defaultImages: GalleryItem[] = [
    { image_url: 'https://picsum.photos/400/400?random=1', title: 'Sample Image 1', description: 'Description 1' },
    { image_url: 'https://picsum.photos/400/400?random=2', title: 'Sample Image 2', description: 'Description 2' },
    { image_url: 'https://picsum.photos/400/400?random=3', title: 'Sample Image 3', description: 'Description 3' },
    { image_url: 'https://picsum.photos/400/400?random=4', title: 'Sample Image 4', description: 'Description 4' }
  ]
  
  // Transform and ensure consistent structure
  const images: GalleryItem[] = galleryData.length > 0 
    ? galleryData.map((item: any): GalleryItem => ({
        image_url: item.image_url || item.imageUrl || item.url || '',
        title: item.title || item.name || '',
        description: item.description || item.desc || ''
      }))
    : defaultImages

  // Configuration with defaults
  const columns = galleryConfig.columns || 3
  const gap = galleryConfig.gap || 8
  const borderRadius = galleryConfig.borderRadius || 8
  const shadow = galleryConfig.shadow ?? true
  const showTitles = galleryConfig.showTitles ?? true
  const showDescriptions = galleryConfig.showDescriptions ?? false
  const enableLightbox = galleryConfig.enableLightbox ?? true
  const enableHover = galleryConfig.enableHover ?? true
  const hoverEffect = galleryConfig.hoverEffect || 'overlay'

  // Get aspect ratio class
  const getAspectRatioClass = () => {
    switch (galleryConfig.aspectRatio) {
      case 'square': return 'aspect-square'
      case '16:9': return 'aspect-video'
      case '4:3': return 'aspect-[4/3]'
      case '3:2': return 'aspect-[3/2]'
      default: return 'aspect-square'
    }
  }

  // Open lightbox
  const openLightbox = (index: number) => {
    if (enableLightbox) {
      setCurrentImageIndex(index)
      setLightboxOpen(true)
    }
  }

  // Navigate lightbox
  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    } else {
      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    }
  }

  return (
    <div className="h-full w-full p-4 overflow-auto">
      {/* Gallery Grid */}
      <div 
        className="grid h-full"
        style={{ 
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${gap}px`
        }}
      >
        {images.map((item: GalleryItem, index: number) => (
          <div 
            key={index} 
            className={`relative group cursor-pointer ${getAspectRatioClass()}`}
            onClick={() => openLightbox(index)}
          >
            <img
              src={item.image_url}
              alt={item.title || `Image ${index + 1}`}
              className={`w-full h-full object-cover transition-transform ${
                shadow ? 'shadow-md' : ''
              } ${enableHover && hoverEffect === 'zoom' ? 'group-hover:scale-105' : ''}`}
              style={{ borderRadius: `${borderRadius}px` }}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = 'https://via.placeholder.com/300x300?text=No+Image'
              }}
            />
            
            {/* Hover Overlay */}
            {enableHover && hoverEffect === 'overlay' && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                   style={{ borderRadius: `${borderRadius}px` }}>
                <ExternalLink className="w-6 h-6 text-white" />
              </div>
            )}
            
            {/* Title/Description Overlay */}
            {(showTitles || showDescriptions) && (item.title || item.description) && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3"
                   style={{ borderRadius: `0 0 ${borderRadius}px ${borderRadius}px` }}>
                {showTitles && item.title && (
                  <p className="text-white text-sm font-medium truncate">{item.title}</p>
                )}
                {showDescriptions && item.description && (
                  <p className="text-white/80 text-xs truncate">{item.description}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && enableLightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          {/* Close Button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          
          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => navigateLightbox('prev')}
                className="absolute left-4 text-white hover:text-gray-300 transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={() => navigateLightbox('next')}
                className="absolute right-4 text-white hover:text-gray-300 transition-colors"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}
          
          {/* Current Image */}
          <div className="max-w-4xl max-h-[80vh] relative">
            <img
              src={images[currentImageIndex]?.image_url}
              alt={images[currentImageIndex]?.title || `Image ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found'
              }}
            />
            
            {/* Image Info */}
            {(images[currentImageIndex]?.title || images[currentImageIndex]?.description) && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-4">
                {images[currentImageIndex]?.title && (
                  <h3 className="font-medium text-lg">{images[currentImageIndex].title}</h3>
                )}
                {images[currentImageIndex]?.description && (
                  <p className="text-sm text-gray-300 mt-1">{images[currentImageIndex].description}</p>
                )}
              </div>
            )}
          </div>
          
          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  )
}