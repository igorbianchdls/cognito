"use client";

import React from 'react';
import type { FileNode } from './types';
import { ChevronRight, Folder, FolderOpen, FileText } from 'lucide-react';

type Props = {
  node: FileNode;
  level?: number;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onOpenFile: (node: FileNode) => void;
  activePath?: string | null;
};

export default function FileTreeItem({ node, level = 0, expanded, onToggle, onOpenFile, activePath }: Props) {
  const isFolder = node.type === 'folder';
  const isExpanded = expanded.has(node.path);
  const paddingLeft = 8 + level * 14;
  const isActive = activePath === node.path;

  const handleClick = () => {
    if (isFolder) onToggle(node.path);
    else onOpenFile(node);
  };

  return (
    <div>
      <div
        className={`flex items-center h-7 cursor-pointer select-none ${isActive ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
        style={{ paddingLeft }}
        onClick={handleClick}
      >
        <span className={`mr-1 transition-transform ${isFolder ? '' : 'opacity-0'}`}>
          <ChevronRight className={`w-4 h-4 ${isExpanded ? 'rotate-90' : ''}`} />
        </span>
        {isFolder ? (
          isExpanded ? <FolderOpen className="w-4 h-4 text-amber-600 mr-2" /> : <Folder className="w-4 h-4 text-amber-600 mr-2" />
        ) : (
          <FileText className="w-4 h-4 text-gray-500 mr-2" />
        )}
        <span className="text-sm text-gray-800 truncate">{node.name}</span>
      </div>
      {isFolder && isExpanded && node.children && node.children.map((child) => (
        <FileTreeItem
          key={child.path}
          node={child}
          level={level + 1}
          expanded={expanded}
          onToggle={onToggle}
          onOpenFile={onOpenFile}
          activePath={activePath}
        />
      ))}
    </div>
  );
}

