import type { ReactNode } from 'react'

type ResultShellProps = {
  eyebrow?: string
  title: string
  description?: string
  children: ReactNode
}

export function ResultShell({ eyebrow, title, description, children }: ResultShellProps) {
  return (
    <>
      <header className="result-shell__header">
        {eyebrow ? <p className="result-shell__eyebrow">{eyebrow}</p> : null}
        <div>
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
      </header>
      {children}
    </>
  )
}
