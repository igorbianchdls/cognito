"use client";

import React, { useMemo, useState } from 'react';
import FileTree from './FileTree';
import EditorTabs from './EditorTabs';
import EditorPane from './EditorPane';
import type { FileNode, OpenFile } from './types';
import { fileTreeMock, fileContentsMock, languageFromPath } from './mockData';

export default function FileExplorer() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['app']));
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);

  const tree: FileNode[] = fileTreeMock;

  const activeFile = useMemo(() => openFiles.find(f => f.path === activePath) || null, [openFiles, activePath]);

  const handleToggle = (path: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  };

  const handleOpenFile = (node: FileNode) => {
    if (node.type !== 'file') return;
    setOpenFiles(prev => {
      const exists = prev.some(f => f.path === node.path);
      if (exists) return prev;
      const initial = fileContentsMock[node.path] || { content: '', language: languageFromPath(node.path) };
      return [...prev, { path: node.path, name: node.name, content: initial.content, language: initial.language }];
    });
    setActivePath(node.path);
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
      </div>
      <div className="min-h-0 grid grid-rows-[auto_1fr]">
        <EditorTabs files={openFiles} activePath={activePath} onSelect={handleSelectTab} onClose={handleCloseTab} />
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

