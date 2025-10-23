import { NextRequest } from 'next/server';
import { etapasDoFunilGeral } from '@/tools/analyticsTools';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data_de = searchParams.get('data_de') || undefined;
    const data_ate = searchParams.get('data_ate') || undefined;
    if (!data_de || !data_ate) {
      return Response.json({ success: false, message: 'Parâmetros data_de e data_ate são obrigatórios' }, { status: 400 });
    }
    const toolAny = etapasDoFunilGeral as unknown as { execute: (args: { data_de: string; data_ate: string }) => Promise<unknown> };
    const result = await toolAny.execute({ data_de, data_ate });
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('📈 API web-analytics/funil-geral error:', error);
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 });
  }
}

