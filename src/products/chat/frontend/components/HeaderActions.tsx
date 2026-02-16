"use client";

import React from 'react';
import { useStore } from '@nanostores/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Undo2, Redo2, ClipboardList, GitBranch, Upload, Palette } from 'lucide-react';
import { $previewJsonrPath } from '@/products/chat/state/sandboxStore';
import { APPS_HEADER_THEME_OPTIONS, APPS_THEME_OPTIONS } from '@/products/apps/shared/themeOptions';

function IconButton({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-700 hover:bg-gray-100"
            aria-label={title}
            title={title}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{title}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function normalizeToThemeTree(parsed: unknown): any[] {
  const nodes = Array.isArray(parsed) ? parsed.slice() : [parsed as any];
  if (!nodes[0] || typeof nodes[0] !== 'object' || (nodes[0] as any).type !== 'Theme') {
    return [
      {
        type: 'Theme',
        props: { name: 'light', headerTheme: 'auto', managers: {} },
        children: nodes,
      },
    ];
  }
  const theme = nodes[0] as any;
  theme.props = theme.props && typeof theme.props === 'object' ? theme.props : {};
  if (!theme.props.name) theme.props.name = 'light';
  if (typeof theme.props.headerTheme !== 'string') theme.props.headerTheme = 'auto';
  if (!theme.props.managers || typeof theme.props.managers !== 'object') theme.props.managers = {};
  return nodes;
}

type HeaderActionsProps = {
  chatId?: string;
};

export default function HeaderActions({ chatId }: HeaderActionsProps) {
  const previewPath = useStore($previewJsonrPath);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [themeName, setThemeName] = React.useState<string>('light');
  const [headerTheme, setHeaderTheme] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);

  const readCurrent = React.useCallback(async () => {
    if (!chatId || !previewPath) {
      setError('chatId/path ausente');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fs-read', chatId, path: previewPath }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; content?: string; error?: string };
      if (!res.ok || data.ok === false) throw new Error(data.error || 'Falha ao ler dashboard');
      const parsed = JSON.parse(String(data.content ?? '[]'));
      const nodes = normalizeToThemeTree(parsed);
      const props = (nodes[0] as any)?.props || {};
      const nextTheme = String(props.name || 'light');
      const rawHeader = typeof props.headerTheme === 'string' ? props.headerTheme : 'auto';
      setThemeName(nextTheme);
      setHeaderTheme(rawHeader === 'auto' ? '' : rawHeader);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : 'Erro ao carregar tema');
    } finally {
      setLoading(false);
    }
  }, [chatId, previewPath]);

  React.useEffect(() => {
    if (!open) return;
    void readCurrent();
  }, [open, readCurrent]);

  const persist = React.useCallback(
    async (next: { name?: string; headerTheme?: string }) => {
      if (!chatId || !previewPath) {
        setError('chatId/path ausente');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const readRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'fs-read', chatId, path: previewPath }),
        });
        const readData = (await readRes.json().catch(() => ({}))) as { ok?: boolean; content?: string; error?: string };
        if (!readRes.ok || readData.ok === false) throw new Error(readData.error || 'Falha ao ler dashboard');

        const parsed = JSON.parse(String(readData.content ?? '[]'));
        const nodes = normalizeToThemeTree(parsed);
        const theme = nodes[0] as any;
        if (typeof next.name === 'string') theme.props.name = next.name;
        if (typeof next.headerTheme === 'string') {
          theme.props.headerTheme = next.headerTheme ? next.headerTheme : 'auto';
        }

        const writeRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'fs-write',
            chatId,
            path: previewPath,
            content: JSON.stringify(nodes, null, 2),
          }),
        });
        const writeData = (await writeRes.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!writeRes.ok || writeData.ok === false) throw new Error(writeData.error || 'Falha ao salvar tema');

        const savedTheme = String(theme.props?.name || 'light');
        const savedHeaderRaw = typeof theme.props?.headerTheme === 'string' ? theme.props.headerTheme : 'auto';
        setThemeName(savedTheme);
        setHeaderTheme(savedHeaderRaw === 'auto' ? '' : savedHeaderRaw);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sandbox-preview-refresh', { detail: { path: previewPath } }));
        }
      } catch (e: any) {
        setError(e?.message ? String(e.message) : 'Erro ao salvar tema');
      } finally {
        setLoading(false);
      }
    },
    [chatId, previewPath]
  );

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="h-8 px-2.5 inline-flex items-center justify-center gap-1 rounded-md text-gray-700 hover:bg-gray-100 border border-transparent"
            aria-label="Tema"
            title="Tema"
          >
            <Palette className="w-4 h-4" />
            <span className="text-xs font-medium">Tema</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={8} className="w-72 p-3">
          <div className="space-y-3">
            <div className="text-xs font-medium text-slate-500">Tema do Dashboard Atual</div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Tema</label>
              <select
                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs outline-none focus:border-slate-400"
                value={themeName}
                disabled={loading || !chatId || !previewPath}
                onChange={(e) => {
                  const next = e.target.value;
                  setThemeName(next);
                  void persist({ name: next });
                }}
              >
                {APPS_THEME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Header</label>
              <select
                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs outline-none focus:border-slate-400"
                value={headerTheme}
                disabled={loading || !chatId || !previewPath}
                onChange={(e) => {
                  const next = e.target.value;
                  setHeaderTheme(next);
                  void persist({ headerTheme: next });
                }}
              >
                {APPS_HEADER_THEME_OPTIONS.map((opt) => (
                  <option key={opt.value || 'auto'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {error && <div className="text-[11px] text-red-600">{error}</div>}
          </div>
        </PopoverContent>
      </Popover>

      <IconButton title="Undo">
        <Undo2 className="w-4 h-4" />
      </IconButton>
      <IconButton title="Redo">
        <Redo2 className="w-4 h-4 text-gray-400" />
      </IconButton>
      <Separator orientation="vertical" className="h-5 mx-2" />
      <IconButton title="Clipboard">
        <ClipboardList className="w-4 h-4" />
      </IconButton>
      <IconButton title="Git">
        <GitBranch className="w-4 h-4" />
      </IconButton>
      <IconButton title="Upload">
        <Upload className="w-4 h-4" />
      </IconButton>
      {/* Deploy button removido */}
    </div>
  );
}
