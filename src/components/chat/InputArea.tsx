"use client";

import React, { FormEvent, useMemo, useState } from 'react';
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
import { Plus, BarChart3, Plug } from 'lucide-react';
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
  model?: 'sonnet' | 'haiku';
  onModelChange?: (m: 'sonnet' | 'haiku') => void;
};

export default function InputArea({ value, onChange, onSubmit, status = 'idle', onOpenSandbox, composioEnabled, onToggleComposio, model = 'haiku', onModelChange }: Props) {
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

  return (
    <div className="pt-[var(--ui-pad-y)]">
      <PromptInput onSubmit={onSubmit} className="border-gray-100 ui-text">
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
            <PromptInputModelSelect value={model} onValueChange={(v: any) => onModelChange?.(v === 'haiku' ? 'haiku' : 'sonnet')}>
              <PromptInputModelSelectTrigger className="text-gray-500 hover:text-gray-800">
                <PromptInputModelSelectValue placeholder="Modelo" />
              </PromptInputModelSelectTrigger>
              <PromptInputModelSelectContent>
                <PromptInputModelSelectItem value="sonnet">Sonnet 4.5</PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="haiku">Haiku 4.5</PromptInputModelSelectItem>
              </PromptInputModelSelectContent>
            </PromptInputModelSelect>
          </PromptInputTools>
          <PromptInputSubmit disabled={!value} status={status as ChatStatus} />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}
