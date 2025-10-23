import { NextRequest } from 'next/server';
import { desempenhoPorGrupoDeAnuncio } from '@/tools/paidTrafficTools';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data_de = searchParams.get('data_de') || undefined;
    const data_ate = searchParams.get('data_ate') || undefined;
    const plataforma = searchParams.get('plataforma') || undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.max(1, Math.min(1000, Number(limitParam))) : undefined;

    const toolAny = desempenhoPorGrupoDeAnuncio as unknown as {
      execute: (args: { data_de: string; data_ate: string; plataforma?: string; limit?: number }) => Promise<unknown>
    };
    if (!data_de || !data_ate) {
      return Response.json({ success: false, message: 'Parâmetros data_de e data_ate são obrigatórios' }, { status: 400 });
    }
    const result = await toolAny.execute({ data_de, data_ate, plataforma, limit });
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('📊 API paid-traffic/grupo-anuncio error:', error);
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 });
  }
}

