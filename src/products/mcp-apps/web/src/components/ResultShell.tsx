import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { ToolTone } from '@/products/mcp-apps/web/src/utils/format'

type ResultShellProps = {
  eyebrow?: string
  icon?: LucideIcon
  tone?: ToolTone
  title: string
  description?: string
  children: ReactNode
}

export function ResultShell({ eyebrow, icon: Icon, tone = 'neutral', title, description, children }: ResultShellProps) {
  return (
    <>
      <header className="result-shell__header">
        <div className="result-shell__heading">
          {Icon ? (
            <span className={`result-shell__icon result-shell__icon--${tone}`} aria-hidden="true">
              <Icon size={19} strokeWidth={2.4} />
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
