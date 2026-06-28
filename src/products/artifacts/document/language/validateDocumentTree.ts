'use client'

import type { ArtifactKind, ArtifactTreeNode } from '@/products/artifacts/core/types/artifactTypes'
import {
  DOCUMENT_SUPPORTED_NODE_TYPE_SET,
  getDocumentManifest,
} from '@/products/artifacts/document/language/documentLanguageManifest'

type DocumentKind = Extract<ArtifactKind, 'report' | 'slide'>
type DocumentTreeChild = ArtifactTreeNode | string

function isTreeNode(node: DocumentTreeChild): node is ArtifactTreeNode {
  return typeof node === 'object' && node !== null && !Array.isArray(node)
}

function formatNodePath(path: number[]) {
  return path.length === 0 ? 'root' : path.join('.')
}

function ensureStringProp(node: ArtifactTreeNode, propName: string, path: number[]) {
  const value = node.props?.[propName]
  if (value != null && typeof value !== 'string') {
    throw new Error(`${node.type}.${propName} deve ser string em ${formatNodePath(path)}`)
  }
}

function validateNode(node: ArtifactTreeNode, kind: DocumentKind, path: number[]) {
  const manifest = getDocumentManifest(kind)

  if (path.length === 0 && !(manifest.rootTypes as readonly string[]).includes(node.type)) {
    throw new Error(`${kind} deve usar root <${manifest.rootTypes[0]}>`)
  }

  if (!DOCUMENT_SUPPORTED_NODE_TYPE_SET.has(node.type)) {
    throw new Error(`Tag ou componente "${node.type}" nao suportado em ${formatNodePath(path)}`)
  }

  if (node.type === 'page' && kind !== 'report') {
    throw new Error(`<page> so e permitido em report`)
  }
  if (node.type === 'slide' && kind !== 'slide') {
    throw new Error(`<slide> so e permitido em slide`)
  }
  if (node.type === 'Report' && kind !== 'report') {
    throw new Error(`<Report> so e permitido em report`)
  }
  if (node.type === 'Deck' && kind !== 'slide') {
    throw new Error(`<Deck> so e permitido em slide`)
  }

  if (node.type === 'img') {
    ensureStringProp(node, 'src', path)
    ensureStringProp(node, 'alt', path)
  }

  if (node.type === 'Chart') {
    ensureStringProp(node, 'type', path)
  }

  for (let index = 0; index < node.children.length; index += 1) {
    const child = node.children[index]
    if (isTreeNode(child)) validateNode(child, kind, [...path, index])
  }
}

export function validateDocumentTree(tree: ArtifactTreeNode, kind: DocumentKind) {
  validateNode(tree, kind, [])
}
