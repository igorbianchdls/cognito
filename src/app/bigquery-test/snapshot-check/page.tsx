"use client";

import { useState } from 'react';

type ApiResult = {
  ok: boolean;
  error?: string;
  snapshotId?: string;
  checks?: Record<string, any>;
  timeline?: Array<{ name: string; ms: number; ok: boolean; exitCode?: number }>;
};

export default function SnapshotCheckPage() {
  const [snapshotId, setSnapshotId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [creating, setCreating] = useState(false);

  const envSnapshot = process.env.SANDBOX_SNAPSHOT_ID || '';

  const runTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/sandbox/test-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshotId: snapshotId || undefined })
      });
      const data: ApiResult = await res.json().catch(() => ({ ok: false, error: 'invalid json' }));
      setResult(data);
    } catch (e: any) {
      setResult({ ok: false, error: e?.message || String(e) });
    } finally {
      setLoading(false);
    }
  };

  const createSnapshotDev = async () => {
    setCreating(true);
    setResult(null);
    try {
      const res = await fetch('/api/sandbox/snapshot?open=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installDeps: true, seed: true })
      });
      const data: ApiResult = await res.json().catch(() => ({ ok: false, error: 'invalid json' }));
      setResult(data);
      if (data.ok && data.snapshotId) {
        setSnapshotId(data.snapshotId);
      }
    } catch (e: any) {
      setResult({ ok: false, error: e?.message || String(e) });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white border rounded-md p-6 space-y-4">
        <h1 className="text-xl font-semibold">Snapshot Check</h1>
        <div className="text-sm text-gray-600">
          <div>Env SANDBOX_SNAPSHOT_ID: <span className="font-mono">{envSnapshot || '(não definido)'}</span></div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm">Snapshot ID (opcional, sobrescreve a env)</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="snap_abc123"
            value={snapshotId}
            onChange={(e) => setSnapshotId(e.target.value)}
          />
        </div>
        <div>
          <button
            onClick={runTest}
            disabled={loading}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          >
            {loading ? 'Validando...' : 'Validar Snapshot'}
          </button>
          <button
            onClick={createSnapshotDev}
            disabled={creating}
            className="ml-2 px-4 py-2 rounded bg-gray-800 text-white disabled:opacity-50"
            title="Modo dev: cria snapshot sem secret (não use em produção)"
          >
            {creating ? 'Gerando...' : 'Gerar snapshot (dev)'}
          </button>
        </div>
        {result && (
          <div className="mt-4">
            <div className={`font-medium ${result.ok ? 'text-green-600' : 'text-red-600'}`}>
              Resultado: {result.ok ? 'OK' : `Erro: ${result.error || 'desconhecido'}`}
            </div>
            {result.checks && (
              <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">{JSON.stringify(result.checks, null, 2)}</pre>
            )}
            {result.timeline && (
              <div className="mt-2">
                <div className="text-sm font-medium">Timeline</div>
                <ul className="text-xs list-disc pl-5 space-y-1">
                  {result.timeline.map((s, i) => (
                    <li key={i}>
                      <span className="font-mono">{s.name}</span> — {s.ms}ms — {s.ok ? 'ok' : `fail${s.exitCode !== undefined ? ` (exit ${s.exitCode})` : ''}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
