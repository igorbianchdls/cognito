export default function DashboardChatPanel() {
  return (
    <div className="h-full bg-white rounded-lg border border-gray-200 p-4">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-600">Visualizações e métricas em tempo real</p>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium mb-2">Painel de Dashboard</h3>
            <p className="text-sm">Aqui aparecerão gráficos e métricas</p>
          </div>
        </div>
      </div>
    </div>
  );
}