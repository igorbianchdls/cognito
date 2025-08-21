import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    console.log('🚀 [Julius API] Request received');
    const body = await req.json();
    console.log('📦 [Julius API] Request body:', body);
    
    const { messages } = body;
    console.log('💬 [Julius API] Messages received:', messages?.length || 0);
    console.log('📝 [Julius API] Messages details:', messages);

    console.log('🧠 [Julius API] Starting AI generation...');
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: 'You are a helpful AI assistant named Julius. Keep responses concise and helpful.',
      messages,
    });

    console.log('✅ [Julius API] AI generation started, returning stream...');
    return result.toUIMessageStreamResponse();
    
  } catch (error) {
    console.error('❌ [Julius API] Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}