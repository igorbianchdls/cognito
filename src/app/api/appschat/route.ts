export const runtime = 'nodejs'

export async function POST() {
  return Response.json(
    {
      success: false,
      message: 'Endpoint desativado. Use /chat com as tools disponiveis.',
    },
    { status: 410 }
  )
}
