type DashboardHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
}

export function DashboardHeader({ eyebrow, title, description }: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      {eyebrow ? <p className="dashboard-header__eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </header>
  )
}

