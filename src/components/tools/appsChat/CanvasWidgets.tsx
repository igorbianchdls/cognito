interface CanvasWidgetsProps {
  widgets: Array<{
    id: string
    name: string
    type: string
    position: { x: number; y: number }
    size: { width: number; height: number }
    description: string
    icon: string
  }>
  totalWidgets: number
  summary: string
  success: boolean
}

export default function CanvasWidgets({ widgets, totalWidgets, summary, success }: CanvasWidgetsProps) {
  if (!success) {
    return (
      <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-red-500">❌</span>
          <span className="text-red-700 font-medium">Failed to get canvas widgets</span>
        </div>
      </div>
    )
  }

  if (totalWidgets === 0) {
    return (
      <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📊</span>
          <span className="font-medium text-gray-700">Canvas Status</span>
        </div>
        <p className="text-gray-600">No widgets on the canvas. Drag widgets from the left panel to get started!</p>
      </div>
    )
  }

  return (
    <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">📊</span>
        <span className="font-medium text-blue-800">Canvas Widgets</span>
        <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
          {totalWidgets} widget{totalWidgets !== 1 ? 's' : ''}
        </span>
      </div>
      
      <p className="text-blue-700 mb-3">{summary}</p>
      
      <div className="space-y-2">
        {widgets.map((widget, index) => (
          <div key={widget.id} className="bg-white p-3 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <span className="text-xl">{widget.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">{widget.name}</h4>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                    {widget.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{widget.description}</p>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>📍 Position: ({widget.position.x}, {widget.position.y})</span>
                  <span>📏 Size: {widget.size.width}×{widget.size.height}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}