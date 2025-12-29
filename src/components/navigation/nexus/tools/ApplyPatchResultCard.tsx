"use client";

import { DiffEditor } from '@monaco-editor/react';

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
  const patchText = typeof input?.patch === 'string' ? input!.patch : '';

  const sendToChatAndSubmit = () => {
    if (!patchText) return;
    // Se não houver envelope de patch, montar um patch Update File padrão para o DSL
    const hasEnvelope = patchText.includes('*** Begin Patch') && patchText.includes('*** End Patch');
    let toSend = patchText;
    if (!hasEnvelope) {
      // Extrair linhas +/- e montar patch contra o arquivo do DSL inicial
      const lines = patchText.split(/\r?\n/);
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
  let previewOriginal = '';
  let previewModified = '';
  if (patchText) {
    const lines = patchText.split(/\r?\n/);
    const minus = lines.filter(l => /^\s*\-/.test(l) && !/^\s*\-\-\- /.test(l)).map(l => l.replace(/^\s*\-/, ''));
    const plus = lines.filter(l => /^\s*\+/.test(l) && !/^\s*\+\+\+ /.test(l)).map(l => l.replace(/^\s*\+/, ''));
    previewOriginal = minus.join('\n');
    previewModified = plus.join('\n');
    // Fallback if no +/- markers: show as single chunk on modified side
    if (!previewOriginal && !previewModified) {
      previewModified = patchText;
    }
  }

  return (
    <div className="rounded-md border border-gray-200 p-4 not-prose">
      <div className="mb-2 text-sm text-gray-700">{headerText}</div>

      {patchText && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-2">Patch</div>
          <div className="border rounded-md overflow-hidden" style={{ height: 320 }}>
            <DiffEditor
              original={previewOriginal}
              modified={previewModified}
              language="plaintext"
              theme="vs-light"
              options={{
                readOnly: true,
                renderSideBySide: false,
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: 'on',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                originalEditable: false,
              }}
            />
          </div>
        </div>
      )}

      {!isApplied && patchText && (
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
