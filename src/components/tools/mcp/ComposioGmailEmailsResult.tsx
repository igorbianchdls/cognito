"use client";

import React, { useMemo } from 'react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { Mail } from 'lucide-react';
import { Tool, ToolHeader, ToolContent, ToolOutput } from '@/components/ai-elements/tool';

type AnyObj = Record<string, any>;

function tryParseJSON(s: any): any {
  if (typeof s !== 'string') return s;
  const t = s.trim();
  if (!t) return s;
  try { return JSON.parse(t); } catch { return s; }
}

function unwrapMcpOutput(output: any): any {
  let out = output;
  if (out && typeof out === 'object' && 'result' in out) {
    out = (out as AnyObj).result;
  }
  // MCP content array
  if (out && typeof out === 'object' && 'content' in out && Array.isArray((out as AnyObj).content)) {
    const arr = (out as AnyObj).content as Array<any>;
    const jsonPart = arr.find((c) => c && (c.json !== undefined));
    if (jsonPart && jsonPart.json !== undefined) return jsonPart.json;
    const textParts = arr.filter((c) => typeof c?.text === 'string').map((c) => String(c.text));
    for (const t of textParts) {
      const parsed = tryParseJSON(t);
      if (parsed && typeof parsed === 'object') return parsed;
    }
    return out;
  }
  // String JSON
  if (typeof out === 'string') return tryParseJSON(out);
  return out;
}

function findMessagesNode(root: any): AnyObj[] | null {
  // Ideal path based on sample: data.results[0].response.data.messages
  try {
    const arr = root?.data?.results;
    if (Array.isArray(arr) && arr.length > 0) {
      const msg = arr[0]?.response?.data?.messages;
      if (Array.isArray(msg)) return msg as AnyObj[];
    }
  } catch {}
  // Fallback: shallow DFS to find a key named 'messages' that is an array of objects
  const stack: any[] = [root];
  const seen = new Set<any>();
  let steps = 0;
  while (stack.length && steps < 500) {
    const node = stack.pop();
    steps++;
    if (!node || typeof node !== 'object' || seen.has(node)) continue;
    seen.add(node);
    try {
      const maybe = (node as AnyObj).messages;
      if (Array.isArray(maybe) && maybe.length > 0 && typeof maybe[0] === 'object') return maybe as AnyObj[];
    } catch {}
    try {
      for (const k of Object.keys(node as AnyObj)) {
        const v = (node as AnyObj)[k];
        if (v && typeof v === 'object') stack.push(v);
      }
    } catch {}
  }
  return null;
}

function extractCount(root: any, fallbackLen: number): number {
  // Path based on sample: data.results[0].response.data.resultSizeEstimate
  try {
    const arr = root?.data?.results;
    if (Array.isArray(arr) && arr.length > 0) {
      const est = arr[0]?.response?.data?.resultSizeEstimate;
      if (typeof est === 'number') return est;
    }
  } catch {}
  return fallbackLen;
}

function formatDate(s?: string): string {
  if (!s) return '';
  try { return new Date(s).toLocaleString('pt-BR'); } catch { return s; }
}

export default function ComposioGmailEmailsResult({ output }: { output: any }) {
  const normalized = useMemo(() => unwrapMcpOutput(output), [output]);
  const messages = useMemo(() => findMessagesNode(normalized) || [], [normalized]);
  const rows = useMemo(() => {
    return (messages || []).map((m: AnyObj) => ({
      date: formatDate(m?.messageTimestamp || m?.internalDate),
      from: String(m?.sender ?? ''),
      to: String(m?.to ?? ''),
      subject: String(m?.subject ?? (m?.preview?.subject ?? '')),
      preview: String(m?.preview?.body ?? m?.snippet ?? ''),
      labels: Array.isArray(m?.labelIds) ? (m.labelIds as any[]).join(', ') : '',
      id: String(m?.messageId ?? m?.id ?? ''),
    })) as Array<Record<string, unknown>>;
  }, [messages]);

  const cols = useMemo<ColumnDef<Record<string, unknown>>[]>(() => [
    { accessorKey: 'date', header: 'Data' },
    { accessorKey: 'from', header: 'De' },
    { accessorKey: 'to', header: 'Para' },
    { accessorKey: 'subject', header: 'Assunto' },
    { accessorKey: 'preview', header: 'Prévia' },
    { accessorKey: 'labels', header: 'Labels' },
  ], []);

  const total = useMemo(() => extractCount(normalized, rows.length), [normalized, rows.length]);
  const msg = useMemo(() => {
    if (total && total !== rows.length) return `Mostrando ${rows.length} de ${total}`;
    return `${rows.length} registros`;
  }, [rows.length, total]);

  const success = Array.isArray(rows);

  if (!success || rows.length === 0) {
    // Fallback: render JSON bruto
    return (
      <Tool>
        <ToolHeader type={'tool-gmail_fetch_emails'} state={'output-available'} />
        <ToolContent>
          <ToolOutput
            output={<pre className="text-xs overflow-auto"><code>{typeof normalized === 'string' ? normalized : JSON.stringify(normalized, null, 2)}</code></pre>}
          />
        </ToolContent>
      </Tool>
    )
  }

  return (
    <ArtifactDataTable
      data={rows}
      columns={cols}
      title={'Emails (Gmail)'}
      icon={Mail}
      iconColor="text-slate-700"
      message={msg}
      success={true}
      count={typeof total === 'number' ? total : rows.length}
      exportFileName="gmail-emails"
    />
  );
}
