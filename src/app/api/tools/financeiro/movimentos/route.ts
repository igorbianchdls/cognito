import { NextRequest } from 'next/server';
import { getMovimentos } from '@/tools/financialTools';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const data_inicial = searchParams.get('data_inicial') || undefined;
    const data_final = searchParams.get('data_final') || undefined;
    const conta_id = searchParams.get('conta_id') || undefined;
    const categoria_id = searchParams.get('categoria_id') || undefined;
    const tipo = searchParams.get('tipo') || undefined;
    const valor_minimo = searchParams.get('valor_minimo');
    const valor_maximo = searchParams.get('valor_maximo');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.max(1, Math.min(1000, Number(limitParam))) : undefined;

    const toolAny = getMovimentos as unknown as {
      execute: (args: {
        limit?: number;
        conta_id?: string;
        tipo?: 'entrada' | 'saída';
        data_inicial?: string;
        data_final?: string;
        categoria_id?: string;
        valor_minimo?: number;
        valor_maximo?: number;
      }) => Promise<unknown>;
    };

    const result = await toolAny.execute({
      limit,
      conta_id,
      tipo: tipo as 'entrada' | 'saída' | undefined,
      data_inicial,
      data_final,
      categoria_id,
      valor_minimo: valor_minimo ? Number(valor_minimo) : undefined,
      valor_maximo: valor_maximo ? Number(valor_maximo) : undefined,
    });

    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('🔁 API tools/financeiro/movimentos error:', error);
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

