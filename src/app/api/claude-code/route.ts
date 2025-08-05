import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

interface ExecError extends Error {
  code?: string;
  killed?: boolean;
  signal?: string;
  stdout?: string;
  stderr?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    // Path to Claude Code CLI in node_modules
    const claudeCodePath = path.join(process.cwd(), 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');
    
    // Execute Claude Code CLI with --print flag for non-interactive output
    const command = `node "${claudeCodePath}" --print --dangerously-skip-permissions "${prompt.replace(/"/g, '\\"')}"`;
    
    console.log('Executing command:', command);

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024, // 1MB buffer
        cwd: process.cwd()
      });

      if (stderr && stderr.trim()) {
        console.warn('Claude Code stderr:', stderr);
      }

      const response = stdout.trim() || 'No response from Claude Code';
      
      return NextResponse.json({ 
        success: true, 
        response,
        debug: {
          command: command,
          stderr: stderr || null
        }
      });
    } catch (execError: unknown) {
      console.error('Claude Code execution error:', execError);
      
      // Handle different types of errors
      let errorMessage = 'Failed to execute Claude Code';
      
      const error = execError as ExecError;
      
      if (error.code === 'ENOENT') {
        errorMessage = 'Claude Code CLI not found. Make sure @anthropic-ai/claude-code is installed.';
      } else if (error.killed || error.signal) {
        errorMessage = 'Claude Code execution timed out or was killed';
      } else if (error.stdout || error.stderr) {
        errorMessage = error.stderr || error.stdout || error.message;
      } else {
        errorMessage = error.message || 'Unknown execution error';
      }

      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          debug: {
            command: command,
            execError: {
              code: error.code,
              killed: error.killed,
              signal: error.signal,
              stdout: error.stdout,
              stderr: error.stderr
            }
          }
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}