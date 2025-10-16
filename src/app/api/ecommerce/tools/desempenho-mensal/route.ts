import { NextRequest } from 'next/server';
import { getDesempenhoVendasMensal } from '@/tools/salesTools';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data_de = searchParams.get('data_de') || undefined;
    const data_ate = searchParams.get('data_ate') || undefined;

    const result = await getDesempenhoVendasMensal.execute({ data_de, data_ate });
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('🛒 API tools/desempenho-mensal error:', error);
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 });
  }
}

