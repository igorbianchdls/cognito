import { UIMessage, type ToolUIPart } from 'ai';
import { Response } from '@/components/ai-elements/response';
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning';
import { Actions, Action } from '@/components/ai-elements/actions';
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
import { CopyIcon, ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react';
import MetaIcon from '@/components/icons/MetaIcon';
import GoogleIcon from '@/components/icons/GoogleIcon';
import GoogleAnalyticsIcon from '@/components/icons/GoogleAnalyticsIcon';
import GoogleAdsIcon from '@/components/icons/GoogleAdsIcon';
import WeatherCard from '../tools/WeatherCard';
import DatasetsList from '../tools/DatasetsList';
import TablesList from '../tools/TablesList';
import TableData from '../tools/TableData';
import ChartVisualization from '../tools/ChartVisualization';
import ResultDisplay from '../tools/ResultDisplay';
import Dashboard from '../tools/Dashboard';
import SQLExecution from '../tools/SQLExecution';
import TableCreation from '../tools/TableCreation';
import { KPICard } from '../widgets/KPICard';
import WebPreviewCard from '../tools/WebPreviewCard';

interface ReasoningPart {
  type: 'reasoning';
  state: 'streaming' | 'complete';
  content?: string;
  text?: string;
}

type WeatherToolInput = {
  location: string;
};

type WeatherToolOutput = {
  location: string;
  temperature: number;
};

type DatasetToolInput = {
  projectId?: string;
};

type DatasetToolOutput = {
  datasets: Array<{
    id: string;
    friendlyName?: string;
    description?: string;
    location?: string;
    creationTime?: string;
    lastModifiedTime?: string;
  }>;
  success: boolean;
  error?: string;
};

type TablesToolInput = {
  datasetId: string;
};

type TablesToolOutput = {
  tables: Array<{
    tableId: string;
    description?: string;
    numRows?: number;
    numBytes?: number;
    creationTime?: string;
  }>;
  datasetId: string;
  success: boolean;
  error?: string;
};

type DataToolInput = {
  datasetId: string;
  tableId: string;
  limit?: number;
};

type DataToolOutput = {
  data: Array<Record<string, unknown>>;
  schema: Array<{
    name: string;
    type: string;
    mode: string;
  }>;
  totalRows: number;
  executionTime: number;
  datasetId: string;
  tableId: string;
  query?: string;
  success: boolean;
  error?: string;
};


type CriarGraficoToolInput = {
  tableData: Array<Record<string, unknown>>;
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'heatmap' | 'radar' | 'funnel' | 'treemap' | 'stream';
  xColumn: string;
  yColumn: string;
  title?: string;
  groupBy?: string;
};

type CriarGraficoToolOutput = {
  chartData: Array<{
    x?: string;
    y?: number;
    label?: string;
    value?: number;
    color?: string;
  }>;
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'heatmap' | 'radar' | 'funnel' | 'treemap' | 'stream';
  title: string;
  xColumn: string;
  yColumn: string;
  metadata: {
    totalDataPoints: number;
    generatedAt: string;
    executionTime: number;
    dataSource?: string;
  };
  success: boolean;
  error?: string;
};

type RetrieveResultToolInput = {
  resultId?: string;
  queryId?: string;
  resultType?: 'analysis' | 'chart' | 'dashboard' | 'query';
};

type SourceDocument = {
  id: string;
  title: string;
  url?: string;
  snippet: string;
  relevanceScore: number;
};

type RetrieveResultToolOutput = {
  resultId: string;
  resultType: string;
  result: {
    type?: string;
    data?: Record<string, unknown>;
    message?: string;
    query?: string;
    response?: string;
  };
  sources?: SourceDocument[];
  retrievedAt: string;
  success: boolean;
  error?: string;
};

type CriarDashboardToolInput = {
  datasetIds: string[];
  title: string;
  dashboardType: 'executive' | 'operational' | 'analytical';
  kpis?: string[];
};

type CriarDashboardToolOutput = {
  dashboardId: string;
  title: string;
  dashboardType: string;
  datasetIds: string[];
  widgets: Array<{
    type: string;
    title: string;
    value?: string;
    trend?: string;
    color?: string;
    target?: string;
    chartType?: string;
    size?: string;
    rows?: number;
    items?: string[];
  }>;
  kpis: string[];
  layout: {
    columns: number;
    theme: string;
    autoRefresh: boolean;
  };
  metadata: {
    createdAt: string;
    lastUpdated: string;
    version: string;
  };
  success: boolean;
  error?: string;
};

type ExecutarSQLToolInput = {
  sqlQuery: string;
  datasetId?: string;
  dryRun?: boolean;
};

type ExecutarSQLToolOutput = {
  sqlQuery: string;
  datasetId: string;
  queryType: string;
  dryRun: boolean;
  data: Array<Record<string, unknown>>;
  schema: Array<{
    name: string;
    type: string;
    mode: string;
  }>;
  rowsReturned: number;
  rowsAffected: number;
  totalRows: number;
  executionTime: number;
  bytesProcessed: number;
  success: boolean;
  validationErrors: string[];
  error?: string;
};

type CriarTabelaToolInput = {
  datasetId: string;
  tableName: string;
  schema: Array<{
    name: string;
    type: 'STRING' | 'INTEGER' | 'FLOAT' | 'BOOLEAN' | 'DATE' | 'TIMESTAMP';
    mode?: 'REQUIRED' | 'NULLABLE' | 'REPEATED';
  }>;
  description?: string;
};

type CriarTabelaToolOutput = {
  datasetId: string;
  tableName: string;
  tableId: string;
  schema: Array<{
    name: string;
    type: string;
    mode: string;
  }>;
  description: string;
  location: string;
  creationTime: string;
  lastModifiedTime: string;
  numRows: number;
  numBytes: number;
  expirationTime: string | null;
  labels: Record<string, string>;
  metadata: {
    tableType: string;
    createdBy: string;
    version: string;
  };
  success: boolean;
  error?: string;
};

type CriarKPIToolInput = {
  name: string;
  datasetId: string;
  tableId: string;
  metric: 'sum' | 'count' | 'avg' | 'min' | 'max' | 'ratio';
  calculation: string;
  target?: number;
  unit?: string;
};

type CriarKPIToolOutput = {
  kpiId: string;
  name: string;
  datasetId: string;
  tableId: string;
  metric: string;
  calculation: string;
  currentValue: number;
  previousValue: number;
  target: number;
  unit: string;
  change: number;
  trend: string;
  status: string;
  timeRange: string;
  visualization: {
    chartType: string;
    color: string;
    showTrend: boolean;
    showTarget: boolean;
  };
  metadata: {
    createdAt: string;
    lastUpdated: string;
    refreshRate: string;
    dataSource: string;
  };
  success: boolean;
  error?: string;
};

type WebPreviewToolInput = {
  url: string;
};

type WebPreviewToolOutput = {
  url: string;
  title: string;
  description: string;
  favicon?: string;
  screenshot?: string;
  isValidUrl: boolean;
  previewAvailable: boolean;
  generatedAt: string;
  success: boolean;
  error?: string;
};

type NexusToolUIPart = ToolUIPart<{
  displayWeather: {
    input: WeatherToolInput;
    output: WeatherToolOutput;
  };
  getDatasets: {
    input: DatasetToolInput;
    output: DatasetToolOutput;
  };
  getTables: {
    input: TablesToolInput;
    output: TablesToolOutput;
  };
  getData: {
    input: DataToolInput;
    output: DataToolOutput;
  };
  criarGrafico: {
    input: CriarGraficoToolInput;
    output: CriarGraficoToolOutput;
  };
  retrieveResult: {
    input: RetrieveResultToolInput;
    output: RetrieveResultToolOutput;
  };
  criarDashboard: {
    input: CriarDashboardToolInput;
    output: CriarDashboardToolOutput;
  };
  executarSQL: {
    input: ExecutarSQLToolInput;
    output: ExecutarSQLToolOutput;
  };
  criarTabela: {
    input: CriarTabelaToolInput;
    output: CriarTabelaToolOutput;
  };
  criarKPI: {
    input: CriarKPIToolInput;
    output: CriarKPIToolOutput;
  };
  webPreview: {
    input: WebPreviewToolInput;
    output: WebPreviewToolOutput;
  };
}>;

// Função para mapear agente
const getAgentInfo = (agent: string) => {
  switch (agent) {
    case 'nexus':
      return { initial: 'N', title: 'Nexus AI', color: 'bg-blue-500' };
    case 'teste':
      return { initial: 'T', title: 'Teste AI', color: 'bg-green-500' };
    case 'metaAnalyst':
      return { initial: 'M', title: 'MetaAnalyst AI', color: 'bg-purple-500', icon: <MetaIcon className="w-full h-full" /> };
    case 'amazonAdsAnalyst':
      return { initial: 'A', title: 'AmazonAds AI', color: 'bg-orange-500' };
    case 'googleAnalyticsAnalyst':
      return { initial: 'G', title: 'GoogleAnalytics AI', color: 'bg-blue-400', icon: <GoogleAnalyticsIcon className="w-full h-full" /> };
    case 'shopifyAnalyst':
      return { initial: 'S', title: 'Shopify AI', color: 'bg-green-400' };
    case 'contaAzulAnalyst':
      return { initial: 'C', title: 'ContaAzul AI', color: 'bg-indigo-500' };
    case 'shopeeAnalyst':
      return { initial: 'H', title: 'Shopee AI', color: 'bg-red-500' };
    case 'keywordAnalyst':
      return { initial: 'K', title: 'Keyword AI', color: 'bg-yellow-500', icon: <GoogleAdsIcon className="w-full h-full" /> };
    case 'googleCampaignAnalyst':
      return { initial: 'Y', title: 'GoogleCampaign AI', color: 'bg-blue-700', icon: <GoogleAdsIcon className="w-full h-full" /> };
    case 'metaCampaignAnalyst':
      return { initial: 'B', title: 'MetaCampaign AI', color: 'bg-blue-800', icon: <MetaIcon className="w-full h-full" /> };
    case 'metaCreativeAnalyst':
      return { initial: 'R', title: 'MetaCreative AI', color: 'bg-pink-500', icon: <MetaIcon className="w-full h-full" /> };
    case 'inventoryAnalyst':
      return { initial: 'I', title: 'Inventory AI', color: 'bg-amber-600' };
    case 'cashFlowAnalyst':
      return { initial: 'F', title: 'CashFlow AI', color: 'bg-emerald-500' };
    case 'pnlAnalyst':
      return { initial: 'P', title: 'P&L AI', color: 'bg-yellow-400' };
    case 'budgetPlanningAnalyst':
      return { initial: 'U', title: 'BudgetPlanning AI', color: 'bg-violet-600' };
    default:
      return { initial: 'A', title: 'AI Assistant', color: 'bg-gray-500' };
  }
};

interface RespostaDaIAProps {
  message: UIMessage;
}

export default function RespostaDaIA({ message }: RespostaDaIAProps) {
  // Usar o agente da própria mensagem, não selectedAgent
  const messageAgent = (message as UIMessage & { agent?: string }).agent || 'nexus'; // fallback para nexus
  
  const agentInfo = getAgentInfo(messageAgent);
  const handleCopy = async () => {
    const textParts = message.parts
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join(' ');
    
    try {
      await navigator.clipboard.writeText(textParts);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div key={message.id}>
      {/* Header com Avatar + Título */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-md ${agentInfo.color} text-white font-semibold flex items-center justify-center`}>
          {agentInfo.icon || agentInfo.initial}
        </div>
        <h3 className="font-bold text-gray-900">{agentInfo.title}</h3>
      </div>
      {message.parts.map((part, index) => {
        if (part.type === 'text') {
          return <Response key={index}>{part.text}</Response>;
        }

        if (part.type === 'reasoning') {
          const reasoningText = (part as ReasoningPart).content || (part as ReasoningPart).text || '';
          return (
            <Reasoning key={index} isStreaming={part.state === 'streaming'}>
              <ReasoningTrigger />
              <ReasoningContent>{reasoningText}</ReasoningContent>
            </Reasoning>
          );
        }

        if (part.type === 'tool-displayWeather') {
          const weatherTool = part as NexusToolUIPart;
          const callId = weatherTool.toolCallId;
          const shouldBeOpen = weatherTool.state === 'output-available' || weatherTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-displayWeather" state={weatherTool.state} />
                <ToolContent>
                  {weatherTool.input && (
                    <ToolInput input={weatherTool.input} />
                  )}
                  {weatherTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={weatherTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {weatherTool.state === 'output-available' && (
                <WeatherCard data={weatherTool.output as WeatherToolOutput} />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getDatasets') {
          const datasetTool = part as NexusToolUIPart;
          const callId = datasetTool.toolCallId;
          const shouldBeOpen = datasetTool.state === 'output-available' || datasetTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getDatasets" state={datasetTool.state} />
                <ToolContent>
                  {datasetTool.input && (
                    <ToolInput input={datasetTool.input} />
                  )}
                  {datasetTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={datasetTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {datasetTool.state === 'output-available' && (
                <DatasetsList 
                  datasets={(datasetTool.output as DatasetToolOutput).datasets}
                  success={(datasetTool.output as DatasetToolOutput).success}
                  error={(datasetTool.output as DatasetToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getTables') {
          const tablesTool = part as NexusToolUIPart;
          const callId = tablesTool.toolCallId;
          const shouldBeOpen = tablesTool.state === 'output-available' || tablesTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getTables" state={tablesTool.state} />
                <ToolContent>
                  {tablesTool.input && (
                    <ToolInput input={tablesTool.input} />
                  )}
                  {tablesTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={tablesTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {tablesTool.state === 'output-available' && (
                <TablesList 
                  tables={(tablesTool.output as TablesToolOutput).tables}
                  datasetId={(tablesTool.output as TablesToolOutput).datasetId}
                  success={(tablesTool.output as TablesToolOutput).success}
                  error={(tablesTool.output as TablesToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getData') {
          const dataTool = part as NexusToolUIPart;
          const callId = dataTool.toolCallId;
          const shouldBeOpen = dataTool.state === 'output-available' || dataTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getData" state={dataTool.state} />
                <ToolContent>
                  {dataTool.input && (
                    <ToolInput input={dataTool.input} />
                  )}
                  {dataTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={dataTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {dataTool.state === 'output-available' && (
                <TableData 
                  data={(dataTool.output as DataToolOutput).data}
                  schema={(dataTool.output as DataToolOutput).schema}
                  totalRows={(dataTool.output as DataToolOutput).totalRows}
                  executionTime={(dataTool.output as DataToolOutput).executionTime}
                  datasetId={(dataTool.output as DataToolOutput).datasetId}
                  tableId={(dataTool.output as DataToolOutput).tableId}
                  query={(dataTool.output as DataToolOutput).query}
                  success={(dataTool.output as DataToolOutput).success}
                  error={(dataTool.output as DataToolOutput).error}
                />
              )}
            </div>
          );
        }


        if (part.type === 'tool-criarGrafico') {
          const chartTool = part as NexusToolUIPart;
          const callId = chartTool.toolCallId;
          const shouldBeOpen = chartTool.state === 'output-available' || chartTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-criarGrafico" state={chartTool.state} />
                <ToolContent>
                  {chartTool.input && (
                    <ToolInput input={chartTool.input} />
                  )}
                  {chartTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={chartTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {chartTool.state === 'output-available' && (
                <ChartVisualization 
                  chartData={(chartTool.output as CriarGraficoToolOutput).chartData}
                  chartType={(chartTool.output as CriarGraficoToolOutput).chartType}
                  title={(chartTool.output as CriarGraficoToolOutput).title}
                  xColumn={(chartTool.output as CriarGraficoToolOutput).xColumn}
                  yColumn={(chartTool.output as CriarGraficoToolOutput).yColumn}
                  metadata={(chartTool.output as CriarGraficoToolOutput).metadata}
                  success={(chartTool.output as CriarGraficoToolOutput).success}
                  error={(chartTool.output as CriarGraficoToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-retrieveResult') {
          const resultTool = part as NexusToolUIPart;
          const callId = resultTool.toolCallId;
          const shouldBeOpen = resultTool.state === 'output-available' || resultTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-retrieveResult" state={resultTool.state} />
                <ToolContent>
                  {resultTool.input && (
                    <ToolInput input={resultTool.input} />
                  )}
                  {resultTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={resultTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {resultTool.state === 'output-available' && (
                <ResultDisplay 
                  resultId={(resultTool.output as RetrieveResultToolOutput).resultId}
                  resultType={(resultTool.output as RetrieveResultToolOutput).resultType}
                  result={(resultTool.output as RetrieveResultToolOutput).result}
                  sources={(resultTool.output as RetrieveResultToolOutput).sources}
                  retrievedAt={(resultTool.output as RetrieveResultToolOutput).retrievedAt}
                  success={(resultTool.output as RetrieveResultToolOutput).success}
                  error={(resultTool.output as RetrieveResultToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-criarDashboard') {
          const dashboardTool = part as NexusToolUIPart;
          const callId = dashboardTool.toolCallId;
          const shouldBeOpen = dashboardTool.state === 'output-available' || dashboardTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-criarDashboard" state={dashboardTool.state} />
                <ToolContent>
                  {dashboardTool.input && (
                    <ToolInput input={dashboardTool.input} />
                  )}
                  {dashboardTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={dashboardTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {dashboardTool.state === 'output-available' && (
                <Dashboard 
                  dashboardId={(dashboardTool.output as CriarDashboardToolOutput).dashboardId}
                  title={(dashboardTool.output as CriarDashboardToolOutput).title}
                  dashboardType={(dashboardTool.output as CriarDashboardToolOutput).dashboardType}
                  datasetIds={(dashboardTool.output as CriarDashboardToolOutput).datasetIds}
                  widgets={(dashboardTool.output as CriarDashboardToolOutput).widgets}
                  kpis={(dashboardTool.output as CriarDashboardToolOutput).kpis}
                  layout={(dashboardTool.output as CriarDashboardToolOutput).layout}
                  metadata={(dashboardTool.output as CriarDashboardToolOutput).metadata}
                  success={(dashboardTool.output as CriarDashboardToolOutput).success}
                  error={(dashboardTool.output as CriarDashboardToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-executarSQL') {
          const sqlTool = part as NexusToolUIPart;
          const callId = sqlTool.toolCallId;
          const shouldBeOpen = sqlTool.state === 'output-available' || sqlTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-executarSQL" state={sqlTool.state} />
                <ToolContent>
                  {sqlTool.input && (
                    <ToolInput input={sqlTool.input} />
                  )}
                  {sqlTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={sqlTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {sqlTool.state === 'output-available' && (
                <SQLExecution 
                  sqlQuery={(sqlTool.output as ExecutarSQLToolOutput).sqlQuery}
                  datasetId={(sqlTool.output as ExecutarSQLToolOutput).datasetId}
                  queryType={(sqlTool.output as ExecutarSQLToolOutput).queryType}
                  dryRun={(sqlTool.output as ExecutarSQLToolOutput).dryRun}
                  data={(sqlTool.output as ExecutarSQLToolOutput).data}
                  schema={(sqlTool.output as ExecutarSQLToolOutput).schema}
                  rowsReturned={(sqlTool.output as ExecutarSQLToolOutput).rowsReturned}
                  rowsAffected={(sqlTool.output as ExecutarSQLToolOutput).rowsAffected}
                  totalRows={(sqlTool.output as ExecutarSQLToolOutput).totalRows}
                  executionTime={(sqlTool.output as ExecutarSQLToolOutput).executionTime}
                  bytesProcessed={(sqlTool.output as ExecutarSQLToolOutput).bytesProcessed}
                  success={(sqlTool.output as ExecutarSQLToolOutput).success}
                  validationErrors={(sqlTool.output as ExecutarSQLToolOutput).validationErrors}
                  error={(sqlTool.output as ExecutarSQLToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-criarTabela') {
          const tableTool = part as NexusToolUIPart;
          const callId = tableTool.toolCallId;
          const shouldBeOpen = tableTool.state === 'output-available' || tableTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-criarTabela" state={tableTool.state} />
                <ToolContent>
                  {tableTool.input && (
                    <ToolInput input={tableTool.input} />
                  )}
                  {tableTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={tableTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {tableTool.state === 'output-available' && (
                <TableCreation 
                  datasetId={(tableTool.output as CriarTabelaToolOutput).datasetId}
                  tableName={(tableTool.output as CriarTabelaToolOutput).tableName}
                  tableId={(tableTool.output as CriarTabelaToolOutput).tableId}
                  schema={(tableTool.output as CriarTabelaToolOutput).schema}
                  description={(tableTool.output as CriarTabelaToolOutput).description}
                  location={(tableTool.output as CriarTabelaToolOutput).location}
                  creationTime={(tableTool.output as CriarTabelaToolOutput).creationTime}
                  lastModifiedTime={(tableTool.output as CriarTabelaToolOutput).lastModifiedTime}
                  numRows={(tableTool.output as CriarTabelaToolOutput).numRows}
                  numBytes={(tableTool.output as CriarTabelaToolOutput).numBytes}
                  expirationTime={(tableTool.output as CriarTabelaToolOutput).expirationTime}
                  labels={(tableTool.output as CriarTabelaToolOutput).labels}
                  metadata={(tableTool.output as CriarTabelaToolOutput).metadata}
                  success={(tableTool.output as CriarTabelaToolOutput).success}
                  error={(tableTool.output as CriarTabelaToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-criarKPI') {
          const kpiTool = part as NexusToolUIPart;
          const callId = kpiTool.toolCallId;
          const shouldBeOpen = kpiTool.state === 'output-available' || kpiTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-criarKPI" state={kpiTool.state} />
                <ToolContent>
                  {kpiTool.input && (
                    <ToolInput input={kpiTool.input} />
                  )}
                  {kpiTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={kpiTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {kpiTool.state === 'output-available' && (
                <KPICard 
                  kpiId={(kpiTool.output as CriarKPIToolOutput).kpiId}
                  name={(kpiTool.output as CriarKPIToolOutput).name}
                  datasetId={(kpiTool.output as CriarKPIToolOutput).datasetId}
                  tableId={(kpiTool.output as CriarKPIToolOutput).tableId}
                  metric={(kpiTool.output as CriarKPIToolOutput).metric}
                  calculation={(kpiTool.output as CriarKPIToolOutput).calculation}
                  currentValue={(kpiTool.output as CriarKPIToolOutput).currentValue}
                  previousValue={(kpiTool.output as CriarKPIToolOutput).previousValue}
                  target={(kpiTool.output as CriarKPIToolOutput).target}
                  unit={(kpiTool.output as CriarKPIToolOutput).unit}
                  change={(kpiTool.output as CriarKPIToolOutput).change}
                  trend={(kpiTool.output as CriarKPIToolOutput).trend}
                  status={(kpiTool.output as CriarKPIToolOutput).status}
                  timeRange={(kpiTool.output as CriarKPIToolOutput).timeRange}
                  visualization={(kpiTool.output as CriarKPIToolOutput).visualization}
                  metadata={(kpiTool.output as CriarKPIToolOutput).metadata}
                  success={(kpiTool.output as CriarKPIToolOutput).success}
                  error={(kpiTool.output as CriarKPIToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-webPreview') {
          const webPreviewTool = part as NexusToolUIPart;
          const callId = webPreviewTool.toolCallId;
          const shouldBeOpen = webPreviewTool.state === 'output-available' || webPreviewTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-webPreview" state={webPreviewTool.state} />
                <ToolContent>
                  {webPreviewTool.input && (
                    <ToolInput input={webPreviewTool.input} />
                  )}
                  {webPreviewTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={webPreviewTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {webPreviewTool.state === 'output-available' && (
                <WebPreviewCard 
                  url={(webPreviewTool.output as WebPreviewToolOutput).url}
                  title={(webPreviewTool.output as WebPreviewToolOutput).title}
                  description={(webPreviewTool.output as WebPreviewToolOutput).description}
                  favicon={(webPreviewTool.output as WebPreviewToolOutput).favicon}
                  screenshot={(webPreviewTool.output as WebPreviewToolOutput).screenshot}
                  isValidUrl={(webPreviewTool.output as WebPreviewToolOutput).isValidUrl}
                  previewAvailable={(webPreviewTool.output as WebPreviewToolOutput).previewAvailable}
                  generatedAt={(webPreviewTool.output as WebPreviewToolOutput).generatedAt}
                  success={(webPreviewTool.output as WebPreviewToolOutput).success}
                  error={(webPreviewTool.output as WebPreviewToolOutput).error}
                />
              )}
            </div>
          );
        }

        return null;
      })}
      
      <Actions className="mt-2">
        <Action tooltip="Copy message" onClick={handleCopy}>
          <CopyIcon className="size-4" />
        </Action>
        <Action tooltip="Like">
          <ThumbsUpIcon className="size-4" />
        </Action>
        <Action tooltip="Dislike">
          <ThumbsDownIcon className="size-4" />
        </Action>
      </Actions>
    </div>
  );
}