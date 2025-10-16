import { NextRequest } from 'next/server';
import { analisePerformanceLancamento } from '@/tools/salesTools';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data_de = searchParams.get('data_de') || undefined;
    const data_ate = searchParams.get('data_ate') || undefined;
    const id_limite_colecao = Number(searchParams.get('id_limite_colecao') ?? '24');
    const mes_lancamento = searchParams.get('mes_lancamento') || undefined;
    const toolAny = analisePerformanceLancamento as unknown as { execute: (args: { data_de?: string; data_ate?: string; id_limite_colecao?: number; mes_lancamento?: string }) => Promise<unknown> };
    const result = await toolAny.execute({ data_de, data_ate, id_limite_colecao, mes_lancamento });
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('🛒 API tools/performance-lancamento error:', error);
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 });
  }
}

