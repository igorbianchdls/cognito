import { Daytona } from '@daytonaio/sdk';

export async function POST(req: Request) {
  console.log('⚡⚡⚡ DAYTONA DIRECT API CALLED ⚡⚡⚡');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    const { code } = await req.json();
    console.log('Code received, length:', code?.length || 0);
    console.log('DAYTONA_API_KEY exists:', !!process.env.DAYTONA_API_KEY);
    console.log('DAYTONA_API_URL exists:', !!process.env.DAYTONA_API_URL);

    if (!process.env.DAYTONA_API_KEY) {
      console.error('Missing DAYTONA_API_KEY');
      return new Response(JSON.stringify({
        success: false,
        error: 'DAYTONA_API_KEY não configurado',
        details: 'Configure DAYTONA_API_KEY nas variáveis de ambiente'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🚀 Initializing Daytona SDK...');
    
    // Inicializar Daytona SDK
    const daytona = new Daytona({
      apiKey: process.env.DAYTONA_API_KEY,
      apiUrl: process.env.DAYTONA_API_URL || 'https://api.daytona.io',
    });

    console.log('✅ Daytona SDK initialized');
    console.log('🔨 Creating Python sandbox...');

    const startTime = Date.now();

    // Criar sandbox Python
    const sandbox = await daytona.create({
      language: 'python'
    });

    const sandboxId = sandbox.id || `sandbox-${Date.now()}`;
    console.log('✅ Sandbox created:', sandboxId);

    console.log('🐍 Executing Python code...');
    
    // Executar código Python usando executeCommand
    const result = await sandbox.process.executeCommand(`python3 -c "${code.replace(/"/g, '\\"')}"`);

    console.log('✅ Code execution completed');
    console.log('Result object:', result);

    const executionTime = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
    console.log('⏱️ Total execution time:', executionTime);

    // Limpar sandbox - será feito automaticamente pelo Daytona após timeout
    console.log('ℹ️ Sandbox will be automatically cleaned up by Daytona');

    // Preparar resposta - usar apenas propriedades disponíveis no ExecuteResponse
    const output = result.result || 'Execução concluída';
    
    console.log('📤 Sending successful response');

    return new Response(JSON.stringify({
      success: true,
      sandboxId: sandboxId,
      output: output,
      executionTime: executionTime,
      exitCode: result.exitCode || 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('💥 DAYTONA DIRECT ERROR 💥');
    console.error('Error type:', (error as Error)?.constructor?.name);
    console.error('Error message:', (error as Error)?.message);
    console.error('Full error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Erro na execução do Daytona',
      details: (error as Error)?.message || 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}