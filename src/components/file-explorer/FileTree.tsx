"use client";

import React from 'react';
import type { FileNode } from './types';
import ExplorerHeader from './ExplorerHeader';
import FileTreeItem from './FileTreeItem';

type Props = {
  tree: FileNode[];
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onOpenFile: (node: FileNode) => void;
  activePath?: string | null;
};

export default function FileTree({ tree, expanded, onToggle, onOpenFile, activePath }: Props) {
  return (
    <div className="h-full flex flex-col">
      <ExplorerHeader />
      <div className="flex-1 overflow-auto py-1">
        {tree.map((node) => (
          <FileTreeItem
            key={node.path}
            node={node}
            expanded={expanded}
            onToggle={onToggle}
            onOpenFile={onOpenFile}
            activePath={activePath}
          />
        ))}
      </div>
    </div>
  );
}

