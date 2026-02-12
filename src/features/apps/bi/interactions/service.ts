import type { BiInteractionGraph, BiInteractionMode } from './types'

export function getInteractionMode(
  graph: BiInteractionGraph,
  sourceVisualId: string,
  targetVisualId: string,
): BiInteractionMode {
  const found = graph.links.find(
    (link) => link.sourceVisualId === sourceVisualId && link.targetVisualId === targetVisualId,
  )
  return found?.mode || graph.defaultMode
}

export function setInteractionMode(
  graph: BiInteractionGraph,
  sourceVisualId: string,
  targetVisualId: string,
  mode: BiInteractionMode,
): BiInteractionGraph {
  const nextLinks = graph.links.filter(
    (link) => !(link.sourceVisualId === sourceVisualId && link.targetVisualId === targetVisualId),
  )
  nextLinks.push({ sourceVisualId, targetVisualId, mode })
  return { ...graph, links: nextLinks }
}

