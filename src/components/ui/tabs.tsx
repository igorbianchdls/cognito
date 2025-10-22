'use client'

import { ReactNode, createContext, useContext } from 'react'

interface TabsContextType {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextType | null>(null)

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: ReactNode
  className?: string
}

export function Tabs({ value, onValueChange, children, className = '' }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  variant?: 'default' | 'underline'
}

export function TabsList({ children, className = '', variant = 'default', style, ...rest }: TabsListProps) {
  if (variant === 'underline') {
    return (
      <div className={`flex h-10 items-end justify-start gap-2 overflow-x-auto border-b border-gray-200 ${className}`} style={style} {...rest}>
        {children}
      </div>
    )
  }
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 ${className}`} style={style} {...rest}>
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: ReactNode
  disabled?: boolean
  className?: string
  variant?: 'default' | 'underline'
}

export function TabsTrigger({ value, children, disabled = false, className = '', variant = 'default' }: TabsTriggerProps) {
  const context = useContext(TabsContext)
  
  if (!context) {
    throw new Error('TabsTrigger must be used within Tabs')
  }

  const isActive = context.value === value
  if (variant === 'underline') {
    return (
      <button
        type="button"
        onClick={() => !disabled && context.onValueChange(value)}
        disabled={disabled}
        className={`inline-flex items-center justify-center whitespace-nowrap px-3 py-0 text-sm font-medium border-b-2 border-transparent transition-colors rounded-none ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
          isActive ? 'border-gray-900 text-gray-900' : 'text-gray-500 hover:text-gray-900'
        } ${className}`}
      >
        {children}
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={() => !disabled && context.onValueChange(value)}
      disabled={disabled}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive
          ? 'bg-white text-gray-950 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      } ${className}`}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

export function TabsContent({ value, children, className = '' }: TabsContentProps) {
  const context = useContext(TabsContext)
  
  if (!context) {
    throw new Error('TabsContent must be used within Tabs')
  }

  if (context.value !== value) {
    return null
  }
  
  return (
    <div className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${className}`}>
      {children}
    </div>
  )
}
