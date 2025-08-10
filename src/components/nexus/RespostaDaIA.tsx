import { UIMessage } from 'ai';
import { Response } from '@/components/ai-elements/response';
import WeatherCard from '../tools/WeatherCard';

interface RespostaDaIAProps {
  message: UIMessage;
}

export default function RespostaDaIA({ message }: RespostaDaIAProps) {
  return (
    <div key={message.id}>
      {message.role === 'assistant' ? 'AI: ' : ''}
      {message.parts.map((part, index) => {
        if (part.type === 'text') {
          return <Response key={index}>{part.text}</Response>;
        }

        if (part.type === 'tool-displayWeather') {
          const callId = part.toolCallId;
          
          switch (part.state) {
            case 'input-streaming':
              return <div key={callId}>Preparing weather request...</div>;
            case 'input-available':
              return <div key={callId}>Getting weather for {(part.input as { location: string }).location}...</div>;
            case 'output-available':
              return (
                <div key={callId}>
                  <WeatherCard data={part.output as { location: string; temperature: number }} />
                </div>
              );
            case 'output-error':
              return <div key={callId}>Error: {part.errorText}</div>;
            default:
              return null;
          }
        }

        return null;
      })}
    </div>
  );
}