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

export function ResultShell({
  eyebrow = 'Plugin',
  icon,
  tone = 'neutral',
  title,
  description,
  children,
}: ResultShellProps) {
  return (
    <>
      <header className="result-shell__header">
        <div className="result-shell__heading">
          <span className={`result-shell__icon result-shell__icon--${tone}`} aria-hidden="true">
            {icon}
          </span>
          <div className="result-shell__copy">
            <span className="result-shell__eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>
        </div>
      </header>
      {children}
    </>
  )
}
