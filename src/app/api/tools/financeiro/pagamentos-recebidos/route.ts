import { NextRequest } from 'next/server';
import { getPagamentosRecebidos } from '@/tools/financialTools';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const data_vencimento_de = searchParams.get('data_vencimento_de') || undefined;
    const data_vencimento_ate = searchParams.get('data_vencimento_ate') || undefined;
    const data_emissao_de = searchParams.get('data_emissao_de') || undefined;
    const data_emissao_ate = searchParams.get('data_emissao_ate') || undefined;
    const cliente_id = searchParams.get('cliente_id') || undefined;
    const valor_minimo = searchParams.get('valor_minimo');
    const valor_maximo = searchParams.get('valor_maximo');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.max(1, Math.min(1000, Number(limitParam))) : undefined;

    const toolAny = getPagamentosRecebidos as unknown as {
      execute: (args: {
        limit?: number;
        cliente_id?: string;
        data_vencimento_de?: string;
        data_vencimento_ate?: string;
        data_emissao_de?: string;
        data_emissao_ate?: string;
        valor_minimo?: number;
        valor_maximo?: number;
      }) => Promise<unknown>;
    };

    const result = await toolAny.execute({
      limit,
      cliente_id,
      data_vencimento_de,
      data_vencimento_ate,
      data_emissao_de,
      data_emissao_ate,
      valor_minimo: valor_minimo ? Number(valor_minimo) : undefined,
      valor_maximo: valor_maximo ? Number(valor_maximo) : undefined,
    });

    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('✅ API tools/financeiro/pagamentos-recebidos error:', error);
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

