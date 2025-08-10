import { UIMessage, type ToolUIPart } from 'ai';
import { Response } from '@/components/ai-elements/response';
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning';
import { Actions, Action } from '@/components/ai-elements/actions';
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
import { CopyIcon, ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react';
import WeatherCard from '../tools/WeatherCard';
import DatasetsList from '../tools/DatasetsList';
import TablesList from '../tools/TablesList';
import TableData from '../tools/TableData';
import DataInterpretation from '../tools/DataInterpretation';
import ChartVisualization from '../tools/ChartVisualization';
import ResultDisplay from '../tools/ResultDisplay';
import Dashboard from '../tools/Dashboard';

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
  success: boolean;
  error?: string;
};

type InterpretarDadosToolInput = {
  datasetId: string;
  tableId: string;
  analysisType?: 'trends' | 'summary' | 'insights' | 'anomalies';
};

type InterpretarDadosToolOutput = {
  datasetId: string;
  tableId: string;
  analysisType: string;
  analysis: {
    summary?: Record<string, unknown>;
    insights?: string[];
    recommendations?: string[];
  };
  executionTime: number;
  success: boolean;
  error?: string;
};

type CriarGraficoToolInput = {
  datasetId: string;
  tableId: string;
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'area';
  xColumn: string;
  yColumn: string;
  title?: string;
};

type CriarGraficoToolOutput = {
  chartData: Array<{
    x?: string;
    y?: number;
    label?: string;
    value?: number;
    color?: string;
  }>;
  chartType: string;
  title: string;
  xColumn: string;
  yColumn: string;
  datasetId: string;
  tableId: string;
  metadata: {
    totalDataPoints: number;
    generatedAt: string;
    executionTime: number;
  };
  success: boolean;
  error?: string;
};

type RetrieveResultToolInput = {
  resultId?: string;
  queryId?: string;
  resultType?: 'analysis' | 'chart' | 'dashboard' | 'query';
};

type RetrieveResultToolOutput = {
  resultId: string;
  resultType: string;
  result: {
    type?: string;
    data?: Record<string, unknown>;
    message?: string;
  };
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
  interpretarDados: {
    input: InterpretarDadosToolInput;
    output: InterpretarDadosToolOutput;
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
}>;

interface RespostaDaIAProps {
  message: UIMessage;
}

export default function RespostaDaIA({ message }: RespostaDaIAProps) {
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
                  success={(dataTool.output as DataToolOutput).success}
                  error={(dataTool.output as DataToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-interpretarDados') {
          const interpretTool = part as NexusToolUIPart;
          const callId = interpretTool.toolCallId;
          const shouldBeOpen = interpretTool.state === 'output-available' || interpretTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-interpretarDados" state={interpretTool.state} />
                <ToolContent>
                  {interpretTool.input && (
                    <ToolInput input={interpretTool.input} />
                  )}
                  {interpretTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={interpretTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {interpretTool.state === 'output-available' && (
                <DataInterpretation 
                  datasetId={(interpretTool.output as InterpretarDadosToolOutput).datasetId}
                  tableId={(interpretTool.output as InterpretarDadosToolOutput).tableId}
                  analysisType={(interpretTool.output as InterpretarDadosToolOutput).analysisType}
                  analysis={(interpretTool.output as InterpretarDadosToolOutput).analysis}
                  executionTime={(interpretTool.output as InterpretarDadosToolOutput).executionTime}
                  success={(interpretTool.output as InterpretarDadosToolOutput).success}
                  error={(interpretTool.output as InterpretarDadosToolOutput).error}
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
                  datasetId={(chartTool.output as CriarGraficoToolOutput).datasetId}
                  tableId={(chartTool.output as CriarGraficoToolOutput).tableId}
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