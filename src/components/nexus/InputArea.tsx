import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { GlobeIcon, MicIcon } from 'lucide-react';
import { FormEvent, useState } from 'react';
import type { ChatStatus } from 'ai';
import AgentDropdown from './AgentDropdown';
import MetaIcon from '@/components/icons/MetaIcon';
import AmazonIcon from '@/components/icons/AmazonIcon';
import GoogleAdsIcon from '@/components/icons/GoogleAdsIcon';
import GoogleAnalyticsIcon from '@/components/icons/GoogleAnalyticsIcon';
import ShopifyIcon from '@/components/icons/ShopifyIcon';
import ShopeeIcon from '@/components/icons/ShopeeIcon';
import ContaAzulIcon from '@/components/icons/ContaAzulIcon';

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  status: string;
  selectedAgent: string;
  onAgentChange: (agent: string) => void;
}

// Mapeamento de ícones das integrações
const iconMap: Record<string, React.ComponentType<{ className?: string }> | null> = {
  'nexus': null,
  'teste': null,
  'metaAnalyst': MetaIcon,
  'metaCampaignAnalyst': MetaIcon,
  'metaCreativeAnalyst': MetaIcon,
  'amazonAdsAnalyst': AmazonIcon,
  'googleAnalyticsAnalyst': GoogleAnalyticsIcon,
  'googleCampaignAnalyst': GoogleAdsIcon,
  'shopifyAnalyst': ShopifyIcon,
  'shopeeAnalyst': ShopeeIcon,
  'contaAzulAnalyst': ContaAzulIcon,
  'keywordAnalyst': null,
  'inventoryAnalyst': null,
  'cashFlowAnalyst': null,
  'pnlAnalyst': null,
  'budgetPlanningAnalyst': null,
};

const models = [
  { id: 'nexus', name: 'Nexus', icon: iconMap['nexus'] },
  { id: 'teste', name: 'Teste', icon: iconMap['teste'] },
  { id: 'metaAnalyst', name: 'MetaAnalyst', icon: iconMap['metaAnalyst'] },
  { id: 'amazonAdsAnalyst', name: 'AmazonAdsAnalyst', icon: iconMap['amazonAdsAnalyst'] },
  { id: 'googleAnalyticsAnalyst', name: 'GoogleAnalyticsAnalyst', icon: iconMap['googleAnalyticsAnalyst'] },
  { id: 'shopifyAnalyst', name: 'ShopifyAnalyst', icon: iconMap['shopifyAnalyst'] },
  { id: 'contaAzulAnalyst', name: 'ContaAzulAnalyst', icon: iconMap['contaAzulAnalyst'] },
  { id: 'shopeeAnalyst', name: 'ShopeeAnalyst', icon: iconMap['shopeeAnalyst'] },
  { id: 'keywordAnalyst', name: 'KeywordAnalyst', icon: iconMap['keywordAnalyst'] },
  { id: 'googleCampaignAnalyst', name: 'GoogleCampaignAnalyst', icon: iconMap['googleCampaignAnalyst'] },
  { id: 'metaCampaignAnalyst', name: 'MetaCampaignAnalyst', icon: iconMap['metaCampaignAnalyst'] },
  { id: 'metaCreativeAnalyst', name: 'MetaCreativeAnalyst', icon: iconMap['metaCreativeAnalyst'] },
  { id: 'inventoryAnalyst', name: 'InventoryAnalyst', icon: iconMap['inventoryAnalyst'] },
  { id: 'cashFlowAnalyst', name: 'CashFlowAnalyst', icon: iconMap['cashFlowAnalyst'] },
  { id: 'pnlAnalyst', name: 'P&LAnalyst', icon: iconMap['pnlAnalyst'] },
  { id: 'budgetPlanningAnalyst', name: 'BudgetPlanningAnalyst', icon: iconMap['budgetPlanningAnalyst'] },
];

