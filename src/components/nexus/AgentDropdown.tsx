import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

interface AgentDropdownProps {
  currentAgent: string;
  onAgentSelect: (agentId: string) => void;
  onClose: () => void;
}

// Lista de agentes disponíveis com suas informações visuais
const agents = [
  { id: 'nexus', name: 'Nexus', icon: 'N', color: 'text-blue-600' },
  { id: 'teste', name: 'Teste', icon: 'T', color: 'text-green-600' },
  { id: 'metaAnalyst', name: 'MetaAnalyst', icon: 'M', color: 'text-purple-600' },
  { id: 'amazonAdsAnalyst', name: 'AmazonAdsAnalyst', icon: 'A', color: 'text-orange-600' },
  { id: 'googleAnalyticsAnalyst', name: 'GoogleAnalyticsAnalyst', icon: 'G', color: 'text-blue-500' },
  { id: 'shopifyAnalyst', name: 'ShopifyAnalyst', icon: 'S', color: 'text-green-500' },
  { id: 'contaAzulAnalyst', name: 'ContaAzulAnalyst', icon: 'C', color: 'text-indigo-600' },
  { id: 'shopeeAnalyst', name: 'ShopeeAnalyst', icon: 'H', color: 'text-red-600' },
];

// Dropdown elegante que aparece quando o usuário digita "/" no input
export default function AgentDropdown({ currentAgent, onAgentSelect, onClose }: AgentDropdownProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filtrar agentes baseado na busca
  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Auto-focus no input quando dropdown abre
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Reset quando dropdown fecha
  useEffect(() => {
    return () => {
      setSearchTerm('');
      setSelectedIndex(0);
    };
  }, []);

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredAgents.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredAgents[selectedIndex]) {
          onAgentSelect(filteredAgents[selectedIndex].id);
          onClose();
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };
  return (
    <div className="absolute bottom-full left-0 mb-2 z-50 bg-white rounded-lg shadow-sm border border-gray-200/60 py-1 min-w-64">
      {/* Campo de busca */}
      <div className="px-3 py-2 border-b border-gray-100/60">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedIndex(0); // Reset seleção quando buscar
            }}
            onKeyDown={handleKeyDown}
            className="w-full pl-9 pr-3 py-2 text-base border-0 bg-transparent focus:outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Lista de agentes */}
      <div className="max-h-40 overflow-y-auto">
        {filteredAgents.length > 0 ? (
          filteredAgents.map((agent, index) => (
            <div
              key={agent.id}
              onClick={() => {
                onAgentSelect(agent.id); // Notifica qual agente foi selecionado
                onClose(); // Fecha o dropdown
              }}
              className={`flex items-center gap-3 px-3 py-2 text-base cursor-pointer transition-colors ${
                index === selectedIndex 
                  ? 'bg-gray-50/80 text-gray-900' 
                  : 'text-gray-700 hover:bg-gray-50/50'
              }`}
            >
              {/* Avatar circular com inicial do agente */}
              <div className={`w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium ${agent.color}`}>
                {agent.icon}
              </div>
              <span>{agent.name}</span>
            </div>
          ))
        ) : (
          <div className="px-3 py-2 text-base text-gray-500 text-center">
            No agents found
          </div>
        )}
      </div>
    </div>
  );
}