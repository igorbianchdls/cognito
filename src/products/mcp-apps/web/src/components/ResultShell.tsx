import type { ReactNode } from 'react'
import type { ToolTone } from '@/products/mcp-apps/web/src/utils/format'

type ResultShellProps = {
  eyebrow?: string
  icon?: ReactNode
  tone?: ToolTone
  title: string
  description?: string
  children: ReactNode
}

export function ResultShell({ eyebrow, icon, tone = 'neutral', title, description, children }: ResultShellProps) {
  return (
    <>
      <header className="result-shell__header">
        <div className="result-shell__heading">
          {icon ? (
            <span className={`result-shell__icon result-shell__icon--${tone}`} aria-hidden="true">
              {icon}
            </span>
          ) : null}
          <div className="result-shell__copy">
            {eyebrow ? <p className="result-shell__eyebrow">{eyebrow}</p> : null}
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>
        </div>
      </header>
      {children}
    </>
  )
}
