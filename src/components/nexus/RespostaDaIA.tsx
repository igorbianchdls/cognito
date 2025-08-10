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
  data: Array<Record<string, any>>;
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