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
  const [creatingFast, setCreatingFast] = useState(false);

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

  const createSnapshotFast = async () => {
    setCreatingFast(true);
    setResult(null);
    try {
      const res = await fetch('/api/sandbox/snapshot?open=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installDeps: false, seed: false })
      });
      const data: ApiResult = await res.json().catch(() => ({ ok: false, error: 'invalid json' }));
      setResult(data);
      if (data.ok && data.snapshotId) {
        setSnapshotId(data.snapshotId);
      }
    } catch (e: any) {
      setResult({ ok: false, error: e?.message || String(e) });
    } finally {
      setCreatingFast(false);
    }
  };

  const generateAndTestFast = async () => {
    setCreatingFast(true);
    setLoading(true);
    setResult(null);
    try {
      // 1) Fast snapshot
      const resSnap = await fetch('/api/sandbox/snapshot?open=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installDeps: false, seed: false })
      });
      const snap: ApiResult = await resSnap.json().catch(() => ({ ok: false, error: 'invalid json' }));
      if (!snap.ok || !snap.snapshotId) {
        setResult(snap);
        return;
      }
      setSnapshotId(snap.snapshotId);

      // 2) Real test using returned snapshotId
      const resTest = await fetch('/api/sandbox/test-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshotId: snap.snapshotId })
      });
      const test: ApiResult = await resTest.json().catch(() => ({ ok: false, error: 'invalid json' }));
      setResult(test);
    } catch (e: any) {
      setResult({ ok: false, error: e?.message || String(e) });
    } finally {
      setCreatingFast(false);
      setLoading(false);
    }
  };

  const runTestFake = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/sandbox/test-start?simulate=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulate: true, snapshotId: snapshotId || 'fake_dev' })
      });
      const data: ApiResult = await res.json().catch(() => ({ ok: false, error: 'invalid json' }));
      setResult(data);
    } catch (e: any) {
      setResult({ ok: false, error: e?.message || String(e) });
    } finally {
      setLoading(false);
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
            onClick={createSnapshotFast}
            disabled={creatingFast}
            className="px-4 py-2 rounded bg-indigo-700 text-white disabled:opacity-50"
            title="Cria snapshot real, rápido (sem instalar deps)"
          >
            {creatingFast ? 'Gerando (rápido)...' : 'Gerar snapshot (rápido)'}
          </button>
          <button
            onClick={runTest}
            disabled={loading}
            className="ml-2 px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          >
            {loading ? 'Validando...' : 'Validar Snapshot'}
          </button>
          <button
            onClick={createSnapshotDev}
            disabled={creating}
            className="ml-2 px-4 py-2 rounded bg-gray-800 text-white disabled:opacity-50"
            title="Cria snapshot real com dependências (pode demorar)"
          >
            {creating ? 'Gerando...' : 'Gerar snapshot (com deps)'}
          </button>
          <button
            onClick={() => setSnapshotId('fake_dev')}
            className="ml-2 px-4 py-2 rounded bg-gray-600 text-white"
            title="Preenche um ID fake para testes"
          >
            Usar ID fake
          </button>
          <button
            onClick={runTestFake}
            disabled={loading}
            className="ml-2 px-4 py-2 rounded bg-gray-900 text-white disabled:opacity-50"
            title="Valida em modo simulado (sem snapshot real)"
          >
            Validar (fake)
          </button>
          <button
            onClick={generateAndTestFast}
            disabled={creatingFast || loading}
            className="ml-2 px-4 py-2 rounded bg-green-700 text-white disabled:opacity-50"
            title="Gera snapshot real rápido e valida em seguida"
          >
            {creatingFast || loading ? 'Rodando...' : 'Gerar e Validar (rápido)'}
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
"use client";
