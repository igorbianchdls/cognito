import React from 'react'

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  suffix?: string
  className?: string
}

export function NumberInput({ 
  value, 
  onChange, 
  min, 
  max, 
  step = 1, 
  label, 
  suffix,
  className = '' 
}: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = parseFloat(e.target.value) || 0
    if (min !== undefined) newValue = Math.max(min, newValue)
    if (max !== undefined) newValue = Math.min(max, newValue)
    onChange(newValue)
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      )}
      <div className="bg-gray-50 rounded px-2 py-1">
        <div className="flex items-center">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            className="flex-1 h-3 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
          />
          {suffix && (
            <span className="text-xs text-gray-500">{suffix}</span>
          )}
        </div>
      </div>
    </div>
  )
}