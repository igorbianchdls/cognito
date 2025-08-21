interface AgentDropdownProps {
  currentAgent: string;
  onAgentSelect: (agentId: string) => void;
  onClose: () => void;
}

const agents = [
  { id: 'nexus', name: 'Nexus', icon: 'N', color: 'text-blue-600' },
  { id: 'teste', name: 'Teste', icon: 'T', color: 'text-green-600' },
];

export default function AgentDropdown({ currentAgent, onAgentSelect, onClose }: AgentDropdownProps) {
  return (
    <div className="absolute bottom-full left-0 mb-2 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-48">
      {agents.map((agent) => (
        <div
          key={agent.id}
          onClick={() => {
            onAgentSelect(agent.id);
            onClose();
          }}
          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <div className={`w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium ${agent.color}`}>
            {agent.icon}
          </div>
          <span>{agent.name}</span>
        </div>
      ))}
    </div>
  );
}