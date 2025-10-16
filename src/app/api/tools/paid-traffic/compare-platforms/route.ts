import { NextRequest } from 'next/server';
import { compareAdsPlatforms } from '@/tools/paidTrafficTools';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data_de = searchParams.get('data_de') || undefined;
    const data_ate = searchParams.get('data_ate') || undefined;
    const plataforma = searchParams.get('plataforma') || undefined;

    const toolAny = compareAdsPlatforms as unknown as {
      execute: (args: { data_de?: string; data_ate?: string; plataforma?: string }) => Promise<unknown>
    };
    const result = await toolAny.execute({ data_de, data_ate, plataforma });
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('📊 API tools/paid-traffic/compare-platforms error:', error);
    return Response.json({
      success: false,
      message: 'Erro interno',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
