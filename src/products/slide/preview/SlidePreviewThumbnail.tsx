'use client'

interface SlidePreviewThumbnailProps {
  alt: string
  height: number
  selected: boolean
  src?: string
  width: number
}

export function SlidePreviewThumbnail({ alt, height, selected, src, width }: SlidePreviewThumbnailProps) {
  return (
    <div
      className={`mb-2 overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${
        selected ? 'border-[3px] border-[#0075E2]' : 'border border-slate-300'
      }`}
    >
      {src ? (
        <img src={src} alt={alt} className="block h-auto w-full bg-white" draggable={false} />
      ) : (
        <div className="bg-white" aria-hidden="true" style={{ width, height }} />
      )}
    </div>
  )
}
