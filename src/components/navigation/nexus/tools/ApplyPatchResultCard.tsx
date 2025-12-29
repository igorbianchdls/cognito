"use client";

import { Editor } from '@monaco-editor/react';
import { useMemo, useState, useEffect } from 'react';

type ApplyPatchFile = {
  path: string;
  op: 'add' | 'update' | 'delete' | 'move';
  hunksApplied?: number;
  changes?: number;
  movedTo?: string;
  error?: string;
};

type ApplyPatchSummary = {
  added: number;
  deleted: number;
  updated: number;
  moved: number;
  totalChanges: number;
};

type ApplyPatchOutput = {
  success: boolean;
  dryRun: boolean;
  applied: boolean;
  files: ApplyPatchFile[];
  summary: ApplyPatchSummary;
  errors?: string[];
};

interface Props {
  input?: { patch?: string; dryRun?: boolean; allowApplyInProduction?: boolean; [k: string]: unknown } | null;
  output?: ApplyPatchOutput | null;
}

export default function ApplyPatchResultCard({ input, output }: Props) {
  const hasOutput = !!output;
  const files = hasOutput && Array.isArray(output!.files) ? output!.files : [];
  const summary = hasOutput && output!.summary ? output!.summary : { added: 0, deleted: 0, updated: 0, moved: 0, totalChanges: 0 };
  const isApplied = hasOutput ? !!output!.applied && !output!.dryRun : false;
  const rawPatch = typeof input?.patch === 'string' ? input!.patch : '';

  // Normalize initial editor text to only +/- lines (ignoring ---/+++ headers), fallback to raw when not present
  const initialEditorText = useMemo(() => {
    if (!rawPatch) return '';
    const lines = rawPatch.split(/\r?\n/);
    const body = lines
      .filter(l => /^(\s*[\-\+])/.test(l) && !/^(\s*\-\-\-|\s*\+\+\+)/.test(l))
      .join('\n');
    return body.trim().length > 0 ? body : rawPatch;
  }, [rawPatch]);

  const [editedPatch, setEditedPatch] = useState<string>(initialEditorText);
  useEffect(() => { setEditedPatch(initialEditorText) }, [initialEditorText]);

  const sendToChatAndSubmit = () => {
    if (!editedPatch) return;
    // Se não houver envelope de patch, montar um patch Update File padrão para o DSL
    const hasEnvelope = editedPatch.includes('*** Begin Patch') && editedPatch.includes('*** End Patch');
    let toSend = editedPatch;
    if (!hasEnvelope) {
      // Extrair linhas +/- e montar patch contra o arquivo do DSL inicial
      const lines = editedPatch.split(/\r?\n/);
      const minus = lines.filter(l => l.trim().startsWith('-')).map(l => l.replace(/^\s*\-/, ''));
      const plus = lines.filter(l => l.trim().startsWith('+')).map(l => l.replace(/^\s*\+/, ''));
      const original = minus.join('\n');
      const replacement = plus.join('\n');
      const file = 'src/stores/visualBuilderStore.ts';
      toSend = [
        '*** Begin Patch',
        `*** Update File: ${file}`,
        '@@',
        `-${original}`,
        `+${replacement}`,
        '*** End Patch',
      ].join('\n');
    }
    const payload = {
      type: 'SEND_TO_CHAT_AND_SUBMIT',
      text: `apply_patch({ patch: ${JSON.stringify(toSend)}, dryRun: false })`,
    } as const;
    try {
      window.postMessage(payload, '*');
    } catch (e) {
      console.error('Failed to post APPLY_PATCH message', e);
    }
  };

  const headerText = hasOutput
    ? (isApplied ? `Patch aplicado — ${output!.success ? 'sucesso' : 'falhou'}` : 'Pré‑visualização do patch')
    : 'Pré‑visualização do patch';

  // Build preview texts for DiffEditor
  return (
    <div className="rounded-md border border-gray-200 p-4 not-prose">
      <div className="mb-2 text-sm text-gray-700">{headerText}</div>

      {editedPatch && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-2">Patch</div>
          <div className="border rounded-md overflow-hidden" style={{ height: 320 }}>
            <Editor
              height="100%"
              language="diff"
              theme="vs-light"
              value={editedPatch}
              onChange={(v) => setEditedPatch(v ?? '')}
              options={{
                readOnly: false,
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: 'on',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>
      )}

      {!isApplied && editedPatch && (
        <div className="mb-3 flex items-center gap-2">
          <button
            onClick={sendToChatAndSubmit}
            className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-xs"
          >
            Aplicar patch
          </button>
          <span className="text-xs text-gray-600">O patch será enviado ao chat para aplicação.</span>
        </div>
      )}

      <div className="mb-3 text-xs text-gray-600">
        <span className="mr-3">+{summary.added} adicionados</span>
        <span className="mr-3">~{summary.updated} atualizados</span>
        <span className="mr-3">→{summary.moved} movidos</span>
        <span className="mr-3">−{summary.deleted} removidos</span>
        <span>Δ {summary.totalChanges} mudanças</span>
      </div>

      {!!files.length && (
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-600 border-b">
                <th className="text-left p-2">Arquivo</th>
                <th className="text-left p-2">Op</th>
                <th className="text-right p-2">Hunks</th>
                <th className="text-right p-2">Changes</th>
                <th className="text-left p-2">Destino</th>
                <th className="text-left p-2">Erro</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f, i) => (
                <tr key={String(f.path || i)} className="border-b">
                  <td className="p-2 font-mono text-[11px]">{String(f.path)}</td>
                  <td className="p-2">{String(f.op)}</td>
                  <td className="p-2 text-right">{typeof f.hunksApplied === 'number' ? f.hunksApplied : '-'}</td>
                  <td className="p-2 text-right">{typeof f.changes === 'number' ? f.changes : '-'}</td>
                  <td className="p-2 text-[11px]">{f.movedTo ? String(f.movedTo) : '-'}</td>
                  <td className="p-2 text-red-600 text-[11px]">{f.error ? String(f.error) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasOutput && Array.isArray(output!.errors) && output!.errors!.length > 0 && (
        <div className="mt-3 text-xs text-red-600">{output!.errors!.join(' • ')}</div>
      )}
    </div>
  );
}
