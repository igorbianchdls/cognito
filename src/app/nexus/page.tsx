'use client';

import { useChat } from '@ai-sdk/react';
import WeatherCard from '../../components/tools/WeatherCard';
import CalculatorCard from '../../components/tools/CalculatorCard';

export default function Page() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat-ui',
  });

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Nexus Chat</h1>
      
      <div style={{ marginBottom: '20px', minHeight: '400px', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
        {messages.map((message, messageIndex) => (
          <div key={messageIndex} style={{ marginBottom: '10px' }}>
            <strong>{message.role === 'user' ? 'You' : 'AI'}:</strong> {message.content}
            
            {/* Render tool UI based on parts array */}
            {message.parts?.map((part, partIndex) => {
              if (part.type === 'tool-displayWeather') {
                switch (part.state) {
                  case 'input-available':
                    return <div key={partIndex}>Loading weather...</div>;
                  case 'output-available':
                    return <WeatherCard key={partIndex} data={part.output} />;
                  case 'output-error':
                    return <div key={partIndex}>Error loading weather</div>;
                  default:
                    return null;
                }
              } else if (part.type === 'tool-calculator') {
                switch (part.state) {
                  case 'input-available':
                    return <div key={partIndex}>Loading calculator...</div>;
                  case 'output-available':
                    return <CalculatorCard key={partIndex} data={part.output} />;
                  case 'output-error':
                    return <div key={partIndex}>Error loading calculator</div>;
                  default:
                    return null;
                }
              }
              return null;
            })}
          </div>
        ))}
        {isLoading && <div>AI is thinking...</div>}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input
          value={input}
          onChange={handleInputChange}
          disabled={isLoading}
          placeholder="Ask about weather or anything else..."
          style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', backgroundColor: '#007cba', color: 'white' }}
        >
          Send
        </button>
      </form>
    </div>
  );
}