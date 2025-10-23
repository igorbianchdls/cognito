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
import {
  GlobeIcon,
  MicIcon,
  Plus,
  TrendingUp,
  Users,
  Wrench,
  ArrowDownLeft,
  Receipt,
  FileText,
  Package,
  ArrowUpRight,
  Activity,
  DollarSign
} from 'lucide-react';
import { FormEvent, useState } from 'react';
import type { ChatStatus } from 'ai';
import AgentDropdown from './AgentDropdown';

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  status: string;
  selectedAgent: string;
  onAgentChange: (agent: string) => void;
  onFileSelected?: (dataUrl: string, mime: string) => void;
}

// Mapeamento de ícones dos agentes
const iconMap: Record<string, React.ComponentType<{ className?: string }> | null> = {
  'analistaDados': null,
  'claudeAgent': null,
  'salesAgent': TrendingUp,
  'contasAReceberAgent': ArrowDownLeft,
  'receiptsAgent': Receipt,
  'nfeAgent': FileText,
  'inventoryAgent': Package,
  'ecommerceSalesAgentV2': TrendingUp,
  'webAnalyticsAgent': Activity,
  'logisticsAgent': Package,
  'paidTrafficAgent': DollarSign,
  'organicMarketingAgent': Activity,
  'gestorDeComprasAgent': Package,
  'gestorDeProjetosAgent': Wrench,
  'gestorDeServicosAgent': Wrench,
  'gestorDeVendasB2BAgent': TrendingUp,
  'funcionariosAgent': Users,
};

const models = [
  { id: 'analistaDados', name: 'Analista de Dados', icon: iconMap['analistaDados'] },
  { id: 'claudeAgent', name: 'Claude Simple', icon: iconMap['claudeAgent'] },
  { id: 'ecommerceSalesAgentV2', name: 'E-commerce Sales', icon: iconMap['ecommerceSalesAgentV2'] },
  { id: 'salesAgent', name: 'Sales Agent', icon: iconMap['salesAgent'] },
  { id: 'contasAReceberAgent', name: 'Contas a Receber', icon: iconMap['contasAReceberAgent'] },
  { id: 'receiptsAgent', name: 'Receipts', icon: iconMap['receiptsAgent'] },
  { id: 'nfeAgent', name: 'Notas Fiscais', icon: iconMap['nfeAgent'] },
  { id: 'inventoryAgent', name: 'Inventory', icon: iconMap['inventoryAgent'] },
  { id: 'logisticsAgent', name: 'Logistics', icon: iconMap['logisticsAgent'] },
  { id: 'funcionariosAgent', name: 'Funcionários', icon: iconMap['funcionariosAgent'] },
  { id: 'paidTrafficAgent', name: 'Tráfego Pago', icon: iconMap['paidTrafficAgent'] },
  { id: 'organicMarketingAgent', name: 'Marketing Orgânico', icon: iconMap['organicMarketingAgent'] },
  { id: 'webAnalyticsAgent', name: 'Web Analytics', icon: iconMap['webAnalyticsAgent'] },
  { id: 'gestorDeComprasAgent', name: 'Gestor de Compras', icon: iconMap['gestorDeComprasAgent'] },
  { id: 'gestorDeProjetosAgent', name: 'Gestor de Projetos', icon: iconMap['gestorDeProjetosAgent'] },
  { id: 'gestorDeServicosAgent', name: 'Gestor de Serviços', icon: iconMap['gestorDeServicosAgent'] },
  { id: 'gestorDeVendasB2BAgent', name: 'Gestor de Vendas B2B', icon: iconMap['gestorDeVendasB2BAgent'] },
  { id: 'automationAgent', name: 'Automações', icon: Wrench },
];

export default function InputArea({ input, setInput, onSubmit, status, selectedAgent, onAgentChange, onFileSelected }: InputAreaProps) {
  // Estado para controlar a exibição do dropdown de agentes quando "/" é digitado
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  // Armazena a posição exata onde o "/" foi digitado no texto
  const [slashPosition, setSlashPosition] = useState(-1);
  
  console.log('🎤 [InputArea] Agent via prop:', selectedAgent);

  // Função para handle upload de documentos
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      alert('Envie um PDF ou imagem (PNG/JPG/WebP)');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      // Atualiza o input com referência leve ao arquivo
      setInput((prev) => (prev ? prev + '\n\n' : '') + `[Documento anexado: ${file.name}]`);
      // Notifica o pai para anexar como file part no envio
      onFileSelected?.(dataUrl, file.type);
    };
    reader.readAsDataURL(file);

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
                case 'analistaDados': return 'Analista de Dados';
                case 'claudeAgent': return 'Claude Simple';
                case 'salesAgent': return 'Sales Agent';
                case 'contasAReceberAgent': return 'Contas a Receber';
                case 'receiptsAgent': return 'Receipts';
                case 'nfeAgent': return 'Notas Fiscais';
                case 'inventoryAgent': return 'Inventory';
                case 'ecommerceSalesAgentV2': return 'E-commerce Sales';
                case 'webAnalyticsAgent': return 'Web Analytics';
                case 'logisticsAgent': return 'Logistics';
                case 'paidTrafficAgent': return 'Tráfego Pago';
                case 'organicMarketingAgent': return 'Marketing Orgânico';
                case 'gestorDeComprasAgent': return 'Gestor de Compras';
                case 'gestorDeProjetosAgent': return 'Gestor de Projetos';
                case 'gestorDeServicosAgent': return 'Gestor de Serviços';
                case 'gestorDeVendasB2BAgent': return 'Gestor de Vendas B2B';
                case 'funcionariosAgent': return 'Funcionários';
                case 'automationAgent': return 'Automações';
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
            accept=".pdf,image/png,image/jpeg,image/webp"
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
