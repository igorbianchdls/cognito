"use client";

import { CodeBlock } from '@/components/ai-elements/code-block';

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
  if (!output) return null;
  const files = Array.isArray(output.files) ? output.files : [];
  const summary = output.summary || { added: 0, deleted: 0, updated: 0, moved: 0, totalChanges: 0 };
  const isDryRun = !!output.dryRun;

  return (
    <div className="rounded-md border border-gray-200 p-4 not-prose">
      <div className="mb-2 text-sm text-gray-700">
        {isDryRun ? 'Dry‑run concluído' : 'Patch aplicado'} — {output.success ? 'sucesso' : 'falhou'}
      </div>

      {input?.patch && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">Patch</div>
          <CodeBlock code={String(input.patch)} language="diff" />
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

      {Array.isArray(output.errors) && output.errors.length > 0 && (
        <div className="mt-3 text-xs text-red-600">{output.errors.join(' • ')}</div>
      )}
    </div>
  );
}

