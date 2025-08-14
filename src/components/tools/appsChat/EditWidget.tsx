type WidgetChanges = {
  x?: number
  y?: number  
  w?: number
  h?: number
  color?: string
  style?: {
    borderRadius?: 'small' | 'medium' | 'large'
    shadow?: boolean
    background?: 'solid' | 'gradient'
  }
}

interface EditWidgetProps {
  success: boolean
  action: string
  widgetId: string
  widgetName: string
  changes?: WidgetChanges
  message: string
  error?: string
  note?: string
  availableWidgets?: Array<{ id: string; name: string }>
}

export default function EditWidget({
  success,
  action,
  widgetId,
  widgetName,
  changes,
  message,
  error,
  note,
  availableWidgets
}: EditWidgetProps) {
  if (!success) {
    return (
      <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-red-500">❌</span>
          <span className="text-red-700 font-medium">Edit Failed</span>
        </div>
        <p className="text-red-600 mb-2">{error}</p>
        
        {availableWidgets && availableWidgets.length > 0 && (
          <div className="mt-3">
            <p className="text-sm text-red-600 font-medium mb-1">Available widgets:</p>
            <div className="flex flex-wrap gap-1">
              {availableWidgets.map((widget) => (
                <span key={widget.id} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                  {widget.name} ({widget.id})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'move': return '📍'
      case 'resize': return '📏'
      case 'changeColor': return '🎨'
      case 'changeStyle': return '✨'
      case 'delete': return '🗑️'
      default: return '⚙️'
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'move': return 'blue'
      case 'resize': return 'green'
      case 'changeColor': return 'purple'
      case 'changeStyle': return 'pink'
      case 'delete': return 'red'
      default: return 'gray'
    }
  }

  const actionColor = getActionColor(action)
  const isDangerous = action === 'delete'

  return (
    <div className={`mt-3 p-4 border rounded-lg ${
      isDangerous 
        ? 'bg-red-50 border-red-200' 
        : `bg-${actionColor}-50 border-${actionColor}-200`
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{getActionIcon(action)}</span>
        <span className={`font-medium ${
          isDangerous ? 'text-red-700' : `text-${actionColor}-800`
        }`}>
          Widget {action.charAt(0).toUpperCase() + action.slice(1)}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          isDangerous 
            ? 'bg-red-200 text-red-800' 
            : `bg-${actionColor}-200 text-${actionColor}-800`
        }`}>
          {widgetName}
        </span>
      </div>
      
      <p className={`mb-2 ${
        isDangerous ? 'text-red-700' : `text-${actionColor}-700`
      }`}>
        {message}
      </p>
      
      {changes && Object.keys(changes).length > 0 && (
        <div className="bg-white p-3 rounded border border-gray-200 mb-2">
          <p className="text-sm font-medium text-gray-700 mb-1">Changes Applied:</p>
          <div className="space-y-1">
            {Object.entries(changes).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-600 capitalize">{key}:</span>
                <span className="text-gray-900 font-mono">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {note && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
          <span className="font-medium">Note:</span> {note}
        </div>
      )}
    </div>
  )
}