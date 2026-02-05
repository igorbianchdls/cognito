export default function TextViewer({ content }: { content?: string }) {
  return (
    <div className="max-h-[82vh] overflow-auto rounded-md bg-neutral-950 p-6 text-sm leading-relaxed text-neutral-200">
      <pre className="whitespace-pre-wrap break-words">{content || 'Sem conteúdo'}</pre>
    </div>
  )
}

