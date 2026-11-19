// Notifications belong to the Social product (still to come). Until then the editor's notices only go to the console.
export type EditorNotice = { kind: string; title: string; text: string; href?: string; action?: string }

export function notify(n: EditorNotice) {
  if (process.env.NODE_ENV !== 'production') console.info('[editor]', n.title, n.text)
}
