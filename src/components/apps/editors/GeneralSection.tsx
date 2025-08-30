import type { DroppedWidget } from '@/types/apps/widget'

interface GeneralSectionProps {
  selectedWidget: DroppedWidget
  editForm: {
    x: number
    y: number
    w: number
    h: number
    color: string
  }
  onFormChange: (field: string, value: number | string) => void
}

export default function GeneralSection({ selectedWidget, editForm, onFormChange }: GeneralSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Edit &quot;{selectedWidget.name}&quot;
      </h3>
      
      {/* Position */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Position
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">X</label>
            <input
              type="number"
              min="0"
              value={editForm.x}
              onChange={(e) => onFormChange('x', parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Y</label>
            <input
              type="number"
              min="0"
              value={editForm.y}
              onChange={(e) => onFormChange('y', parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Size */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Size
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Width</label>
            <input
              type="number"
              min="1"
              value={editForm.w}
              onChange={(e) => onFormChange('w', parseInt(e.target.value) || 1)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Height</label>
            <input
              type="number"
              min="1"
              value={editForm.h}
              onChange={(e) => onFormChange('h', parseInt(e.target.value) || 1)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Color
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={editForm.color}
            onChange={(e) => onFormChange('color', e.target.value)}
            className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
          />
          <input
            type="text"
            value={editForm.color}
            onChange={(e) => onFormChange('color', e.target.value)}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="#3B82F6"
          />
        </div>
      </div>
    </div>
  )
}