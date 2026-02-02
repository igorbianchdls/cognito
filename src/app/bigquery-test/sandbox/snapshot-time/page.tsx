"use client";

import { useState } from 'react';

type ApiResult = {
  ok: boolean;
  error?: string;
  timeline?: Array<{ name: string; ms: number; ok: boolean; exitCode?: number }>;
  mode?: string;
};

export default function SnapshotTimePage() {
  const [snapshotId, setSnapshotId] = useState('');
  const [loading, setLoading] = useState(false);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const envSnapshot = process.env.SANDBOX_SNAPSHOT_ID || '';

  const run = async () => {
    setLoading(true);
    setDurationMs(null);
    setError(null);
    try {
      const res = await fetch('/api/sandbox/test-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshotId: snapshotId || undefined })
      });
      const data: ApiResult = await res.json().catch(() => ({ ok: false, error: 'invalid json' }));
      if (!data.ok) {
        setError(data.error || 'Falha ao criar sandbox');
        return;
      }
      const step = (data.timeline || []).find(s => s.name === 'create-from-snapshot');
      setDurationMs(step ? step.ms : null);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto bg-white border rounded-md p-6 space-y-4">
        <h1 className="text-xl font-semibold">Snapshot — Tempo de Criação</h1>
        <div className="text-sm text-gray-600">
          <div>Env SANDBOX_SNAPSHOT_ID: <span className="font-mono">{envSnapshot || '(não definido)'}</span></div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm">Snapshot ID (opcional, usa env se vazio)</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="snap_abc123"
            value={snapshotId}
            onChange={(e) => setSnapshotId(e.target.value)}
          />
        </div>
        <div>
          <button
            onClick={run}
            disabled={loading}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          >
            {loading ? 'Medindo...' : 'Medir criação a partir do Snapshot'}
          </button>
        </div>
        {durationMs !== null && (
          <div className="text-green-700 text-sm">Duração: <span className="font-mono">{durationMs} ms</span></div>
        )}
        {error && (
          <div className="text-red-700 text-sm">Erro: {error}</div>
        )}
      </div>
    </div>
  );
}
