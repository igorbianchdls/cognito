import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AgentDropdownProps {
  currentAgent: string;
  onAgentSelect: (agentId: string) => void;
  onClose: () => void;
}

const agents = [
  { id: 'nexus', name: 'Nexus', icon: '🔵', color: 'bg-blue-500' },
  { id: 'teste', name: 'Teste', icon: '🟢', color: 'bg-green-500' },
];

export default function AgentDropdown({ currentAgent, onAgentSelect, onClose }: AgentDropdownProps) {
  return (
    <Card className="absolute bottom-full left-0 right-0 mb-2 z-50 shadow-lg border">
      <CardContent className="p-3">
        <div className="text-sm font-medium mb-2 text-gray-700">Selecionar Agente</div>
        <div className="space-y-2">
          {agents.map((agent) => (
            <Button
              key={agent.id}
              variant={currentAgent === agent.id ? "default" : "ghost"}
              onClick={() => {
                onAgentSelect(agent.id);
                onClose();
              }}
              className="w-full justify-start gap-2 h-auto p-2"
            >
              <div className={`w-3 h-3 rounded-full ${agent.color}`}></div>
              <span>{agent.name}</span>
              {currentAgent === agent.id && <span className="ml-auto text-xs">✓</span>}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}