'use client'

import { useState } from 'react'

interface Automation {
  id: string
  name: string
  description: string
  condition: string
  action: string
  isActive: boolean
}

export default function AutomationsPanel() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [newAutomation, setNewAutomation] = useState({
    name: '',
    description: '',
    condition: '',
    action: ''
  })

  const handleCreateAutomation = () => {
    if (!newAutomation.name || !newAutomation.condition || !newAutomation.action) {
      return
    }

    const automation: Automation = {
      id: `automation-${Date.now()}`,
      name: newAutomation.name,
      description: newAutomation.description,
      condition: newAutomation.condition,
      action: newAutomation.action,
      isActive: true
    }

    setAutomations(prev => [...prev, automation])
    setNewAutomation({ name: '', description: '', condition: '', action: '' })
    setIsCreating(false)
  }

  const handleDeleteAutomation = (id: string) => {
    setAutomations(prev => prev.filter(automation => automation.id !== id))
  }

  const handleToggleActive = (id: string) => {
    setAutomations(prev => prev.map(automation =>
      automation.id === id 
        ? { ...automation, isActive: !automation.isActive }
        : automation
    ))
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Automações</h2>
            <p className="text-sm text-gray-600">Configure alertas e ações automáticas</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Nova
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isCreating && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="text-md font-medium text-gray-900 mb-3">Criar Nova Automação</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Automação
                </label>
                <input
                  type="text"
                  value={newAutomation.name}
                  onChange={(e) => setNewAutomation(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Alerta de vendas altas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={newAutomation.description}
                  onChange={(e) => setNewAutomation(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição opcional da automação"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condição
                </label>
                <select
                  value={newAutomation.condition}
                  onChange={(e) => setNewAutomation(prev => ({ ...prev, condition: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione uma condição</option>
                  <option value="vendas > 1000">Vendas &gt; 1000</option>
                  <option value="lucro < 500">Lucro &lt; 500</option>
                  <option value="meta_atingida">Meta atingida</option>
                  <option value="erro_sistema">Erro no sistema</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ação
                </label>
                <select
                  value={newAutomation.action}
                  onChange={(e) => setNewAutomation(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione uma ação</option>
                  <option value="enviar_email">Enviar email</option>
                  <option value="enviar_notificacao">Enviar notificação</option>
                  <option value="executar_script">Executar script</option>
                  <option value="atualizar_dashboard">Atualizar dashboard</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCreateAutomation}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Criar
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false)
                    setNewAutomation({ name: '', description: '', condition: '', action: '' })
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {automations.length === 0 && !isCreating ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-3">🤖</div>
            <p className="text-lg font-medium mb-2">Nenhuma automação configurada</p>
            <p className="text-sm">Clique em &quot;Nova&quot; para criar sua primeira automação</p>
          </div>
        ) : (
          <div className="space-y-3">
            {automations.map((automation) => (
              <div
                key={automation.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{automation.name}</h4>
                    {automation.description && (
                      <p className="text-sm text-gray-600 mt-1">{automation.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(automation.id)}
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        automation.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {automation.isActive ? 'Ativa' : 'Inativa'}
                    </button>
                    <button
                      onClick={() => handleDeleteAutomation(automation.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">Quando:</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {automation.condition}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Então:</span>
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                      {automation.action}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}