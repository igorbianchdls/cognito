import { Daytona } from '@daytonaio/sdk';

interface DaytonaRequest {
  action: 'create' | 'execute' | 'destroy';
  command?: string;
  sandboxId?: string;
}

interface DaytonaResponse {
  success: boolean;
  data?: any;
  error?: string;
  sandboxId?: string;
  output?: string;
}

// Simple in-memory store for sandboxes (for demo purposes)
// In production, you'd want to use a database
const activeSandboxes = new Map<string, any>();

export async function POST(req: Request): Promise<Response> {
  console.log('🏗️ [DAYTONA API] Route called');
  
  try {
    const { action, command, sandboxId }: DaytonaRequest = await req.json();
    console.log('📝 [DAYTONA API] Action:', action, 'Command:', command, 'SandboxId:', sandboxId);

    // Check for required environment variables
    if (!process.env.DAYTONA_API_KEY) {
      console.error('❌ [DAYTONA API] Missing DAYTONA_API_KEY');
      return Response.json({
        success: false,
        error: 'Daytona API key not configured. Please set DAYTONA_API_KEY environment variable.'
      });
    }

    // Initialize Daytona SDK
    const daytona = new Daytona({
      apiKey: process.env.DAYTONA_API_KEY,
      apiUrl: process.env.DAYTONA_API_URL || 'https://app.daytona.io/api'
    });

    let response: DaytonaResponse;

    switch (action) {
      case 'create':
        console.log('🚀 [DAYTONA API] Creating new sandbox...');
        try {
          const sandbox = await daytona.create({
            language: 'typescript'
          });
          
          console.log('✅ [DAYTONA API] Sandbox created successfully:', sandbox.id);
          
          // Store sandbox reference for later use
          activeSandboxes.set(sandbox.id, sandbox);
          
          response = {
            success: true,
            data: sandbox,
            sandboxId: sandbox.id
          };
        } catch (error) {
          console.error('❌ [DAYTONA API] Failed to create sandbox:', error);
          response = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create sandbox'
          };
        }
        break;

      case 'execute':
        if (!command) {
          response = {
            success: false,
            error: 'Command is required for execute action'
          };
          break;
        }

        if (!sandboxId) {
          response = {
            success: false,
            error: 'Sandbox ID is required for execute action'
          };
          break;
        }

        console.log('⚡ [DAYTONA API] Executing command:', command);
        try {
          // Get existing sandbox from our store
          const sandbox = activeSandboxes.get(sandboxId);
          
          if (!sandbox) {
            response = {
              success: false,
              error: 'Sandbox not found. Please create a new sandbox first.'
            };
            break;
          }
          
          // Execute command
          const result = await sandbox.process.executeCommand(command);
          
          console.log('✅ [DAYTONA API] Command executed successfully');
          response = {
            success: true,
            output: result.output || result.result || 'Command executed successfully',
            sandboxId
          };
        } catch (error) {
          console.error('❌ [DAYTONA API] Failed to execute command:', error);
          response = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to execute command'
          };
        }
        break;

      case 'destroy':
        if (!sandboxId) {
          response = {
            success: false,
            error: 'Sandbox ID is required for destroy action'
          };
          break;
        }

        console.log('🗑️ [DAYTONA API] Destroying sandbox:', sandboxId);
        try {
          // Get existing sandbox from our store
          const sandbox = activeSandboxes.get(sandboxId);
          
          if (!sandbox) {
            response = {
              success: false,
              error: 'Sandbox not found'
            };
            break;
          }
          
          // Destroy sandbox
          await sandbox.destroy();
          
          // Remove from our store
          activeSandboxes.delete(sandboxId);
          
          console.log('✅ [DAYTONA API] Sandbox destroyed successfully');
          response = {
            success: true,
            data: { message: 'Sandbox destroyed successfully' }
          };
        } catch (error) {
          console.error('❌ [DAYTONA API] Failed to destroy sandbox:', error);
          response = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to destroy sandbox'
          };
        }
        break;

      default:
        response = {
          success: false,
          error: `Unknown action: ${action}`
        };
        break;
    }

    console.log('📤 [DAYTONA API] Sending response:', response);
    return Response.json(response);

  } catch (error) {
    console.error('💥 [DAYTONA API] Unexpected error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}