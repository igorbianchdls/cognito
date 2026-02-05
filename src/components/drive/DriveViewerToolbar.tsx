import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RefreshCw, Download, RotateCw } from 'lucide-react'

export default function DriveViewerToolbar({
  title,
  countText,
  onClose,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onDownload,
  onRotate,
  zoomText,
}: {
  title?: string
  countText?: string
  onClose?: () => void
  onPrev?: () => void
  onNext?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onZoomReset?: () => void
  onDownload?: () => void
  onRotate?: () => void
  zoomText?: string
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-black/50 px-3 py-2 text-white shadow-lg ring-1 ring-white/10">
      <div className="flex items-center gap-2">
        <button onClick={onClose} className="rounded p-1 hover:bg-white/10" title="Fechar">
          <X className="size-4" />
        </button>
        <div className="text-sm font-medium max-w-[40vw] truncate">{title}</div>
        {countText && <div className="text-xs text-white/70">{countText}</div>}
        {zoomText && <div className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-white/80">{zoomText}</div>}
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onPrev} className="rounded p-1 hover:bg-white/10" title="Anterior"><ChevronLeft className="size-4" /></button>
        <button onClick={onNext} className="rounded p-1 hover:bg-white/10" title="Próximo"><ChevronRight className="size-4" /></button>
        <span className="mx-1 h-4 w-px bg-white/20" />
        <button onClick={onZoomOut} className="rounded p-1 hover:bg-white/10" title="Diminuir"><ZoomOut className="size-4" /></button>
        <button onClick={onZoomIn} className="rounded p-1 hover:bg-white/10" title="Aumentar"><ZoomIn className="size-4" /></button>
        <button onClick={onZoomReset} className="rounded p-1 hover:bg-white/10" title="Ajustar"><RefreshCw className="size-4" /></button>
        <button onClick={onRotate} className="rounded p-1 hover:bg-white/10" title="Girar"><RotateCw className="size-4" /></button>
        <span className="mx-1 h-4 w-px bg-white/20" />
        <button onClick={onDownload} className="rounded p-1 hover:bg-white/10" title="Download"><Download className="size-4" /></button>
      </div>
    </div>
  )
}
