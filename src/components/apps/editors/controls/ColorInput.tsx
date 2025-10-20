import React from 'react'

interface ColorInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
}

export function ColorInput({ value, onChange, label, className = '' }: ColorInputProps) {
  const handleColorPick = () => {
    const input = document.createElement('input')
    input.type = 'color'
    input.value = value || '#ffffff'
    input.onchange = (e) => onChange((e.target as HTMLInputElement).value)
    input.click()
  }

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value.replace('#', '')
    if (/^[0-9A-Fa-f]{0,6}$/.test(hex)) {
      onChange(`#${hex}`)
    }
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      )}
      <div className="bg-gray-50 rounded px-2 py-1">
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 min-w-4 min-h-4 flex-shrink-0 rounded cursor-pointer border border-gray-300"
            style={{ backgroundColor: value || '#ffffff' }}
            onClick={handleColorPick}
          />
          <input
            type="text"
            value={(value || '#ffffff').replace('#', '').toUpperCase()}
            onChange={handleHexChange}
            className="flex-1 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
            maxLength={6}
          />
        </div>
      </div>
    </div>
  )
}