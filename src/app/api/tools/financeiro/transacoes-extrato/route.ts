import { NextRequest } from 'next/server';
import { getTransacoesExtrato } from '@/tools/financialTools';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const data_inicial = searchParams.get('data_inicial') || undefined;
    const data_final = searchParams.get('data_final') || undefined;
    const tipo = searchParams.get('tipo') || undefined;
    const conta_id = searchParams.get('conta_id') || undefined;
    const origem = searchParams.get('origem') || undefined;
    const conciliadoParam = searchParams.get('conciliado');
    const conciliado = conciliadoParam === undefined ? undefined : conciliadoParam === 'true';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.max(1, Math.min(1000, Number(limitParam))) : undefined;

    const toolAny = getTransacoesExtrato as unknown as {
      execute: (args: {
        limit?: number;
        data_inicial?: string;
        data_final?: string;
        tipo?: string;
        conciliado?: boolean;
        conta_id?: string;
        origem?: string;
      }) => Promise<unknown>;
    };

    const result = await toolAny.execute({
      limit,
      data_inicial,
      data_final,
      tipo,
      conciliado,
      conta_id,
      origem,
    });

    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('📄 API tools/financeiro/transacoes-extrato error:', error);
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

