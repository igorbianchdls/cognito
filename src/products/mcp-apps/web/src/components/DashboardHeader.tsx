type DashboardHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  return (
    <header className="chart-card__header">
      <div className="chart-card__copy">
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
    </header>
  )
}
