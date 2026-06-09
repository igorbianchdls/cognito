type EmptyStateProps = {
  title?: string
  description?: string
}

export function EmptyState({
  title = 'Nada para renderizar',
  description = 'Peça ao MCP host para listar ou abrir um dashboard.',
}: EmptyStateProps) {
  return (
    <section className="state-card">
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  )
}

