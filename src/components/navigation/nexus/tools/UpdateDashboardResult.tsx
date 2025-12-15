'use client';

interface UpdateItem {
  id: string;
  changes: Record<string, unknown>;
}

interface UpdateDashboardResultProps {
  success: boolean;
  updateJson?: string;
  description?: string;
  message?: string;
}

export default function UpdateDashboardResult({
  success,
  updateJson,
  description,
  message
}: UpdateDashboardResultProps) {
  if (!success) {
    return (
      <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-red-500">❌</span>
          <span className="text-red-700 font-medium">Failed to update dashboard</span>
        </div>
      </div>
    );
  }

  // Parse updates to show summary
  let parsedUpdates: UpdateItem[] = [];
  if (updateJson) {
    try {
      const parsed = JSON.parse(updateJson);
      parsedUpdates = parsed.updates || [];
    } catch (error) {
      console.error('Error parsing updateJson:', error);
    }
  }

  return (
    <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🔄</span>
        <span className="font-medium text-blue-800">Dashboard Updated</span>
        <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
          {parsedUpdates.length} widget{parsedUpdates.length !== 1 ? 's' : ''} updated
        </span>
      </div>

      {description && (
        <p className="text-blue-700 mb-3">
          <strong>Changes:</strong> {description}
        </p>
      )}

      {message && (
        <p className="text-blue-700 mb-3 text-sm">{message}</p>
      )}

      {/* Summary of Updates */}
      {parsedUpdates.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Updated Widgets:</h4>
          <div className="space-y-2">
            {parsedUpdates.map((update, index) => (
              <div key={index} className="bg-white p-2 rounded border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">Widget: {update.id}</span>
                </div>
                <div className="text-xs text-gray-600">
                  Changes: {Object.keys(update.changes || {}).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {updateJson && (
        <div className="bg-white rounded-lg border border-blue-200 p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Update JSON</h4>
          <pre className="text-xs text-gray-600 bg-gray-50 rounded p-2 overflow-x-auto max-h-96 overflow-y-auto">
            {JSON.stringify(JSON.parse(updateJson), null, 2)}
          </pre>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(updateJson)}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              📋 Copy JSON
            </button>
            <button
              onClick={() => {
                const blob = new Blob([updateJson], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'dashboard-updates.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
            >
              💾 Download JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}