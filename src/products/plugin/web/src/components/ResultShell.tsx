import type { ReactNode } from 'react'
import type { ToolTone } from '@/products/plugin/web/src/utils/format'

type ResultShellProps = {
  eyebrow?: string
  icon?: ReactNode
  tone?: ToolTone
  title: string
  description?: string
  children: ReactNode
}

export function ResultShell({ title, description, children }: ResultShellProps) {
  return (
    <>
      <header className="chart-card__header">
        <div className="chart-card__copy">
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
      </header>
      {children}
    </>
  )
}
