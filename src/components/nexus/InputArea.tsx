import { FormEvent } from 'react';

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  status: string;
}

export default function InputArea({ input, setInput, onSubmit, status }: InputAreaProps) {
  return (
    <form onSubmit={onSubmit}>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        disabled={status !== 'ready'}
        placeholder="Say something..."
      />
    </form>
  );
}