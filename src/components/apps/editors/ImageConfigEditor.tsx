'use client'

import type { DroppedWidget } from '@/types/apps/droppedWidget'
import { isImageWidget } from '@/types/apps/droppedWidget'
import type { ImageConfig } from '@/types/apps/droppedWidget'

interface ImageConfigEditorProps {
  selectedWidget: DroppedWidget
  imageConfig: ImageConfig
  editImageForm: {
    src: string
    alt: string
    title: string
    objectFit: string
    objectPosition: string
  }
  onImageConfigChange: (field: string, value: unknown) => void
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onImageRemove: () => void
}

export default function ImageConfigEditor({ 
  selectedWidget, 
  imageConfig, 
  editImageForm, 
  onImageConfigChange,
  onImageUpload,
  onImageRemove
}: ImageConfigEditorProps) {
  
  if (!selectedWidget || !isImageWidget(selectedWidget)) {
    return null
  }

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-4">🖼️ Image Configuration</h4>
      
      <div className="space-y-6">
        {/* Image Upload */}
        <div>
          <h5 className="text-lg font-bold text-gray-700 mb-3">📷 Image Upload</h5>
          <div className="space-y-4">
            {/* Current Image Preview */}
            {editImageForm.src && (
              <div className="border border-gray-200 rounded-lg p-3">
                <label className="block text-xs font-medium text-gray-600 mb-2">Preview</label>
                <div className="relative">
                  <img
                    src={editImageForm.src}
                    alt={editImageForm.alt || 'Preview'}
                    className="w-full h-32 object-cover rounded border"
                    style={{ objectFit: editImageForm.objectFit as React.CSSProperties['objectFit'] }}
                  />
                  <button
                    onClick={onImageRemove}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs"
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Upload Input */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Upload Image (PNG, JPG, GIF, WebP - max 2MB)
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={onImageUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Or Image URL</label>
              <input
                type="url"
                value={editImageForm.src?.startsWith('http') ? editImageForm.src : ''}
                onChange={(e) => onImageConfigChange('src', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        </div>

        {/* Basic Properties */}
        <div>
          <h5 className="text-lg font-bold text-gray-700 mb-3">📝 Basic Properties</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Alt Text</label>
              <input
                type="text"
                value={editImageForm.alt}
                onChange={(e) => onImageConfigChange('alt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Description of the image"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
              <input
                type="text"
                value={editImageForm.title}
                onChange={(e) => onImageConfigChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Image title (tooltip)"
              />
            </div>
          </div>
        </div>

        {/* Layout Properties */}
        <div>
          <h5 className="text-lg font-bold text-gray-700 mb-3">📐 Layout</h5>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Object Fit</label>
              <select
                value={editImageForm.objectFit}
                onChange={(e) => onImageConfigChange('objectFit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
                <option value="scale-down">Scale Down</option>
                <option value="none">None</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Object Position</label>
              <input
                type="text"
                value={editImageForm.objectPosition}
                onChange={(e) => onImageConfigChange('objectPosition', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="center, top left, etc."
              />
            </div>
          </div>
        </div>

        {/* Style Properties */}
        <div>
          <h5 className="text-lg font-bold text-gray-700 mb-3">🎨 Style</h5>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius</label>
              <input
                type="number"
                min="0"
                value={imageConfig.borderRadius ?? 8}
                onChange={(e) => onImageConfigChange('borderRadius', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Border Width</label>
              <input
                type="number"
                min="0"
                value={imageConfig.borderWidth ?? 0}
                onChange={(e) => onImageConfigChange('borderWidth', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Border Color</label>
              <input
                type="color"
                value={imageConfig.borderColor || '#e5e7eb'}
                onChange={(e) => onImageConfigChange('borderColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={imageConfig.opacity ?? 1}
                onChange={(e) => onImageConfigChange('opacity', parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-gray-500">
                {(imageConfig.opacity ?? 1) * 100}%
              </span>
            </div>
          </div>
          <div className="mt-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={imageConfig.shadow ?? false}
                onChange={(e) => onImageConfigChange('shadow', e.target.checked)}
                className="rounded"
              />
              <span className="text-xs text-gray-600">Add Shadow</span>
            </label>
          </div>
        </div>

        {/* Behavior Properties */}
        <div>
          <h5 className="text-lg font-bold text-gray-700 mb-3">🔗 Behavior</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Click Action</label>
              <select
                value={imageConfig.clickAction || 'none'}
                onChange={(e) => onImageConfigChange('clickAction', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="none">None</option>
                <option value="link">Open Link</option>
              </select>
            </div>
            {imageConfig.clickAction === 'link' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Link URL</label>
                  <input
                    type="url"
                    value={imageConfig.linkUrl || ''}
                    onChange={(e) => onImageConfigChange('linkUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={imageConfig.openInNewTab ?? true}
                      onChange={(e) => onImageConfigChange('openInNewTab', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-600">Open in New Tab</span>
                  </label>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}