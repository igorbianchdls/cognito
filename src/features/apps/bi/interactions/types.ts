export type BiInteractionMode = 'filter' | 'highlight' | 'none'

export type BiVisualInteraction = {
  sourceVisualId: string
  targetVisualId: string
  mode: BiInteractionMode
}

export type BiInteractionGraph = {
  defaultMode: BiInteractionMode
  links: BiVisualInteraction[]
}

