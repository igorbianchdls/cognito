import { useEffect, useRef } from 'react'
import type { ViewerHandlers } from '../DriveViewerContent'

export default function VideoViewer({ src, register }: { src?: string; register?: (h: ViewerHandlers) => void }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    register?.({
      togglePlay: () => {
        const v = ref.current; if (!v) return; if (v.paused) v.play().catch(()=>{}); else v.pause()
      }
    })
  }, [register])
  return (
    <div className="grid size-full place-items-center bg-neutral-950">
      {src ? (
        <video ref={ref} src={src} controls className="max-h-[82vh] rounded-md" />
      ) : (
        <div className="text-neutral-400">Sem vídeo</div>
      )}
    </div>
  )
}
