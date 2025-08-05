import { NextRequest, NextResponse } from 'next/server';
import { Daytona } from '@daytonaio/sdk';

export async function POST(request: NextRequest) {
  try {
    const { language, envVars, name } = await request.json();

    const daytona = new Daytona({
      apiKey: process.env.DAYTONA_API_KEY,
      apiUrl: process.env.DAYTONA_API_URL,
      target: process.env.DAYTONA_TARGET
    });

    const sandbox = await daytona.create({
      language: language || 'typescript',
      envVars: envVars || { NODE_ENV: 'development' },
      ...(name && { name })
    });

    return NextResponse.json({ success: true, sandbox });
  } catch (error) {
    console.error('Failed to create sandbox:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}