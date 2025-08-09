interface CalculationData {
  expression: string;
  result: number;
  steps?: string[];
}

interface CalculatorCardProps {
  data: CalculationData;
}

export default function CalculatorCard({ data }: CalculatorCardProps) {
  return (
    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-700 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl" role="img" aria-label="calculator">
          🧮
        </span>
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
          Calculation
        </h3>
      </div>
      
      <div className="space-y-3">
        <div className="bg-white dark:bg-gray-800 rounded p-3 border">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expression</div>
          <div className="font-mono text-lg text-gray-800 dark:text-gray-200">
            {data.expression}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded p-3 border">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Result</div>
          <div className="font-mono text-2xl font-bold text-green-600 dark:text-green-400">
            {data.result.toLocaleString()}
          </div>
        </div>
        
        {data.steps && data.steps.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded p-3 border">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Steps</div>
            <div className="space-y-1">
              {data.steps.map((step, index) => (
                <div key={index} className="font-mono text-sm text-gray-700 dark:text-gray-300">
                  {index + 1}. {step}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}