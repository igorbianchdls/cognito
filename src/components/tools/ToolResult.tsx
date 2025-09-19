import WeatherCard from './WeatherCard';
import CalculatorCard from './CalculatorCard';

interface ToolCall {
  id: string;
  name: string;
  state: 'loading' | 'result';
  args?: Record<string, unknown>;
  result?: Record<string, unknown>;
}

interface ToolResultProps {
  toolCall: ToolCall;
}

export default function ToolResult({ toolCall }: ToolResultProps) {
  if (toolCall.state === 'loading') {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Executing {toolCall.name}...
          </span>
        </div>
      </div>
    );
  }

  if (toolCall.state === 'result' && toolCall.result) {
    // Map tool names to their respective components
    switch (toolCall.name) {
      case 'weather':
        return <WeatherCard data={toolCall.result as { location: string; temperature: number; condition: string; humidity: number }} />;

      case 'calculator':
        return <CalculatorCard data={toolCall.result as { expression: string; result: number; steps?: string[] }} />;


      default:
        // Generic result display for unknown tools
        return (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔧</span>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 capitalize">
                {toolCall.name} Result
              </h3>
            </div>
            <pre className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 rounded p-2 overflow-x-auto">
              {JSON.stringify(toolCall.result, null, 2)}
            </pre>
          </div>
        );
    }
  }

  return null;
}