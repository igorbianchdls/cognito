export interface SandboxConfig {
  language?: string;
  envVars?: Record<string, string>;
  name?: string;
}

export interface CommandResult {
  output: string;
  exitCode: number;
  error?: string;
  command?: string;
}

export interface Sandbox {
  id: string;
  name?: string;
  language: string;
  status: string;
}

export interface SandboxInfo {
  id: string;
  name: string;
  language: string;
  status: string;
  createdAt: Date;
}

export class SandboxService {
  async createSandbox(config: SandboxConfig): Promise<Sandbox> {
    try {
      const response = await fetch('/api/sandbox/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create sandbox');
      }

      return data.sandbox;
    } catch (error) {
      console.error('Failed to create sandbox:', error);
      throw new Error(`Failed to create sandbox: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async executeCommand(sandbox: Sandbox, command: string): Promise<CommandResult> {
    try {
      const response = await fetch('/api/sandbox/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sandboxId: sandbox.id,
          command,
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to execute command');
      }

      return {
        output: data.result.output || '',
        exitCode: data.result.exitCode || 0,
        error: data.result.error || undefined,
        command
      };
    } catch (error) {
      console.error('Failed to execute command:', error);
      return {
        output: '',
        exitCode: 1,
        error: error instanceof Error ? error.message : 'Unknown error',
        command
      };
    }
  }

  async listSandboxes(): Promise<SandboxInfo[]> {
    try {
      // This would be implemented with another API route
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Failed to list sandboxes:', error);
      return [];
    }
  }

  async deleteSandbox(sandboxId: string): Promise<boolean> {
    try {
      // This would be implemented with another API route
      // For now, return true
      return true;
    } catch (error) {
      console.error('Failed to delete sandbox:', error);
      return false;
    }
  }

  async getSandboxStatus(sandboxId: string): Promise<string> {
    try {
      // This would be implemented with another API route
      // For now, return 'active'
      return 'active';
    } catch (error) {
      console.error('Failed to get sandbox status:', error);
      return 'error';
    }
  }
}

export const sandboxService = new SandboxService();