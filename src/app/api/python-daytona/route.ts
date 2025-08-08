import { Daytona } from '@daytonaio/sdk';

interface PythonExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
}

export async function POST(req: Request): Promise<Response> {
  console.log('🚀 [DAYTONA] ===== API ROUTE CALLED =====');
  console.log('🚀 [DAYTONA] Starting Python execution request');
  console.log('🚀 [DAYTONA] Current time:', new Date().toISOString());
  const startTime = Date.now();

  try {
    // Parse request body
    console.log('📝 [DAYTONA] Parsing request body...');
    const { code } = await req.json();
    
    if (!code || typeof code !== 'string') {
      console.error('❌ [DAYTONA] Invalid code provided:', typeof code);
      return Response.json({ 
        success: false, 
        error: 'No valid Python code provided' 
      });
    }

    console.log('✅ [DAYTONA] Code received, length:', code.length);
    console.log('📄 [DAYTONA] Code preview:', code.substring(0, 100) + '...');

    // Check for Daytona API key
    console.log('🔑 [DAYTONA] Checking for API key...');
    console.log('🌍 [DAYTONA] Environment variables check:', {
      NODE_ENV: process.env.NODE_ENV,
      hasApiKey: !!process.env.DAYTONA_API_KEY,
      envKeysCount: Object.keys(process.env).length
    });
    const apiKey = process.env.DAYTONA_API_KEY;
    
    if (!apiKey) {
      console.error('❌ [DAYTONA] DAYTONA_API_KEY environment variable not found');
      return Response.json({
        success: false,
        error: 'Daytona API key not configured. Please set DAYTONA_API_KEY environment variable.'
      });
    }

    console.log('✅ [DAYTONA] API key found, length:', apiKey.length);
    console.log('🔑 [DAYTONA] API key preview:', apiKey.substring(0, 10) + '...');

    // Initialize Daytona client
    console.log('🔧 [DAYTONA] Initializing Daytona client...');
    console.log('🔧 [DAYTONA] Client config:', { hasApiKey: !!apiKey, sdkVersion: '@daytonaio/sdk' });
    let daytona: Daytona;
    
    try {
      console.log('🔧 [DAYTONA] Creating new Daytona instance...');
      daytona = new Daytona({
        apiKey: apiKey
      });
      console.log('✅ [DAYTONA] Client initialized successfully');
      console.log('✅ [DAYTONA] Client type:', typeof daytona);
    } catch (initError) {
      console.error('❌ [DAYTONA] Failed to initialize client:', initError);
      console.error('❌ [DAYTONA] Init error stack:', initError instanceof Error ? initError.stack : 'No stack');
      return Response.json({
        success: false,
        error: `Failed to initialize Daytona client: ${initError instanceof Error ? initError.message : 'Unknown error'}`
      });
    }

    // Create sandbox
    console.log('🏗️ [DAYTONA] Creating Python sandbox...');
    console.log('🏗️ [DAYTONA] Sandbox config:', { image: 'python:3.11-slim' });
    let sandbox;
    
    try {
      console.log('🏗️ [DAYTONA] Calling daytona.create()...');
      const createPromise = daytona.create({
        image: 'python:3.11-slim'
      });
      
      console.log('⏳ [DAYTONA] Waiting for sandbox creation...');
      sandbox = await createPromise;
      
      console.log('✅ [DAYTONA] Sandbox created successfully');
      console.log('📦 [DAYTONA] Sandbox details:', {
        id: sandbox?.id,
        type: typeof sandbox,
        hasProcess: !!sandbox?.process
      });
    } catch (createError) {
      console.error('❌ [DAYTONA] Failed to create sandbox:', createError);
      console.error('❌ [DAYTONA] Create error type:', typeof createError);
      console.error('❌ [DAYTONA] Create error stack:', createError instanceof Error ? createError.stack : 'No stack');
      return Response.json({
        success: false,
        error: `Failed to create sandbox: ${createError instanceof Error ? createError.message : 'Unknown error'}`
      });
    }

    // Execute Python code
    console.log('▶️ [DAYTONA] Executing Python code in sandbox...');
    let executionResult;
    
    try {
      // Execute Python code directly
      console.log('🐍 [DAYTONA] Running Python code directly...');
      executionResult = await sandbox.process.codeRun(code);
      console.log('✅ [DAYTONA] Python execution completed');
      
      console.log('📊 [DAYTONA] Execution result:', {
        exitCode: executionResult.exitCode,
        result: executionResult.result ? 'present' : 'none',
        hasArtifacts: !!executionResult.artifacts
      });
      
    } catch (execError) {
      console.error('❌ [DAYTONA] Failed to execute Python code:', execError);
      
      // Try to cleanup sandbox even if execution failed
      try {
        console.log('🧹 [DAYTONA] Cleaning up sandbox after execution error...');
        await sandbox.delete();
        console.log('✅ [DAYTONA] Sandbox cleaned up');
      } catch (cleanupError) {
        console.error('❌ [DAYTONA] Failed to cleanup sandbox:', cleanupError);
      }
      
      return Response.json({
        success: false,
        error: `Failed to execute Python code: ${execError instanceof Error ? execError.message : 'Unknown error'}`
      });
    }

    // Process results
    console.log('🔄 [DAYTONA] Processing execution results...');
    const result = executionResult.result || '';
    const exitCode = executionResult.exitCode;

    console.log('📤 [DAYTONA] Results processed:', {
      exitCode,
      hasResult: result.length > 0,
      resultPreview: result.substring(0, 100),
      hasArtifacts: !!executionResult.artifacts
    });

    // Cleanup sandbox
    console.log('🧹 [DAYTONA] Cleaning up sandbox...');
    try {
      await sandbox.delete();
      console.log('✅ [DAYTONA] Sandbox cleaned up successfully');
    } catch (cleanupError) {
      console.error('⚠️ [DAYTONA] Failed to cleanup sandbox (non-fatal):', cleanupError);
    }

    // Calculate execution time
    const executionTime = Date.now() - startTime;
    console.log(`⏱️ [DAYTONA] Total execution time: ${executionTime}ms`);

    // Prepare response
    const response: PythonExecutionResult = {
      success: exitCode === 0,
      output: result,
      error: exitCode !== 0 ? 'Code execution failed' : undefined,
      executionTime
    };

    console.log('📋 [DAYTONA] Final response:', {
      success: response.success,
      outputLength: response.output?.length || 0,
      hasError: !!response.error,
      executionTime: response.executionTime
    });

    return Response.json(response);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('💥 [DAYTONA] Unexpected error in Python execution:', error);
    console.error('🔍 [DAYTONA] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      executionTime
    });

    return Response.json({
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      executionTime
    }, { status: 500 });
  }
}