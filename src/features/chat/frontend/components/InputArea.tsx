"use client";

import React, { FormEvent, useMemo, useRef, useState } from 'react';
import type { ChatStatus } from 'ai';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputModelSelect,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
} from '@/components/ai-elements/prompt-input';
import { Plus, BarChart3, Plug, Mic, Square, Loader2 } from 'lucide-react';
import BrandIcon from '@/components/icons/BrandIcon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input as UiInput } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  status?: ChatStatus | string;
  onOpenSandbox?: () => void;
  composioEnabled?: boolean;
  onToggleComposio?: () => void;
  model?: 'claude-sonnet' | 'claude-haiku' | 'openai-gpt5' | 'openai-gpt5mini' | 'openai-gpt5nano';
  onModelChange?: (m: 'claude-sonnet' | 'claude-haiku' | 'openai-gpt5' | 'openai-gpt5mini' | 'openai-gpt5nano') => void;
};

export default function InputArea({ value, onChange, onSubmit, status = 'idle', onOpenSandbox, composioEnabled, onToggleComposio, model = 'openai-gpt5nano', onModelChange }: Props) {
  // Local-only UI state for Toolkits panel (no persistence, no backend)
  const [toolkitsOpen, setToolkitsOpen] = useState(false)
  const [tkSearch, setTkSearch] = useState('')
  const [tkEnabled, setTkEnabled] = useState<Record<string, boolean>>({
    gmail: true,
    composio: true,
    github: false,
    gcal: false,
    notion: false,
    gsheets: false,
  })
  const tkList = useMemo(() => ([
    { key: 'gmail', label: 'Gmail', icon: <BrandIcon brand="gmail" /> },
    { key: 'composio', label: 'Composio', icon: <Plug className="size-4" /> },
    { key: 'github', label: 'GitHub', icon: <BrandIcon brand="github" /> },
    { key: 'gcal', label: 'Google Calendar', icon: <BrandIcon brand="gcal" /> },
    { key: 'notion', label: 'Notion', icon: <BrandIcon brand="notion" /> },
    { key: 'gsheets', label: 'Google Sheets', icon: <BrandIcon brand="gsheets" /> },
  ]), [])
  const filteredTk = useMemo(() => (
    tkList.filter(t => t.label.toLowerCase().includes(tkSearch.toLowerCase()))
  ), [tkList, tkSearch])

  // Audio capture + STT (ElevenLabs) — record → stop → send once → write text to input
  type RecState = 'idle' | 'recording' | 'processing' | 'error'
  const [recState, setRecState] = useState<RecState>('idle')
  const [recError, setRecError] = useState<string>('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordedMimeTypeRef = useRef<string>('')

  const startRecording = async () => {
    if (recState === 'recording' || recState === 'processing') return
    setRecError('')
    recordedChunksRef.current = []
    recordedMimeTypeRef.current = ''
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeOptions = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
      ]
      let mimeType = ''
      for (const m of mimeOptions) {
        if ((window as any).MediaRecorder && MediaRecorder.isTypeSupported(m)) { mimeType = m; break }
      }
      const mr = new MediaRecorder(stream, mimeType ? { mimeType, bitsPerSecond: 128000 } : { bitsPerSecond: 128000 })
      mediaRecorderRef.current = mr
      recordedMimeTypeRef.current = mimeType
      mr.addEventListener('dataavailable', (ev) => {
        const b = ev.data
        if (b && b.size > 0) recordedChunksRef.current.push(b)
      })
      mr.start(3000)
      setRecState('recording')
    } catch (e: any) {
      setRecError(e?.message || String(e))
      setRecState('error')
    }
  }

  const stopRecording = async () => {
    if (recState !== 'recording') return
    setRecState('processing')
    const mr = mediaRecorderRef.current
    if (mr) {
      try { (mr as any).requestData?.() } catch {}
      const stopped = new Promise<void>((resolve) => mr.addEventListener('stop', () => resolve(), { once: true }))
      try { mr.stop() } catch {}
      await stopped
    }
    try { streamRef.current?.getTracks().forEach(t => t.stop()) } catch {}
    mediaRecorderRef.current = null
    streamRef.current = null

    try {
      const type = recordedMimeTypeRef.current || (recordedChunksRef.current[0]?.type || 'audio/webm')
      const fullBlob = new Blob(recordedChunksRef.current, { type })
      const fd = new FormData()
      fd.append('file', fullBlob, 'recording.webm')
      fd.append('modelId', 'scribe_v2')
      fd.append('languageCode', 'por')
      // Optional toggles (off by default for speed)
      // fd.append('diarize', 'false')
      // fd.append('tagAudioEvents', 'false')
      const res = await fetch('/api/bigquery-test/elevenlabs', { method: 'POST', body: fd })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || `Falha na transcrição (${res.status})`)
      }
      const text: string = json?.transcription?.text || ''
      if (text) onChange(text)
      setRecState('idle')
    } catch (e: any) {
      setRecError(e?.message || String(e))
      setRecState('error')
      // Auto-reset back to idle after a short delay so user can retry
      setTimeout(() => setRecState('idle'), 2000)
    } finally {
      recordedChunksRef.current = []
      recordedMimeTypeRef.current = ''
    }
  }

  return (
    <div className="pt-[var(--ui-pad-y)]">
      <PromptInput
        onSubmit={onSubmit}
        className="border-gray-100 ui-text"
        style={{ boxShadow: 'var(--shadow-3)' }}
      >
        <PromptInputTextarea
          placeholder="Ask a follow up..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <PromptInputToolbar>
          <PromptInputTools>
            {/* Plus at extreme left */}
            <PromptInputButton>
              <Plus size={16} />
            </PromptInputButton>
            {/* All Toolkits (UI only) now to the right of + */}
            <Popover open={toolkitsOpen} onOpenChange={setToolkitsOpen}>
              <PopoverTrigger asChild>
                <PromptInputButton variant="ghost" className="text-gray-500 hover:text-gray-800">
                  <Plug size={16} />
                  <span>All Toolkits</span>
                </PromptInputButton>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-80 p-0">
                <div className="p-2 border-b">
                  <UiInput placeholder="Search toolkits…" value={tkSearch} onChange={(e)=>setTkSearch(e.target.value)} className="h-8" />
                </div>
                <div className="max-h-72 overflow-auto">
                  <ul className="py-1">
                    {filteredTk.map(t => (
                      <li key={t.key} className="px-3 py-2 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-2 text-sm text-gray-800">
                          <span className="inline-flex items-center justify-center size-6 rounded-md bg-gray-100 text-gray-700">
                            {t.icon}
                          </span>
                          <span>{t.label}</span>
                        </div>
                        <Switch checked={!!tkEnabled[t.key]} onCheckedChange={(v)=> setTkEnabled(s=>({ ...s, [t.key]: v }))} />
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="px-3 py-2 text-xs text-gray-500 border-t">All toolkits enabled</div>
              </PopoverContent>
            </Popover>
            <PromptInputButton onClick={() => onOpenSandbox?.()}>
              <BarChart3 size={16} />
              <span>Artifact</span>
            </PromptInputButton>
            {typeof onToggleComposio === 'function' && (
              <PromptInputButton onClick={() => onToggleComposio?.()} variant="ghost" className="text-gray-500 hover:text-gray-800">
                <Plug size={16} />
                {/* Only change the text color when selected */}
                <span className={composioEnabled ? 'text-blue-600' : undefined}>{composioEnabled ? 'ON' : 'OFF'}</span>
              </PromptInputButton>
            )}

            {/* Model selector */}
            <PromptInputModelSelect value={model} onValueChange={(v: any) => {
              const next = (v === 'claude-sonnet' || v === 'claude-haiku' || v === 'openai-gpt5' || v === 'openai-gpt5nano' || v === 'openai-gpt5mini') ? v : 'openai-gpt5nano'
              onModelChange?.(next)
            }}>
              <PromptInputModelSelectTrigger className="text-gray-500 hover:text-gray-800">
                <PromptInputModelSelectValue placeholder="Modelo" />
              </PromptInputModelSelectTrigger>
              <PromptInputModelSelectContent>
                <PromptInputModelSelectItem value="claude-sonnet">Claude Sonnet 4.5 (Agent SDK)</PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="claude-haiku">Claude Haiku 4.5 (Agent SDK)</PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="openai-gpt5">OpenAI GPT-5 (Responses)</PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="openai-gpt5mini">OpenAI GPT-5 mini (Responses)</PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="openai-gpt5nano">OpenAI GPT-5 nano (Responses)</PromptInputModelSelectItem>
              </PromptInputModelSelectContent>
            </PromptInputModelSelect>
          </PromptInputTools>
          <div className="flex items-center gap-1">
            {/* Mic control button */}
            {recState === 'recording' ? (
              <PromptInputButton onClick={stopRecording} className="text-red-600 hover:text-red-700" title="Parar gravação">
                <Square size={16} />
                <span>Parar</span>
              </PromptInputButton>
            ) : recState === 'processing' ? (
              <PromptInputButton disabled className="text-gray-500" title="Transcrevendo…">
                <Loader2 className="size-4 animate-spin" />
                <span>Transcrevendo…</span>
              </PromptInputButton>
            ) : (
              <PromptInputButton onClick={startRecording} variant="ghost" className="text-gray-500 hover:text-gray-800" title="Gravar áudio e transcrever">
                <Mic size={16} />
                <span>Microfone</span>
              </PromptInputButton>
            )}
            <PromptInputSubmit disabled={!value || recState !== 'idle'} status={status as ChatStatus} />
          </div>
        </PromptInputToolbar>
      </PromptInput>
      {recError && (
        <div className="px-2 pt-1 text-xs text-red-600">{recError}</div>
      )}
    </div>
  );
}
