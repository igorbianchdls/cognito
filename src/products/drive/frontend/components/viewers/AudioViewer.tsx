export default function AudioViewer({ src }: { src?: string }) {
  return (
    <div className="grid size-full place-items-center bg-neutral-950">
      {src ? (
        <audio src={src} controls className="w-[720px] max-w-[95vw]" />
      ) : (
        <div className="text-neutral-400">Sem áudio</div>
      )}
    </div>
  )
}

