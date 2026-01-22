"use client";

import React, { useMemo, useState } from 'react';
import FileTree from './FileTree';
import EditorTabs from './EditorTabs';
import EditorPane from './EditorPane';
import type { FileNode, OpenFile } from './types';
import { fileTreeMock, fileContentsMock, languageFromPath } from './mockData';

export default function FileExplorer({ chatId }: { chatId?: string }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['/vercel/sandbox']));
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [tree, setTree] = useState<FileNode[]>(fileTreeMock);
  const [fsError, setFsError] = useState<string | null>(null);

  const activeFile = useMemo(() => openFiles.find(f => f.path === activePath) || null, [openFiles, activePath]);

  // Load root when chatId becomes available
  React.useEffect(() => {
    (async () => {
      if (!chatId) return;
      await refreshDir('/vercel/sandbox');
    })();
  }, [chatId]);

  

  const handleOpenFile = async (node: FileNode) => {
    if (node.type !== 'file') return;
    if (!chatId) return;
    // ensure tab exists first
    setOpenFiles(prev => {
      const exists = prev.some(f => f.path === node.path);
      if (exists) return prev;
      const initial = fileContentsMock[node.path] || { content: '', language: languageFromPath(node.path) };
      return [...prev, { path: node.path, name: node.name, content: initial.content, language: initial.language }];
    });
    setActivePath(node.path);
    // load real content
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'fs-read', chatId, path: node.path }) })
      const data = await res.json().catch(()=> ({})) as { ok?: boolean; content?: string; isBinary?: boolean; error?: string }
      if (res.ok && data.ok && typeof data.content === 'string' && !data.isBinary) {
        setOpenFiles(prev => prev.map(f => f.path === node.path ? { ...f, content: data.content, language: languageFromPath(node.path), dirty: false } : f))
      } else if (!res.ok || data.ok === false) {
        setFsError(data.error || 'Falha ao ler arquivo')
      }
    } catch (e) {
      setFsError((e as Error).message)
    }
  };

  const handleSelectTab = (path: string) => setActivePath(path);
  const handleCloseTab = (path: string) => {
    setOpenFiles(prev => {
      const idx = prev.findIndex(f => f.path === path);
      if (idx === -1) return prev;
      const next = [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      // adjust active
      if (activePath === path) {
        const newActive = next[idx - 1]?.path ?? next[0]?.path ?? null;
        setActivePath(newActive);
      }
      return next;
    });
  };

  const handleChange = (value: string) => {
    if (!activeFile) return;
    setOpenFiles(prev => prev.map(f => (f.path === activeFile.path ? { ...f, content: value, dirty: true } : f)));
  };

  const refreshDir = async (dirPath: string) => {
    if (!chatId) return;
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'fs-list', chatId, path: dirPath }) })
      const data = await res.json().catch(()=> ({})) as { ok?: boolean; entries?: Array<{ name:string; path:string; type:'file'|'dir' }>; path?: string; error?: string }
      if (!res.ok || data.ok === false) { setFsError(data.error || `Falha ao listar ${dirPath}`); return }
      const ents = (data.entries ?? []).map(e => ({ id: e.path, name: e.name, path: e.path, type: e.type === 'dir' ? 'folder' : 'file' as any }))
      // Construct/merge tree: for simplicity, if root refresh, replace root
      if (dirPath === '/vercel/sandbox') {
        setTree([{ id: 'root', name: 'sandbox', type: 'folder', path: dirPath, children: ents }])
        setExpanded(s => new Set(s).add('/vercel/sandbox'))
      } else {
        setTree(prev => upsertChildren(prev, dirPath, ents))
      }
    } catch (e) {
      setFsError((e as Error).message)
    }
  }

  const upsertChildren = (nodes: FileNode[], dirPath: string, children: FileNode[]): FileNode[] => {
    const recur = (arr: FileNode[]): FileNode[] => arr.map(n => {
      if (n.type === 'folder') {
        if (n.path === dirPath) return { ...n, children }
        if (n.children) return { ...n, children: recur(n.children) }
      }
      return n
    })
    return recur(nodes)
  }

  const handleToggle = (path: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path); else next.add(path)
      return next
    })
    // Lazy load children when opening
    const nodeOpened = !expanded.has(path)
    if (nodeOpened && chatId) refreshDir(path)
  }

  return (
    <div className="h-full grid grid-cols-[260px_1fr] min-h-0">
      <div className="border-r bg-white min-w-[240px]">
        <FileTree
          tree={tree}
          expanded={expanded}
          onToggle={handleToggle}
          onOpenFile={handleOpenFile}
          activePath={activePath}
        />
        {fsError && <div className="p-2 text-xs text-red-600 border-t">{fsError}</div>}
      </div>
      <div className="min-h-0 grid grid-rows-[auto_1fr]">
        <div className="flex items-center justify-between h-10 border-b px-2">
          <div className="flex-1">
            <EditorTabs files={openFiles} activePath={activePath} onSelect={handleSelectTab} onClose={handleCloseTab} />
          </div>
          {activeFile && (
            <button
              className={`ml-2 px-3 py-1.5 rounded text-sm ${activeFile.dirty ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-700'}`}
              disabled={!activeFile.dirty}
              onClick={async () => {
                if (!chatId || !activeFile) return;
                try {
                  const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'fs-write', chatId, path: activeFile.path, content: activeFile.content }) })
                  const data = await res.json().catch(()=> ({})) as { ok?: boolean; error?: string }
                  if (res.ok && data.ok) setOpenFiles(prev => prev.map(f => f.path === activeFile.path ? { ...f, dirty: false } : f))
                  else setFsError(data.error || 'Falha ao salvar')
                } catch (e) { setFsError((e as Error).message) }
              }}
            >
              Save
            </button>
          )}
        </div>
        <div className="min-h-0">
          {activeFile ? (
            <EditorPane value={activeFile.content} onChange={handleChange} language={activeFile.language} path={activeFile.path} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">Select a file to start editing</div>
          )}
        </div>
      </div>
    </div>
  );
}
