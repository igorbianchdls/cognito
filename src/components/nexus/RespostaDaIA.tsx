import { UIMessage, type ToolUIPart } from 'ai';
import { Response } from '@/components/ai-elements/response';
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning';
import { Actions, Action } from '@/components/ai-elements/actions';
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
import { CopyIcon, ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react';
import WeatherCard from '../tools/WeatherCard';

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

type WeatherToolUIPart = ToolUIPart<{
  displayWeather: {
    input: WeatherToolInput;
    output: WeatherToolOutput;
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
          const weatherTool = part as WeatherToolUIPart;
          const callId = weatherTool.toolCallId;
          const shouldBeOpen = weatherTool.state === 'output-available' || weatherTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="displayWeather" state={weatherTool.state} />
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
                <WeatherCard data={weatherTool.output} />
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