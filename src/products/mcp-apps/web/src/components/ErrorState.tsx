type ErrorStateProps = {
  message?: string
}

export function ErrorState({ message = 'Nao foi possivel renderizar esta resposta.' }: ErrorStateProps) {
  return (
    <section className="state-card state-card--error">
      <h2>Erro</h2>
      <p>{message}</p>
    </section>
  )
}

