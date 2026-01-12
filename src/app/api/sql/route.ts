import { NextResponse } from 'next/server'

// Minimal SQL execution stub. Replace with real DB execution safely.
// Accepts: { sql: string }
// Returns: { rows: Array<Record<string, unknown>> }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { sql?: string };
    const sql = (body?.sql || '').toString().trim();
    // For now, do not execute anything. Return empty rows to keep placeholder charts.
    // Implement your DB connector here with proper parameterization and safety.
    return NextResponse.json({ rows: [] });
  } catch (e) {
    return new NextResponse('Bad Request', { status: 400 });
  }
}

