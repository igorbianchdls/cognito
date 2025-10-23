import { NextRequest } from 'next/server';
import { obterDespesasPorCentroCusto } from '@/tools/financialTools';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const data_inicial = searchParams.get('data_inicial') || undefined;
    const data_final = searchParams.get('data_final') || undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.max(1, Math.min(1000, Number(limitParam))) : undefined;

    if (!data_inicial || !data_final) {
      return Response.json({ success: false, message: 'Parâmetros data_inicial e data_final são obrigatórios' }, { status: 400 });
    }

    const toolAny = obterDespesasPorCentroCusto as unknown as {
      execute: (args: { data_inicial: string; data_final: string; limit?: number }) => Promise<unknown>;
    };

    const result = await toolAny.execute({ data_inicial, data_final, limit });
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('💼 API tools/financeiro/despesas-centro-custo error:', error);
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

