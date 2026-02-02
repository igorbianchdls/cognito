"use client";

import { useState } from 'react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn";
import PageContainer from "@/components/chat/PageContainer";

type FsEntry = { name: string; type: 'dir'|'file' };

export default function SandboxChatSnapshotTestPage() {
  const [chatId, setChatId] = useState<string>('');
  const [snapshotId, setSnapshotId] = useState<string>('');
  const [leftLog, setLeftLog] = useState<string>('');
  const [rightLog, setRightLog] = useState<string>('');
  const [leftEntries, setLeftEntries] = useState<FsEntry[]>([]);
  const [rightEntries, setRightEntries] = useState<FsEntry[]>([]);
  const [loadingLeft, setLoadingLeft] = useState(false);
  const [loadingRight, setLoadingRight] = useState(false);

  const appendLeft = (s: string) => setLeftLog(prev => prev + (prev ? "\n" : "") + s);
  const appendRight = (s: string) => setRightLog(prev => prev + (prev ? "\n" : "") + s);

  const createChatWithFiles = async () => {
    setLoadingLeft(true);
    setLeftEntries([]);
    setLeftLog('');
    try {
      appendLeft('→ chat-start (cold)');
      const start = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'chat-start' }) });
      const sdata = await start.json();
      if (!start.ok || !sdata?.ok) throw new Error(sdata?.error || 'chat-start failed');
      const id = sdata.chatId as string;
      setChatId(id);
      appendLeft(`✓ chatId=${id}`);
      // write some files
      const mk1 = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'fs-write', chatId: id, path: '/vercel/sandbox/demo/hello.txt', content: 'Hello from chat sandbox' }) });
      if (!mk1.ok) throw new Error('fs-write hello failed');
      const mk2 = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'fs-write', chatId: id, path: '/vercel/sandbox/demo/info.json', content: JSON.stringify({ t: Date.now(), note: 'test' }) }) });
      if (!mk2.ok) throw new Error('fs-write info failed');
      appendLeft('✓ arquivos escritos em /vercel/sandbox/demo');
      await listCurrentFs();
    } catch (e: any) {
      appendLeft('✗ ' + (e?.message || String(e)));
    } finally {
      setLoadingLeft(false);
    }
  };

  const createMoreFiles = async () => {
    if (!chatId) return appendLeft('✗ chatId vazio');
    setLoadingLeft(true);
    try {
      const mk = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'fs-write', chatId, path: '/vercel/sandbox/demo/extra.txt', content: 'extra file ' + new Date().toISOString() }) });
      if (!mk.ok) throw new Error('fs-write extra failed');
      appendLeft('✓ extra.txt criado');
      await listCurrentFs();
    } catch (e: any) {
      appendLeft('✗ ' + (e?.message || String(e)));
    } finally {
      setLoadingLeft(false);
    }
  };

  const listCurrentFs = async () => {
    if (!chatId) return;
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'fs-list', chatId, path: '/vercel/sandbox/demo' }) });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'fs-list failed');
      setLeftEntries(data.entries || []);
    } catch (e: any) {
      appendLeft('✗ ' + (e?.message || String(e)));
    }
  };

  const saveSnapshot = async () => {
    if (!chatId) return appendLeft('✗ chatId vazio');
    setLoadingLeft(true);
    try {
      appendLeft('→ snapshot...');
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'chat-snapshot', chatId }) });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'snapshot failed');
      setSnapshotId(data.snapshotId || '');
      appendLeft('✓ snapshotId=' + (data.snapshotId || '(null)'));
    } catch (e: any) {
      appendLeft('✗ ' + (e?.message || String(e)));
    } finally {
      setLoadingLeft(false);
    }
  };

  const loadSnapshotAndList = async () => {
    const sid = snapshotId.trim();
    if (!sid) return appendRight('✗ snapshotId vazio');
    setLoadingRight(true);
    setRightEntries([]);
    setRightLog('');
    try {
      appendRight('→ create from snapshot & list /vercel/sandbox/demo');
      const res = await fetch('/api/sandbox/fs-from-snapshot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ snapshotId: sid, path: '/vercel/sandbox/demo' }) });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'fs-from-snapshot failed');
      appendRight(`✓ createMs=${data.createMs}ms path=${data.path}`);
      setRightEntries(data.entries || []);
    } catch (e: any) {
      appendRight('✗ ' + (e?.message || String(e)));
    } finally {
      setLoadingRight(false);
    }
  };

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden">
          <div className="flex-1">
            <PageContainer>
              <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                {/* Left: live chat sandbox */}
                <div className="border-r min-h-0 flex flex-col">
                  <div className="p-3 border-b">
                    <h2 className="font-semibold">Sandbox do Chat (viva)</h2>
                    <div className="text-xs text-gray-500">Cria chat, escreve arquivos e salva snapshot</div>
                  </div>
                  <div className="p-3 space-x-2">
                    <button onClick={createChatWithFiles} disabled={loadingLeft} className="px-3 py-1.5 bg-black text-white rounded disabled:opacity-50">{loadingLeft ? 'Aguarde...' : 'Criar chat + arquivos'}</button>
                    <button onClick={createMoreFiles} disabled={loadingLeft || !chatId} className="px-3 py-1.5 bg-gray-800 text-white rounded disabled:opacity-50">Criar novos arquivos</button>
                    <button onClick={saveSnapshot} disabled={loadingLeft || !chatId} className="px-3 py-1.5 bg-indigo-700 text-white rounded disabled:opacity-50">Salvar snapshot</button>
                  </div>
                  <div className="p-3 text-sm space-y-1">
                    <div>chatId: <span className="font-mono">{chatId || '-'}</span></div>
                    <div>snapshotId: <input className="border rounded px-2 py-1 w-full md:w-auto" value={snapshotId} onChange={(e)=>setSnapshotId(e.target.value)} placeholder="snap_..." /></div>
                  </div>
                  <div className="p-3">
                    <div className="text-xs text-gray-500 mb-1">/vercel/sandbox/demo</div>
                    <ul className="text-sm list-disc pl-4">
                      {leftEntries.map((e,i)=> (
                        <li key={i}><span className="font-mono">{e.type}</span> {e.name}</li>
                      ))}
                      {leftEntries.length === 0 && <li className="text-gray-400">(vazio)</li>}
                    </ul>
                  </div>
                  <div className="p-3">
                    <div className="text-xs text-gray-500 mb-1">Log</div>
                    <pre className="bg-gray-100 p-2 rounded text-[11px] leading-4 whitespace-pre-wrap">{leftLog || '(sem logs)'}</pre>
                  </div>
                </div>

                {/* Right: restore from snapshot */}
                <div className="min-h-0 flex flex-col">
                  <div className="p-3 border-b">
                    <h2 className="font-semibold">Restaurar do Snapshot</h2>
                    <div className="text-xs text-gray-500">Cria sandbox do snapshot e lista arquivos</div>
                  </div>
                  <div className="p-3 space-x-2">
                    <button onClick={loadSnapshotAndList} disabled={loadingRight || !snapshotId} className="px-3 py-1.5 bg-green-700 text-white rounded disabled:opacity-50">Carregar snapshot e listar FS</button>
                  </div>
                  <div className="p-3">
                    <div className="text-xs text-gray-500 mb-1">/vercel/sandbox/demo</div>
                    <ul className="text-sm list-disc pl-4">
                      {rightEntries.map((e,i)=> (
                        <li key={i}><span className="font-mono">{e.type}</span> {e.name}</li>
                      ))}
                      {rightEntries.length === 0 && <li className="text-gray-400">(vazio)</li>}
                    </ul>
                  </div>
                  <div className="p-3">
                    <div className="text-xs text-gray-500 mb-1">Log</div>
                    <pre className="bg-gray-100 p-2 rounded text-[11px] leading-4 whitespace-pre-wrap">{rightLog || '(sem logs)'}</pre>
                  </div>
                </div>
              </div>
            </PageContainer>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
"use client";
