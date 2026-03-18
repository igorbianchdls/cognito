"use client";

import React from "react";
import { catalog, validateElement } from "@/products/bi/json-render/catalog";
import { useDataValue } from "@/products/bi/json-render/context";

type AnyRecord = Record<string, any>;

type RendererProps = {
  tree: any | any[];
  registry: Record<string, React.FC<{ element: any; children?: React.ReactNode; data?: AnyRecord; onAction?: (action: any) => void }>>;
  data?: AnyRecord;
  onAction?: (action: any) => void;
  nodeDecorator?: (args: { rendered: React.ReactNode; node: any; path: number[]; type: string }) => React.ReactNode;
};

function getNodeKey(node: any, fallbackIndex: number, path: number[]): string {
  const type = String(node?.type || 'node');
  const props = node?.props && typeof node.props === 'object' ? node.props : {};
  const explicitId =
    typeof props.id === 'string' && props.id.trim()
      ? props.id.trim()
      : typeof props.key === 'string' && props.key.trim()
        ? props.key.trim()
        : '';
  if (explicitId) return `${type}:${explicitId}`;
  return `${type}:${path.join('.')}:${fallbackIndex}`;
}

function RenderNode({
  node,
  registry,
  data,
  onAction,
  nodeDecorator,
  path,
}: {
  node: any
  registry: RendererProps["registry"]
  data?: AnyRecord
  onAction?: (action: any) => void
  nodeDecorator?: RendererProps["nodeDecorator"]
  path: number[]
}) {
  const activeTab = useDataValue('ui.activeTab', '');
  const v = validateElement(node);
  if (!v.success) {
    const rendered = (
      <div className="rounded border border-red-300 bg-red-50 p-2 text-xs text-red-700">
        Invalid element: {v.error}
      </div>
    );
    return nodeDecorator ? nodeDecorator({ rendered, node, path, type: String(node?.type || '') }) : rendered;
  }
  const el = v.value;
  const nodeTab = typeof el?.props?.tab === 'string' ? el.props.tab.trim() : '';
  if (nodeTab && activeTab && nodeTab !== activeTab) {
    return null;
  }
  const Cmp = registry[el.type];
  if (!Cmp) {
    const rendered = (
      <div className="rounded border border-yellow-300 bg-yellow-50 p-2 text-xs text-yellow-800">
        Unknown component: {el.type}
      </div>
    );
    return nodeDecorator ? nodeDecorator({ rendered, node: el, path, type: el.type }) : rendered;
  }
  const children = Array.isArray(el.children)
    ? el.children.map((child: any, idx: number) => (
        <RenderNode
          key={getNodeKey(child, idx, [...path, idx])}
          node={child}
          registry={registry}
          data={data}
          onAction={onAction}
          nodeDecorator={nodeDecorator}
          path={[...path, idx]}
        />
      ))
    : null;
  const rendered = <Cmp element={el} data={data} onAction={onAction}>{children}</Cmp>;
  return nodeDecorator ? nodeDecorator({ rendered, node: el, path, type: el.type }) : rendered;
}

export function Renderer({ tree, registry, data, onAction, nodeDecorator }: RendererProps) {
  if (Array.isArray(tree)) {
    return (
      <div className="space-y-3">
        {tree.map((n, i) => (
          <RenderNode key={getNodeKey(n, i, [i])} node={n} registry={registry} data={data} onAction={onAction} nodeDecorator={nodeDecorator} path={[i]} />
        ))}
      </div>
    );
  }
  return <RenderNode node={tree} registry={registry} data={data} onAction={onAction} nodeDecorator={nodeDecorator} path={[]} />;
}

export { catalog };
