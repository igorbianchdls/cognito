export const runtime = 'nodejs'

export async function GET() {
  return Response.json(
    {
      error: 'Endpoint desativado. Use /chat com as tools disponiveis.',
    },
    { status: 410 }
  )
}
