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
  DollarSign,
  BookOpen,
  Workflow
} from 'lucide-react';
import { FormEvent, useState } from 'react';
import type { ChatStatus } from 'ai';
import AgentDropdown from './AgentDropdown';
import { useStore } from '@nanostores/react';
import { currentWorkflow, setCurrentWorkflow } from '@/stores/nexus/workflowStore';

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  status: string;
  selectedAgent: string | null;
  onAgentChange: (agent: string | null) => void;
  onFileSelected?: (dataUrl: string, mime: string) => void;
}

// Mapeamento de ícones dos agentes
const iconMap: Record<string, React.ComponentType<{ className?: string }> | null> = {
  'salesAgent': TrendingUp,
  'contasAReceberAgent': ArrowDownLeft,
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
  'crmAgent': Users,
  'contabilidadeAgent': BookOpen,
};

const models = [
  { id: 'ecommerceSalesAgentV2', name: 'Gestor de E-commerce', icon: iconMap['ecommerceSalesAgentV2'] },
  { id: 'salesAgent', name: 'Executivo de Vendas', icon: iconMap['salesAgent'] },
  { id: 'contasAReceberAgent', name: 'Contas a Pagar e Receber', icon: iconMap['contasAReceberAgent'] },
  { id: 'inventoryAgent', name: 'Gestor de Estoque', icon: iconMap['inventoryAgent'] },
  { id: 'logisticsAgent', name: 'Coordenador de Logística', icon: iconMap['logisticsAgent'] },
  { id: 'funcionariosAgent', name: 'Analista de RH', icon: iconMap['funcionariosAgent'] },
  { id: 'paidTrafficAgent', name: 'Gestor de Tráfego Pago', icon: iconMap['paidTrafficAgent'] },
  { id: 'organicMarketingAgent', name: 'Analista de Marketing Orgânico', icon: iconMap['organicMarketingAgent'] },
  { id: 'webAnalyticsAgent', name: 'Analista de Web Analytics', icon: iconMap['webAnalyticsAgent'] },
  { id: 'gestorDeComprasAgent', name: 'Gestor de Compras', icon: iconMap['gestorDeComprasAgent'] },
  { id: 'gestorDeProjetosAgent', name: 'Gerente de Projetos', icon: iconMap['gestorDeProjetosAgent'] },
  { id: 'gestorDeServicosAgent', name: 'Gestor de Serviços', icon: iconMap['gestorDeServicosAgent'] },
  { id: 'gestorDeVendasB2BAgent', name: 'Gerente de Vendas B2B', icon: iconMap['gestorDeVendasB2BAgent'] },
  { id: 'crmAgent', name: 'Analista de CRM', icon: iconMap['crmAgent'] },
  { id: 'contabilidadeAgent', name: 'Agente de Contabilidade', icon: iconMap['contabilidadeAgent'] },
];

// Workflows disponíveis
const workflows = [
  { id: 'contas-a-pagar', name: 'Contas a Pagar', icon: ArrowDownLeft },
  { id: 'contas-a-receber', name: 'Contas a Receber', icon: ArrowUpRight },
  { id: 'pagamento-efetuado', name: 'Pagamento Efetuado', icon: DollarSign },
  { id: 'pagamento-recebido', name: 'Pagamento Recebido', icon: TrendingUp },
];

export default function InputArea({ input, setInput, onSubmit, status, selectedAgent, onAgentChange, onFileSelected }: InputAreaProps) {
  // Estado para controlar a exibição do dropdown de agentes quando "/" é digitado
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  // Armazena a posição exata onde o "/" foi digitado no texto
  const [slashPosition, setSlashPosition] = useState(-1);

  // Workflow store
  const selectedWorkflow = useStore(currentWorkflow);

  console.log('🎤 [InputArea] Agent via prop:', selectedAgent);
  console.log('🔄 [InputArea] Workflow via store:', selectedWorkflow);

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
      setInput((input ? input + '\n\n' : '') + `[Documento anexado: ${file.name}]`);
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
                case 'salesAgent': return 'Executivo de Vendas';
                case 'contasAReceberAgent': return 'Contas a Pagar e Receber';
                case 'inventoryAgent': return 'Gestor de Estoque';
                case 'ecommerceSalesAgentV2': return 'Gestor de E-commerce';
                case 'webAnalyticsAgent': return 'Analista de Web Analytics';
                case 'logisticsAgent': return 'Coordenador de Logística';
                case 'paidTrafficAgent': return 'Gestor de Tráfego Pago';
                case 'organicMarketingAgent': return 'Analista de Marketing Orgânico';
                case 'gestorDeComprasAgent': return 'Gestor de Compras';
                case 'gestorDeProjetosAgent': return 'Gerente de Projetos';
                case 'gestorDeServicosAgent': return 'Gestor de Serviços';
                case 'gestorDeVendasB2BAgent': return 'Gerente de Vendas B2B';
                case 'funcionariosAgent': return 'Analista de RH';
                case 'crmAgent': return 'Analista de CRM';
                case 'contabilidadeAgent': return 'Agente de Contabilidade';
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
              setCurrentWorkflow(null);  // Limpar workflow quando agente é selecionado
            }}
            value={selectedAgent || ''}
          >
            <PromptInputModelSelectTrigger
              className={selectedAgent ? 'text-blue-600 hover:text-blue-700' : ''}
            >
              <PromptInputModelSelectValue placeholder="Agentes" />
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

          <PromptInputModelSelect
            onValueChange={(value) => {
              console.log('🔄 [InputArea] Workflow changed:', value);
              setCurrentWorkflow(value);
              onAgentChange(null);  // Limpar agente quando workflow é selecionado
            }}
            value={selectedWorkflow || ''}
          >
            <PromptInputModelSelectTrigger
              className={selectedWorkflow ? 'text-blue-600 hover:text-blue-700' : ''}
            >
              <PromptInputModelSelectValue placeholder="Workflow" />
            </PromptInputModelSelectTrigger>
            <PromptInputModelSelectContent>
              {workflows.map((workflow) => (
                <PromptInputModelSelectItem key={workflow.id} value={workflow.id}>
                  <div className="flex items-center gap-2">
                    {workflow.icon && (
                      <workflow.icon className="w-4 h-4" />
                    )}
                    <span>{workflow.name}</span>
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
