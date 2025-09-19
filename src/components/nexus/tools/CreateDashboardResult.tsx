'use client';

interface CreateDashboardResultProps {
  success: boolean;
  generatedJson?: string;
  description?: string;
  message?: string;
}

export default function CreateDashboardResult({
  success,
  generatedJson,
  description,
  message
}: CreateDashboardResultProps) {
  if (!success) {
    return (
      <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-red-500">❌</span>
          <span className="text-red-700 font-medium">Failed to create dashboard</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🎨</span>
        <span className="font-medium text-green-800">Dashboard Created</span>
        <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
          JSON Generated
        </span>
      </div>

      {description && (
        <p className="text-green-700 mb-3">
          <strong>Description:</strong> {description}
        </p>
      )}

      {message && (
        <p className="text-green-700 mb-3 text-sm">{message}</p>
      )}

      {generatedJson && (
        <div className="bg-white rounded-lg border border-green-200 p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Generated Dashboard JSON</h4>
          <pre className="text-xs text-gray-600 bg-gray-50 rounded p-2 overflow-x-auto max-h-96 overflow-y-auto">
            {JSON.stringify(JSON.parse(generatedJson), null, 2)}
          </pre>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(generatedJson)}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
            >
              📋 Copy JSON
            </button>
            <button
              onClick={() => {
                const blob = new Blob([generatedJson], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'dashboard.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              💾 Download JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}