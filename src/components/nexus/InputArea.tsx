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
import { GlobeIcon, MicIcon, Plus } from 'lucide-react';
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
  'claudeAgent': null,
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
  'performanceAgent': null,
  'productAgent': null,
  'analistaDados': null,
  'salesAgent': null,
  'rhAgent': null,
  'serviceOrdersAgent': null,
  'contasAReceberAgent': null,
  'receiptsAgent': null,
  'nfeAgent': null,
  'inventoryAgent': null,
  'contasAPagarAgent': null,
  'fluxoCaixaAgent': null,
};

const models = [
  { id: 'nexus', name: 'Nexus', icon: iconMap['nexus'] },
  { id: 'teste', name: 'Teste', icon: iconMap['teste'] },
  { id: 'claudeAgent', name: 'Claude Agent', icon: iconMap['claudeAgent'] },
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
  { id: 'performanceAgent', name: 'PerformanceAgent', icon: iconMap['performanceAgent'] },
  { id: 'productAgent', name: 'ProductAgent', icon: iconMap['productAgent'] },
  { id: 'analistaDados', name: 'Analista de Dados', icon: iconMap['analistaDados'] },
  { id: 'salesAgent', name: 'SalesAgent', icon: iconMap['salesAgent'] },
  { id: 'rhAgent', name: 'RH Agent', icon: iconMap['rhAgent'] },
  { id: 'serviceOrdersAgent', name: 'Service Orders Agent', icon: iconMap['serviceOrdersAgent'] },
  { id: 'contasAReceberAgent', name: 'Contas a Receber', icon: iconMap['contasAReceberAgent'] },
  { id: 'receiptsAgent', name: 'Receipts Agent', icon: iconMap['receiptsAgent'] },
  { id: 'nfeAgent', name: 'Invoice Agent', icon: iconMap['nfeAgent'] },
  { id: 'inventoryAgent', name: 'Inventory Agent', icon: iconMap['inventoryAgent'] },
  { id: 'contasAPagarAgent', name: 'Contas a Pagar', icon: iconMap['contasAPagarAgent'] },
  { id: 'fluxoCaixaAgent', name: 'Fluxo de Caixa', icon: iconMap['fluxoCaixaAgent'] },
];

export default function InputArea({ input, setInput, onSubmit, status, selectedAgent, onAgentChange }: InputAreaProps) {
  // Estado para controlar a exibição do dropdown de agentes quando "/" é digitado
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  // Armazena a posição exata onde o "/" foi digitado no texto
  const [slashPosition, setSlashPosition] = useState(-1);
  
  console.log('🎤 [InputArea] Agent via prop:', selectedAgent);

  // Função para handle upload de documentos
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const fileInfo = `[Documento: ${file.name}]\n${content}`;
      setInput(input + (input ? '\n\n' : '') + fileInfo);
    };
    reader.readAsText(file);
    
    // Reset input file
    event.target.value = '';
  };

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

  // Detectar se há dados anexados para aplicar estilo diferente
  const hasDataAttachment = input.startsWith('[+') && input.includes('linhas de dados]');

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
                case 'claudeAgent': return 'Claude Agent';
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
                case 'analistaDados': return 'Analista de Dados';
                case 'salesAgent': return 'SalesAgent';
                case 'rhAgent': return 'RH Agent';
                case 'serviceOrdersAgent': return 'Service Orders Agent';
                case 'contasAReceberAgent': return 'Contas a Receber';
                case 'receiptsAgent': return 'Receipts Agent';
                case 'nfeAgent': return 'Invoice Agent';
                case 'inventoryAgent': return 'Inventory Agent';
                case 'contasAPagarAgent': return 'Contas a Pagar';
                case 'fluxoCaixaAgent': return 'Fluxo de Caixa';
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
          className={hasDataAttachment ? 'text-blue-600' : ''}
        />
      <PromptInputToolbar>
        <PromptInputTools>
          <PromptInputButton asChild>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Plus size={16} />
            </label>
          </PromptInputButton>
          
          <input
            id="file-upload"
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />

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