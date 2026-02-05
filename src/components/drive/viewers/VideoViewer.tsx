export default function VideoViewer({ src }: { src?: string }) {
  return (
    <div className="grid size-full place-items-center bg-neutral-950">
      {src ? (
        <video src={src} controls className="max-h-[82vh] rounded-md" />
      ) : (
        <div className="text-neutral-400">Sem vídeo</div>
      )}
    </div>
  )
}

