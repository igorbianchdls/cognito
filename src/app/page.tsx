'use client';

import { useState } from 'react';
import Image from "next/image";
import { sandboxService, type SandboxConfig, type CommandResult, type Sandbox } from '@/services/sandbox';

export default function Home() {
  const [sandbox, setSandbox] = useState<Sandbox | null>(null);
  const [loading, setLoading] = useState(false);
  const [command, setCommand] = useState('');
  const [results, setResults] = useState<CommandResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const createSandbox = async (config: SandboxConfig) => {
    setLoading(true);
    setError(null);
    
    try {
      const newSandbox = await sandboxService.createSandbox(config);
      setSandbox(newSandbox);
      setResults([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sandbox');
    } finally {
      setLoading(false);
    }
  };

  const executeCommand = async () => {
    if (!sandbox || !command.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await sandboxService.executeCommand(sandbox, command);
      setResults(prev => [...prev, { ...result, command }]);
      setCommand('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute command');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start max-w-4xl w-full">
        <div className="flex items-center gap-4">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
          />
          <span className="text-xl font-bold">+ Daytona AI</span>
        </div>

        {/* Claude Code Chat Link */}
        <div className="w-full bg-blue-50 dark:bg-blue-900 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
          <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">🤖 Claude Code Chat</h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
            Chat directly with Claude Code CLI running in this sandbox environment.
          </p>
          <a
            href="/claude-chat"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Open Claude Code Chat
          </a>
        </div>

        {/* Sandbox Creation */}
        <div className="w-full bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border">
          <h2 className="text-xl font-bold mb-4">Create Sandbox</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => createSandbox({ language: 'typescript' })}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              TypeScript
            </button>
            <button
              onClick={() => createSandbox({ language: 'python' })}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Python
            </button>
            <button
              onClick={() => createSandbox({ language: 'node' })}
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              Node.js
            </button>
          </div>
          
          {sandbox && (
            <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 rounded">
              <p className="text-green-800 dark:text-green-200">
                ✅ Sandbox created successfully!
              </p>
            </div>
          )}
        </div>

        {/* Command Execution */}
        {sandbox && (
          <div className="w-full bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border">
            <h2 className="text-xl font-bold mb-4">Execute Commands</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Enter command (e.g., echo 'Hello World!')"
                className="flex-1 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                onKeyPress={(e) => e.key === 'Enter' && executeCommand()}
              />
              <button
                onClick={executeCommand}
                disabled={loading || !command.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                Run
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="w-full bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border">
            <h2 className="text-xl font-bold mb-4">Command Results</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <div className="font-mono text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded mb-2">
                    $ {result.command}
                  </div>
                  {result.output && (
                    <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-x-auto">
                      {result.output}
                    </pre>
                  )}
                  {result.error && (
                    <pre className="text-sm bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 p-3 rounded overflow-x-auto">
                      {result.error}
                    </pre>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    Exit code: {result.exitCode}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="w-full bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">❌ {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="w-full bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <p className="text-blue-800 dark:text-blue-200">⏳ Loading...</p>
          </div>
        )}

        {/* Instructions */}
        <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border">
          <h3 className="font-bold mb-2">Instructions:</h3>
          <ol className="font-mono list-inside list-decimal text-sm space-y-1">
            <li>Choose a programming language to create a sandbox</li>
            <li>Once created, you can execute commands in the sandbox</li>
            <li>Try commands like: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">ls</code>, <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">echo &quot;Hello World&quot;</code>, <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">node --version</code></li>
          </ol>
        </div>
      </main>
      
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <span className="text-sm text-gray-600">Powered by Daytona AI SDK</span>
      </footer>
    </div>
  );
}
