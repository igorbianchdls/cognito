import { NextRequest } from 'next/server';
import { analyzeTrafficOverview } from '@/tools/analyticsTools';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function daysBetween(from: string, to: string): number {
  const d1 = new Date(from);
  const d2 = new Date(to);
  const ms = d2.getTime() - d1.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.min(days, 365));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('data_de') || undefined;
    const to = searchParams.get('data_ate') || undefined;
    const daysParam = searchParams.get('days');
    let date_range_days: number | undefined = daysParam ? Number(daysParam) : undefined;
    if ((!date_range_days || Number.isNaN(date_range_days)) && from && to) {
      date_range_days = daysBetween(from, to);
    }
    if (!date_range_days || Number.isNaN(date_range_days)) {
      date_range_days = 30;
    }

    const toolAny = analyzeTrafficOverview as unknown as { execute: (args: { date_range_days: number }) => Promise<unknown> };
    const result = await toolAny.execute({ date_range_days });
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('📈 API web-analytics/overview error:', error);
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 });
  }
}