export default function InputArea({ input, setInput, onSubmit, status, selectedAgent, onAgentChange }: InputAreaProps) {
  // Estado para controlar a exibição do dropdown de agentes quando "/" é digitado
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  // Armazena a posição exata onde o "/" foi digitado no texto
  const [slashPosition, setSlashPosition] = useState(-1);
  
  console.log('🎤 [InputArea] Agent via prop:', selectedAgent);

  // Handler que detecta quando o usuário digita "/" para mostrar o dropdown de agentes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Detecta se o usuário terminou de digitar com "/"
    if (value.endsWith('/')) {
      setShowAgentDropdown(true);
      setSlashPosition(value.length - 1); // Salva a posição do "/" para substituição posterior
    } else {
      setShowAgentDropdown(false);
      setSlashPosition(-1);
    }
  };

  return (
    <div className="relative">
      {/* Dropdown que aparece quando o usuário digita "/" */}
      {showAgentDropdown && (
        <AgentDropdown
          currentAgent={selectedAgent}
          onAgentSelect={(agentId) => {
            // Mapear ID do agente para nome legível
            const getAgentName = (id: string) => {
              switch (id) {
                case 'nexus': return 'Nexus';
                case 'teste': return 'Teste';
                case 'metaAnalyst': return 'MetaAnalyst';
                case 'amazonAdsAnalyst': return 'AmazonAdsAnalyst';
                case 'googleAnalyticsAnalyst': return 'GoogleAnalyticsAnalyst';
                case 'shopifyAnalyst': return 'ShopifyAnalyst';
                case 'contaAzulAnalyst': return 'ContaAzulAnalyst';
                case 'shopeeAnalyst': return 'ShopeeAnalyst';
                case 'keywordAnalyst': return 'KeywordAnalyst';
                case 'googleCampaignAnalyst': return 'GoogleCampaignAnalyst';
                case 'metaCampaignAnalyst': return 'MetaCampaignAnalyst';
                case 'metaCreativeAnalyst': return 'MetaCreativeAnalyst';
                case 'inventoryAnalyst': return 'InventoryAnalyst';
                case 'cashFlowAnalyst': return 'CashFlowAnalyst';
                case 'pnlAnalyst': return 'P&LAnalyst';
                case 'budgetPlanningAnalyst': return 'BudgetPlanningAnalyst';
                default: return id;
              }
            };
            const agentName = getAgentName(agentId);
            
            // Substituir o "/" pela tag do agente na posição exata onde foi digitado
            const beforeSlash = input.slice(0, slashPosition); // Texto antes do "/"
            const afterSlash = input.slice(slashPosition + 1); // Texto depois do "/"
            const newValue = beforeSlash + `[${agentName}] ` + afterSlash; // Texto final com tag
            
            setInput(newValue);
            onAgentChange(agentId); // Atualiza o agente selecionado
          }}
          onClose={() => setShowAgentDropdown(false)}
        />
      )}
      
      <PromptInput onSubmit={onSubmit} className="mt-4 border-gray-100">
        <PromptInputTextarea
          onChange={handleInputChange}
          value={input}
        />
      <PromptInputToolbar>
        <PromptInputTools>
          <PromptInputButton>
            <MicIcon size={16} />
          </PromptInputButton>
          <PromptInputButton>
            <GlobeIcon size={16} />
            <span>Search</span>
          </PromptInputButton>
          <PromptInputModelSelect
            onValueChange={(value) => {
              console.log('🎤 [InputArea] onValueChange chamado:', value);
              onAgentChange(value);
            }}
            value={selectedAgent}
          >
            <PromptInputModelSelectTrigger>
              <PromptInputModelSelectValue />
            </PromptInputModelSelectTrigger>
            <PromptInputModelSelectContent>
              {models.map((model) => (
                <PromptInputModelSelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    {model.icon && (
                      <model.icon className="w-4 h-4" />
                    )}
                    <span>{model.name}</span>
                  </div>
                </PromptInputModelSelectItem>
              ))}
            </PromptInputModelSelectContent>
          </PromptInputModelSelect>
        </PromptInputTools>
        <PromptInputSubmit disabled={!input} status={status as ChatStatus} />
      </PromptInputToolbar>
    </PromptInput>
    </div>
  );
}