import { useZoomPan } from '../hooks/useZoomPan'

export default function ImageViewer({ src, alt }: { src?: string; alt?: string }) {
  const z = useZoomPan(1)
  return (
    <div className="relative grid size-full place-items-center overflow-hidden bg-neutral-950" onWheel={z.onWheel} onMouseMove={z.onMouseMove} onMouseDown={z.onMouseDown} onMouseUp={z.onMouseUp} onMouseLeave={z.onMouseLeave}>
      {src ? (
        <img
          src={src}
          alt={alt || ''}
          style={{ transform: `translate(${z.offset.x}px, ${z.offset.y}px) scale(${z.zoom})`, transformOrigin: 'center center' }}
          className="max-h-[82vh] select-none"
          draggable={false}
        />
      ) : (
        <div className="text-neutral-400">Sem imagem</div>
      )}
    </div>
  )
}

