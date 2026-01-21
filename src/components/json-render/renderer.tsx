"use client";

import React from "react";
import { catalog, validateElement } from "@/components/json-render/catalog";

type AnyRecord = Record<string, any>;

type RendererProps = {
  tree: any | any[];
  registry: Record<string, React.FC<{ element: any; children?: React.ReactNode; data?: AnyRecord; onAction?: (action: any) => void }>>;
  data?: AnyRecord;
  onAction?: (action: any) => void;
};

function RenderNode({ node, registry, data, onAction }: { node: any; registry: RendererProps["registry"]; data?: AnyRecord; onAction?: (action: any) => void }) {
  const v = validateElement(node);
  if (!v.success) {
    return (
      <div className="rounded border border-red-300 bg-red-50 p-2 text-xs text-red-700">
        Invalid element: {v.error}
      </div>
    );
  }
  const el = v.value;
  const Cmp = registry[el.type];
  if (!Cmp) {
    return (
      <div className="rounded border border-yellow-300 bg-yellow-50 p-2 text-xs text-yellow-800">
        Unknown component: {el.type}
      </div>
    );
  }
  const children = Array.isArray(el.children)
    ? el.children.map((child: any, idx: number) => (
        <RenderNode key={idx} node={child} registry={registry} data={data} onAction={onAction} />
      ))
    : null;
  return <Cmp element={el} data={data} onAction={onAction}>{children}</Cmp>;
}

export function Renderer({ tree, registry, data, onAction }: RendererProps) {
  if (Array.isArray(tree)) {
    return (
      <div className="space-y-3">
        {tree.map((n, i) => (
          <RenderNode key={i} node={n} registry={registry} data={data} onAction={onAction} />
        ))}
      </div>
    );
  }
  return <RenderNode node={tree} registry={registry} data={data} onAction={onAction} />;
}

export { catalog };

